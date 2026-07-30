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

const allowedPeriodTypes = [
  "MONTHLY",
  "QUARTERLY",
  "SIX_MONTHLY",
  "YEARLY",
  "INTERIM_FS",
  "CUSTOM",
  "PERIOD_LOCK",
  "PERIOD_CLOSE",
];

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

    const organisationId = String(body.organisation_id || "").trim();

    const engagementId = body.engagement_id
      ? String(body.engagement_id).trim()
      : null;

    const periodName = String(
      body.period_name || body.name || "Date range period"
    ).trim();

    const periodType = String(body.period_type || "CUSTOM").trim();
    const startDate = String(body.start_date || "").trim();
    const endDate = String(body.end_date || "").trim();

    const status = String(body.status || "OPEN").trim().toUpperCase();

    const lockReason = body.lock_reason
      ? String(body.lock_reason).trim()
      : null;

    const reportingFramework = body.reporting_framework
      ? String(body.reporting_framework).trim()
      : null;

    const currencyCode = body.currency_code
      ? String(body.currency_code).trim()
      : null;

    if (!organisationId) {
      return Response.json(
        { error: "Organisation is required." },
        { status: 400 }
      );
    }

    if (!periodName) {
      return Response.json(
        { error: "Period label is required." },
        { status: 400 }
      );
    }

    if (!allowedPeriodTypes.includes(periodType)) {
      return Response.json(
        { error: "Invalid period type." },
        { status: 400 }
      );
    }

    if (!["OPEN", "UNDER_REVIEW", "LOCKED", "CLOSED"].includes(status)) {
      return Response.json(
        { error: "Invalid period status." },
        { status: 400 }
      );
    }

    if (!startDate || !endDate) {
      return Response.json(
        { error: "Start date and end date are required." },
        { status: 400 }
      );
    }

    if (new Date(endDate) < new Date(startDate)) {
      return Response.json(
        { error: "End date cannot be earlier than start date." },
        { status: 400 }
      );
    }

    const { data: organisation, error: organisationError } = await supabase
      .from("organisations")
      .select(
        "id, legal_name, trading_name, reporting_framework_code, base_currency_code"
      )
      .eq("id", organisationId)
      .single();

    if (organisationError || !organisation) {
      return Response.json(
        { error: "Organisation not found." },
        { status: 404 }
      );
    }

    if (engagementId) {
      const { data: engagement, error: engagementError } = await supabase
        .from("engagements")
        .select("id, organisation_id")
        .eq("id", engagementId)
        .single();

      if (
        engagementError ||
        !engagement ||
        engagement.organisation_id !== organisationId
      ) {
        return Response.json(
          { error: "Invalid engagement selected." },
          { status: 400 }
        );
      }
    }

    const finalReportingFramework =
      reportingFramework || organisation.reporting_framework_code || null;

    const finalCurrencyCode =
      currencyCode || organisation.base_currency_code || null;

    const now = new Date().toISOString();

    const periodResult = await insertWithSchemaRetry({
      supabase,
      table: "accounting_periods",
      payload: {
        organisation_id: organisationId,
        engagement_id: engagementId,

        // Old and new naming supported.
        name: periodName,
        period_name: periodName,

        period_type: periodType,
        start_date: startDate,
        end_date: endDate,

        reporting_framework: finalReportingFramework,
        currency_code: finalCurrencyCode,

        status,
        lock_reason: lockReason,

        locked_at: status === "LOCKED" ? now : null,
        locked_by: status === "LOCKED" ? user.id : null,

        closed_at: status === "CLOSED" ? now : null,
        closed_by: status === "CLOSED" ? user.id : null,

        created_by: user.id,
      },
      selectColumns: "id",
    });

    const accountingPeriod = periodResult.data as unknown as { id: string };

    try {
      await supabase.from("audit_logs").insert({
        user_id: user.id,
        organisation_id: organisationId,
        engagement_id: engagementId,
        action: "ACCOUNTING_PERIOD_CREATED",
        details: {
          accounting_period_id: accountingPeriod.id,
          period_name: periodName,
          period_type: periodType,
          start_date: startDate,
          end_date: endDate,
          status,
          lock_reason: lockReason,
          reporting_framework: finalReportingFramework,
          currency_code: finalCurrencyCode,
          removed_period_columns: periodResult.removedColumns,
        },
      });
    } catch {
      // Audit logging should not block period creation.
    }

    return Response.json({
      success: true,
      accountingPeriodId: accountingPeriod.id,
      removedPeriodColumns: periodResult.removedColumns,
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create accounting period.",
      },
      { status: 500 }
    );
  }
}