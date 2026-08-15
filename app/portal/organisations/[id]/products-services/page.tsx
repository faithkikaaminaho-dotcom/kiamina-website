import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  Boxes,
  MapPinned,
  Plus,
  Search,
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

type ProductServiceRecord = {
  id: string;
  item_name: string;
  item_type: string | null;
  sku: string | null;
  description: string | null;
  unit_price: number | null;
  currency_code: string | null;
  income_account_id: string | null;
  expense_account_id: string | null;
  tax_account_id: string | null;
  tax_relevant: boolean | null;
  taxable: boolean | null;
  is_active: boolean | null;
};

type AccountRecord = {
  id: string;
  account_code: string | null;
  account_name: string | null;
};

function formatLabel(value: string | null) {
  if (!value) return "—";

  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatMoney(currencyCode: string | null, amount: number | null) {
  if (amount === null || amount === undefined) {
    return "Not set";
  }

  return `${currencyCode || "—"} ${Number(amount).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatAccount(account?: AccountRecord) {
  if (!account) return "Not selected";

  return `${account.account_code || "No code"} - ${
    account.account_name || "Unnamed account"
  }`;
}

export default async function ProductsServicesPage({
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

  if (!profile || !internalRoles.includes(profile.role)) {
    redirect("/portal");
  }

  const { data: organisation } = await supabase
    .from("organisations")
    .select("id, legal_name, trading_name, base_currency_code")
    .eq("id", id)
    .single();

  if (!organisation) {
    redirect("/portal/organisations");
  }

  const { data: items, error: itemsError } = await supabase
    .from("products_services")
    .select(
      "id, item_name, item_type, sku, description, unit_price, currency_code, income_account_id, expense_account_id, tax_account_id, tax_relevant, taxable, is_active"
    )
    .eq("organisation_id", id)
    .order("item_name", { ascending: true });

  if (itemsError) {
    throw new Error(itemsError.message);
  }

  const itemRows = (items || []) as ProductServiceRecord[];

  const accountIds = Array.from(
    new Set(
      itemRows
        .flatMap((item) => [
          item.income_account_id,
          item.expense_account_id,
          item.tax_account_id,
        ])
        .filter((accountId): accountId is string => Boolean(accountId))
    )
  );

  let accounts: AccountRecord[] = [];

  if (accountIds.length > 0) {
    const { data: accountRows } = await supabase
      .from("chart_of_accounts")
      .select("id, account_code, account_name")
      .eq("organisation_id", id)
      .in("id", accountIds);

    accounts = (accountRows || []) as AccountRecord[];
  }

  const accountMap = new Map(
    accounts.map((account) => [account.id, account])
  );

  const activeItems = itemRows.filter(
    (item) => item.is_active !== false
  ).length;

  const serviceCount = itemRows.filter(
    (item) => item.item_type === "SERVICE"
  ).length;

  const productCount = itemRows.filter(
    (item) => item.item_type === "PRODUCT"
  ).length;

  const organisationName =
    organisation.trading_name ||
    organisation.legal_name ||
    "Organisation";

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <section className="border-b border-[#D9E3F4] bg-white">
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          <Link
            href={`/portal/organisations/${organisation.id}`}
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
                  Sales and Purchases
                </div>

                <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
                  Products / Services
                </h1>

                <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                  Manage reusable products and services for {organisationName}.
                  Items support sales invoices, purchase bills, account mapping,
                  tax treatment and reporting. Products are created once for the
                  organisation and can then be activated at one or more locations.
                </p>
              </div>
            </div>

            <Link
              href={`/portal/organisations/${organisation.id}/products-services/new`}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#073D7F] px-6 py-3 text-sm font-semibold text-white"
            >
              <Plus className="h-4 w-4" />
              Create Product / Service
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="mb-8 rounded-[1.5rem] border border-[#BCD2F3] bg-blue-50 p-6">
          <div className="flex items-start gap-4">
            <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#073D7F]">
              <MapPinned className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-semibold text-slate-950">
                Organisation-wide products, location-level inventory
              </h2>

              <p className="mt-2 max-w-4xl text-sm leading-7 text-slate-600">
                Create each product only once. Use Manage locations to activate
                that existing product at Abuja or any other permitted location,
                and maintain quantities separately for each location.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-4">
          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">
              Total Items
            </div>
            <div className="mt-3 text-3xl font-semibold text-slate-950">
              {itemRows.length}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">
              Active Items
            </div>
            <div className="mt-3 text-3xl font-semibold text-emerald-700">
              {activeItems}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">
              Services
            </div>
            <div className="mt-3 text-3xl font-semibold text-slate-950">
              {serviceCount}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">
              Products
            </div>
            <div className="mt-3 text-3xl font-semibold text-slate-950">
              {productCount}
            </div>
          </div>
        </div>

        <section className="mt-8 overflow-hidden rounded-[2rem] border border-[#D9E3F4] bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-[#D9E3F4] px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                Product and service register
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Reusable item records and their default accounting treatment.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-[#D9E3F4] bg-[#F8FAFC] px-4 py-2 text-sm text-slate-500">
              <Search className="h-4 w-4" />
              Search and filters will follow
            </div>
          </div>

          {itemRows.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F8FAFC] text-[#073D7F]">
                <Boxes className="h-6 w-6" />
              </div>

              <h3 className="mt-5 text-lg font-semibold text-slate-950">
                No products or services yet
              </h3>

              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
                Create the first reusable product or service for sales invoices
                and purchase bills.
              </p>

              <Link
                href={`/portal/organisations/${organisation.id}/products-services/new`}
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-[#073D7F] px-6 py-3 text-sm font-semibold text-white"
              >
                <Plus className="h-4 w-4" />
                Create Product / Service
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#D9E3F4]">
                <thead className="bg-[#F8FAFC]">
                  <tr>
                    {[
                      "Item",
                      "Type",
                      "Price",
                      "Income Account",
                      "Expense Account",
                      "Tax",
                      "Locations",
                      "Status",
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#D9E3F4] bg-white">
                  {itemRows.map((item) => (
                    <tr key={item.id} className="hover:bg-[#F8FAFC]">
                      <td className="px-6 py-5">
                        <Link
                          href={`/portal/organisations/${organisation.id}/products-services/${item.id}`}
                          className="font-semibold text-[#073D7F] hover:underline"
                        >
                          {item.item_name}
                        </Link>

                        <div className="mt-1 text-sm text-slate-500">
                          {item.sku || "No SKU / code"}
                        </div>

                        {item.description ? (
                          <div className="mt-2 max-w-sm truncate text-sm text-slate-500">
                            {item.description}
                          </div>
                        ) : null}
                      </td>

                      <td className="px-6 py-5 text-sm text-slate-600">
                        {formatLabel(item.item_type)}
                      </td>

                      <td className="px-6 py-5 text-sm font-semibold text-slate-700">
                        {formatMoney(
                          item.currency_code ||
                            organisation.base_currency_code,
                          item.unit_price
                        )}
                      </td>

                      <td className="min-w-[220px] px-6 py-5 text-sm text-slate-600">
                        {formatAccount(
                          accountMap.get(item.income_account_id || "")
                        )}
                      </td>

                      <td className="min-w-[220px] px-6 py-5 text-sm text-slate-600">
                        {formatAccount(
                          accountMap.get(item.expense_account_id || "")
                        )}
                      </td>

                      <td className="px-6 py-5 text-sm text-slate-600">
                        {item.taxable
                          ? "Taxable"
                          : item.tax_relevant
                            ? "Tax relevant"
                            : "Not taxable"}
                      </td>

                      <td className="min-w-[170px] px-6 py-5">
                        {item.item_type === "PRODUCT" ? (
                          <Link
                            href={`/portal/organisations/${organisation.id}/products-services/${item.id}/locations`}
                            className="inline-flex items-center gap-2 text-sm font-semibold text-[#073D7F] hover:underline"
                          >
                            <MapPinned className="h-4 w-4" />
                            Manage locations
                          </Link>
                        ) : (
                          <span className="text-sm text-slate-400">
                            Not applicable
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            item.is_active !== false
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {item.is_active !== false
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
