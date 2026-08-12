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

const managerRoles = [
  "SUPER_ADMIN",
  "ADMIN",
  "STAFF",
  "ACCOUNTANT_ADMIN",
  "COMPLIANCE_ADMIN",
  "OPERATIONS_ADMIN",
];

async function getAuthenticatedProfile() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, profile: null, error: "Not authenticated." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .single();

  if (!profile || !internalRoles.includes(String(profile.role))) {
    return { supabase, user, profile: null, error: "Access denied." };
  }

  return { supabase, user, profile, error: null };
}

export async function GET(request: Request) {
  const { supabase, error } = await getAuthenticatedProfile();

  if (error) {
    return NextResponse.json({ error }, { status: error === "Access denied." ? 403 : 401 });
  }

  const { searchParams } = new URL(request.url);
  const organisationId = searchParams.get("organisation_id");
  const trackingCategoryId = searchParams.get("tracking_category_id");

  if (!organisationId) {
    return NextResponse.json(
      { error: "organisation_id is required." },
      { status: 400 }
    );
  }

  let query = supabase
    .from("tracking_options")
    .select(
      "id, organisation_id, tracking_category_id, option_code, option_name, description, parent_option_id, start_date, end_date, is_active, created_at"
    )
    .eq("organisation_id", organisationId)
    .order("option_name", { ascending: true });

  if (trackingCategoryId) {
    query = query.eq("tracking_category_id", trackingCategoryId);
  }

  const { data, error: queryError } = await query;

  if (queryError) {
    return NextResponse.json({ error: queryError.message }, { status: 400 });
  }

  return NextResponse.json({ options: data || [] });
}

export async function POST(request: Request) {
  const { supabase, user, profile, error } = await getAuthenticatedProfile();

  if (error) {
    return NextResponse.json({ error }, { status: error === "Access denied." ? 403 : 401 });
  }

  if (!profile || !managerRoles.includes(String(profile.role))) {
    return NextResponse.json({ error: "Access denied." }, { status: 403 });
  }

  const body = await request.json();

  const organisationId = String(body.organisation_id || "").trim();
  const trackingCategoryId = String(body.tracking_category_id || "").trim();
  const optionCode = body.option_code ? String(body.option_code).trim() : null;
  const optionName = String(body.option_name || "").trim();
  const description = body.description ? String(body.description).trim() : null;
  const parentOptionId = body.parent_option_id
    ? String(body.parent_option_id).trim()
    : null;
  const startDate = body.start_date ? String(body.start_date).trim() : null;
  const endDate = body.end_date ? String(body.end_date).trim() : null;

  if (!organisationId || !trackingCategoryId || !optionName) {
    return NextResponse.json(
      {
        error:
          "organisation_id, tracking_category_id, and option_name are required.",
      },
      { status: 400 }
    );
  }

  const { data: category } = await supabase
    .from("tracking_categories")
    .select("id, organisation_id")
    .eq("id", trackingCategoryId)
    .eq("organisation_id", organisationId)
    .single();

  if (!category) {
    return NextResponse.json(
      { error: "Tracking category not found for this organisation." },
      { status: 404 }
    );
  }

  const { data, error: insertError } = await supabase
    .from("tracking_options")
    .insert({
      organisation_id: organisationId,
      tracking_category_id: trackingCategoryId,
      option_code: optionCode,
      option_name: optionName,
      description,
      parent_option_id: parentOptionId,
      start_date: startDate,
      end_date: endDate,
      is_active: true,
      created_by: user?.id,
      updated_by: user?.id,
    })
    .select(
      "id, organisation_id, tracking_category_id, option_code, option_name, description, parent_option_id, start_date, end_date, is_active, created_at"
    )
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 400 });
  }

  return NextResponse.json({ option: data });
}