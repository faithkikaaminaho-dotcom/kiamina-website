import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ArrowRightLeft } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import CreateInventoryTransferForm, {
  type ProductLocationAssignment,
  type TransferLocationOption,
  type TransferProductOption,
} from "./CreateInventoryTransferForm";

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

export default async function NewInventoryTransferPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/signin");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = String(profile?.role || "");

  if (!profile || !internalRoles.includes(role)) redirect("/portal");

  const { data: organisation } = await supabase
    .from("organisations")
    .select("id, legal_name, trading_name")
    .eq("id", id)
    .single();

  if (!organisation) redirect("/portal/organisations");

  const { data: inventorySettings } = await supabase
    .from("organisation_inventory_settings")
    .select("inventory_tracking_enabled, is_active")
    .eq("organisation_id", id)
    .maybeSingle();

  if (
    inventorySettings?.inventory_tracking_enabled !== true ||
    inventorySettings?.is_active === false
  ) {
    throw new Error(
      "Enable organisation inventory tracking before creating a location transfer."
    );
  }

  const { data: locationCategory } = await supabase
    .from("tracking_categories")
    .select("id")
    .eq("organisation_id", id)
    .eq("is_active", true)
    .or("category_code.ilike.LOCATION%,category_name.ilike.%location%")
    .limit(1)
    .maybeSingle();

  let locations: TransferLocationOption[] = [];

  if (locationCategory) {
    const { data, error } = await supabase
      .from("tracking_options")
      .select("id, option_code, option_name")
      .eq("organisation_id", id)
      .eq("tracking_category_id", locationCategory.id)
      .eq("is_active", true)
      .order("option_name", { ascending: true });

    if (error) throw new Error(error.message);
    locations = (data || []) as TransferLocationOption[];
  }

  const isGlobalInventoryManager =
    globalInventoryManagerRoles.includes(role);

  if (!isGlobalInventoryManager && locations.length > 0) {
    const { data: accessRows, error: accessError } = await supabase
      .from("user_location_access")
      .select("location_id")
      .eq("organisation_id", id)
      .eq("user_id", user.id)
      .eq("is_active", true)
      .eq("can_manage_inventory", true)
      .in(
        "location_id",
        locations.map((location) => location.id)
      );

    if (accessError) throw new Error(accessError.message);

    const permittedIds = new Set(
      (accessRows || []).map((access) => String(access.location_id))
    );
    locations = locations.filter((location) => permittedIds.has(location.id));
  }

  let assignments: ProductLocationAssignment[] = [];
  let products: TransferProductOption[] = [];

  if (locations.length > 0) {
    const { data: assignmentRows, error: assignmentError } = await supabase
      .from("product_inventory_locations")
      .select("product_service_id, location_id")
      .eq("organisation_id", id)
      .eq("is_active", true)
      .in(
        "location_id",
        locations.map((location) => location.id)
      );

    if (assignmentError) throw new Error(assignmentError.message);
    assignments = (assignmentRows || []) as ProductLocationAssignment[];

    const productIds = Array.from(
      new Set(assignments.map((assignment) => assignment.product_service_id))
    );

    if (productIds.length > 0) {
      const { data: productRows, error: productError } = await supabase
        .from("products_services")
        .select("id, item_name, sku, unit_of_measure")
        .eq("organisation_id", id)
        .eq("item_type", "PRODUCT")
        .eq("track_inventory", true)
        .eq("is_active", true)
        .in("id", productIds)
        .order("item_name", { ascending: true });

      if (productError) throw new Error(productError.message);
      products = (productRows || []) as TransferProductOption[];
    }
  }

  const organisationName =
    organisation.trading_name || organisation.legal_name || "Organisation";

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <section className="border-b border-[#D9E3F4] bg-white">
        <div className="mx-auto max-w-6xl px-6 py-8 lg:px-8">
          <Link
            href={`/portal/organisations/${id}/inventory-transfers`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#073D7F]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Location Transfers
          </Link>

          <div className="mt-8 flex items-start gap-5">
            <div className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#F1F1F1] text-[#073D7F]">
              <ArrowRightLeft className="h-6 w-6" />
            </div>
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                Multi-location Inventory
              </div>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
                Create location transfer
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                Prepare a draft inventory transfer for {organisationName}. Stock
                quantities and values will change only after controlled posting.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10 lg:px-8">
        <CreateInventoryTransferForm
          organisationId={organisation.id}
          locations={locations}
          products={products}
          assignments={assignments}
        />
      </section>
    </main>
  );
}
