import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

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

function getEngagementType(serviceName: string) {
  const value = serviceName.toLowerCase();

  if (value.includes("bookkeeping")) return "BOOKKEEPING";
  if (value.includes("payroll")) return "PAYROLL";
  if (value.includes("financial reporting")) return "FINANCIAL_REPORTING";
  if (value.includes("management reporting")) return "MANAGEMENT_REPORTING";
  if (value.includes("receivable") || value.includes("payable")) return "AR_AP";
  if (value.includes("cfo")) return "CFO_ADVISORY";
  if (value.includes("modelling") || value.includes("modeling")) {
    return "FINANCIAL_MODELLING";
  }
  if (value.includes("tax")) return "TAX_COMPLIANCE";
  if (value.includes("full service")) return "FULL_SERVICE";

  return "OTHER";
}

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

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id: organisationId } = await context.params;

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

    const serviceName = String(body.service_name || "").trim();
    const engagementName = String(body.engagement_name || "").trim();

    if (!serviceName && !engagementName) {
      return Response.json(
        { error: "Engagement name or service name is required." },
        { status: 400 }
      );
    }

    const { data: organisation, error: organisationError } = await supabase
      .from("organisations")
      .select(
        `
        id,
        legal_name,
        trading_name,
        jurisdiction_code,
        reporting_framework_code,
        base_currency_code,
        legacy_client_id
      `
      )
      .eq("id", organisationId)
      .single();

    if (organisationError || !organisation) {
      return Response.json(
        {
          error:
            organisationError?.message ||
            "Organisation not found. Please open the organisation workspace again and retry.",
        },
        { status: 404 }
      );
    }

    const organisationName =
      organisation.trading_name || organisation.legal_name || "Organisation";

    const finalEngagementName =
      engagementName || `${serviceName} - ${organisationName}`;

    const engagementType = getEngagementType(serviceName || finalEngagementName);

    const today = new Date();
    const startDate = today.toISOString().slice(0, 10);

    const endDate = new Date(today);
    endDate.setMonth(endDate.getMonth() + 12);
    const endDateText = endDate.toISOString().slice(0, 10);

    const engagementPayload = {
      organisation_id: organisation.id,
      client_id: organisation.legacy_client_id,

      name: finalEngagementName,
      engagement_type: engagementType,
      type: engagementType,

      status: "ACTIVE",

      reporting_period_start: startDate,
      reporting_period_end: endDateText,
      start_date: startDate,
      end_date: endDateText,

      reporting_framework_code: organisation.reporting_framework_code,
      reporting_framework: organisation.reporting_framework_code,

      base_currency_code: organisation.base_currency_code,
      currency: organisation.base_currency_code,

      jurisdiction_code: organisation.jurisdiction_code,

      created_by: user.id,
    };

    const engagementResult = await insertWithSchemaRetry({
      supabase,
      table: "engagements",
      payload: engagementPayload,
      selectColumns: "id",
    });

    const engagement = engagementResult.data as unknown as { id: string };

    try {
      await supabase.from("audit_logs").insert({
        user_id: user.id,
        client_id: organisation.legacy_client_id,
        organisation_id: organisation.id,
        engagement_id: engagement.id,
        action: "ENGAGEMENT_CREATED_FROM_ORGANISATION",
        details: {
          organisation_id: organisation.id,
          service_name: serviceName,
          engagement_name: finalEngagementName,
          engagement_type: engagementType,
          removed_engagement_columns: engagementResult.removedColumns,
        },
      });
    } catch {
      // Audit logging should not block engagement creation.
    }

    return Response.json({
      success: true,
      engagementId: engagement.id,
      removedEngagementColumns: engagementResult.removedColumns,
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create engagement.",
      },
      { status: 500 }
    );
  }
}