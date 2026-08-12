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

const editableStatuses = ["DRAFT", "READY_FOR_REVIEW", "REVIEWED", "UNDER_REVIEW"];

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;
type AnyRecord = Record<string, any>;

type GlLineInput = {
  account_id: string;
  description: string | null;
  debit_amount: number;
  credit_amount: number;
  customer_id?: string | null;
  supplier_id?: string | null;
  investor_id?: string | null;
  source_line_id?: string | null;
};

function toMoney(value: unknown) {
  return Number(Number(value || 0).toFixed(2));
}

function getSourceKey(sourceModule?: string | null, sourceRecordId?: string | null) {
  return `${sourceModule || ""}:${sourceRecordId || ""}`;
}

function isPosted(record?: AnyRecord | null) {
  return record?.status === "POSTED" || Boolean(record?.posted_at);
}

function isVoid(record?: AnyRecord | null) {
  return ["VOID", "VOIDED", "CANCELLED", "CANCELED", "REVERSED"].includes(
    record?.status || ""
  );
}

function isFundingOutflow(transactionType?: string | null) {
  return transactionType === "LOAN_REPAYMENT" || transactionType === "INTEREST_PAYMENT";
}

function getMissingSchemaColumn(errorMessage?: string | null) {
  if (!errorMessage) return null;

  const match = errorMessage.match(
    /Could not find the '([^']+)' column of '([^']+)' in the schema cache/i
  );

  return match?.[1] || null;
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

async function validateAccountingPeriodIsOpen({
  supabase,
  organisationId,
  entryDate,
}: {
  supabase: SupabaseClient;
  organisationId: string;
  entryDate: string;
}) {
  const { data: lockedPeriodRows, error } = await supabase
    .from("accounting_periods")
    .select("id, period_name, start_date, end_date, status")
    .eq("organisation_id", organisationId)
    .lte("start_date", entryDate)
    .gte("end_date", entryDate)
    .in("status", ["LOCKED", "CLOSED"])
    .limit(1);

  if (error) {
    return {
      error: NextResponse.json(
        {
          error: "Unable to validate accounting period lock status.",
          details: error.message,
        },
        { status: 500 }
      ),
    };
  }

  const lockedPeriod = (lockedPeriodRows || [])[0];

  if (lockedPeriod) {
    return {
      error: NextResponse.json(
        {
          error:
            "This accounting period is locked or closed. Posting is not allowed.",
          periodId: lockedPeriod.id,
          periodName: lockedPeriod.period_name,
          periodStatus: lockedPeriod.status,
          entryDate,
        },
        { status: 409 }
      ),
    };
  }

  return { error: null };
}

async function createGeneralLedgerEntry({
  supabase,
  userId,
  organisationId,
  accountingPeriodId,
  engagementId,
  entryDate,
  sourceModule,
  sourceRecordId,
  sourceReference,
  description,
  currencyCode,
  exchangeRate,
  exchangeRateDate,
  exchangeRateSource,
  exchangeRateIsLocked,
  lines,
}: {
  supabase: SupabaseClient;
  userId: string;
  organisationId: string;
  accountingPeriodId?: string | null;
  engagementId?: string | null;
  entryDate: string;
  sourceModule: string;
  sourceRecordId: string;
  sourceReference: string | null;
  description: string | null;
  currencyCode: string | null;
  exchangeRate: number;
  exchangeRateDate?: string | null;
  exchangeRateSource?: string | null;
  exchangeRateIsLocked?: boolean | null;
  lines: GlLineInput[];
}) {
  const periodCheck = await validateAccountingPeriodIsOpen({
    supabase,
    organisationId,
    entryDate,
  });

  if (periodCheck.error) {
    return { error: periodCheck.error };
  }

  const { data: existingLedgerEntry } = await supabase
    .from("general_ledger_entries")
    .select("id, entry_number, status")
    .eq("organisation_id", organisationId)
    .eq("source_module", sourceModule)
    .eq("source_record_id", sourceRecordId)
    .maybeSingle();

  if (existingLedgerEntry) {
    return {
      skipped: true,
      ledgerEntryId: existingLedgerEntry.id,
      entryNumber: existingLedgerEntry.entry_number,
    };
  }

  if (lines.length < 2) {
    return {
      error: NextResponse.json(
        { error: `${sourceModule} must produce at least two GL lines.` },
        { status: 400 }
      ),
    };
  }

  const totalDebits = toMoney(
    lines.reduce((sum, line) => sum + toMoney(line.debit_amount), 0)
  );

  const totalCredits = toMoney(
    lines.reduce((sum, line) => sum + toMoney(line.credit_amount), 0)
  );

  if (totalDebits <= 0 || totalCredits <= 0 || totalDebits !== totalCredits) {
    return {
      error: NextResponse.json(
        {
          error: `${sourceModule} is not balanced and cannot be posted.`,
          totalDebits,
          totalCredits,
        },
        { status: 400 }
      ),
    };
  }

  const accountIds = Array.from(new Set(lines.map((line) => line.account_id)));

  if (accountIds.some((accountId) => !accountId)) {
    return {
      error: NextResponse.json(
        { error: `${sourceModule} has a missing GL account.` },
        { status: 400 }
      ),
    };
  }

  const { data: accounts, error: accountsError } = await supabase
    .from("chart_of_accounts")
    .select("id, is_active")
    .eq("organisation_id", organisationId)
    .in("id", accountIds);

  if (accountsError) {
    return {
      error: NextResponse.json(
        { error: "Unable to validate GL accounts.", details: accountsError.message },
        { status: 500 }
      ),
    };
  }

  const activeAccountIds = new Set(
    (accounts || [])
      .filter((account) => account.is_active)
      .map((account) => account.id)
  );

  const invalidAccountId = accountIds.find(
    (accountId) => !activeAccountIds.has(accountId)
  );

  if (invalidAccountId) {
    return {
      error: NextResponse.json(
        {
          error:
            "One or more selected accounts are inactive or invalid for this organisation.",
          accountId: invalidAccountId,
        },
        { status: 400 }
      ),
    };
  }

  const entryNumber = await reserveDocumentNumber({
    supabase,
    organisationId,
    documentType: "GL_ENTRY",
  });

  const { data: ledgerEntry, error: ledgerEntryError } = await supabase
    .from("general_ledger_entries")
    .insert({
      organisation_id: organisationId,
      accounting_period_id: accountingPeriodId || null,
      engagement_id: engagementId || null,

      entry_number: entryNumber,
      entry_date: entryDate,

      source_module: sourceModule,
      source_record_id: sourceRecordId,
      source_line_id: null,

      source_reference: sourceReference,
      description: description || `${sourceModule} posting`,

      currency_code: currencyCode,
      exchange_rate: exchangeRate,
      exchange_rate_date: exchangeRateDate || entryDate,
      exchange_rate_source: exchangeRateSource || null,
      exchange_rate_is_locked: Boolean(exchangeRateIsLocked),

      total_debits: totalDebits,
      total_credits: totalCredits,

      status: "POSTED",
      posted_at: new Date().toISOString(),
      posted_by: userId,

      created_by: userId,
      updated_by: userId,
    })
    .select("id, entry_number")
    .single();

  if (ledgerEntryError || !ledgerEntry) {
    return {
      error: NextResponse.json(
        {
          error: "Unable to create General Ledger entry.",
          details: ledgerEntryError?.message,
        },
        { status: 500 }
      ),
    };
  }

  const ledgerLines = lines.map((line, index) => {
    const debitAmount = toMoney(line.debit_amount);
    const creditAmount = toMoney(line.credit_amount);

    return {
      general_ledger_entry_id: ledgerEntry.id,
      organisation_id: organisationId,

      line_number: index + 1,
      account_id: line.account_id,

      description: line.description || description || `${sourceModule} posting`,

      debit_amount: debitAmount,
      credit_amount: creditAmount,

      base_debit_amount: toMoney(debitAmount * exchangeRate),
      base_credit_amount: toMoney(creditAmount * exchangeRate),

      customer_id: line.customer_id || null,
      supplier_id: line.supplier_id || null,
      investor_id: line.investor_id || null,

      source_module: sourceModule,
      source_record_id: sourceRecordId,
      source_line_id: line.source_line_id || null,
    };
  });

  const { error: ledgerLinesError } = await supabase
    .from("general_ledger_lines")
    .insert(ledgerLines);

  if (ledgerLinesError) {
    await supabase
      .from("general_ledger_entries")
      .delete()
      .eq("id", ledgerEntry.id);

    return {
      error: NextResponse.json(
        {
          error: "Unable to create General Ledger lines. Posting was cancelled.",
          details: ledgerLinesError.message,
        },
        { status: 500 }
      ),
    };
  }

  return {
    ledgerEntryId: ledgerEntry.id,
    entryNumber: ledgerEntry.entry_number,
    totalDebits,
    totalCredits,
  };
}

async function postCustomerReceipt({
  supabase,
  userId,
  organisationId,
  allocation,
  bankGlAccountId,
}: {
  supabase: SupabaseClient;
  userId: string;
  organisationId: string;
  allocation: AnyRecord;
  bankGlAccountId: string;
}) {
  const { data: receipt } = await supabase
    .from("customer_receipts")
    .select("*")
    .eq("id", allocation.source_record_id)
    .eq("organisation_id", organisationId)
    .single();

  if (!receipt) {
    return {
      error: NextResponse.json(
        { error: "Linked customer receipt not found." },
        { status: 404 }
      ),
    };
  }

  if (isPosted(receipt)) {
    return { skipped: true, reason: "Customer receipt already posted." };
  }

  if (isVoid(receipt) || !editableStatuses.includes(receipt.status || "")) {
    return {
      error: NextResponse.json(
        {
          error:
            "Customer receipt is not in an editable/reviewable status and cannot be group-posted.",
          receiptNumber: receipt.receipt_number,
          status: receipt.status,
        },
        { status: 400 }
      ),
    };
  }

  const amount = toMoney(receipt.net_amount || receipt.amount_received);
  const allocationAmount = toMoney(allocation.allocation_amount);

  if (Math.abs(amount - allocationAmount) >= 0.01) {
    return {
      error: NextResponse.json(
        {
          error:
            "Customer receipt amount does not equal the linked bank allocation amount. Edit the draft before posting.",
          receiptNumber: receipt.receipt_number,
          receiptAmount: amount,
          allocationAmount,
        },
        { status: 400 }
      ),
    };
  }

  const creditAccountId =
    receipt.income_account_id || receipt.receivable_account_id || allocation.credit_account_id;

  if (!bankGlAccountId || !creditAccountId) {
    return {
      error: NextResponse.json(
        {
          error:
            "Customer receipt cannot be posted because the bank or credit GL account is missing.",
          receiptNumber: receipt.receipt_number,
        },
        { status: 400 }
      ),
    };
  }

  const result = await createGeneralLedgerEntry({
    supabase,
    userId,
    organisationId,
    accountingPeriodId: receipt.accounting_period_id,
    engagementId: receipt.engagement_id,
    entryDate: receipt.receipt_date,
    sourceModule: "CUSTOMER_RECEIPT",
    sourceRecordId: receipt.id,
    sourceReference: receipt.receipt_number || receipt.reference_number || receipt.id,
    description: receipt.narration || "Customer receipt posting",
    currencyCode: receipt.currency_code,
    exchangeRate: Number(receipt.exchange_rate || 1),
    exchangeRateDate: receipt.receipt_date,
    exchangeRateSource: null,
    exchangeRateIsLocked: false,
    lines: [
      {
        account_id: bankGlAccountId,
        description: receipt.narration || "Customer receipt - bank",
        debit_amount: amount,
        credit_amount: 0,
        customer_id: receipt.customer_id,
      },
      {
        account_id: creditAccountId,
        description: receipt.narration || "Customer receipt - income/receivable",
        debit_amount: 0,
        credit_amount: amount,
        customer_id: receipt.customer_id,
      },
    ],
  });

  if (result.error || result.skipped) return result;

  const updateResult = await updateWithSchemaFallback({
    supabase,
    table: "customer_receipts",
    payload: {
      status: "POSTED",
      posted_at: new Date().toISOString(),
      posted_by: userId,
      updated_by: userId,
    },
    eqColumn: "id",
    eqValue: receipt.id,
  });

  if (updateResult.error) {
    return {
      error: NextResponse.json(
        {
          error:
            "GL entry was created, but the customer receipt status could not be updated.",
          details: updateResult.error.message,
        },
        { status: 500 }
      ),
    };
  }

  return result;
}

async function postSupplierPayment({
  supabase,
  userId,
  organisationId,
  allocation,
  bankGlAccountId,
}: {
  supabase: SupabaseClient;
  userId: string;
  organisationId: string;
  allocation: AnyRecord;
  bankGlAccountId: string;
}) {
  const { data: payment } = await supabase
    .from("supplier_payments")
    .select("*")
    .eq("id", allocation.source_record_id)
    .eq("organisation_id", organisationId)
    .single();

  if (!payment) {
    return {
      error: NextResponse.json(
        { error: "Linked supplier payment not found." },
        { status: 404 }
      ),
    };
  }

  if (isPosted(payment)) {
    return { skipped: true, reason: "Supplier payment already posted." };
  }

  if (isVoid(payment) || !editableStatuses.includes(payment.status || "")) {
    return {
      error: NextResponse.json(
        {
          error:
            "Supplier payment is not in an editable/reviewable status and cannot be group-posted.",
          paymentNumber: payment.payment_number,
          status: payment.status,
        },
        { status: 400 }
      ),
    };
  }

  const amount = toMoney(payment.total_cash_outflow || payment.amount_paid);
  const allocationAmount = toMoney(allocation.allocation_amount);

  if (Math.abs(amount - allocationAmount) >= 0.01) {
    return {
      error: NextResponse.json(
        {
          error:
            "Supplier payment amount does not equal the linked bank allocation amount. Edit the draft before posting.",
          paymentNumber: payment.payment_number,
          paymentAmount: amount,
          allocationAmount,
        },
        { status: 400 }
      ),
    };
  }

  const debitAccountId =
    payment.expense_account_id || payment.payable_account_id || allocation.debit_account_id;

  if (!bankGlAccountId || !debitAccountId) {
    return {
      error: NextResponse.json(
        {
          error:
            "Supplier payment cannot be posted because the bank or debit GL account is missing.",
          paymentNumber: payment.payment_number,
        },
        { status: 400 }
      ),
    };
  }

  const result = await createGeneralLedgerEntry({
    supabase,
    userId,
    organisationId,
    accountingPeriodId: payment.accounting_period_id,
    engagementId: payment.engagement_id,
    entryDate: payment.payment_date,
    sourceModule: "SUPPLIER_PAYMENT",
    sourceRecordId: payment.id,
    sourceReference: payment.payment_number || payment.reference_number || payment.id,
    description: payment.narration || payment.description || "Supplier payment posting",
    currencyCode: payment.currency_code,
    exchangeRate: Number(payment.exchange_rate || 1),
    exchangeRateDate: payment.payment_date,
    exchangeRateSource: null,
    exchangeRateIsLocked: false,
    lines: [
      {
        account_id: debitAccountId,
        description: payment.narration || payment.description || "Supplier payment",
        debit_amount: amount,
        credit_amount: 0,
        supplier_id: payment.supplier_id,
      },
      {
        account_id: bankGlAccountId,
        description: payment.narration || payment.description || "Supplier payment - bank",
        debit_amount: 0,
        credit_amount: amount,
        supplier_id: payment.supplier_id,
      },
    ],
  });

  if (result.error || result.skipped) return result;

  const updateResult = await updateWithSchemaFallback({
    supabase,
    table: "supplier_payments",
    payload: {
      status: "POSTED",
      posted_at: new Date().toISOString(),
      posted_by: userId,
      updated_by: userId,
    },
    eqColumn: "id",
    eqValue: payment.id,
  });

  if (updateResult.error) {
    return {
      error: NextResponse.json(
        {
          error:
            "GL entry was created, but the supplier payment status could not be updated.",
          details: updateResult.error.message,
        },
        { status: 500 }
      ),
    };
  }

  return result;
}

async function postFundingTransaction({
  supabase,
  userId,
  organisationId,
  allocation,
  bankGlAccountId,
}: {
  supabase: SupabaseClient;
  userId: string;
  organisationId: string;
  allocation: AnyRecord;
  bankGlAccountId: string;
}) {
  const { data: transaction } = await supabase
    .from("funding_transactions")
    .select("*")
    .eq("id", allocation.source_record_id)
    .eq("organisation_id", organisationId)
    .single();

  if (!transaction) {
    return {
      error: NextResponse.json(
        { error: "Linked funding transaction not found." },
        { status: 404 }
      ),
    };
  }

  if (isPosted(transaction)) {
    return { skipped: true, reason: "Funding transaction already posted." };
  }

  if (isVoid(transaction) || !editableStatuses.includes(transaction.status || "")) {
    return {
      error: NextResponse.json(
        {
          error:
            "Funding transaction is not in an editable/reviewable status and cannot be group-posted.",
          transactionNumber: transaction.transaction_number,
          status: transaction.status,
        },
        { status: 400 }
      ),
    };
  }

  const amount = toMoney(transaction.net_amount || transaction.amount);
  const allocationAmount = toMoney(allocation.allocation_amount);

  if (Math.abs(amount - allocationAmount) >= 0.01) {
    return {
      error: NextResponse.json(
        {
          error:
            "Funding transaction amount does not equal the linked bank allocation amount. Edit the draft before posting.",
          transactionNumber: transaction.transaction_number,
          transactionAmount: amount,
          allocationAmount,
        },
        { status: 400 }
      ),
    };
  }

  const outflow = isFundingOutflow(transaction.transaction_type);

  const debitAccountId = outflow
    ? transaction.interest_expense_account_id ||
      transaction.liability_account_id ||
      transaction.equity_account_id ||
      allocation.debit_account_id ||
      allocation.debit_gl_account_id
    : bankGlAccountId;

  const creditAccountId = outflow
    ? bankGlAccountId
    : transaction.income_account_id ||
      transaction.equity_account_id ||
      transaction.liability_account_id ||
      allocation.credit_account_id ||
      allocation.credit_gl_account_id;

  if (!debitAccountId || !creditAccountId) {
    return {
      error: NextResponse.json(
        {
          error:
            "Funding transaction cannot be posted because one or more GL accounts are missing.",
          transactionNumber: transaction.transaction_number,
        },
        { status: 400 }
      ),
    };
  }

  const result = await createGeneralLedgerEntry({
    supabase,
    userId,
    organisationId,
    accountingPeriodId: transaction.accounting_period_id,
    engagementId: transaction.engagement_id,
    entryDate: transaction.transaction_date,
    sourceModule: "FUNDING_TRANSACTION",
    sourceRecordId: transaction.id,
    sourceReference:
      transaction.transaction_number || transaction.reference_number || transaction.id,
    description: transaction.narration || transaction.purpose || "Funding transaction posting",
    currencyCode: transaction.currency_code,
    exchangeRate: Number(transaction.exchange_rate || 1),
    exchangeRateDate: transaction.exchange_rate_date || transaction.transaction_date,
    exchangeRateSource: transaction.exchange_rate_source || null,
    exchangeRateIsLocked: Boolean(transaction.exchange_rate_is_locked),
    lines: [
      {
        account_id: debitAccountId,
        description:
          transaction.narration || transaction.purpose || "Funding transaction debit",
        debit_amount: amount,
        credit_amount: 0,
        investor_id: transaction.investor_id,
      },
      {
        account_id: creditAccountId,
        description:
          transaction.narration || transaction.purpose || "Funding transaction credit",
        debit_amount: 0,
        credit_amount: amount,
        investor_id: transaction.investor_id,
      },
    ],
  });

  if (result.error || result.skipped) return result;

  const updateResult = await updateWithSchemaFallback({
    supabase,
    table: "funding_transactions",
    payload: {
      status: "POSTED",
      posted_at: new Date().toISOString(),
      posted_by: userId,
      updated_by: userId,
    },
    eqColumn: "id",
    eqValue: transaction.id,
  });

  if (updateResult.error) {
    return {
      error: NextResponse.json(
        {
          error:
            "GL entry was created, but the funding transaction status could not be updated.",
          details: updateResult.error.message,
        },
        { status: 500 }
      ),
    };
  }

  return result;
}

async function postJournalEntry({
  supabase,
  userId,
  organisationId,
  allocation,
}: {
  supabase: SupabaseClient;
  userId: string;
  organisationId: string;
  allocation: AnyRecord;
}) {
  const { data: journal } = await supabase
    .from("journal_entries")
    .select("*")
    .eq("id", allocation.source_record_id)
    .eq("organisation_id", organisationId)
    .single();

  if (!journal) {
    return {
      error: NextResponse.json(
        { error: "Linked journal entry not found." },
        { status: 404 }
      ),
    };
  }

  if (isPosted(journal)) {
    return { skipped: true, reason: "Journal already posted." };
  }

  if (isVoid(journal) || !editableStatuses.includes(journal.status || "")) {
    return {
      error: NextResponse.json(
        {
          error:
            "Journal is not in an editable/reviewable status and cannot be group-posted.",
          journalNumber: journal.journal_number,
          status: journal.status,
        },
        { status: 400 }
      ),
    };
  }

  const { data: journalLines, error: linesError } = await supabase
    .from("journal_entry_lines")
    .select("*")
    .eq("journal_entry_id", journal.id)
    .eq("organisation_id", organisationId)
    .order("line_number", { ascending: true });

  if (linesError) {
    return {
      error: NextResponse.json(
        { error: "Unable to read linked journal lines.", details: linesError.message },
        { status: 500 }
      ),
    };
  }

  const lines = journalLines || [];

  const totalDebits = toMoney(
    lines.reduce((sum, line) => sum + Number(line.debit_amount || 0), 0)
  );

  const totalCredits = toMoney(
    lines.reduce((sum, line) => sum + Number(line.credit_amount || 0), 0)
  );

  const allocationAmount = toMoney(allocation.allocation_amount);

  if (
    totalDebits !== totalCredits ||
    Math.abs(totalDebits - allocationAmount) >= 0.01
  ) {
    return {
      error: NextResponse.json(
        {
          error:
            "Linked journal is not balanced against the bank allocation. Edit the draft journal before posting.",
          journalNumber: journal.journal_number,
          totalDebits,
          totalCredits,
          allocationAmount,
        },
        { status: 400 }
      ),
    };
  }

  const result = await createGeneralLedgerEntry({
    supabase,
    userId,
    organisationId,
    accountingPeriodId: journal.accounting_period_id,
    engagementId: journal.engagement_id,
    entryDate: journal.journal_date,
    sourceModule: "JOURNAL_ENTRY",
    sourceRecordId: journal.id,
    sourceReference: journal.journal_number || journal.reference_number || journal.id,
    description: journal.description || "Journal entry posting",
    currencyCode: journal.currency_code,
    exchangeRate: Number(journal.exchange_rate || 1),
    exchangeRateDate: journal.exchange_rate_date || journal.journal_date,
    exchangeRateSource: journal.exchange_rate_source || null,
    exchangeRateIsLocked: Boolean(journal.exchange_rate_is_locked),
    lines: lines.map((line) => ({
      account_id: line.account_id,
      description: line.description || journal.description || "Journal entry posting",
      debit_amount: toMoney(line.debit_amount),
      credit_amount: toMoney(line.credit_amount),
      customer_id: line.customer_id || null,
      supplier_id: line.supplier_id || null,
      investor_id: line.investor_id || null,
      source_line_id: line.id,
    })),
  });

  if (result.error || result.skipped) return result;

  const updateResult = await updateWithSchemaFallback({
    supabase,
    table: "journal_entries",
    payload: {
      status: "POSTED",
      posted_at: new Date().toISOString(),
      posted_by: userId,
      updated_by: userId,
    },
    eqColumn: "id",
    eqValue: journal.id,
  });

  if (updateResult.error) {
    return {
      error: NextResponse.json(
        {
          error: "GL entry was created, but the journal status could not be updated.",
          details: updateResult.error.message,
        },
        { status: 500 }
      ),
    };
  }

  return result;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ lineId: string }> }
) {
  try {
    const { lineId } = await context.params;

    const { supabase, user, error } = await getInternalUser();

    if (error) return error;

    if (!lineId) {
      return NextResponse.json(
        { error: "Bank statement line is required." },
        { status: 400 }
      );
    }

    const { data: bankLine } = await supabase
      .from("bank_statement_lines")
      .select("*")
      .eq("id", lineId)
      .single();

    if (!bankLine) {
      return NextResponse.json(
        { error: "Bank statement line not found." },
        { status: 404 }
      );
    }

    const organisationId = bankLine.organisation_id;

    const { data: bankAccount } = await supabase
      .from("bank_accounts")
      .select("id, account_name, bank_name, gl_account_id")
      .eq("id", bankLine.bank_account_id)
      .eq("organisation_id", organisationId)
      .single();

    if (!bankAccount?.gl_account_id) {
      return NextResponse.json(
        {
          error:
            "The bank account is not mapped to a GL account. Add the bank GL mapping before posting linked drafts.",
        },
        { status: 400 }
      );
    }

    const bankGlAccountId = bankAccount.gl_account_id;

    const { data: allocationRows, error: allocationsError } = await supabase
      .from("bank_reconciliation_allocations")
      .select("*")
      .eq("organisation_id", organisationId)
      .eq("bank_statement_line_id", lineId)
      .order("created_at", { ascending: true });

    if (allocationsError) {
      return NextResponse.json(
        {
          error: "Unable to read linked bank allocations.",
          details: allocationsError.message,
        },
        { status: 500 }
      );
    }

    const allocations = allocationRows || [];

    if (allocations.length === 0) {
      return NextResponse.json(
        { error: "No linked allocations found for this bank line." },
        { status: 400 }
      );
    }

    const moneyIn = toMoney(bankLine.money_in);
    const moneyOut = toMoney(bankLine.money_out);
    const bankLineAmount = moneyIn > 0 ? moneyIn : moneyOut;

    const linkedTotal = toMoney(
      allocations.reduce(
        (sum, allocation) => sum + Number(allocation.allocation_amount || 0),
        0
      )
    );

    const difference = toMoney(bankLineAmount - linkedTotal);

    if (Math.abs(difference) >= 0.01) {
      return NextResponse.json(
        {
          error:
            "Posting blocked. The linked allocation total does not equal the bank line amount.",
          bankLineAmount,
          linkedTotal,
          difference,
        },
        { status: 400 }
      );
    }

    const uniqueAllocations: AnyRecord[] = [];
    const seenSources = new Set<string>();

    for (const allocation of allocations) {
      if (!allocation.source_module || !allocation.source_record_id) continue;

      const sourceKey = getSourceKey(
        allocation.source_module,
        allocation.source_record_id
      );

      if (seenSources.has(sourceKey)) continue;

      seenSources.add(sourceKey);
      uniqueAllocations.push(allocation);
    }

    if (uniqueAllocations.length === 0) {
      return NextResponse.json(
        {
          error:
            "No linked source records found to post. Review the bank allocation links.",
        },
        { status: 400 }
      );
    }

    const posted: AnyRecord[] = [];
    const skipped: AnyRecord[] = [];

    for (const allocation of uniqueAllocations) {
      let result: AnyRecord;

      if (allocation.source_module === "CUSTOMER_RECEIPT") {
        result = await postCustomerReceipt({
          supabase,
          userId: user!.id,
          organisationId,
          allocation,
          bankGlAccountId,
        });
      } else if (allocation.source_module === "SUPPLIER_PAYMENT") {
        result = await postSupplierPayment({
          supabase,
          userId: user!.id,
          organisationId,
          allocation,
          bankGlAccountId,
        });
      } else if (allocation.source_module === "FUNDING_TRANSACTION") {
        result = await postFundingTransaction({
          supabase,
          userId: user!.id,
          organisationId,
          allocation,
          bankGlAccountId,
        });
      } else if (allocation.source_module === "JOURNAL_ENTRY") {
        result = await postJournalEntry({
          supabase,
          userId: user!.id,
          organisationId,
          allocation,
        });
      } else {
        return NextResponse.json(
          {
            error: `Unsupported linked source module: ${allocation.source_module}.`,
          },
          { status: 400 }
        );
      }

      if (result.error) {
        return result.error;
      }

      if (result.skipped) {
        skipped.push({
          sourceModule: allocation.source_module,
          sourceRecordId: allocation.source_record_id,
          reason: result.reason || "Already posted.",
        });
      } else {
        posted.push({
          sourceModule: allocation.source_module,
          sourceRecordId: allocation.source_record_id,
          ledgerEntryId: result.ledgerEntryId,
          entryNumber: result.entryNumber,
        });
      }

      await updateWithSchemaFallback({
        supabase,
        table: "bank_reconciliation_allocations",
        payload: {
          status: result.skipped ? "ALLOCATED" : "POSTED",
          updated_by: user!.id,
        },
        eqColumn: "id",
        eqValue: allocation.id,
      });
    }

    await updateWithSchemaFallback({
      supabase,
      table: "bank_statement_lines",
      payload: {
        reconciliation_status: "RECONCILED",
        reconciled_at: new Date().toISOString(),
        reconciled_by: user!.id,
        updated_by: user!.id,
      },
      eqColumn: "id",
      eqValue: lineId,
    });

    try {
      await supabase.from("audit_logs").insert({
        organisation_id: organisationId,
        user_id: user!.id,
        action: "BANK_LINE_LINKED_DRAFTS_POSTED_TO_GL",
        details: {
          bank_statement_line_id: lineId,
          bank_account_id: bankLine.bank_account_id,
          bank_line_amount: bankLineAmount,
          linked_total: linkedTotal,
          posted,
          skipped,
        },
      });
    } catch {
      // Audit logging should not block posting.
    }

    return NextResponse.json({
      success: true,
      message: "Linked bank-line drafts posted to General Ledger.",
      lineId,
      bankLineAmount,
      linkedTotal,
      posted,
      skipped,
    });
  } catch (error) {
    console.error("Post linked bank-line drafts to GL error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unexpected error while posting linked bank-line drafts.",
      },
      { status: 500 }
    );
  }
}