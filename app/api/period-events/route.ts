import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";

const internalRoles = [
  "SUPER_ADMIN",
  "ADMIN",
  "STAFF",
  "IT_ADMIN",
  "ACCOUNTANT_ADMIN",
  "ACCOUNTANT_USER",
  "CUSTOMER_SUPPORT",
  "COMPLIANCE_ADMIN",
  "OPERATIONS_ADMIN",
];

const allowedEventTypes = [
  "THEFT",
  "FRAUD",
  "BAD_DEBT",
  "CUSTOMER_DEFAULT",
  "NEW_CONTRACT",
  "CONTRACT_LOSS",
  "MAJOR_REPAIR",
  "TAX_PENALTY",
  "REGULATORY_ISSUE",
  "FUNDING_RECEIVED",
  "DONATION_RECEIVED",
  "ASSET_PURCHASE",
  "LOAN_OBTAINED",
  "PAYROLL_INCREASE",
  "EXCHANGE_RATE_IMPACT",
  "OPERATIONAL_DISRUPTION",
  "LITIGATION",
  "PROJECT_DELAY",
  "OTHER",
];

const allowedSeverity = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

function getMissingColumnName(errorMessage: string) {
  const match = errorMessage.match(/Could not find the '([^']+)' column/i);

  if (!match?.[1]) {
    return null;
  }

  return match[1];
}

async function insertWithSchemaRetry({
  supabase,
  table,
  payload,
  selectColumns = "id",
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  table: string;
  payload: Record<string, unknown>;
  selectColumns?: string;
}) {
  let safePayload = { ...payload };
  const removedColumns: string[] = [];

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const { data, error } = await supabase
      .from(table)
      .insert(safePayload)
      .select(selectColumns)
      .single();

    if (!error && data) {
      return {
        data,
        removedColumns,
      };
    }

    const missingColumn = getMissingColumnName(error?.message || "");

    if (missingColumn && missingColumn in safePayload) {
      delete safePayload[missingColumn];
      removedColumns.push(missingColumn);
      continue;
    }

    throw new Error(error?.message || `Unable to insert into ${table}.`);
  }

  throw new Error(`Unable to insert into ${table} after schema retry.`);
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

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile || !internalRoles.includes(profile.role)) {
      return Response.json({ error: "Access denied." }, { status: 403 });
    }

    const body = await request.json();

    const accountingPeriodId = String(body.accounting_period_id || "").trim();
    const eventType = String(body.event_type || "OTHER").trim();
    const title = String(body.title || "").trim();
    const description = body.description
      ? String(body.description).trim()
      : null;
    const eventDate = body.event_date ? String(body.event_date).trim() : null;
    const financialImpactAmount = body.financial_impact_amount
      ? Number(body.financial_impact_amount)
      : null;
    const currencyCode = body.currency_code ? String(body.currency_code).trim() : null;
    const impactArea = body.impact_area ? String(body.impact_area).trim() : null;
    const severity = String(body.severity || "MEDIUM").trim();

    const managementResponse = body.management_response
      ? String(body.management_response).trim()
      : null;

    const advisoryNote = body.advisory_note
      ? String(body.advisory_note).trim()
      : null;

    const recommendedAction = body.recommended_action
      ? String(body.recommended_action).trim()
      : null;

    const includeInManagementReport =
      body.include_in_management_report === false ? false : true;

    const includeInFinancialStatementNotes =
      body.include_in_financial_statement_notes === true;

    if (!accountingPeriodId) {
      return Response.json(
        { error: "Accounting period is required." },
        { status: 400 }
      );
    }

    if (!title) {
      return Response.json(
        { error: "Event title is required." },
        { status: 400 }
      );
    }

    if (!allowedEventTypes.includes(eventType)) {
      return Response.json(
        { error: "Invalid event type." },
        { status: 400 }
      );
    }

    if (!allowedSeverity.includes(severity)) {
      return Response.json(
        { error: "Invalid severity level." },
        { status: 400 }
      );
    }

    const { data: period, error: periodError } = await supabase
      .from("accounting_periods")
      .select(
        "id, organisation_id, engagement_id, currency_code, name, start_date, end_date"
      )
      .eq("id", accountingPeriodId)
      .single();

    if (periodError || !period) {
      return Response.json(
        { error: "Accounting period not found." },
        { status: 404 }
      );
    }

    const eventResult = await insertWithSchemaRetry({
      supabase,
      table: "period_events",
      payload: {
        accounting_period_id: period.id,
        organisation_id: period.organisation_id,
        engagement_id: period.engagement_id,
        event_type: eventType,
        title,
        description,
        event_date: eventDate,
        financial_impact_amount: financialImpactAmount,
        currency_code: currencyCode || period.currency_code,
        impact_area: impactArea,
        severity,
        management_response: managementResponse,
        advisory_note: advisoryNote,
        recommended_action: recommendedAction,
        include_in_management_report: includeInManagementReport,
        include_in_financial_statement_notes: includeInFinancialStatementNotes,
        status: "OPEN",
        created_by: user.id,
        updated_by: user.id,
      },
      selectColumns: "id",
    });

    const eventRecord = eventResult.data as unknown as { id: string };

    try {
      await supabase.from("audit_logs").insert({
        user_id: user.id,
        organisation_id: period.organisation_id,
        engagement_id: period.engagement_id,
        action: "PERIOD_EVENT_CREATED",
        details: {
          accounting_period_id: period.id,
          period_name: period.name,
          period_start_date: period.start_date,
          period_end_date: period.end_date,
          period_event_id: eventRecord.id,
          event_type: eventType,
          title,
          severity,
          financial_impact_amount: financialImpactAmount,
          currency_code: currencyCode || period.currency_code,
          removed_event_columns: eventResult.removedColumns,
        },
      });
    } catch {
      // Audit logging should not block period event creation.
    }

    return Response.json({
      success: true,
      periodEventId: eventRecord.id,
      accountingPeriodId: period.id,
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create period event.",
      },
      { status: 500 }
    );
  }
}