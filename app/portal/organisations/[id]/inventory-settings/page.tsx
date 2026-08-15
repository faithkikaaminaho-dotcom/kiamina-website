import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  Boxes,
  MapPinned,
  ShieldCheck,
} from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import InventorySettingsForm from "./InventorySettingsForm";

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

type InventorySettings = {
  inventory_tracking_enabled: boolean | null;
  inventory_valuation_method: string | null;

  default_inventory_asset_account_id:
    | string
    | null;

  default_cost_of_sales_account_id:
    | string
    | null;

  inventory_adjustment_account_id:
    | string
    | null;

  inventory_write_off_account_id:
    | string
    | null;

  allow_negative_inventory: boolean | null;

  require_inventory_count_approval:
    | boolean
    | null;
};

const defaultSettings: InventorySettings = {
  inventory_tracking_enabled: false,

  inventory_valuation_method:
    "WEIGHTED_AVERAGE",

  default_inventory_asset_account_id:
    null,

  default_cost_of_sales_account_id:
    null,

  inventory_adjustment_account_id:
    null,

  inventory_write_off_account_id:
    null,

  allow_negative_inventory: false,

  require_inventory_count_approval: true,
};

export default async function InventorySettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  const {
    data: inventorySettings,
    error: inventorySettingsError,
  } = await supabase
    .from("organisation_inventory_settings")
    .select(
      `
        inventory_tracking_enabled,
        inventory_valuation_method,
        default_inventory_asset_account_id,
        default_cost_of_sales_account_id,
        inventory_adjustment_account_id,
        inventory_write_off_account_id,
        allow_negative_inventory,
        require_inventory_count_approval
      `
    )
    .eq("organisation_id", id)
    .maybeSingle();

  if (inventorySettingsError) {
    throw new Error(
      inventorySettingsError.message
    );
  }

  const { data: assetAccounts } =
    await supabase
      .from("chart_of_accounts")
      .select(
        "id, account_code, account_name"
      )
      .eq("organisation_id", id)
      .eq("is_active", true)
      .eq("account_type", "ASSET")
      .order("account_code", {
        ascending: true,
      });

  const { data: expenseAccounts } =
    await supabase
      .from("chart_of_accounts")
      .select(
        "id, account_code, account_name, account_subtype"
      )
      .eq("organisation_id", id)
      .eq("is_active", true)
      .eq("account_type", "EXPENSE")
      .order("account_code", {
        ascending: true,
      });

  const allExpenseAccounts =
    expenseAccounts || [];

  const costOfSalesAccounts =
    allExpenseAccounts.filter(
      (account) =>
        account.account_subtype ===
          "COST_OF_SALES" ||
        String(
          account.account_name || ""
        )
          .toLowerCase()
          .includes("cost of sales") ||
        String(
          account.account_name || ""
        )
          .toLowerCase()
          .includes("cost of goods")
    );

  const resolvedCostOfSalesAccounts =
    costOfSalesAccounts.length > 0
      ? costOfSalesAccounts
      : allExpenseAccounts;

  const organisationName =
    organisation.trading_name ||
    organisation.legal_name ||
    "Organisation";

  const settings = {
    ...defaultSettings,
    ...(inventorySettings || {}),
  } as InventorySettings;

  const { count: locationCount } =
    await supabase
      .from("tracking_options")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("organisation_id", id)
      .eq("is_active", true);

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <section className="border-b border-[#D9E3F4] bg-white">
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          <Link
            href={`/portal/organisations/${id}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#073D7F]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to organisation workspace
          </Link>

          <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-start gap-5">
              <div className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#F1F1F1] text-[#073D7F]">
                <Boxes className="h-6 w-6" />
              </div>

              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                  Core Accounting Setup
                </div>

                <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
                  Inventory Settings
                </h1>

                <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                  Configure organisation-wide
                  inventory accounting policies for{" "}
                  {organisationName}. These settings
                  apply across inventory products and
                  locations.
                </p>
              </div>
            </div>

            <span
              className={`inline-flex rounded-full px-4 py-2 text-sm font-semibold ${
                settings.inventory_tracking_enabled
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {settings.inventory_tracking_enabled
                ? "Inventory Enabled"
                : "Inventory Disabled"}
            </span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="mb-8 grid gap-5 md:grid-cols-3">
          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Boxes className="h-5 w-5 text-[#073D7F]" />

              <div className="text-sm font-semibold text-slate-500">
                Inventory Status
              </div>
            </div>

            <div className="mt-3 text-xl font-semibold text-slate-950">
              {settings.inventory_tracking_enabled
                ? "Enabled"
                : "Disabled"}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-[#073D7F]" />

              <div className="text-sm font-semibold text-slate-500">
                Valuation Method
              </div>
            </div>

            <div className="mt-3 text-xl font-semibold text-slate-950">
              {settings.inventory_valuation_method ===
              "FIFO"
                ? "FIFO"
                : settings.inventory_valuation_method ===
                    "SPECIFIC_IDENTIFICATION"
                  ? "Specific Identification"
                  : "Weighted Average"}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <MapPinned className="h-5 w-5 text-[#073D7F]" />

              <div className="text-sm font-semibold text-slate-500">
                Active Tracking Options
              </div>
            </div>

            <div className="mt-3 text-3xl font-semibold text-slate-950">
              {locationCount || 0}
            </div>

            <p className="mt-2 text-xs leading-5 text-slate-500">
              Inventory products will use active
              Location tracking options.
            </p>
          </div>
        </div>

        <InventorySettingsForm
          organisationId={organisation.id}
          settings={settings}
          inventoryAssetAccounts={
            assetAccounts || []
          }
          costOfSalesAccounts={
            resolvedCostOfSalesAccounts
          }
          adjustmentAccounts={
            allExpenseAccounts
          }
          writeOffAccounts={
            allExpenseAccounts
          }
        />
      </section>
    </main>
  );
}