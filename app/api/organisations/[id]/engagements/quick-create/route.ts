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
  if (value.includes("modelling") || value.includes("modeling")) return "FINANCIAL_MODELLING";
  if (value.includes("tax")) return "TAX_COMPLIANCE";
  if (value.includes("full service")) return "FULL_SERVICE";

  return "OTHER";
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
        reporting_framework,
        base_currency,
        legacy_client_id
      `
      )
      .eq("id", organisationId)
      .single();

    if (organisationError || !organisation) {
      return Response.json(
        { error: "Organisation not found." },
        { status: 404 }
      );
    }

    const finalEngagementName =
      engagementName ||
      `${serviceName} - ${organisation.trading_name || organisation.legal_name}`;

    const engagementType = getEngagementType(serviceName || finalEngagementName);

    const today = new Date();
    const startDate = today.toISOString().slice(0, 10);

    const endDate = new Date(today);
    endDate.setMonth(endDate.getMonth() + 12);

    const { data: engagement, error: engagementError } = await supabase
      .from("engagements")
      .insert({
        organisation_id: organisation.id,
        client_id: organisation.legacy_client_id,
        name: finalEngagementName,
        engagement_type: engagementType,
        status: "ACTIVE",
        start_date: startDate,
        end_date: endDate.toISOString().slice(0, 10),
        reporting_framework: organisation.reporting_framework,
        currency: organisation.base_currency,
        jurisdiction_code: organisation.jurisdiction_code,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (engagementError || !engagement) {
      return Response.json(
        {
          error:
            engagementError?.message || "Unable to create engagement.",
        },
        { status: 500 }
      );
    }

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
        },
      });
    } catch {
      // Audit logging should not block engagement creation.
    }

    return Response.json({
      success: true,
      engagementId: engagement.id,
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