import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ClipboardCheck } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import CreateInventoryCountForm, {
  type CountLocationOption,
} from "./CreateInventoryCountForm";

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

export default async function NewInventoryCountPage({
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
      "Enable organisation inventory tracking before creating an inventory count."
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

  let locations: CountLocationOption[] = [];

  if (locationCategory) {
    const { data, error } = await supabase
      .from("tracking_options")
      .select("id, option_code, option_name")
      .eq("organisation_id", id)
      .eq("tracking_category_id", locationCategory.id)
      .eq("is_active", true)
      .order("option_name", { ascending: true });

    if (error) throw new Error(error.message);
    locations = (data || []) as CountLocationOption[];
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

    const permittedLocationIds = new Set(
      (accessRows || []).map((access) => String(access.location_id))
    );
    locations = locations.filter((location) =>
      permittedLocationIds.has(location.id)
    );
  }

  const organisationName =
    organisation.trading_name || organisation.legal_name || "Organisation";

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <section className="border-b border-[#D9E3F4] bg-white">
        <div className="mx-auto max-w-6xl px-6 py-8 lg:px-8">
          <Link
            href={`/portal/organisations/${id}/inventory-counts`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#073D7F]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Inventory Counts
          </Link>

          <div className="mt-8 flex items-start gap-5">
            <div className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#F1F1F1] text-[#073D7F]">
              <ClipboardCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                Period-end Inventory Control
              </div>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
                Create inventory count
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                Create a location-specific physical inventory count for
                {" "}{organisationName}. System quantities are frozen when the
                draft is created.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10 lg:px-8">
        <CreateInventoryCountForm
          organisationId={organisation.id}
          locations={locations}
        />
      </section>
    </main>
  );
}