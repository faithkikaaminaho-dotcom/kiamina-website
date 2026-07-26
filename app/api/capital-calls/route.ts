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

    const investorId = body.investor_id
      ? String(body.investor_id).trim()
      : null;

    const accountingPeriodId = body.accounting_period_id
      ? String(body.accounting_period_id).trim()
      : null;

    const engagementId = body.engagement_id
      ? String(body.engagement_id).trim()
      : null;

    const callNumber = await reserveDocumentNumber({
      supabase,
      organisationId,
      documentType: "CAPITAL_CALL",
      providedNumber: body.call_number,
    });

    const callDate = String(body.call_date || "").trim();
    const dueDate = body.due_date ? String(body.due_date).trim() : null;

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

    const committedAmount = toNumber(body.committed_amount, 0);
    const calledAmount = toNumber(body.called_amount, 0);
    const amountReceived = toNumber(body.amount_received, 0);

    const outstandingAmount = Number(
      Math.max(calledAmount - amountReceived, 0).toFixed(2)
    );

    const fundingType = body.funding_type
      ? String(body.funding_type).trim()
      : null;

    const purpose =
      body.purpose || body.funding_purpose
        ? String(body.purpose || body.funding_purpose).trim()
        : null;

    const terms = body.terms ? String(body.terms).trim() : null;

    const internalNotes = body.internal_notes
      ? String(body.internal_notes).trim()
      : null;

    const receivableAccountId = body.receivable_account_id
      ? String(body.receivable_account_id).trim()
      : null;

    const equityAccountId = body.equity_account_id
      ? String(body.equity_account_id).trim()
      : null;

    const liabilityAccountId = body.liability_account_id
      ? String(body.liability_account_id).trim()
      : null;

    if (!organisationId) {
      return Response.json(
        { error: "Organisation is required." },
        { status: 400 }
      );
    }

    if (!investorId) {
      return Response.json(
        { error: "Investor or funding provider is required." },
        { status: 400 }
      );
    }

    if (!callNumber) {
      return Response.json(
        { error: "Capital call number is required." },
        { status: 400 }
      );
    }

    if (!callDate) {
      return Response.json(
        { error: "Capital call date is required." },
        { status: 400 }
      );
    }

    if (calledAmount <= 0) {
      return Response.json(
        { error: "Called amount must be greater than zero." },
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

    const { data: investor } = await supabase
      .from("investors")
      .select("id, investor_name, funding_type")
      .eq("id", investorId)
      .eq("organisation_id", organisationId)
      .single();

    if (!investor) {
      return Response.json(
        { error: "Investor or funding provider not found for this organisation." },
        { status: 404 }
      );
    }

    const { data: capitalCall, error: capitalCallError } = await supabase
      .from("capital_calls")
      .insert({
        organisation_id: organisationId,
        accounting_period_id: accountingPeriodId,
        engagement_id: engagementId,
        investor_id: investorId,
        call_number: callNumber,
        call_date: callDate,
        due_date: dueDate,
        currency_code: currencyCode || organisation.base_currency_code,
        exchange_rate: exchangeRate,
        exchange_rate_date: exchangeRateDate,
        exchange_rate_source: exchangeRateSource,
        exchange_rate_is_locked: exchangeRateIsLocked,
        committed_amount: committedAmount,
        called_amount: calledAmount,
        amount_received: amountReceived,
        outstanding_amount: outstandingAmount,
        funding_type: fundingType || investor.funding_type,
        purpose,
        terms,
        internal_notes: internalNotes,
        receivable_account_id: receivableAccountId,
        equity_account_id: equityAccountId,
        liability_account_id: liabilityAccountId,
        status: "DRAFT",
        created_by: user.id,
        updated_by: user.id,
      })
      .select("id")
      .single();

    if (capitalCallError || !capitalCall) {
      return Response.json(
        {
          error: capitalCallError?.message || "Unable to create capital call.",
        },
        { status: 500 }
      );
    }

    try {
      await supabase.from("audit_logs").insert({
        user_id: user.id,
        organisation_id: organisationId,
        engagement_id: engagementId,
        action: "CAPITAL_CALL_CREATED_DRAFT",
        details: {
          capital_call_id: capitalCall.id,
          call_number: callNumber,
          investor_id: investorId,
          investor_name: investor.investor_name,
          called_amount: calledAmount,
          amount_received: amountReceived,
          outstanding_amount: outstandingAmount,
          currency_code: currencyCode || organisation.base_currency_code,
          exchange_rate: exchangeRate,
          exchange_rate_date: exchangeRateDate,
          exchange_rate_source: exchangeRateSource,
          exchange_rate_is_locked: exchangeRateIsLocked,
          status: "DRAFT",
        },
      });
    } catch {
      // Audit logging should not block capital call creation.
    }

    return Response.json({
      success: true,
      capitalCallId: capitalCall.id,
      status: "DRAFT",
      calledAmount,
      outstandingAmount,
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create capital call.",
      },
      { status: 500 }
    );
  }
}