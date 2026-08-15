import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  Boxes,
  Calculator,
  MapPinned,
  ShieldCheck,
} from "lucide-react";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

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

const globalInventoryManagerRoles = [
  "SUPER_ADMIN",
  "ADMIN",
  "IT_ADMIN",
  "ACCOUNTANT_ADMIN",
  "OPERATIONS_ADMIN",
];

function today() {
  return new Date().toISOString().slice(0, 10);
}

function readPositiveNumber(
  value: FormDataEntryValue | null,
  label: string
) {
  const number = Number(String(value || "").trim());

  if (!Number.isFinite(number) || number <= 0) {
    throw new Error(`${label} must be greater than zero.`);
  }

  return number;
}

function readNonNegativeNumber(
  value: FormDataEntryValue | null,
  label: string
) {
  const number = Number(String(value || "").trim());

  if (!Number.isFinite(number) || number < 0) {
    throw new Error(`${label} must be zero or greater.`);
  }

  return number;
}

export default async function OpeningInventoryPage({
  params,
  searchParams,
}: {
  params: Promise<{
    id: string;
    itemId: string;
    locationId: string;
  }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const {
    id: organisationId,
    itemId: productId,
    locationId,
  } = await params;
  const { saved } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = String(profile?.role || "");

  if (!profile || !internalRoles.includes(role)) {
    redirect("/portal");
  }

  const { data: organisation } = await supabase
    .from("organisations")
    .select("id, legal_name, trading_name, base_currency_code")
    .eq("id", organisationId)
    .single();

  if (!organisation) {
    redirect("/portal/organisations");
  }

  const { data: product, error: productError } = await supabase
    .from("products_services")
    .select(
      "id, item_name, item_type, sku, track_inventory, default_purchase_cost, currency_code, is_active"
    )
    .eq("id", productId)
    .eq("organisation_id", organisationId)
    .single();

  if (productError) {
    throw new Error(productError.message);
  }

  if (!product || product.item_type !== "PRODUCT") {
    redirect(
      `/portal/organisations/${organisationId}/products-services`
    );
  }

  const { data: location, error: locationError } = await supabase
    .from("tracking_options")
    .select("id, option_code, option_name, description, is_active")
    .eq("id", locationId)
    .eq("organisation_id", organisationId)
    .single();

  if (locationError) {
    throw new Error(locationError.message);
  }

  if (!location || location.is_active === false) {
    redirect(
      `/portal/organisations/${organisationId}/products-services/${productId}/locations`
    );
  }

  const { data: assignment } = await supabase
    .from("product_inventory_locations")
    .select("id, is_active")
    .eq("organisation_id", organisationId)
    .eq("product_service_id", productId)
    .eq("location_id", locationId)
    .maybeSingle();

  if (!assignment || assignment.is_active !== true) {
    redirect(
      `/portal/organisations/${organisationId}/products-services/${productId}/locations`
    );
  }

  const isGlobalInventoryManager =
    globalInventoryManagerRoles.includes(role);

  let canManageInventory = isGlobalInventoryManager;

  if (!isGlobalInventoryManager) {
    const { data: access } = await supabase
      .from("user_location_access")
      .select("can_view, can_manage_inventory, is_active")
      .eq("organisation_id", organisationId)
      .eq("user_id", user.id)
      .eq("location_id", locationId)
      .eq("is_active", true)
      .maybeSingle();

    if (!access || access.can_view !== true) {
      redirect(
        `/portal/organisations/${organisationId}/products-services/${productId}/locations`
      );
    }

    canManageInventory = access.can_manage_inventory === true;
  }

  const { data: existingMovement, error: movementError } = await supabase
    .from("inventory_movements")
    .select(
      "id, movement_date, quantity_in, unit_cost, total_cost, source_reference, narration, status, created_at"
    )
    .eq("organisation_id", organisationId)
    .eq("product_service_id", productId)
    .eq("location_id", locationId)
    .eq("movement_type", "OPENING_BALANCE")
    .neq("status", "VOID")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (movementError) {
    throw new Error(movementError.message);
  }

  const { data: balance } = await supabase
    .from("inventory_balances_by_location")
    .select("quantity_on_hand, inventory_value, last_movement_date")
    .eq("organisation_id", organisationId)
    .eq("product_service_id", productId)
    .eq("location_id", locationId)
    .maybeSingle();

  const existingMovementId = existingMovement?.id || null;
  const existingMovementStatus = existingMovement?.status || null;
  const canEditExistingMovement =
    !existingMovementStatus ||
    ["DRAFT", "READY_FOR_REVIEW"].includes(existingMovementStatus);

  async function saveOpeningBalance(formData: FormData) {
    "use server";

    const serverSupabase = await createClient();
    const {
      data: { user: actionUser },
    } = await serverSupabase.auth.getUser();

    if (!actionUser) {
      redirect("/signin");
    }

    const { data: actionProfile } = await serverSupabase
      .from("profiles")
      .select("role")
      .eq("id", actionUser.id)
      .single();

    const actionRole = String(actionProfile?.role || "");
    const actionIsGlobalManager =
      globalInventoryManagerRoles.includes(actionRole);

    if (!actionIsGlobalManager) {
      const { data: actionAccess } = await serverSupabase
        .from("user_location_access")
        .select("can_manage_inventory, is_active")
        .eq("organisation_id", organisationId)
        .eq("user_id", actionUser.id)
        .eq("location_id", locationId)
        .eq("is_active", true)
        .eq("can_manage_inventory", true)
        .maybeSingle();

      if (!actionAccess) {
        throw new Error(
          "You do not have permission to manage inventory at this location."
        );
      }
    }

    const { data: activeAssignment } = await serverSupabase
      .from("product_inventory_locations")
      .select("id")
      .eq("organisation_id", organisationId)
      .eq("product_service_id", productId)
      .eq("location_id", locationId)
      .eq("is_active", true)
      .maybeSingle();

    if (!activeAssignment) {
      throw new Error(
        "Activate this product at the location before recording an opening balance."
      );
    }

    const movementDate = String(formData.get("movement_date") || "").trim();
    const quantity = readPositiveNumber(
      formData.get("quantity"),
      "Opening quantity"
    );
    const unitCost = readNonNegativeNumber(
      formData.get("unit_cost"),
      "Unit cost"
    );
    const sourceReference =
      String(formData.get("source_reference") || "").trim() || null;
    const narration =
      String(formData.get("narration") || "").trim() || null;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(movementDate)) {
      throw new Error("Enter a valid movement date.");
    }

    const totalCost = Number((quantity * unitCost).toFixed(4));
    const now = new Date().toISOString();

    const payload = {
      movement_date: movementDate,
      movement_type: "OPENING_BALANCE",
      quantity_in: quantity,
      quantity_out: 0,
      unit_cost: unitCost,
      total_cost: totalCost,
      source_module: "INVENTORY_OPENING_BALANCE",
      source_record_id: null,
      source_line_id: null,
      source_reference: sourceReference,
      narration,
      status: "DRAFT",
      updated_at: now,
      updated_by: actionUser.id,
    };

    if (existingMovementId) {
      if (
        existingMovementStatus &&
        !["DRAFT", "READY_FOR_REVIEW"].includes(existingMovementStatus)
      ) {
        throw new Error(
          `The existing opening balance is ${existingMovementStatus} and cannot be edited.`
        );
      }

      const { error: updateError } = await serverSupabase
        .from("inventory_movements")
        .update(payload)
        .eq("id", existingMovementId)
        .eq("organisation_id", organisationId)
        .eq("product_service_id", productId)
        .eq("location_id", locationId);

      if (updateError) {
        throw new Error(updateError.message);
      }
    } else {
      const { error: insertError } = await serverSupabase
        .from("inventory_movements")
        .insert({
          organisation_id: organisationId,
          product_service_id: productId,
          location_id: locationId,
          ...payload,
          created_at: now,
          created_by: actionUser.id,
        });

      if (insertError) {
        throw new Error(insertError.message);
      }
    }

    const pagePath =
      `/portal/organisations/${organisationId}` +
      `/products-services/${productId}/locations/${locationId}/opening-balance`;

    revalidatePath(pagePath);
    redirect(`${pagePath}?saved=1`);
  }

  const organisationName =
    organisation.trading_name ||
    organisation.legal_name ||
    "Organisation";
  const currencyCode =
    product.currency_code || organisation.base_currency_code || "—";
  const defaultUnitCost =
    existingMovement?.unit_cost ?? product.default_purchase_cost ?? "";

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <section className="border-b border-[#D9E3F4] bg-white">
        <div className="mx-auto max-w-6xl px-6 py-8 lg:px-8">
          <Link
            href={`/portal/organisations/${organisationId}/products-services/${productId}/locations`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#073D7F]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to product locations
          </Link>

          <div className="mt-8 flex items-start gap-5">
            <div className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#F1F1F1] text-[#073D7F]">
              <Boxes className="h-6 w-6" />
            </div>

            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                Inventory Opening Balance
              </div>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
                {product.item_name}
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                Record the starting inventory quantity and cost at{" "}
                {location.option_name} for {organisationName}.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10 lg:px-8">
        {saved === "1" ? (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-700">
            Draft opening balance saved successfully.
          </div>
        ) : null}

        <div className="mb-8 grid gap-5 md:grid-cols-3">
          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <MapPinned className="h-5 w-5 text-[#073D7F]" />
            <div className="mt-3 text-sm font-semibold text-slate-500">
              Location
            </div>
            <div className="mt-2 text-xl font-semibold text-slate-950">
              {location.option_name}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <Calculator className="h-5 w-5 text-[#073D7F]" />
            <div className="mt-3 text-sm font-semibold text-slate-500">
              Posted quantity on hand
            </div>
            <div className="mt-2 text-3xl font-semibold text-slate-950">
              {Number(balance?.quantity_on_hand || 0).toLocaleString()}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <ShieldCheck className="h-5 w-5 text-[#073D7F]" />
            <div className="mt-3 text-sm font-semibold text-slate-500">
              Opening-balance status
            </div>
            <div className="mt-2 text-xl font-semibold text-slate-950">
              {existingMovementStatus || "Not created"}
            </div>
          </div>
        </div>

        <section className="rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-950">
            Opening quantity and cost
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            This creates a draft inventory movement. Draft movements do not
            affect stock balances until reviewed and posted.
          </p>

          {!canManageInventory ? (
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
              You have view-only access to this location.
            </div>
          ) : !canEditExistingMovement ? (
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
              This opening balance is {existingMovementStatus} and can no longer
              be edited here.
            </div>
          ) : (
            <form action={saveOpeningBalance} className="mt-8 space-y-6">
              <div className="grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">
                    Opening-balance date
                  </span>
                  <input
                    type="date"
                    name="movement_date"
                    required
                    defaultValue={existingMovement?.movement_date || today()}
                    className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">
                    Opening quantity
                  </span>
                  <input
                    type="number"
                    name="quantity"
                    required
                    min="0.0001"
                    step="0.0001"
                    defaultValue={existingMovement?.quantity_in ?? ""}
                    placeholder="0.00"
                    className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">
                    Unit cost ({currencyCode})
                  </span>
                  <input
                    type="number"
                    name="unit_cost"
                    required
                    min="0"
                    step="0.0001"
                    defaultValue={defaultUnitCost}
                    placeholder="0.00"
                    className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">
                    Source reference
                  </span>
                  <input
                    type="text"
                    name="source_reference"
                    defaultValue={existingMovement?.source_reference || ""}
                    placeholder="Opening inventory schedule reference"
                    className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Narration
                </span>
                <textarea
                  name="narration"
                  rows={4}
                  defaultValue={existingMovement?.narration || ""}
                  placeholder="Explain the source and basis of the opening balance."
                  className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm"
                />
              </label>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  className="rounded-full bg-[#073D7F] px-6 py-3 text-sm font-semibold text-white"
                >
                  Save Draft Opening Balance
                </button>
                <Link
                  href={`/portal/organisations/${organisationId}/products-services/${productId}/locations`}
                  className="rounded-full border border-[#D9E3F4] bg-white px-6 py-3 text-center text-sm font-semibold text-[#073D7F]"
                >
                  Cancel
                </Link>
              </div>
            </form>
          )}
        </section>
      </section>
    </main>
  );
}
