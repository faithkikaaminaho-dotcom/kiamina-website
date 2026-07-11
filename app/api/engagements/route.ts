export const runtime = "nodejs";

import { createClient } from "@/utils/supabase/server";

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

    if (!profile || !["SUPER_ADMIN", "ADMIN", "STAFF"].includes(profile.role)) {
      return Response.json({ error: "Access denied." }, { status: 403 });
    }

    const body = await request.json();

    const {
      organisation_id,
      name,
      engagement_type,
      reporting_period_start,
      reporting_period_end,
    }: {
      organisation_id?: string;
      name?: string;
      engagement_type?: string;
      reporting_period_start?: string;
      reporting_period_end?: string;
    } = body;

    if (!organisation_id || !name || !engagement_type) {
      return Response.json(
        { error: "Organisation, engagement name, and engagement type are required." },
        { status: 400 }
      );
    }

    const { data: organisation, error: organisationError } = await supabase
      .from("organisations")
      .select(
        "id, legal_name, reporting_framework_code, base_currency_code"
      )
      .eq("id", organisation_id)
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
        organisation_id,
        name,
        engagement_type,
        status: "planned",
        reporting_period_start: reporting_period_start || null,
        reporting_period_end: reporting_period_end || null,
        reporting_framework_code: organisation.reporting_framework_code,
        currency_code: organisation.base_currency_code,
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
        { status: 400 }
      );
    }

    await supabase.from("audit_logs").insert({
      user_id: user.id,
      organisation_id,
      action: "ENGAGEMENT_CREATED",
      details: {
        engagement_id: engagement.id,
        organisation_name: organisation.legal_name,
        name,
        engagement_type,
        reporting_period_start,
        reporting_period_end,
        reporting_framework_code: organisation.reporting_framework_code,
        currency_code: organisation.base_currency_code,
      },
    });

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