import { createClient } from "@/utils/supabase/server";
import { reserveDocumentNumber } from "@/lib/numbering";

export const runtime = "nodejs";

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
  "CAPITAL_CONTRIBUTION",
  "CAPITAL_CALL_RECEIPT",
  "GRANT_RECEIPT",
  "DONATION_RECEIPT",
  "LOAN_DRAWDOWN",
  "DIRECTOR_LOAN",
  "SHAREHOLDER_LOAN",
  "INVESTOR_FUNDING",
  "LOAN_REPAYMENT",
  "INTEREST_PAYMENT",
  "OTHER_FUNDING_RECEIPT",
];

function toNumber(value: unknown, fallback = 0) {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : fallback;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Not authenticated." }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !internalRoles.includes(profile.role)) {
      return Response.json({ error: "Access denied." }, { status: 403 });
    }

    const body = await request.json();

    const organisationId = String(body.organisation_id || "").trim();
    const investorId = body.investor_id ? String(body.investor_id).trim() : null;
    const capitalCallId = body.capital_call_id
      ? String(body.capital_call_id).trim()
      : null;

    const accountingPeriodId = body.accounting_period_id
      ? String(body.accounting_period_id).trim()
      : null;

    const engagementId = body.engagement_id
      ? String(body.engagement_id).trim()
      : null;

    const transactionNumber = await reserveDocumentNumber({
  supabase,
  organisationId,
  documentType: "FUNDING_TRANSACTION",
  providedNumber: body.transaction_number,
});
    const transactionDate = String(body.transaction_date || "").trim();
    const transactionType = String(body.transaction_type || "")
      .trim()
      .toUpperCase();

    const currencyCode = body.currency_code
      ? String(body.currency_code).trim().toUpperCase()
      : null;

    const exchangeRate = toNumber(body.exchange_rate, 1);
    const amount = toNumber(body.amount, 0);
    const bankCharges = toNumber(body.bank_charges, 0);
    const netAmount = Number(Math.max(amount - bankCharges, 0).toFixed(2));

    const paymentMethod = body.payment_method
      ? String(body.payment_method).trim()
      : null;

    const bankAccountId = body.bank_account_id
      ? String(body.bank_account_id).trim()
      : null;

    const equityAccountId = body.equity_account_id
      ? String(body.equity_account_id).trim()
      : null;

    const liabilityAccountId = body.liability_account_id
      ? String(body.liability_account_id).trim()
      : null;

    const incomeAccountId = body.income_account_id
      ? String(body.income_account_id).trim()
      : null;

    const interestExpenseAccountId = body.interest_expense_account_id
      ? String(body.interest_expense_account_id).trim()
      : null;

    const referenceNumber = body.reference_number
      ? String(body.reference_number).trim()
      : null;

    const purpose = body.purpose ? String(body.purpose).trim() : null;
    const narration = body.narration ? String(body.narration).trim() : null;

    const internalNotes = body.internal_notes
      ? String(body.internal_notes).trim()
      : null;

    if (!organisationId) {
      return Response.json(
        { error: "Organisation is required." },
        { status: 400 }
      );
    }

    if (!transactionNumber) {
      return Response.json(
        { error: "Funding transaction number is required." },
        { status: 400 }
      );
    }

    if (!transactionDate) {
      return Response.json(
        { error: "Funding transaction date is required." },
        { status: 400 }
      );
    }

    if (!allowedTransactionTypes.includes(transactionType)) {
      return Response.json(
        { error: "Invalid funding transaction type." },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return Response.json(
        { error: "Amount must be greater than zero." },
        { status: 400 }
      );
    }

    const { data: organisation } = await supabase
      .from("organisations")
      .select("id, base_currency_code")
      .eq("id", organisationId)
      .single();

    if (!organisation) {
      return Response.json(
        { error: "Organisation not found." },
        { status: 404 }
      );
    }

    let investorName: string | null = null;

    if (investorId) {
      const { data: investor } = await supabase
        .from("investors")
        .select("id, investor_name")
        .eq("id", investorId)
        .eq("organisation_id", organisationId)
        .single();

      if (!investor) {
        return Response.json(
          {
            error:
              "Investor or funding provider not found for this organisation.",
          },
          { status: 404 }
        );
      }

      investorName = investor.investor_name;
    }

    if (capitalCallId) {
      const { data: capitalCall } = await supabase
        .from("capital_calls")
        .select("id")
        .eq("id", capitalCallId)
        .eq("organisation_id", organisationId)
        .single();

      if (!capitalCall) {
        return Response.json(
          { error: "Capital call not found for this organisation." },
          { status: 404 }
        );
      }
    }

    const { data: fundingTransaction, error: fundingTransactionError } =
      await supabase
        .from("funding_transactions")
        .insert({
          organisation_id: organisationId,
          accounting_period_id: accountingPeriodId,
          engagement_id: engagementId,
          investor_id: investorId,
          capital_call_id: capitalCallId,
          transaction_number: transactionNumber,
          transaction_date: transactionDate,
          transaction_type: transactionType,
          currency_code: currencyCode || organisation.base_currency_code,
          exchange_rate: exchangeRate,
          amount,
          bank_charges: bankCharges,
          net_amount: netAmount,
          payment_method: paymentMethod,
          bank_account_id: bankAccountId,
          equity_account_id: equityAccountId,
          liability_account_id: liabilityAccountId,
          income_account_id: incomeAccountId,
          interest_expense_account_id: interestExpenseAccountId,
          reference_number: referenceNumber,
          purpose,
          narration,
          internal_notes: internalNotes,
          status: "DRAFT",
          created_by: user.id,
          updated_by: user.id,
        })
        .select("id")
        .single();

    if (fundingTransactionError || !fundingTransaction) {
      return Response.json(
        {
          error:
            fundingTransactionError?.message ||
            "Unable to create funding transaction.",
        },
        { status: 500 }
      );
    }

    try {
      await supabase.from("audit_logs").insert({
        user_id: user.id,
        organisation_id: organisationId,
        engagement_id: engagementId,
        action: "FUNDING_TRANSACTION_CREATED_DRAFT",
        details: {
          funding_transaction_id: fundingTransaction.id,
          transaction_number: transactionNumber,
          transaction_type: transactionType,
          investor_id: investorId,
          investor_name: investorName,
          capital_call_id: capitalCallId,
          amount,
          bank_charges: bankCharges,
          net_amount: netAmount,
          status: "DRAFT",
        },
      });
    } catch {
      // Audit logging should not block funding transaction creation.
    }

    return Response.json({
      success: true,
      fundingTransactionId: fundingTransaction.id,
      status: "DRAFT",
      transactionType,
      netAmount,
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create funding transaction.",
      },
      { status: 500 }
    );
  }
}