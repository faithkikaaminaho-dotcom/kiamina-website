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

type SubmittedLine = {
  product_service_id?: unknown;
  quantity?: unknown;
  line_note?: unknown;
};

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
    const transferReference = String(body.transfer_reference || "").trim();
    const transferDate = String(body.transfer_date || "").trim();
    const fromLocationId = String(body.from_location_id || "").trim();
    const toLocationId = String(body.to_location_id || "").trim();
    const notes = String(body.notes || "").trim();
    const submittedLines = Array.isArray(body.lines)
      ? (body.lines as SubmittedLine[])
      : [];

    if (!organisationId) {
      return Response.json(
        { error: "Organisation is required." },
        { status: 400 }
      );
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(transferDate)) {
      return Response.json(
        { error: "A valid transfer date is required." },
        { status: 400 }
      );
    }

    if (!fromLocationId || !toLocationId) {
      return Response.json(
        { error: "Source and destination locations are required." },
        { status: 400 }
      );
    }

    if (fromLocationId === toLocationId) {
      return Response.json(
        { error: "Source and destination locations must be different." },
        { status: 400 }
      );
    }

    const lines = submittedLines
      .map((line) => ({
        product_service_id: String(line.product_service_id || "").trim(),
        quantity: Number(line.quantity),
        line_note: String(line.line_note || "").trim() || null,
      }))
      .filter(
        (line) =>
          line.product_service_id &&
          Number.isFinite(line.quantity) &&
          line.quantity > 0
      );

    if (lines.length === 0) {
      return Response.json(
        { error: "Add at least one product with a quantity above zero." },
        { status: 400 }
      );
    }

    if (lines.length !== submittedLines.length) {
      return Response.json(
        { error: "Every transfer line requires a product and valid quantity." },
        { status: 400 }
      );
    }

    const uniqueProductIds = new Set(
      lines.map((line) => line.product_service_id)
    );

    if (uniqueProductIds.size !== lines.length) {
      return Response.json(
        { error: "A product can appear only once in a transfer." },
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

    const { data: transferId, error: transferError } = await supabase.rpc(
      "create_inventory_transfer",
      {
        requested_organisation_id: organisationId,
        requested_transfer_reference: transferReference || null,
        requested_transfer_date: transferDate,
        requested_from_location_id: fromLocationId,
        requested_to_location_id: toLocationId,
        requested_notes: notes || null,
        requested_lines: lines,
      }
    );

    if (transferError || !transferId) {
      return Response.json(
        {
          error:
            transferError?.message || "Unable to create inventory transfer.",
        },
        { status: 400 }
      );
    }

    const { data: transfer } = await supabase
      .from("inventory_transfers")
      .select("id, transfer_reference")
      .eq("id", String(transferId))
      .eq("organisation_id", organisationId)
      .single();

    return Response.json({
      success: true,
      transferId: String(transferId),
      transferReference: transfer?.transfer_reference || transferReference,
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create inventory transfer.",
      },
      { status: 500 }
    );
  }
}
