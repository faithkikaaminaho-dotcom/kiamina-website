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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ optionId: string }> }
) {
  const { optionId } = await params;

  const { supabase, user, profile, error } = await getAuthenticatedProfile();

  if (error) {
    return NextResponse.json(
      { error },
      { status: error === "Access denied." ? 403 : 401 }
    );
  }

  if (!profile || !managerRoles.includes(String(profile.role))) {
    return NextResponse.json({ error: "Access denied." }, { status: 403 });
  }

  const body = await request.json();

  const { data: existingOption, error: existingError } = await supabase
    .from("tracking_options")
    .select("id, organisation_id, tracking_category_id, option_name, is_active")
    .eq("id", optionId)
    .single();

  if (existingError || !existingOption) {
    return NextResponse.json(
      { error: "Tracking option not found." },
      { status: 404 }
    );
  }

  const updatePayload: Record<string, unknown> = {
    updated_by: user?.id,
  };

  if (Object.prototype.hasOwnProperty.call(body, "option_name")) {
    const optionName = String(body.option_name || "").trim();

    if (!optionName) {
      return NextResponse.json(
        { error: "Option name is required." },
        { status: 400 }
      );
    }

    updatePayload.option_name = optionName;
  }

  if (Object.prototype.hasOwnProperty.call(body, "option_code")) {
    const optionCode = body.option_code
      ? String(body.option_code).trim()
      : null;

    updatePayload.option_code = optionCode;
  }

  if (Object.prototype.hasOwnProperty.call(body, "description")) {
    const description = body.description
      ? String(body.description).trim()
      : null;

    updatePayload.description = description;
  }

  if (Object.prototype.hasOwnProperty.call(body, "is_active")) {
    updatePayload.is_active = Boolean(body.is_active);
  }

  const { data, error: updateError } = await supabase
    .from("tracking_options")
    .update(updatePayload)
    .eq("id", optionId)
    .select(
      "id, organisation_id, tracking_category_id, option_code, option_name, description, parent_option_id, start_date, end_date, is_active, created_at"
    )
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  return NextResponse.json({ option: data });
}