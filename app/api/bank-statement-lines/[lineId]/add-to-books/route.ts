import { NextResponse } from "next/server";
import { reserveDocumentNumber } from "@/lib/numbering";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

const internalRoles = [
  "SUPER_ADMIN",
  "ADMIN",
  "STAFF",
  "IT_ADMIN",
  "ACCOUNTANT_ADMIN",
  "ACCOUNTANT_USER",
  "COMPLIANCE_ADMIN",
  "OPERATIONS_ADMIN",
];

const allowedSplitTypes = [
  "CUSTOMER_RECEIPT",
  "SUPPLIER_PAYMENT",
  "FUNDING_TRANSACTION",
  "BANK_CHARGE",
  "OTHER",
];

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

type CreationResult = {
  sourceModule?: string | null;
  sourceRecordId?: string | null;
  debitAccountId?: string | null;
  creditAccountId?: string | null;
  error?: NextResponse;
};

function toNumber(value: unknown, fallback = 0) {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function roundMoney(value: number) {
  return Number(value.toFixed(2));
}

function formatAmount(value: number) {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getCurrentUnallocatedAmount({
  bankLineAmount,
  allocatedAmount,
  unallocatedAmount,
}: {
  bankLineAmount: number;
  allocatedAmount: number;
  unallocatedAmount?: number | null;
}) {
  if (unallocatedAmount !== null && unallocatedAmount !== undefined) {
    return roundMoney(toNumber(unallocatedAmount, bankLineAmount));
  }

  return roundMoney(Math.max(bankLineAmount - allocatedAmount, 0));
}

function buildNumber(prefix: string) {
  const datePart = new Date()
    .toISOString()
    .replace(/[-:TZ.]/g, "")
    .slice(0, 14);

  const randomPart = Math.random().toString(36).slice(2, 7).toUpperCase();

  return `${prefix}-${datePart}-${randomPart}`;
}

function mapFundingTransactionType(value: unknown) {
  const rawValue = String(value || "").trim().toUpperCase();

  const typeMap: Record<string, string> = {
    CAPITAL_CONTRIBUTION: "CAPITAL_CONTRIBUTION",
    CAPITAL_CALL_RECEIPT: "CAPITAL_CALL_RECEIPT",

    GRANT_RECEIVED: "GRANT_RECEIPT",
    GRANT_RECEIPT: "GRANT_RECEIPT",

    DONATION_RECEIVED: "DONATION_RECEIPT",
    DONATION_RECEIPT: "DONATION_RECEIPT",

    LOAN_RECEIVED: "LOAN_DRAWDOWN",
    LOAN_DRAWDOWN: "LOAN_DRAWDOWN",

    DIRECTOR_LOAN: "DIRECTOR_LOAN",
    SHAREHOLDER_LOAN: "SHAREHOLDER_LOAN",
    INVESTOR_FUNDING: "INVESTOR_FUNDING",

    LOAN_REPAYMENT: "LOAN_REPAYMENT",
    INTEREST_PAYMENT: "INTEREST_PAYMENT",

    OTHER_FUNDING: "OTHER_FUNDING_RECEIPT",
    OTHER_FUNDING_RECEIVED: "OTHER_FUNDING_RECEIPT",
    OTHER_FUNDING_RECEIPT: "OTHER_FUNDING_RECEIPT",
  };

  return typeMap[rawValue] || rawValue || "GRANT_RECEIPT";
}

function getMissingSchemaColumn(errorMessage?: string | null) {
  if (!errorMessage) return null;

  const match = errorMessage.match(
    /Could not find the '([^']+)' column of '([^']+)' in the schema cache/i
  );

  return match?.[1] || null;
}

async function insertWithSchemaFallback({
  supabase,
  table,
  payload,
  select = "",
}: {
  supabase: SupabaseClient;
  table: string;
  payload: Record<string, unknown>;
  select?: string;
}) {
  const workingPayload = { ...payload };
  const removedColumns: string[] = [];

  for (let attempt = 0; attempt < 25; attempt += 1) {
    const query = (supabase as any).from(table).insert(workingPayload);

    const result = select
      ? await query.select(select).single()
      : await query;

    if (!result.error) {
      return {
        data: result.data,
        error: null,
        removedColumns,
      };
    }

    const missingColumn = getMissingSchemaColumn(result.error.message);

    if (!missingColumn || !(missingColumn in workingPayload)) {
      return {
        data: result.data,
        error: result.error,
        removedColumns,
      };
    }

    delete workingPayload[missingColumn];
    removedColumns.push(missingColumn);
  }

  return {
    data: null,
    error: {
      message:
        "Unable to save record because too many expected columns are missing from the live database schema.",
    },
    removedColumns,
  };
}

async function updateWithSchemaFallback({
  supabase,
  table,
  payload,
  eqColumn,
  eqValue,
}: {
  supabase: SupabaseClient;
  table: string;
  payload: Record<string, unknown>;
  eqColumn: string;
  eqValue: string;
}) {
  const workingPayload = { ...payload };
  const removedColumns: string[] = [];

  for (let attempt = 0; attempt < 25; attempt += 1) {
    const result = await (supabase as any)
      .from(table)
      .update(workingPayload)
      .eq(eqColumn, eqValue);

    if (!result.error) {
      return {
        error: null,
        removedColumns,
      };
    }

    const missingColumn = getMissingSchemaColumn(result.error.message);

    if (!missingColumn || !(missingColumn in workingPayload)) {
      return {
        error: result.error,
        removedColumns,
      };
    }

    delete workingPayload[missingColumn];
    removedColumns.push(missingColumn);
  }

  return {
    error: {
      message:
        "Unable to update record because too many expected columns are missing from the live database schema.",
    },
    removedColumns,
  };
}

async function upsertWithSchemaFallback({
  supabase,
  table,
  payload,
  onConflict,
}: {
  supabase: SupabaseClient;
  table: string;
  payload: Record<string, unknown>;
  onConflict: string;
}) {
  const workingPayload = { ...payload };
  const removedColumns: string[] = [];

  for (let attempt = 0; attempt < 25; attempt += 1) {
    const result = await (supabase as any)
      .from(table)
      .upsert(workingPayload, { onConflict });

    if (!result.error) {
      return {
        error: null,
        removedColumns,
      };
    }

    const missingColumn = getMissingSchemaColumn(result.error.message);

    if (!missingColumn || !(missingColumn in workingPayload)) {
      return {
        error: result.error,
        removedColumns,
      };
    }

    delete workingPayload[missingColumn];
    removedColumns.push(missingColumn);
  }

  return {
    error: {
      message:
        "Unable to update reconciliation status because too many expected columns are missing from the live database schema.",
    },
    removedColumns,
  };
}

async function getInternalUser() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      supabase,
      user: null,
      error: NextResponse.json({ error: "Not authenticated." }, { status: 401 }),
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !internalRoles.includes(profile.role)) {
    return {
      supabase,
      user,
      error: NextResponse.json({ error: "Access denied." }, { status: 403 }),
    };
  }

  return {
    supabase,
    user,
    error: null,
  };
}

async function insertCustomerReceipt({
  supabase,
  userId,
  organisationId,
  bankLine,
  split,
}: {
  supabase: SupabaseClient;
  userId?: string;
  organisationId: string;
  bankLine: any;
  split: any;
}): Promise<CreationResult> {
  const customerId = split.customer_id ? String(split.customer_id).trim() : "";
  const incomeAccountId = split.income_account_id
    ? String(split.income_account_id).trim()
    : null;

  if (!customerId) {
    return {
      error: NextResponse.json(
        { error: "Customer is required for customer receipt splits." },
        { status: 400 }
      ),
    };
  }

  if (!incomeAccountId) {
    return {
      error: NextResponse.json(
        { error: "Income GL account is required for customer receipt splits." },
        { status: 400 }
      ),
    };
  }

  const amount = roundMoney(toNumber(split.amount, 0));
  const receiptNumber = buildNumber("RCPT");
  const receiptDate = bankLine.transaction_date;
  const currencyCode = bankLine.currency_code || null;

  const payload = {
    organisation_id: organisationId,
    customer_id: customerId,
    receipt_number: receiptNumber,
    receipt_date: receiptDate,
    currency_code: currencyCode,
    amount_received: amount,
    bank_charges: 0,
    net_amount: amount,
    payment_method: "BANK_TRANSFER",
    reference_number: bankLine.reference_number,
    status: "DRAFT",
    income_account_id: incomeAccountId,
    accounting_period_id: null,
    engagement_id: null,
    created_by: userId,
    updated_by: userId,
  };

  const { data, error, removedColumns } = await insertWithSchemaFallback({
    supabase,
    table: "customer_receipts",
    payload,
    select: "id",
  });

  if (error || !data) {
    return {
      error: NextResponse.json(
        {
          error: "Unable to create customer receipt from bank split.",
          details: error?.message,
          removedColumns,
        },
        { status: 500 }
      ),
    };
  }

  return {
    sourceModule: "CUSTOMER_RECEIPT",
    sourceRecordId: data.id,
  };
}

async function insertSupplierPayment({
  supabase,
  userId,
  organisationId,
  bankLine,
  split,
}: {
  supabase: SupabaseClient;
  userId?: string;
  organisationId: string;
  bankLine: any;
  split: any;
}): Promise<CreationResult> {
  const supplierId = split.supplier_id ? String(split.supplier_id).trim() : "";
  const expenseAccountId = split.expense_account_id
    ? String(split.expense_account_id).trim()
    : null;

  if (!supplierId) {
    return {
      error: NextResponse.json(
        { error: "Supplier is required for supplier payment splits." },
        { status: 400 }
      ),
    };
  }

  if (!expenseAccountId) {
    return {
      error: NextResponse.json(
        { error: "Expense GL account is required for supplier payment splits." },
        { status: 400 }
      ),
    };
  }

  const amount = roundMoney(toNumber(split.amount, 0));
  const paymentNumber = buildNumber("PAY");
  const paymentDate = bankLine.transaction_date;
  const currencyCode = bankLine.currency_code || null;

  const payload = {
    organisation_id: organisationId,
    supplier_id: supplierId,
    payment_number: paymentNumber,
    payment_date: paymentDate,
    currency_code: currencyCode,
    amount_paid: amount,
    bank_charges: 0,
    total_cash_outflow: amount,
    payment_method: "BANK_TRANSFER",
    reference_number: bankLine.reference_number,
    description: split.description || bankLine.description,
    status: "DRAFT",
    expense_account_id: expenseAccountId,
    accounting_period_id: null,
    engagement_id: null,
    created_by: userId,
    updated_by: userId,
  };

  const { data, error, removedColumns } = await insertWithSchemaFallback({
    supabase,
    table: "supplier_payments",
    payload,
    select: "id",
  });

  if (error || !data) {
    return {
      error: NextResponse.json(
        {
          error: "Unable to create supplier payment from bank split.",
          details: error?.message,
          removedColumns,
        },
        { status: 500 }
      ),
    };
  }

  return {
    sourceModule: "SUPPLIER_PAYMENT",
    sourceRecordId: data.id,
  };
}

async function insertFundingTransaction({
  supabase,
  userId,
  organisationId,
  bankLine,
  split,
}: {
  supabase: SupabaseClient;
  userId?: string;
  organisationId: string;
  bankLine: any;
  split: any;
}): Promise<CreationResult> {
  const investorId = split.investor_id ? String(split.investor_id).trim() : null;

  const incomeAccountId = split.income_account_id
    ? String(split.income_account_id).trim()
    : null;

  const expenseAccountId = split.expense_account_id
    ? String(split.expense_account_id).trim()
    : null;

  const isMoneyIn = roundMoney(toNumber(bankLine.money_in, 0)) > 0;

  if (isMoneyIn && !incomeAccountId) {
    return {
      error: NextResponse.json(
        {
          error:
            "Funding / income GL account is required before adding a funding transaction from banking.",
        },
        { status: 400 }
      ),
    };
  }

  if (!isMoneyIn && !expenseAccountId) {
    return {
      error: NextResponse.json(
        {
          error:
            "Funding / expense GL account is required before adding a funding payment from banking.",
        },
        { status: 400 }
      ),
    };
  }

  const transactionType = mapFundingTransactionType(
    split.funding_transaction_type
  );

  const amount = roundMoney(toNumber(split.amount, 0));
  const transactionNumber = buildNumber("FUND");
  const transactionDate = bankLine.transaction_date;
  const currencyCode = bankLine.currency_code || null;

  const payload = {
    organisation_id: organisationId,
    investor_id: investorId,
    transaction_number: transactionNumber,
    transaction_date: transactionDate,
    transaction_type: transactionType,
    currency_code: currencyCode,
    amount,
    bank_charges: 0,
    net_amount: amount,
    reference_number: bankLine.reference_number,
    purpose: split.description || bankLine.description,
    status: "DRAFT",
    accounting_period_id: null,
    engagement_id: null,
    created_by: userId,
    updated_by: userId,
  };

  const { data, error, removedColumns } = await insertWithSchemaFallback({
    supabase,
    table: "funding_transactions",
    payload,
    select: "id",
  });

  if (error || !data) {
    return {
      error: NextResponse.json(
        {
          error: "Unable to create funding transaction from bank split.",
          details: error?.message,
          removedColumns,
        },
        { status: 500 }
      ),
    };
  }

  return {
    sourceModule: "FUNDING_TRANSACTION",
    sourceRecordId: data.id,
    debitAccountId: expenseAccountId,
    creditAccountId: incomeAccountId,
  };
}

async function insertDraftJournalFromBankSplit({
  supabase,
  userId,
  organisationId,
  bankLine,
  split,
}: {
  supabase: SupabaseClient;
  userId?: string;
  organisationId: string;
  bankLine: any;
  split: any;
}): Promise<CreationResult> {
  const splitType = String(split.split_type || "").trim().toUpperCase();
  const amount = roundMoney(toNumber(split.amount, 0));
  const isMoneyIn = roundMoney(toNumber(bankLine.money_in, 0)) > 0;

  const { data: bankAccount, error: bankAccountError } = await supabase
    .from("bank_accounts")
    .select("id, account_name, bank_name, currency_code, gl_account_id")
    .eq("id", bankLine.bank_account_id)
    .eq("organisation_id", organisationId)
    .single();

  if (bankAccountError || !bankAccount) {
    return {
      error: NextResponse.json(
        {
          error:
            "Unable to create draft journal because the linked bank account could not be found.",
          details: bankAccountError?.message,
        },
        { status: 500 }
      ),
    };
  }

  const bankGlAccountId = bankAccount.gl_account_id
    ? String(bankAccount.gl_account_id).trim()
    : "";

  if (!bankGlAccountId) {
    return {
      error: NextResponse.json(
        {
          error:
            "This bank account is not mapped to a GL account. Select the bank account GL mapping before creating a journal from banking.",
        },
        { status: 400 }
      ),
    };
  }

  const selectedAccountId =
    splitType === "BANK_CHARGE"
      ? split.bank_charge_gl_account_id
        ? String(split.bank_charge_gl_account_id).trim()
        : ""
      : split.income_account_id
        ? String(split.income_account_id).trim()
        : split.expense_account_id
          ? String(split.expense_account_id).trim()
          : "";

  if (!selectedAccountId) {
    return {
      error: NextResponse.json(
        {
          error:
            splitType === "BANK_CHARGE"
              ? "Bank Charges GL account is required before creating the draft journal."
              : "Select a GL account before creating the draft journal for Other Allocation.",
        },
        { status: 400 }
      ),
    };
  }

  const journalNumber = await reserveDocumentNumber({
    supabase,
    organisationId,
    documentType: "JOURNAL_ENTRY",
  });

  const journalDate = bankLine.transaction_date;
  const currencyCode =
    bankLine.currency_code || bankAccount.currency_code || null;

  const description =
    split.description ||
    bankLine.description ||
    (splitType === "BANK_CHARGE"
      ? "Bank charge from bank reconciliation"
      : "Other allocation from bank reconciliation");

  const referenceNumber = bankLine.reference_number || null;

  const debitAccountId =
    splitType === "BANK_CHARGE"
      ? selectedAccountId
      : isMoneyIn
        ? bankGlAccountId
        : selectedAccountId;

  const creditAccountId =
    splitType === "BANK_CHARGE"
      ? bankGlAccountId
      : isMoneyIn
        ? selectedAccountId
        : bankGlAccountId;

  const journalPayload = {
    organisation_id: organisationId,
    accounting_period_id: null,
    engagement_id: null,
    journal_number: journalNumber,
    journal_date: journalDate,
    journal_type: splitType === "BANK_CHARGE" ? "OTHER" : "OTHER",
    description,
    reference_number: referenceNumber,
    currency_code: currencyCode,
    exchange_rate: 1,
    exchange_rate_date: journalDate,
    exchange_rate_source: "BANKING_ADD_TO_BOOKS",
    exchange_rate_is_locked: false,
    total_debits: amount,
    total_credits: amount,
    status: "DRAFT",
    created_by: userId,
    updated_by: userId,
  };

  const {
    data: journalEntry,
    error: journalError,
    removedColumns: journalRemovedColumns,
  } = await insertWithSchemaFallback({
    supabase,
    table: "journal_entries",
    payload: journalPayload,
    select: "id, journal_number",
  });

  if (journalError || !journalEntry) {
    return {
      error: NextResponse.json(
        {
          error: "Unable to create draft journal from bank split.",
          details: journalError?.message,
          removedColumns: journalRemovedColumns,
        },
        { status: 500 }
      ),
    };
  }

  const journalLinesPayload = [
    {
      journal_entry_id: journalEntry.id,
      organisation_id: organisationId,
      line_number: 1,
      account_id: debitAccountId,
      description,
      debit_amount: amount,
      credit_amount: 0,
      customer_id: split.customer_id || null,
      supplier_id: split.supplier_id || null,
      investor_id: split.investor_id || null,
    },
    {
      journal_entry_id: journalEntry.id,
      organisation_id: organisationId,
      line_number: 2,
      account_id: creditAccountId,
      description,
      debit_amount: 0,
      credit_amount: amount,
      customer_id: split.customer_id || null,
      supplier_id: split.supplier_id || null,
      investor_id: split.investor_id || null,
    },
  ];

  const { error: journalLinesError, removedColumns: lineRemovedColumns } =
    await insertWithSchemaFallback({
      supabase,
      table: "journal_entry_lines",
      payload: journalLinesPayload[0],
    });

  if (journalLinesError) {
    await supabase.from("journal_entries").delete().eq("id", journalEntry.id);

    return {
      error: NextResponse.json(
        {
          error:
            "Draft journal was created, but the first journal line could not be saved.",
          details: journalLinesError.message,
          removedColumns: lineRemovedColumns,
        },
        { status: 500 }
      ),
    };
  }

  const { error: secondLineError, removedColumns: secondLineRemovedColumns } =
    await insertWithSchemaFallback({
      supabase,
      table: "journal_entry_lines",
      payload: journalLinesPayload[1],
    });

  if (secondLineError) {
    await supabase
      .from("journal_entry_lines")
      .delete()
      .eq("journal_entry_id", journalEntry.id);

    await supabase.from("journal_entries").delete().eq("id", journalEntry.id);

    return {
      error: NextResponse.json(
        {
          error:
            "Draft journal was created, but the second journal line could not be saved.",
          details: secondLineError.message,
          removedColumns: secondLineRemovedColumns,
        },
        { status: 500 }
      ),
    };
  }

  try {
    await insertWithSchemaFallback({
      supabase,
      table: "audit_logs",
      payload: {
        user_id: userId,
        organisation_id: organisationId,
        action:
          splitType === "BANK_CHARGE"
            ? "BANK_CHARGE_DRAFT_JOURNAL_CREATED_FROM_BANKING"
            : "OTHER_ALLOCATION_DRAFT_JOURNAL_CREATED_FROM_BANKING",
        details: {
          bank_statement_line_id: bankLine.id,
          bank_account_id: bankLine.bank_account_id,
          bank_gl_account_id: bankGlAccountId,
          selected_account_id: selectedAccountId,
          journal_entry_id: journalEntry.id,
          journal_number: journalEntry.journal_number || journalNumber,
          amount,
          split_type: splitType,
          is_money_in: isMoneyIn,
        },
      },
    });
  } catch {
    // Audit logging should not block banking add-to-books.
  }

  return {
    sourceModule: "JOURNAL_ENTRY",
    sourceRecordId: journalEntry.id,
    debitAccountId,
    creditAccountId,
  };
}

async function createSplitRecord({
  supabase,
  userId,
  organisationId,
  bankLine,
  split,
  sourceModule,
  sourceRecordId,
  debitAccountId,
  creditAccountId,
}: {
  supabase: SupabaseClient;
  userId?: string;
  organisationId: string;
  bankLine: any;
  split: any;
  sourceModule?: string | null;
  sourceRecordId?: string | null;
  debitAccountId?: string | null;
  creditAccountId?: string | null;
}) {
  const splitType = String(split.split_type || "").trim().toUpperCase();
  const amount = roundMoney(toNumber(split.amount, 0));

  const fallbackDebitAccountId =
    splitType === "BANK_CHARGE"
      ? split.bank_charge_gl_account_id || null
      : split.expense_account_id || null;

  const fallbackCreditAccountId = split.income_account_id || null;

  const finalDebitAccountId = debitAccountId || fallbackDebitAccountId;
  const finalCreditAccountId = creditAccountId || fallbackCreditAccountId;

  const payload = {
    organisation_id: organisationId,
    bank_account_id: bankLine.bank_account_id,
    bank_statement_line_id: bankLine.id,

    split_type: splitType,
    split_description: split.description || bankLine.description,
    split_amount: amount,

    source_module: sourceModule || null,
    source_record_id: sourceRecordId || null,

    debit_account_id: finalDebitAccountId,
    credit_account_id: finalCreditAccountId,
    debit_gl_account_id: finalDebitAccountId,
    credit_gl_account_id: finalCreditAccountId,

    party_type: split.customer_id
      ? "CUSTOMER"
      : split.supplier_id
        ? "SUPPLIER"
        : split.investor_id
          ? "INVESTOR"
          : null,
    party_id: split.customer_id || split.supplier_id || split.investor_id || null,

    bank_charge_treatment:
      splitType === "BANK_CHARGE" ? "SEPARATE_BANK_LINE" : "NONE",
    bank_charge_amount: splitType === "BANK_CHARGE" ? amount : 0,
    bank_charge_gl_account_id:
      splitType === "BANK_CHARGE"
        ? split.bank_charge_gl_account_id || null
        : null,

    status: "ALLOCATED",
    created_by: userId,
    updated_by: userId,
  };

  const { error, removedColumns } = await insertWithSchemaFallback({
    supabase,
    table: "bank_line_splits",
    payload,
  });

  return {
    error,
    removedColumns,
  };
}

async function createAllocationRecord({
  supabase,
  userId,
  organisationId,
  bankLine,
  split,
  sourceModule,
  sourceRecordId,
  debitAccountId,
  creditAccountId,
}: {
  supabase: SupabaseClient;
  userId?: string;
  organisationId: string;
  bankLine: any;
  split: any;
  sourceModule?: string | null;
  sourceRecordId?: string | null;
  debitAccountId?: string | null;
  creditAccountId?: string | null;
}) {
  const splitType = String(split.split_type || "").trim().toUpperCase();
  const amount = roundMoney(toNumber(split.amount, 0));

  const fallbackDebitAccountId =
    splitType === "BANK_CHARGE"
      ? split.bank_charge_gl_account_id || null
      : split.expense_account_id || null;

  const fallbackCreditAccountId = split.income_account_id || null;

  const finalDebitAccountId = debitAccountId || fallbackDebitAccountId;
  const finalCreditAccountId = creditAccountId || fallbackCreditAccountId;

  const payload = {
    organisation_id: organisationId,
    bank_account_id: bankLine.bank_account_id,
    bank_statement_line_id: bankLine.id,

    allocation_type:
      splitType === "BANK_CHARGE"
        ? "BANK_CHARGE"
        : splitType === "OTHER"
          ? "OTHER"
          : "ADD_TO_BOOKS",

    source_module: sourceModule || null,
    source_record_id: sourceRecordId || null,

    allocation_description: split.description || bankLine.description,
    allocation_amount: amount,

    debit_account_id: finalDebitAccountId,
    credit_account_id: finalCreditAccountId,
    debit_gl_account_id: finalDebitAccountId,
    credit_gl_account_id: finalCreditAccountId,

    party_type: split.customer_id
      ? "CUSTOMER"
      : split.supplier_id
        ? "SUPPLIER"
        : split.investor_id
          ? "INVESTOR"
          : null,
    party_id: split.customer_id || split.supplier_id || split.investor_id || null,

    bank_charge_treatment:
      splitType === "BANK_CHARGE" ? "SEPARATE_BANK_LINE" : "NONE",
    bank_charge_amount: splitType === "BANK_CHARGE" ? amount : 0,
    bank_charge_gl_account_id:
      splitType === "BANK_CHARGE"
        ? split.bank_charge_gl_account_id || null
        : null,

    status: "ALLOCATED",
    created_by: userId,
    updated_by: userId,
  };

  const { error, removedColumns } = await insertWithSchemaFallback({
    supabase,
    table: "bank_reconciliation_allocations",
    payload,
  });

  return {
    error,
    removedColumns,
  };
}

async function updateSourceReconciliationStatus({
  supabase,
  organisationId,
  bankLine,
  split,
  sourceModule,
  sourceRecordId,
}: {
  supabase: SupabaseClient;
  organisationId: string;
  bankLine: any;
  split: any;
  sourceModule?: string | null;
  sourceRecordId?: string | null;
}) {
  if (!sourceModule || !sourceRecordId) {
    return {
      error: null,
      removedColumns: [],
    };
  }

  const amount = roundMoney(toNumber(split.amount, 0));

  const payload = {
    organisation_id: organisationId,
    source_module: sourceModule,
    source_record_id: sourceRecordId,
    source_amount: amount,
    allocated_bank_amount: amount,
    unallocated_source_amount: 0,
    reconciliation_status: "RECONCILED",
    last_bank_statement_line_id: bankLine.id,
  };

  return upsertWithSchemaFallback({
    supabase,
    table: "source_transaction_reconciliation_status",
    payload,
    onConflict: "organisation_id,source_module,source_record_id",
  });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ lineId: string }> }
) {
  try {
    const { lineId } = await context.params;

    const { supabase, user, error } = await getInternalUser();

    if (error) {
      return error;
    }

    const body = await request.json();

    if (!lineId) {
      return NextResponse.json(
        { error: "Bank statement line is required." },
        { status: 400 }
      );
    }

    const splits = Array.isArray(body.splits) ? body.splits : [];

    if (splits.length === 0) {
      return NextResponse.json(
        { error: "At least one split line is required." },
        { status: 400 }
      );
    }

    const { data: bankLine } = await supabase
      .from("bank_statement_lines")
      .select(
        "id, organisation_id, bank_account_id, transaction_date, description, reference_number, money_in, money_out, currency_code, allocated_amount, unallocated_amount, reconciliation_status"
      )
      .eq("id", lineId)
      .single();

    if (!bankLine) {
      return NextResponse.json(
        { error: "Bank statement line not found." },
        { status: 404 }
      );
    }

    if (
      ["RECONCILED", "ADDED_TO_BOOKS", "EXCLUDED", "IGNORED"].includes(
        bankLine.reconciliation_status || ""
      )
    ) {
      return NextResponse.json(
        {
          error:
            "This bank line has already been reconciled, added to books, or excluded.",
        },
        { status: 409 }
      );
    }

    const moneyIn = roundMoney(toNumber(bankLine.money_in, 0));
    const moneyOut = roundMoney(toNumber(bankLine.money_out, 0));
    const bankLineAmount = moneyIn > 0 ? moneyIn : moneyOut;
    const isMoneyIn = moneyIn > 0;
    const alreadyAllocated = roundMoney(toNumber(bankLine.allocated_amount, 0));

    const currentUnallocated = getCurrentUnallocatedAmount({
      bankLineAmount,
      allocatedAmount: alreadyAllocated,
      unallocatedAmount: bankLine.unallocated_amount,
    });

    if (bankLineAmount <= 0) {
      return NextResponse.json(
        { error: "Bank line amount must be greater than zero." },
        { status: 400 }
      );
    }

    if (currentUnallocated <= 0) {
      return NextResponse.json(
        { error: "There is no remaining unallocated amount on this bank line." },
        { status: 409 }
      );
    }

    let totalSplitAmount = 0;

    for (const split of splits) {
      const splitType = String(split.split_type || "").trim().toUpperCase();
      const amount = roundMoney(toNumber(split.amount, 0));

      if (!allowedSplitTypes.includes(splitType)) {
        return NextResponse.json(
          { error: "Invalid split type." },
          { status: 400 }
        );
      }

      if (amount <= 0) {
        return NextResponse.json(
          { error: "Each split amount must be greater than zero." },
          { status: 400 }
        );
      }

      if (
        isMoneyIn &&
        !["CUSTOMER_RECEIPT", "FUNDING_TRANSACTION", "BANK_CHARGE", "OTHER"].includes(
          splitType
        )
      ) {
        return NextResponse.json(
          { error: "Invalid split type for money in bank line." },
          { status: 400 }
        );
      }

      if (
        !isMoneyIn &&
        !["SUPPLIER_PAYMENT", "FUNDING_TRANSACTION", "BANK_CHARGE", "OTHER"].includes(
          splitType
        )
      ) {
        return NextResponse.json(
          { error: "Invalid split type for money out bank line." },
          { status: 400 }
        );
      }

      if (splitType === "CUSTOMER_RECEIPT" && !split.customer_id) {
        return NextResponse.json(
          { error: "Customer is required for customer receipt splits." },
          { status: 400 }
        );
      }

      if (splitType === "CUSTOMER_RECEIPT" && !split.income_account_id) {
        return NextResponse.json(
          { error: "Income GL account is required for customer receipt splits." },
          { status: 400 }
        );
      }

      if (splitType === "SUPPLIER_PAYMENT" && !split.supplier_id) {
        return NextResponse.json(
          { error: "Supplier is required for supplier payment splits." },
          { status: 400 }
        );
      }

      if (splitType === "SUPPLIER_PAYMENT" && !split.expense_account_id) {
        return NextResponse.json(
          { error: "Expense GL account is required for supplier payment splits." },
          { status: 400 }
        );
      }

      if (
        splitType === "FUNDING_TRANSACTION" &&
        isMoneyIn &&
        !split.income_account_id
      ) {
        return NextResponse.json(
          {
            error:
              "Funding / income GL account is required before adding a funding transaction from banking.",
          },
          { status: 400 }
        );
      }

      if (
        splitType === "FUNDING_TRANSACTION" &&
        !isMoneyIn &&
        !split.expense_account_id
      ) {
        return NextResponse.json(
          {
            error:
              "Funding / expense GL account is required before adding a funding payment from banking.",
          },
          { status: 400 }
        );
      }

      if (splitType === "BANK_CHARGE" && !split.bank_charge_gl_account_id) {
        return NextResponse.json(
          { error: "Bank Charges GL account is required for bank charge splits." },
          { status: 400 }
        );
      }

      if (
        splitType === "OTHER" &&
        !split.income_account_id &&
        !split.expense_account_id
      ) {
        return NextResponse.json(
          { error: "Select at least one GL account for other allocation splits." },
          { status: 400 }
        );
      }

      totalSplitAmount = roundMoney(totalSplitAmount + amount);
    }

    if (Math.abs(totalSplitAmount - currentUnallocated) >= 0.01) {
      return NextResponse.json(
        {
          error: `Split total must equal the remaining unallocated bank line amount. Remaining: ${formatAmount(
            currentUnallocated
          )}. Split total: ${formatAmount(totalSplitAmount)}.`,
        },
        { status: 400 }
      );
    }

    const createdSources: {
      splitType: string;
      amount: number;
      sourceModule: string | null;
      sourceRecordId: string | null;
      removedColumns: Record<string, string[]>;
    }[] = [];

    for (const split of splits) {
      const splitType = String(split.split_type || "").trim().toUpperCase();

      let creationResult: CreationResult | undefined;

      if (splitType === "CUSTOMER_RECEIPT") {
        creationResult = await insertCustomerReceipt({
          supabase,
          userId: user?.id,
          organisationId: bankLine.organisation_id,
          bankLine,
          split,
        });
      } else if (splitType === "SUPPLIER_PAYMENT") {
        creationResult = await insertSupplierPayment({
          supabase,
          userId: user?.id,
          organisationId: bankLine.organisation_id,
          bankLine,
          split,
        });
      } else if (splitType === "FUNDING_TRANSACTION") {
        creationResult = await insertFundingTransaction({
          supabase,
          userId: user?.id,
          organisationId: bankLine.organisation_id,
          bankLine,
          split,
        });
      } else if (splitType === "BANK_CHARGE" || splitType === "OTHER") {
        creationResult = await insertDraftJournalFromBankSplit({
          supabase,
          userId: user?.id,
          organisationId: bankLine.organisation_id,
          bankLine,
          split,
        });
      } else {
        creationResult = {
          sourceModule: null,
          sourceRecordId: null,
          debitAccountId: null,
          creditAccountId: null,
        };
      }

      if (creationResult?.error) {
        return creationResult.error;
      }

      const sourceModule = creationResult?.sourceModule || null;
      const sourceRecordId = creationResult?.sourceRecordId || null;
      const debitAccountId = creationResult?.debitAccountId || null;
      const creditAccountId = creationResult?.creditAccountId || null;

      const splitRecordResult = await createSplitRecord({
        supabase,
        userId: user?.id,
        organisationId: bankLine.organisation_id,
        bankLine,
        split,
        sourceModule,
        sourceRecordId,
        debitAccountId,
        creditAccountId,
      });

      if (splitRecordResult.error) {
        return NextResponse.json(
          {
            error:
              "Source transaction was created, but the split record could not be saved.",
            details: splitRecordResult.error.message,
            removedColumns: splitRecordResult.removedColumns,
          },
          { status: 500 }
        );
      }

      const allocationResult = await createAllocationRecord({
        supabase,
        userId: user?.id,
        organisationId: bankLine.organisation_id,
        bankLine,
        split,
        sourceModule,
        sourceRecordId,
        debitAccountId,
        creditAccountId,
      });

      if (allocationResult.error) {
        return NextResponse.json(
          {
            error:
              "Source transaction was created, but the reconciliation allocation could not be saved.",
            details: allocationResult.error.message,
            removedColumns: allocationResult.removedColumns,
          },
          { status: 500 }
        );
      }

      const sourceStatusResult = await updateSourceReconciliationStatus({
        supabase,
        organisationId: bankLine.organisation_id,
        bankLine,
        split,
        sourceModule,
        sourceRecordId,
      });

      if (sourceStatusResult.error) {
        return NextResponse.json(
          {
            error:
              "Split was created, but source reconciliation status could not be updated.",
            details: sourceStatusResult.error.message,
            removedColumns: sourceStatusResult.removedColumns,
          },
          { status: 500 }
        );
      }

      createdSources.push({
        splitType,
        amount: roundMoney(toNumber(split.amount, 0)),
        sourceModule,
        sourceRecordId,
        removedColumns: {
          bank_line_splits: splitRecordResult.removedColumns,
          bank_reconciliation_allocations: allocationResult.removedColumns,
          source_transaction_reconciliation_status:
            sourceStatusResult.removedColumns,
        },
      });
    }

    const { error: recalcError } = await supabase.rpc(
      "recalculate_bank_statement_line_reconciliation",
      {
        p_bank_statement_line_id: lineId,
      }
    );

    if (recalcError) {
      return NextResponse.json(
        {
          error:
            "Splits were created, but bank line reconciliation status could not be recalculated.",
          details: recalcError.message,
        },
        { status: 500 }
      );
    }

    const primarySource = createdSources.find((source) => source.sourceModule);

    const updateResult = await updateWithSchemaFallback({
      supabase,
      table: "bank_statement_lines",
      payload: {
        reconciliation_status: "ADDED_TO_BOOKS",
        added_transaction_module: primarySource?.sourceModule || "SPLIT",
        added_transaction_id: primarySource?.sourceRecordId || null,
        updated_by: user?.id,
      },
      eqColumn: "id",
      eqValue: lineId,
    });

    if (updateResult.error) {
      return NextResponse.json(
        {
          error:
            "Splits were created, but the bank line could not be updated. Please review manually.",
          details: updateResult.error.message,
          removedColumns: updateResult.removedColumns,
        },
        { status: 500 }
      );
    }

    try {
      await insertWithSchemaFallback({
        supabase,
        table: "audit_logs",
        payload: {
          user_id: user?.id,
          organisation_id: bankLine.organisation_id,
          action: "BANK_STATEMENT_LINE_SPLIT_ADDED_TO_BOOKS",
          details: {
            bank_statement_line_id: lineId,
            bank_account_id: bankLine.bank_account_id,
            bank_line_amount: bankLineAmount,
            already_allocated_amount: alreadyAllocated,
            remaining_unallocated_amount: currentUnallocated,
            total_split_amount: totalSplitAmount,
            splits: createdSources,
          },
        },
      });
    } catch {
      // Audit logging should not block add-to-books.
    }

    return NextResponse.json({
      success: true,
      lineId,
      status: "ADDED_TO_BOOKS",
      bankLineAmount,
      alreadyAllocated,
      currentUnallocated,
      totalSplitAmount,
      createdSources,
      bankLineUpdateRemovedColumns: updateResult.removedColumns,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to add bank line to books.",
      },
      { status: 500 }
    );
  }
}