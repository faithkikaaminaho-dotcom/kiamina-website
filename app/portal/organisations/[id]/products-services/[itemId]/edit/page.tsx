import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Boxes } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import EditProductServiceForm from "./EditProductServiceForm";

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

export default async function EditProductServicePage({
  params,
}: {
  params: Promise<{
    id: string;
    itemId: string;
  }>;
}) {
  const { id, itemId } = await params;
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

  if (
    !profile ||
    !internalRoles.includes(profile.role)
  ) {
    redirect("/portal");
  }

  const { data: organisation } =
    await supabase
      .from("organisations")
      .select(
        "id, legal_name, trading_name, base_currency_code"
      )
      .eq("id", id)
      .single();

  if (!organisation) {
    redirect("/portal/organisations");
  }

  const { data: item } = await supabase
    .from("products_services")
    .select("*")
    .eq("id", itemId)
    .eq("organisation_id", id)
    .single();

  if (!item) {
    redirect(
      `/portal/organisations/${id}/products-services`
    );
  }

  const { data: incomeAccounts } =
    await supabase
      .from("chart_of_accounts")
      .select(
        "id, account_code, account_name"
      )
      .eq("organisation_id", id)
      .eq("is_active", true)
      .eq("account_type", "INCOME")
      .order("account_code", {
        ascending: true,
      });

  const { data: expenseAccounts } =
    await supabase
      .from("chart_of_accounts")
      .select(
        "id, account_code, account_name"
      )
      .eq("organisation_id", id)
      .eq("is_active", true)
      .eq("account_type", "EXPENSE")
      .order("account_code", {
        ascending: true,
      });

  const { data: taxAccounts } =
    await supabase
      .from("chart_of_accounts")
      .select(
        "id, account_code, account_name"
      )
      .eq("organisation_id", id)
      .eq("is_active", true)
      .or(
        "tax_relevant.eq.true,fs_line_item.ilike.%tax%,account_name.ilike.%tax%"
      )
      .order("account_code", {
        ascending: true,
      });

  const { data: inventoryAssetAccounts } =
    await supabase
      .from("chart_of_accounts")
      .select(
        "id, account_code, account_name"
      )
      .eq("organisation_id", id)
      .eq("is_active", true)
      .eq("account_type", "ASSET")
      .or(
        "fs_line_item.ilike.%inventor%,management_report_category.ilike.%inventor%,account_name.ilike.%inventor%"
      )
      .order("account_code", {
        ascending: true,
      });

  const { data: costOfSalesAccounts } =
    await supabase
      .from("chart_of_accounts")
      .select(
        "id, account_code, account_name"
      )
      .eq("organisation_id", id)
      .eq("is_active", true)
      .eq("account_type", "EXPENSE")
      .or(
        "account_subtype.eq.COST_OF_SALES,fs_line_item.ilike.%cost of sales%,account_name.ilike.%cost of sales%,account_name.ilike.%cost of goods%"
      )
      .order("account_code", {
        ascending: true,
      });

  const { data: locationCategory } =
    await supabase
      .from("tracking_categories")
      .select("id")
      .eq("organisation_id", id)
      .eq("category_code", "LOCATION")
      .eq("is_active", true)
      .maybeSingle();

  let locationOptions: {
    id: string;
    option_code: string | null;
    option_name: string | null;
  }[] = [];

  if (locationCategory) {
    const { data: locations } = await supabase
      .from("tracking_options")
      .select(
        "id, option_code, option_name"
      )
      .eq("organisation_id", id)
      .eq(
        "tracking_category_id",
        locationCategory.id
      )
      .eq("is_active", true)
      .order("option_name", {
        ascending: true,
      });

    locationOptions = locations || [];
  }

  const { data: existingInventoryLocations } =
    await supabase
      .from("product_inventory_locations")
      .select(
        "id, location_id, reorder_level, is_active"
      )
      .eq("organisation_id", id)
      .eq("product_service_id", itemId)
      .eq("is_active", true);

  const selectedLocationIds = (
    existingInventoryLocations || []
  ).map((record) => record.location_id);

  const existingReorderLevel =
    existingInventoryLocations?.find(
      (record) =>
        record.reorder_level !== null
    )?.reorder_level ?? null;

  const organisationName =
    organisation.trading_name ||
    organisation.legal_name ||
    "Organisation";

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <section className="border-b border-[#D9E3F4] bg-white">
        <div className="mx-auto max-w-6xl px-6 py-8 lg:px-8">
          <Link
            href={`/portal/organisations/${id}/products-services/${itemId}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#073D7F]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to product or service
          </Link>

          <div className="mt-8 flex items-start gap-5">
            <div className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#F1F1F1] text-[#073D7F]">
              <Boxes className="h-6 w-6" />
            </div>

            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                Product / Service Master Data
              </div>

              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
                Edit product or service
              </h1>

              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                Update {item.item_name} for{" "}
                {organisationName}. Inventory
                products can be assigned to multiple
                operating or storage locations.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10 lg:px-8">
        <EditProductServiceForm
          organisationId={organisation.id}
          item={item}
          defaultCurrency={
            organisation.base_currency_code
          }
          incomeAccounts={
            incomeAccounts || []
          }
          expenseAccounts={
            expenseAccounts || []
          }
          taxAccounts={taxAccounts || []}
          inventoryAssetAccounts={
            inventoryAssetAccounts || []
          }
          costOfSalesAccounts={
            costOfSalesAccounts || []
          }
          locationOptions={locationOptions}
          selectedLocationIds={
            selectedLocationIds
          }
          existingReorderLevel={
            existingReorderLevel
          }
        />
      </section>
    </main>
  );
}