import Link from "next/link";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  ArrowRightLeft,
  Boxes,
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

type LocationRecord = {
  id: string;
  option_code: string | null;
  option_name: string;
  description: string | null;
};

type LocationAssignment = {
  id: string;
  location_id: string;
  reorder_level: number | null;
  is_active: boolean;
};

type LocationAccess = {
  location_id: string;
  can_view: boolean;
  can_manage_inventory: boolean;
  is_active: boolean;
};

function parseNonNegativeNumber(value: FormDataEntryValue | null) {
  if (value === null || String(value).trim() === "") {
    return null;
  }

  const number = Number(value);

  if (!Number.isFinite(number) || number < 0) {
    throw new Error("Reorder levels must be zero or greater.");
  }

  return number;
}

export default async function ProductLocationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; itemId: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const {
    id: organisationId,
    itemId: productId,
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
    .select("id, legal_name, trading_name")
    .eq("id", organisationId)
    .single();

  if (!organisation) {
    redirect("/portal/organisations");
  }

  const { data: product, error: productError } = await supabase
    .from("products_services")
    .select(
      "id, item_name, item_type, sku, is_active, track_inventory, inventory_asset_account_id, cost_of_sales_account_id, inventory_valuation_method"
    )
    .eq("id", productId)
    .eq("organisation_id", organisationId)
    .single();

  if (productError) {
    throw new Error(
      `Unable to load product ${productId}: ${productError.message}`
    );
  }

  if (!product) {
    throw new Error(
      `Product ${productId} was not found in organisation ${organisationId}.`
    );
  }

  if (product.item_type !== "PRODUCT") {
    redirect(
      `/portal/organisations/${organisationId}/products-services/${productId}`
    );
  }

  const { data: inventorySettings } = await supabase
    .from("organisation_inventory_settings")
    .select(
      "inventory_tracking_enabled, inventory_valuation_method, default_inventory_asset_account_id, default_cost_of_sales_account_id, is_active"
    )
    .eq("organisation_id", organisationId)
    .maybeSingle();

  const { data: locationCategory } = await supabase
    .from("tracking_categories")
    .select("id")
    .eq("organisation_id", organisationId)
    .eq("is_active", true)
    .or("category_code.ilike.LOCATION%,category_name.ilike.%location%")
    .limit(1)
    .maybeSingle();

  let allLocations: LocationRecord[] = [];

  if (locationCategory) {
    const { data: locationRows, error: locationsError } = await supabase
      .from("tracking_options")
      .select("id, option_code, option_name, description")
      .eq("organisation_id", organisationId)
      .eq("tracking_category_id", locationCategory.id)
      .eq("is_active", true)
      .order("option_name", { ascending: true });

    if (locationsError) {
      throw new Error(locationsError.message);
    }

    allLocations = (locationRows || []) as LocationRecord[];
  }

  const isGlobalInventoryManager =
    globalInventoryManagerRoles.includes(role);

  let accessRows: LocationAccess[] = [];

  if (!isGlobalInventoryManager) {
    const { data, error } = await supabase
      .from("user_location_access")
      .select(
        "location_id, can_view, can_manage_inventory, is_active"
      )
      .eq("organisation_id", organisationId)
      .eq("user_id", user.id)
      .eq("is_active", true);

    if (error) {
      throw new Error(error.message);
    }

    accessRows = (data || []) as LocationAccess[];
  }

  const accessMap = new Map(
    accessRows.map((access) => [access.location_id, access])
  );

  const visibleLocations = isGlobalInventoryManager
    ? allLocations
    : allLocations.filter(
        (location) => accessMap.get(location.id)?.can_view === true
      );

  const manageableLocationIds = new Set(
    isGlobalInventoryManager
      ? visibleLocations.map((location) => location.id)
      : visibleLocations
          .filter(
            (location) =>
              accessMap.get(location.id)?.can_manage_inventory === true
          )
          .map((location) => location.id)
  );

  const { data: assignmentRows, error: assignmentsError } = await supabase
    .from("product_inventory_locations")
    .select("id, location_id, reorder_level, is_active")
    .eq("organisation_id", organisationId)
    .eq("product_service_id", productId);

  if (assignmentsError) {
    throw new Error(assignmentsError.message);
  }

  const assignments = (assignmentRows || []) as LocationAssignment[];
  const assignmentMap = new Map(
    assignments.map((assignment) => [assignment.location_id, assignment])
  );

  const canManageAnyLocation = manageableLocationIds.size > 0;
  const inventoryEnabled =
    inventorySettings?.inventory_tracking_enabled === true &&
    inventorySettings?.is_active !== false;

  const existingInventoryAssetAccountId =
    product.inventory_asset_account_id;
  const existingCostOfSalesAccountId =
    product.cost_of_sales_account_id;
  const existingInventoryValuationMethod =
    product.inventory_valuation_method;

  async function saveProductLocations(formData: FormData) {
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

    const submittedVisibleLocationIds = formData
      .getAll("visible_location_ids")
      .map(String);

    if (submittedVisibleLocationIds.length === 0) {
      throw new Error("No manageable location was submitted.");
    }

    const { data: validLocationRows } = await serverSupabase
      .from("tracking_options")
      .select("id")
      .eq("organisation_id", organisationId)
      .eq("is_active", true)
      .in("id", submittedVisibleLocationIds);

    const validLocationIds = new Set(
      (validLocationRows || []).map((location) => location.id)
    );

    let authorisedLocationIds = new Set<string>();

    if (actionIsGlobalManager) {
      authorisedLocationIds = validLocationIds;
    } else {
      const { data: actionAccessRows } = await serverSupabase
        .from("user_location_access")
        .select("location_id")
        .eq("organisation_id", organisationId)
        .eq("user_id", actionUser.id)
        .eq("is_active", true)
        .eq("can_manage_inventory", true)
        .in("location_id", Array.from(validLocationIds));

      authorisedLocationIds = new Set(
        (actionAccessRows || []).map((access) => access.location_id)
      );
    }

    if (authorisedLocationIds.size === 0) {
      throw new Error(
        "You do not have permission to manage inventory at these locations."
      );
    }

    const selectedLocationIds = new Set(
      formData
        .getAll("location_ids")
        .map(String)
        .filter((locationId) => authorisedLocationIds.has(locationId))
    );

    const { data: currentSettings } = await serverSupabase
      .from("organisation_inventory_settings")
      .select(
        "inventory_tracking_enabled, inventory_valuation_method, default_inventory_asset_account_id, default_cost_of_sales_account_id, is_active"
      )
      .eq("organisation_id", organisationId)
      .maybeSingle();

    if (
      currentSettings?.inventory_tracking_enabled !== true ||
      currentSettings?.is_active === false
    ) {
      throw new Error(
        "Enable organisation inventory tracking before assigning product locations."
      );
    }

    if (
      !currentSettings.default_inventory_asset_account_id ||
      !currentSettings.default_cost_of_sales_account_id
    ) {
      throw new Error(
        "Complete the organisation inventory GL mappings before assigning product locations."
      );
    }

    const { error: productUpdateError } = await serverSupabase
      .from("products_services")
      .update({
        track_inventory: true,
        inventory_asset_account_id:
          existingInventoryAssetAccountId ||
          currentSettings.default_inventory_asset_account_id,
        cost_of_sales_account_id:
          existingCostOfSalesAccountId ||
          currentSettings.default_cost_of_sales_account_id,
        inventory_valuation_method:
          existingInventoryValuationMethod ||
          currentSettings.inventory_valuation_method,
        updated_at: new Date().toISOString(),
        updated_by: actionUser.id,
      })
      .eq("id", productId)
      .eq("organisation_id", organisationId);

    if (productUpdateError) {
      throw new Error(productUpdateError.message);
    }

    const now = new Date().toISOString();

    for (const locationId of authorisedLocationIds) {
      const selected = selectedLocationIds.has(locationId);
      const reorderLevel = selected
        ? parseNonNegativeNumber(formData.get(`reorder_${locationId}`))
        : null;

      const { data: existingAssignment } = await serverSupabase
        .from("product_inventory_locations")
        .select("id")
        .eq("organisation_id", organisationId)
        .eq("product_service_id", productId)
        .eq("location_id", locationId)
        .maybeSingle();

      if (existingAssignment) {
        const { error: updateError } = await serverSupabase
          .from("product_inventory_locations")
          .update({
            reorder_level: reorderLevel,
            is_active: selected,
            updated_at: now,
            updated_by: actionUser.id,
          })
          .eq("id", existingAssignment.id)
          .eq("organisation_id", organisationId);

        if (updateError) {
          throw new Error(updateError.message);
        }
      } else if (selected) {
        const { error: insertError } = await serverSupabase
          .from("product_inventory_locations")
          .insert({
            organisation_id: organisationId,
            product_service_id: productId,
            location_id: locationId,
            reorder_level: reorderLevel,
            is_active: true,
            created_at: now,
            updated_at: now,
            created_by: actionUser.id,
            updated_by: actionUser.id,
          });

        if (insertError) {
          throw new Error(insertError.message);
        }
      }
    }

    const pagePath =
      `/portal/organisations/${organisationId}` +
      `/products-services/${productId}/locations`;

    revalidatePath(pagePath);
    revalidatePath(
      `/portal/organisations/${organisationId}/products-services`
    );
    redirect(`${pagePath}?saved=1`);
  }

  const organisationName =
    organisation.trading_name ||
    organisation.legal_name ||
    "Organisation";

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <section className="border-b border-[#D9E3F4] bg-white">
        <div className="mx-auto max-w-6xl px-6 py-8 lg:px-8">
          <Link
            href={`/portal/organisations/${organisationId}/products-services`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#073D7F]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Products / Services
          </Link>

          <div className="mt-8 flex items-start gap-5">
            <div className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#F1F1F1] text-[#073D7F]">
              <MapPinned className="h-6 w-6" />
            </div>

            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                Multi-location Inventory
              </div>

              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
                Manage product locations
              </h1>

              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                Activate {product.item_name} at permitted locations for{" "}
                {organisationName}. The product remains a single organisation-wide
                record while quantities and inventory values remain location-specific.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10 lg:px-8">
        {saved === "1" ? (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-700">
            Product locations saved successfully.
          </div>
        ) : null}

        {!inventoryEnabled ? (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-7 text-amber-800">
            Organisation inventory tracking is disabled. Enable it in Inventory
            Settings before assigning this product to locations.
          </div>
        ) : null}

        <div className="mb-8 grid gap-5 md:grid-cols-3">
          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">Product</div>
            <div className="mt-3 text-xl font-semibold text-slate-950">
              {product.item_name}
            </div>
            <div className="mt-2 text-sm text-slate-500">
              {product.sku || "No SKU / code"}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">
              Available locations
            </div>
            <div className="mt-3 text-3xl font-semibold text-slate-950">
              {visibleLocations.length}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">
              Active locations
            </div>
            <div className="mt-3 text-3xl font-semibold text-emerald-700">
              {
                visibleLocations.filter(
                  (location) => assignmentMap.get(location.id)?.is_active
                ).length
              }
            </div>
          </div>
        </div>

        <section className="rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm">
          <div className="flex items-start gap-4">
            <ShieldCheck className="mt-1 h-6 w-6 text-[#073D7F]" />
            <div>
              <h2 className="text-2xl font-semibold text-slate-950">
                Location availability
              </h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Only locations you are authorised to view are shown. Select a
                location to activate this existing product there.
              </p>
            </div>
          </div>

          {visibleLocations.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-dashed border-[#BCD2F3] bg-[#F8FAFC] px-6 py-12 text-center">
              <Boxes className="mx-auto h-7 w-7 text-[#073D7F]" />
              <h3 className="mt-4 font-semibold text-slate-950">
                No permitted locations found
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Create an active Location tracking option or grant this user
                location access.
              </p>
            </div>
          ) : (
            <form action={saveProductLocations} className="mt-8 space-y-4">
              {visibleLocations.map((location) => {
                const assignment = assignmentMap.get(location.id);
                const canManage = manageableLocationIds.has(location.id);

                return (
                  <div
                    key={location.id}
                    className="grid gap-5 rounded-2xl border border-[#D9E3F4] bg-[#F8FAFC] p-5 md:grid-cols-[1fr_220px] md:items-center"
                  >
                    {canManage ? (
                      <input
                        type="hidden"
                        name="visible_location_ids"
                        value={location.id}
                      />
                    ) : null}

                    <div>
                      <label className="flex items-start gap-4">
                        <input
                          type="checkbox"
                          name="location_ids"
                          value={location.id}
                          defaultChecked={assignment?.is_active === true}
                          disabled={!canManage || !inventoryEnabled}
                          className="mt-1 h-5 w-5 rounded border-slate-300"
                        />

                        <span>
                          <span className="block font-semibold text-slate-950">
                            {location.option_name}
                          </span>
                          <span className="mt-1 block text-sm text-slate-500">
                            {location.option_code || "No location code"}
                            {!canManage ? " · View only" : ""}
                          </span>
                          {location.description ? (
                            <span className="mt-2 block text-sm text-slate-500">
                              {location.description}
                            </span>
                          ) : null}
                        </span>
                      </label>

                      {assignment?.is_active === true ? (
                        <div className="ml-9 mt-4 flex flex-wrap items-center gap-x-5 gap-y-3">
                          <Link
                            href={`/portal/organisations/${organisationId}/products-services/${productId}/locations/${location.id}`}
                            className="inline-flex items-center gap-2 text-sm font-semibold text-[#073D7F] hover:underline"
                          >
                            <ArrowRightLeft className="h-4 w-4" />
                            View movements
                          </Link>

                          {canManage ? (
                            <Link
                              href={`/portal/organisations/${organisationId}/products-services/${productId}/locations/${location.id}/opening-balance`}
                              className="inline-flex items-center gap-2 text-sm font-semibold text-[#073D7F] hover:underline"
                            >
                              <Boxes className="h-4 w-4" />
                              Opening balance
                            </Link>
                          ) : null}
                        </div>
                      ) : (
                        <p className="ml-9 mt-3 text-xs text-slate-500">
                          Save this location first to create an opening balance.
                        </p>
                      )}
                    </div>

                    <label className="block">
                      <span className="text-sm font-semibold text-slate-700">
                        Reorder level
                      </span>
                      <input
                        type="number"
                        name={`reorder_${location.id}`}
                        min="0"
                        step="0.0001"
                        defaultValue={assignment?.reorder_level ?? ""}
                        disabled={!canManage || !inventoryEnabled}
                        placeholder="Optional"
                        className="mt-2 w-full rounded-2xl border border-[#D9E3F4] bg-white px-4 py-3 text-sm disabled:cursor-not-allowed disabled:bg-slate-100"
                      />
                    </label>
                  </div>
                );
              })}

              {canManageAnyLocation && inventoryEnabled ? (
                <div className="flex flex-col gap-3 pt-4 sm:flex-row">
                  <button
                    type="submit"
                    className="rounded-full bg-[#073D7F] px-6 py-3 text-sm font-semibold text-white"
                  >
                    Save Product Locations
                  </button>

                  <Link
                    href={`/portal/organisations/${organisationId}/products-services`}
                    className="rounded-full border border-[#D9E3F4] bg-white px-6 py-3 text-center text-sm font-semibold text-[#073D7F]"
                  >
                    Cancel
                  </Link>
                </div>
              ) : null}
            </form>
          )}
        </section>
      </section>
    </main>
  );
}
