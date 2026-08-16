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

    if (!profile || !internalRoles.includes(String(profile.role))) {
      return Response.json({ error: "Access denied." }, { status: 403 });
    }

    const body = await request.json();
    const organisationId = String(body.organisation_id || "").trim();
    const countReference = String(body.count_reference || "").trim();
    const countDate = String(body.count_date || "").trim();
    const locationId = String(body.location_id || "").trim();
    const notes = String(body.notes || "").trim();

    if (!organisationId) {
      return Response.json(
        { error: "Organisation is required." },
        { status: 400 }
      );
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(countDate)) {
      return Response.json(
        { error: "A valid count date is required." },
        { status: 400 }
      );
    }

    if (!locationId) {
      return Response.json(
        { error: "Inventory count location is required." },
        { status: 400 }
      );
    }

    const { data: organisation } = await supabase
      .from("organisations")
      .select("id")
      .eq("id", organisationId)
      .single();

    if (!organisation) {
      return Response.json(
        { error: "Organisation not found." },
        { status: 404 }
      );
    }

    const { data: countId, error: countError } = await supabase.rpc(
      "create_inventory_count",
      {
        requested_organisation_id: organisationId,
        requested_count_reference: countReference || null,
        requested_count_date: countDate,
        requested_location_id: locationId,
        requested_notes: notes || null,
      }
    );

    if (countError || !countId) {
      return Response.json(
        {
          error: countError?.message || "Unable to create inventory count.",
        },
        { status: 400 }
      );
    }

    const { data: inventoryCount } = await supabase
      .from("inventory_counts")
      .select("id, count_reference")
      .eq("id", String(countId))
      .eq("organisation_id", organisationId)
      .single();

    return Response.json({
      success: true,
      countId: String(countId),
      countReference: inventoryCount?.count_reference || countReference,
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create inventory count.",
      },
      { status: 500 }
    );
  }
}