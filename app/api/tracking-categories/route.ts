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

  if (!organisationId) {
    return NextResponse.json(
      { error: "organisation_id is required." },
      { status: 400 }
    );
  }

  const { data, error: queryError } = await supabase
    .from("tracking_categories")
    .select(
      "id, organisation_id, category_code, category_name, description, is_system_default, is_required, is_active, created_at"
    )
    .eq("organisation_id", organisationId)
    .order("category_code", { ascending: true });

  if (queryError) {
    return NextResponse.json({ error: queryError.message }, { status: 400 });
  }

  return NextResponse.json({ categories: data || [] });
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
  const categoryCode = String(body.category_code || "").trim().toUpperCase();
  const categoryName = String(body.category_name || "").trim();
  const description = body.description ? String(body.description).trim() : null;
  const isRequired = Boolean(body.is_required);

  if (!organisationId || !categoryCode || !categoryName) {
    return NextResponse.json(
      { error: "organisation_id, category_code, and category_name are required." },
      { status: 400 }
    );
  }

  const { data: organisation } = await supabase
    .from("organisations")
    .select("id")
    .eq("id", organisationId)
    .single();

  if (!organisation) {
    return NextResponse.json({ error: "Organisation not found." }, { status: 404 });
  }

  const { data, error: insertError } = await supabase
    .from("tracking_categories")
    .insert({
      organisation_id: organisationId,
      category_code: categoryCode,
      category_name: categoryName,
      description,
      is_system_default: false,
      is_required: isRequired,
      is_active: true,
      created_by: user?.id,
      updated_by: user?.id,
    })
    .select(
      "id, organisation_id, category_code, category_name, description, is_system_default, is_required, is_active, created_at"
    )
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 400 });
  }

  return NextResponse.json({ category: data });
}