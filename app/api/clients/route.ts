import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
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

  if (profile?.role !== "SUPER_ADMIN") {
    return Response.json({ error: "Access denied." }, { status: 403 });
  }

  const body = await request.json();

  const {
    name,
    jurisdiction_code,
    city,
    industry_id,
    business_type,
  }: {
    name?: string;
    jurisdiction_code?: string;
    city?: string;
    industry_id?: string;
    business_type?: string;
  } = body;

  if (!name || !jurisdiction_code) {
    return Response.json(
      { error: "Client name and jurisdiction are required." },
      { status: 400 }
    );
  }

  const { data: jurisdiction, error: jurisdictionError } = await supabase
    .from("jurisdictions")
    .select("code, name, reporting_framework_code, currency_code")
    .eq("code", jurisdiction_code)
    .single();

  if (jurisdictionError || !jurisdiction) {
    return Response.json(
      { error: "Invalid jurisdiction selected." },
      { status: 400 }
    );
  }

  let industryName: string | null = null;

  if (industry_id) {
    const { data: industry } = await supabase
      .from("industries")
      .select("name")
      .eq("id", industry_id)
      .single();

    industryName = industry?.name || null;
  }

  const { data: clientRecord, error: clientError } = await supabase
    .from("clients")
    .insert({
      name,
      jurisdiction_code: jurisdiction.code,
      country: jurisdiction.name,
      city: city || null,
      industry_id: industry_id || null,
      industry: industryName,
      business_type: business_type || null,
      reporting_framework_code: jurisdiction.reporting_framework_code,
      currency_code: jurisdiction.currency_code,
      status: "ONBOARDING",
      created_by: user.id,
    })
    .select("id")
    .single();

  if (clientError || !clientRecord) {
    return Response.json(
      { error: clientError?.message || "Unable to create client." },
      { status: 400 }
    );
  }

  const { data: organisationRecord, error: organisationError } = await supabase
    .from("organisations")
    .insert({
      legal_name: name,
      organisation_type: business_type || null,
      status: "onboarding",
      jurisdiction_code: jurisdiction.code,
      reporting_framework_code: jurisdiction.reporting_framework_code,
      base_currency_code: jurisdiction.currency_code,
      legacy_client_id: clientRecord.id,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (organisationError || !organisationRecord) {
    return Response.json(
      {
        error:
          organisationError?.message ||
          "Client created, but organisation creation failed.",
      },
      { status: 500 }
    );
  }

  const { error: updateClientError } = await supabase
    .from("clients")
    .update({
      organisation_id: organisationRecord.id,
    })
    .eq("id", clientRecord.id);

  if (updateClientError) {
    return Response.json(
      {
        error:
          "Client and organisation created, but linking failed: " +
          updateClientError.message,
      },
      { status: 500 }
    );
  }

  await supabase.from("audit_logs").insert({
    user_id: user.id,
    organisation_id: organisationRecord.id,
    action: "ORGANISATION_CREATED",
    details: {
      client_id: clientRecord.id,
      organisation_id: organisationRecord.id,
      name,
      jurisdiction_code: jurisdiction.code,
      country: jurisdiction.name,
      reporting_framework_code: jurisdiction.reporting_framework_code,
      currency_code: jurisdiction.currency_code,
      industry: industryName,
    },
  });

  return Response.json({
    success: true,
    clientId: clientRecord.id,
    organisationId: organisationRecord.id,
  });
}