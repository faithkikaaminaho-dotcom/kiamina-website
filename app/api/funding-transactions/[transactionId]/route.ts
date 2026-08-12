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

const editableStatuses = ["DRAFT", "READY_FOR_REVIEW", "REVIEWED", "UNDER_REVIEW"];

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
  if (value === null || value === undefined || value === "") return fallback;

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function normalizeTransactionType(value: unknown) {
  const transactionType = String(value || "").trim().toUpperCase();

  if (transactionType === "CAPITAL_RECEIPT") {
    return "CAPITAL_CONTRIBUTION";
  }

  if (transactionType === "SHAREHOLDER_FUNDING") {
    return "SHAREHOLDER_LOAN";
  }

  if (transactionType === "OTHER") {
    return "OTHER_FUNDING_RECEIPT";
  }

  return transactionType;
}

function isOutflow(transactionType: string) {
  return transactionType === "LOAN_REPAYMENT" || transactionType === "INTEREST_PAYMENT";
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ transactionId: string }> }
) {
  try {
    const { transactionId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !internalRoles.includes(profile.role)) {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }

    const body = await request.json();

    const organisationId = String(body.organisation_id || "").trim();

    if (!organisationId) {
      return NextResponse.json(
        { error: "Organisation is required." },
        { status: 400 }
      );
    }

    const { data: existingTransaction } = await supabase
      .from("funding_transactions")
      .select("*")
      .eq("id", transactionId)
      .eq("organisation_id", organisationId)
      .single();

    if (!existingTransaction) {
      return NextResponse.json(
        { error: "Funding transaction not found." },
        { status: 404 }
      );
    }

    if (
      existingTransaction.status === "POSTED" ||
      existingTransaction.posted_at ||
      !editableStatuses.includes(existingTransaction.status || "")
    ) {
      return NextResponse.json(
        {
          error:
            "This funding transaction cannot be edited because it is posted or no longer in an editable review status.",
        },
        { status: 409 }
      );
    }

    const { data: existingLedgerEntry } = await supabase
      .from("general_ledger_entries")
      .select("id")
      .eq("organisation_id", organisationId)
      .eq("source_module", "FUNDING_TRANSACTION")
      .eq("source_record_id", transactionId)
      .maybeSingle();

    if (existingLedgerEntry) {
      return NextResponse.json(
        {
          error:
            "This funding transaction cannot be edited because it already has a General Ledger entry.",
        },
        { status: 409 }
      );
    }

    const investorId = body.investor_id ? String(body.investor_id).trim() : null;

    const capitalCallId = body.capital_call_id
      ? String(body.capital_call_id).trim()
      : null;

    const transactionDate = String(body.transaction_date || "").trim();

    const transactionType = normalizeTransactionType(body.transaction_type);

    const currencyCode = body.currency_code
      ? String(body.currency_code).trim().toUpperCase()
      : null;

    const exchangeRate = toNumber(body.exchange_rate, 1);

    const exchangeRateDate = body.exchange_rate_date
      ? String(body.exchange_rate_date).trim()
      : null;

    const exchangeRateSource = body.exchange_rate_source
      ? String(body.exchange_rate_source).trim()
      : null;

    const exchangeRateIsLocked = Boolean(body.exchange_rate_is_locked);

    const amount = toNumber(body.amount, 0);
    const bankCharges = toNumber(body.bank_charges, 0);

    const netAmount = isOutflow(transactionType)
      ? Number((amount + bankCharges).toFixed(2))
      : Number(Math.max(amount - bankCharges, 0).toFixed(2));

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

    const purpose =
      body.purpose || body.funding_purpose
        ? String(body.purpose || body.funding_purpose).trim()
        : null;

    const narration = body.narration ? String(body.narration).trim() : null;

    const internalNotes = body.internal_notes
      ? String(body.internal_notes).trim()
      : null;

    if (!transactionDate) {
      return NextResponse.json(
        { error: "Funding transaction date is required." },
        { status: 400 }
      );
    }

    if (!allowedTransactionTypes.includes(transactionType)) {
      return NextResponse.json(
        { error: "Invalid funding transaction type." },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: "Amount must be greater than zero." },
        { status: 400 }
      );
    }

    if (bankCharges < 0) {
      return NextResponse.json(
        { error: "Bank charges cannot be negative." },
        { status: 400 }
      );
    }

    if (investorId) {
      const { data: investor } = await supabase
        .from("investors")
        .select("id")
        .eq("id", investorId)
        .eq("organisation_id", organisationId)
        .single();

      if (!investor) {
        return NextResponse.json(
          { error: "Investor or funding provider not found for this organisation." },
          { status: 404 }
        );
      }
    }

    if (capitalCallId) {
      const { data: capitalCall } = await supabase
        .from("capital_calls")
        .select("id")
        .eq("id", capitalCallId)
        .eq("organisation_id", organisationId)
        .single();

      if (!capitalCall) {
        return NextResponse.json(
          { error: "Capital call not found for this organisation." },
          { status: 404 }
        );
      }
    }

    if (bankAccountId) {
      const { data: bankAccount } = await supabase
        .from("bank_accounts")
        .select("id")
        .eq("id", bankAccountId)
        .eq("organisation_id", organisationId)
        .single();

      if (!bankAccount) {
        return NextResponse.json(
          { error: "Bank account not found for this organisation." },
          { status: 404 }
        );
      }
    }

    const chartAccountIds = [
      equityAccountId,
      liabilityAccountId,
      incomeAccountId,
      interestExpenseAccountId,
    ].filter(Boolean) as string[];

    if (chartAccountIds.length > 0) {
      const { data: chartAccounts } = await supabase
        .from("chart_of_accounts")
        .select("id")
        .eq("organisation_id", organisationId)
        .in("id", chartAccountIds);

      if ((chartAccounts || []).length !== chartAccountIds.length) {
        return NextResponse.json(
          {
            error:
              "One or more selected GL accounts were not found for this organisation.",
          },
          { status: 404 }
        );
      }
    }

    const { error: updateError } = await supabase
      .from("funding_transactions")
      .update({
        investor_id: investorId,
        capital_call_id: capitalCallId,
        transaction_date: transactionDate,
        transaction_type: transactionType,
        currency_code: currencyCode || existingTransaction.currency_code,
        exchange_rate: exchangeRate,
        exchange_rate_date: exchangeRateDate || transactionDate,
        exchange_rate_source: exchangeRateSource,
        exchange_rate_is_locked: exchangeRateIsLocked,
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
        updated_by: user.id,
      })
      .eq("id", transactionId)
      .eq("organisation_id", organisationId);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message || "Unable to update funding transaction." },
        { status: 500 }
      );
    }

    try {
      await supabase.from("audit_logs").insert({
        user_id: user.id,
        organisation_id: organisationId,
        action: "FUNDING_TRANSACTION_DRAFT_UPDATED",
        details: {
          funding_transaction_id: transactionId,
          transaction_number: existingTransaction.transaction_number,
          transaction_type: transactionType,
          amount,
          bank_charges: bankCharges,
          net_amount: netAmount,
          status: existingTransaction.status,
        },
      });
    } catch {
      // Audit logging should not block edit.
    }

    return NextResponse.json({
      success: true,
      fundingTransactionId: transactionId,
      transactionType,
      netAmount,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update funding transaction.",
      },
      { status: 500 }
    );
  }
}