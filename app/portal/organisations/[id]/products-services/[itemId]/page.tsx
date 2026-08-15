import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  Boxes,
  Edit3,
  ReceiptText,
  ShoppingCart,
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

type AccountRecord = {
  id: string;
  account_code: string | null;
  account_name: string | null;
};

type SalesLineRecord = {
  sales_invoice_id: string;
  quantity: number | null;
  line_total: number | null;
};

type PurchaseLineRecord = {
  purchase_bill_id: string;
  quantity: number | null;
  line_total: number | null;
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

export default async function ProductServiceDetailPage({
  params,
}: {
  params: Promise<{ id: string; itemId: string }>;
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

  const { data: item } = await supabase
    .from("products_services")
    .select("*")
    .eq("id", itemId)
    .eq("organisation_id", id)
    .single();

  if (!item) {
    redirect(`/portal/organisations/${id}/products-services`);
  }

  const accountIds = [
    item.income_account_id,
    item.expense_account_id,
    item.tax_account_id,
  ].filter((accountId): accountId is string => Boolean(accountId));

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

  const { data: salesLines } = await supabase
    .from("sales_invoice_lines")
    .select("sales_invoice_id, quantity, line_total")
    .eq("organisation_id", id)
    .eq("product_service_id", itemId);

  const { data: purchaseLines } = await supabase
    .from("purchase_bill_lines")
    .select("purchase_bill_id, quantity, line_total")
    .eq("organisation_id", id)
    .eq("product_service_id", itemId);

  const salesLineRows = (salesLines || []) as SalesLineRecord[];
  const purchaseLineRows = (purchaseLines || []) as PurchaseLineRecord[];

  const salesInvoiceIds = Array.from(
    new Set(salesLineRows.map((line) => line.sales_invoice_id))
  );

  const purchaseBillIds = Array.from(
    new Set(purchaseLineRows.map((line) => line.purchase_bill_id))
  );

  const totalSalesQuantity = salesLineRows.reduce(
    (sum, line) => sum + Number(line.quantity || 0),
    0
  );

  const totalSalesValue = salesLineRows.reduce(
    (sum, line) => sum + Number(line.line_total || 0),
    0
  );

  const totalPurchaseQuantity = purchaseLineRows.reduce(
    (sum, line) => sum + Number(line.quantity || 0),
    0
  );

  const totalPurchaseValue = purchaseLineRows.reduce(
    (sum, line) => sum + Number(line.line_total || 0),
    0
  );

  const itemCurrency =
    item.currency_code || organisation.base_currency_code || null;

  const organisationName =
    organisation.trading_name ||
    organisation.legal_name ||
    "Organisation";

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <section className="border-b border-[#D9E3F4] bg-white">
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          <Link
            href={`/portal/organisations/${id}/products-services`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#073D7F]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to products and services
          </Link>

          <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-start gap-5">
              <div className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#F1F1F1] text-[#073D7F]">
                <Boxes className="h-6 w-6" />
              </div>

              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                  Product / Service Master Record
                </div>

                <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
                  {item.item_name}
                </h1>

                <p className="mt-3 text-sm text-slate-500">
                  {formatLabel(item.item_type)} for {organisationName}
                  {item.sku ? ` • ${item.sku}` : ""}
                </p>

                <span
                  className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                    item.is_active !== false
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {item.is_active !== false ? "Active" : "Inactive"}
                </span>
              </div>
            </div>

            <Link
              href={`/portal/organisations/${id}/products-services/${itemId}/edit`}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[#D9E3F4] bg-white px-5 py-3 text-sm font-semibold text-[#073D7F]"
            >
              <Edit3 className="h-4 w-4" />
              Edit Product / Service
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="grid gap-5 md:grid-cols-4">
          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">
              Default Unit Price
            </div>
            <div className="mt-3 text-2xl font-semibold text-slate-950">
              {formatMoney(itemCurrency, item.unit_price)}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">
              Sales Invoices
            </div>
            <div className="mt-3 text-3xl font-semibold text-[#073D7F]">
              {salesInvoiceIds.length}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">
              Purchase Bills
            </div>
            <div className="mt-3 text-3xl font-semibold text-[#073D7F]">
              {purchaseBillIds.length}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">
              Tax Treatment
            </div>
            <div className="mt-3 text-lg font-semibold text-slate-950">
              {item.taxable
                ? "Taxable"
                : item.tax_relevant
                  ? "Tax relevant"
                  : "Not taxable"}
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <section className="rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-950">
              Item information
            </h2>

            <dl className="mt-6 grid gap-5 text-sm sm:grid-cols-2">
              <div>
                <dt className="font-semibold text-slate-950">Item type</dt>
                <dd className="mt-1 text-slate-600">
                  {formatLabel(item.item_type)}
                </dd>
              </div>

              <div>
                <dt className="font-semibold text-slate-950">SKU / Code</dt>
                <dd className="mt-1 text-slate-600">
                  {item.sku || "Not assigned"}
                </dd>
              </div>

              <div>
                <dt className="font-semibold text-slate-950">Currency</dt>
                <dd className="mt-1 text-slate-600">
                  {itemCurrency || "Not selected"}
                </dd>
              </div>

              <div>
                <dt className="font-semibold text-slate-950">Unit price</dt>
                <dd className="mt-1 text-slate-600">
                  {formatMoney(itemCurrency, item.unit_price)}
                </dd>
              </div>
            </dl>

            <div className="mt-6 rounded-2xl bg-[#F8FAFC] p-5 text-sm">
              <div className="font-semibold text-slate-950">Description</div>
              <div className="mt-2 whitespace-pre-line leading-7 text-slate-600">
                {item.description || "No description recorded."}
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-950">
              Default accounting mappings
            </h2>

            <dl className="mt-6 space-y-5 text-sm">
              <div>
                <dt className="font-semibold text-slate-950">
                  Income account
                </dt>
                <dd className="mt-1 text-slate-600">
                  {formatAccount(
                    accountMap.get(item.income_account_id || "")
                  )}
                </dd>
              </div>

              <div>
                <dt className="font-semibold text-slate-950">
                  Expense account
                </dt>
                <dd className="mt-1 text-slate-600">
                  {formatAccount(
                    accountMap.get(item.expense_account_id || "")
                  )}
                </dd>
              </div>

              <div>
                <dt className="font-semibold text-slate-950">Tax account</dt>
                <dd className="mt-1 text-slate-600">
                  {formatAccount(
                    accountMap.get(item.tax_account_id || "")
                  )}
                </dd>
              </div>
            </dl>
          </section>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <section className="rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm">
            <div className="flex items-center gap-3">
              <ReceiptText className="h-5 w-5 text-[#073D7F]" />
              <h2 className="text-lg font-semibold text-slate-950">
                Sales usage
              </h2>
            </div>

            <dl className="mt-6 grid gap-5 text-sm sm:grid-cols-3">
              <div>
                <dt className="font-semibold text-slate-500">Invoices</dt>
                <dd className="mt-2 text-xl font-semibold text-slate-950">
                  {salesInvoiceIds.length}
                </dd>
              </div>

              <div>
                <dt className="font-semibold text-slate-500">
                  Quantity
                </dt>
                <dd className="mt-2 text-xl font-semibold text-slate-950">
                  {totalSalesQuantity.toLocaleString()}
                </dd>
              </div>

              <div>
                <dt className="font-semibold text-slate-500">Value</dt>
                <dd className="mt-2 text-xl font-semibold text-slate-950">
                  {formatMoney(itemCurrency, totalSalesValue)}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm">
            <div className="flex items-center gap-3">
              <ShoppingCart className="h-5 w-5 text-[#073D7F]" />
              <h2 className="text-lg font-semibold text-slate-950">
                Purchase usage
              </h2>
            </div>

            <dl className="mt-6 grid gap-5 text-sm sm:grid-cols-3">
              <div>
                <dt className="font-semibold text-slate-500">Bills</dt>
                <dd className="mt-2 text-xl font-semibold text-slate-950">
                  {purchaseBillIds.length}
                </dd>
              </div>

              <div>
                <dt className="font-semibold text-slate-500">
                  Quantity
                </dt>
                <dd className="mt-2 text-xl font-semibold text-slate-950">
                  {totalPurchaseQuantity.toLocaleString()}
                </dd>
              </div>

              <div>
                <dt className="font-semibold text-slate-500">Value</dt>
                <dd className="mt-2 text-xl font-semibold text-slate-950">
                  {formatMoney(itemCurrency, totalPurchaseValue)}
                </dd>
              </div>
            </dl>
          </section>
        </div>
      </section>
    </main>
  );
}