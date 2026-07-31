import { NextResponse } from "next/server";
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

const allowedTransactionTypes = [
  "CUSTOMER_RECEIPT",
  "SUPPLIER_PAYMENT",
  "FUNDING_TRANSACTION",
];

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

function buildNumber(prefix: string) {
  const datePart = new Date()
    .toISOString()
    .replace(/[-:TZ.]/g, "")
    .slice(0, 14);

  const randomPart = Math.random().toString(36).slice(2, 7).toUpperCase();

  return `${prefix}-${datePart}-${randomPart}`;
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
  body,
  amount,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId?: string;
  organisationId: string;
  bankLine: any;
  body: any;
  amount: number;
}) {
  const customerId = body.customer_id ? String(body.customer_id).trim() : "";
  const incomeAccountId = body.income_account_id
    ? String(body.income_account_id).trim()
    : null;

  if (!customerId) {
    return {
      error: NextResponse.json(
        { error: "Customer is required to add this bank line as a customer receipt." },
        { status: 400 }
      ),
    };
  }

  const receiptNumber = buildNumber("RCPT");
  const receiptDate = bankLine.transaction_date;
  const currencyCode = bankLine.currency_code || body.currency_code || null;
  const bankCharges = roundMoney(toNumber(body.bank_charges, 0));
  const netAmount = roundMoney(amount - bankCharges);

  const payload = {
    organisation_id: organisationId,
    customer_id: customerId,
    receipt_number: receiptNumber,
    receipt_date: receiptDate,
    currency_code: currencyCode,
    amount_received: amount,
    bank_charges: bankCharges,
    net_amount: netAmount,
    payment_method: "BANK_TRANSFER",
    reference_number: bankLine.reference_number,
    description: body.description || bankLine.description,
    status: "DRAFT",
    income_account_id: incomeAccountId,
    accounting_period_id: null,
    engagement_id: null,
    created_by: userId,
    updated_by: userId,
  };

  const { data, error } = await supabase
    .from("customer_receipts")
    .insert(payload)
    .select("id")
    .single();

  if (error || !data) {
    return {
      error: NextResponse.json(
        {
          error: "Unable to create customer receipt from bank line.",
          details: error?.message,
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
  body,
  amount,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId?: string;
  organisationId: string;
  bankLine: any;
  body: any;
  amount: number;
}) {
  const supplierId = body.supplier_id ? String(body.supplier_id).trim() : "";
  const expenseAccountId = body.expense_account_id
    ? String(body.expense_account_id).trim()
    : null;

  if (!supplierId) {
    return {
      error: NextResponse.json(
        { error: "Supplier is required to add this bank line as a supplier payment." },
        { status: 400 }
      ),
    };
  }

  const paymentNumber = buildNumber("PAY");
  const paymentDate = bankLine.transaction_date;
  const currencyCode = bankLine.currency_code || body.currency_code || null;
  const bankCharges = roundMoney(toNumber(body.bank_charges, 0));
  const totalCashOutflow = roundMoney(amount + bankCharges);

  const payload = {
    organisation_id: organisationId,
    supplier_id: supplierId,
    payment_number: paymentNumber,
    payment_date: paymentDate,
    currency_code: currencyCode,
    amount_paid: amount,
    bank_charges: bankCharges,
    total_cash_outflow: totalCashOutflow,
    payment_method: "BANK_TRANSFER",
    reference_number: bankLine.reference_number,
    description: body.description || bankLine.description,
    status: "DRAFT",
    expense_account_id: expenseAccountId,
    accounting_period_id: null,
    engagement_id: null,
    created_by: userId,
    updated_by: userId,
  };

  const { data, error } = await supabase
    .from("supplier_payments")
    .insert(payload)
    .select("id")
    .single();

  if (error || !data) {
    return {
      error: NextResponse.json(
        {
          error: "Unable to create supplier payment from bank line.",
          details: error?.message,
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
  body,
  amount,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId?: string;
  organisationId: string;
  bankLine: any;
  body: any;
  amount: number;
}) {
  const investorId = body.investor_id ? String(body.investor_id).trim() : null;
  const transactionType = body.funding_transaction_type
    ? String(body.funding_transaction_type).trim().toUpperCase()
    : "GRANT_RECEIVED";

  const transactionNumber = buildNumber("FUND");
  const transactionDate = bankLine.transaction_date;
  const currencyCode = bankLine.currency_code || body.currency_code || null;
  const bankCharges = roundMoney(toNumber(body.bank_charges, 0));
  const netAmount = roundMoney(amount - bankCharges);

  const payload = {
    organisation_id: organisationId,
    investor_id: investorId,
    transaction_number: transactionNumber,
    transaction_date: transactionDate,
    transaction_type: transactionType,
    currency_code: currencyCode,
    amount,
    bank_charges: bankCharges,
    net_amount: netAmount,
    reference_number: bankLine.reference_number,
    purpose: body.description || bankLine.description,
    status: "DRAFT",
    accounting_period_id: null,
    engagement_id: null,
    created_by: userId,
    updated_by: userId,
  };

  const { data, error } = await supabase
    .from("funding_transactions")
    .insert(payload)
    .select("id")
    .single();

  if (error || !data) {
    return {
      error: NextResponse.json(
        {
          error: "Unable to create funding transaction from bank line.",
          details: error?.message,
        },
        { status: 500 }
      ),
    };
  }

  return {
    sourceModule: "FUNDING_TRANSACTION",
    sourceRecordId: data.id,
  };
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

    const transactionType = String(body.transaction_type || "")
      .trim()
      .toUpperCase();

    if (!lineId) {
      return NextResponse.json(
        { error: "Bank statement line is required." },
        { status: 400 }
      );
    }

    if (!allowedTransactionTypes.includes(transactionType)) {
      return NextResponse.json(
        { error: "Invalid add-to-books transaction type." },
        { status: 400 }
      );
    }

    const { data: bankLine } = await supabase
      .from("bank_statement_lines")
      .select(
        "id, organisation_id, bank_account_id, transaction_date, description, reference_number, money_in, money_out, currency_code, reconciliation_status"
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
      ["MATCHED", "RECONCILED", "ADDED_TO_BOOKS", "EXCLUDED", "IGNORED"].includes(
        bankLine.reconciliation_status || ""
      )
    ) {
      return NextResponse.json(
        {
          error:
            "This bank line has already been matched, reconciled, added to books, or excluded.",
        },
        { status: 409 }
      );
    }

    const moneyIn = roundMoney(toNumber(bankLine.money_in, 0));
    const moneyOut = roundMoney(toNumber(bankLine.money_out, 0));
    const amount = moneyIn > 0 ? moneyIn : moneyOut;
    const isMoneyIn = moneyIn > 0;

    if (amount <= 0) {
      return NextResponse.json(
        { error: "Bank line amount must be greater than zero." },
        { status: 400 }
      );
    }

    if (!isMoneyIn && transactionType !== "SUPPLIER_PAYMENT") {
      return NextResponse.json(
        {
          error:
            "Money out bank lines can only be added as supplier payments in this foundation version.",
        },
        { status: 400 }
      );
    }

    if (
      isMoneyIn &&
      !["CUSTOMER_RECEIPT", "FUNDING_TRANSACTION"].includes(transactionType)
    ) {
      return NextResponse.json(
        {
          error:
            "Money in bank lines can only be added as customer receipts or funding transactions in this foundation version.",
        },
        { status: 400 }
      );
    }

    let creationResult:
      | {
          sourceModule?: string;
          sourceRecordId?: string;
          error?: NextResponse;
        }
      | undefined;

    if (transactionType === "CUSTOMER_RECEIPT") {
      creationResult = await insertCustomerReceipt({
        supabase,
        userId: user?.id,
        organisationId: bankLine.organisation_id,
        bankLine,
        body,
        amount,
      });
    }

    if (transactionType === "SUPPLIER_PAYMENT") {
      creationResult = await insertSupplierPayment({
        supabase,
        userId: user?.id,
        organisationId: bankLine.organisation_id,
        bankLine,
        body,
        amount,
      });
    }

    if (transactionType === "FUNDING_TRANSACTION") {
      creationResult = await insertFundingTransaction({
        supabase,
        userId: user?.id,
        organisationId: bankLine.organisation_id,
        bankLine,
        body,
        amount,
      });
    }

    if (!creationResult) {
      return NextResponse.json(
        { error: "Unable to determine source transaction creation result." },
        { status: 500 }
      );
    }

    if (creationResult.error) {
      return creationResult.error;
    }

    const { sourceModule, sourceRecordId } = creationResult;

    const { error: updateError } = await supabase
      .from("bank_statement_lines")
      .update({
        reconciliation_status: "ADDED_TO_BOOKS",
        added_transaction_module: sourceModule,
        added_transaction_id: sourceRecordId,
        updated_by: user?.id,
      })
      .eq("id", lineId);

    if (updateError) {
      return NextResponse.json(
        {
          error:
            "Source transaction was created, but the bank line could not be updated. Please review manually.",
          details: updateError.message,
          sourceModule,
          sourceRecordId,
        },
        { status: 500 }
      );
    }

    try {
      await supabase.from("audit_logs").insert({
        user_id: user?.id,
        organisation_id: bankLine.organisation_id,
        action: "BANK_STATEMENT_LINE_ADDED_TO_BOOKS",
        details: {
          bank_statement_line_id: lineId,
          bank_account_id: bankLine.bank_account_id,
          source_module: sourceModule,
          source_record_id: sourceRecordId,
          amount,
        },
      });
    } catch {
      // Audit logging should not block add-to-books.
    }

    return NextResponse.json({
      success: true,
      lineId,
      sourceModule,
      sourceRecordId,
      status: "ADDED_TO_BOOKS",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to add bank line to books.",
      },
      { status: 500 }
    );
  }
}