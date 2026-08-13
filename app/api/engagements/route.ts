export const runtime = "nodejs";

import { createClient } from "@/utils/supabase/server";

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

    const organisationId = body.organisation_id
      ? String(body.organisation_id).trim()
      : "";

    const name = body.name ? String(body.name).trim() : "";

    const engagementType = body.engagement_type
      ? String(body.engagement_type).trim()
      : "";

    const reportingPeriodStart = body.reporting_period_start
      ? String(body.reporting_period_start).trim()
      : null;

    const reportingPeriodEnd = body.reporting_period_end
      ? String(body.reporting_period_end).trim()
      : null;

    if (!organisationId || !name || !engagementType) {
      return Response.json(
        {
          error:
            "Organisation, engagement name, and engagement type are required.",
        },
        { status: 400 }
      );
    }

    if (
      reportingPeriodStart &&
      reportingPeriodEnd &&
      reportingPeriodStart > reportingPeriodEnd
    ) {
      return Response.json(
        {
          error:
            "Reporting period start date cannot be after the reporting period end date.",
        },
        { status: 400 }
      );
    }

    const { data: organisation, error: organisationError } = await supabase
      .from("organisations")
      .select("id, legal_name, reporting_framework_code, base_currency_code")
      .eq("id", organisationId)
      .single();

    if (organisationError || !organisation) {
      return Response.json(
        { error: "Organisation not found." },
        { status: 404 }
      );
    }

    const { data: engagement, error: engagementError } = await supabase
      .from("engagements")
      .insert({
        organisation_id: organisationId,
        name,
        engagement_type: engagementType,
        status: "planned",
        reporting_period_start: reportingPeriodStart,
        reporting_period_end: reportingPeriodEnd,
        reporting_framework_code: organisation.reporting_framework_code,
        currency_code: organisation.base_currency_code,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (engagementError || !engagement) {
      return Response.json(
        {
          error: engagementError?.message || "Unable to create engagement.",
        },
        { status: 400 }
      );
    }

    try {
      await supabase.from("audit_logs").insert({
        user_id: user.id,
        organisation_id: organisationId,
        action: "ENGAGEMENT_CREATED",
        details: {
          engagement_id: engagement.id,
          organisation_name: organisation.legal_name,
          name,
          engagement_type: engagementType,
          reporting_period_start: reportingPeriodStart,
          reporting_period_end: reportingPeriodEnd,
          reporting_framework_code: organisation.reporting_framework_code,
          currency_code: organisation.base_currency_code,
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