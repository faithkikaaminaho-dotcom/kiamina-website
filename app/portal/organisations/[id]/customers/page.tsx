import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Mail,
  Plus,
  Search,
  UserRound,
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

type CustomerRecord = {
  id: string;
  customer_name: string;
  customer_type: string | null;
  email: string | null;
  phone: string | null;
  currency_code: string | null;
  payment_terms: string | null;
  credit_limit: number | null;
  is_active: boolean | null;
  created_at: string | null;
};

function formatCustomerType(value: string | null) {
  if (!value) return "Not specified";

  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatMoney(currencyCode: string | null, amount: number | null) {
  if (amount === null || amount === undefined) return "Not set";

  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: currencyCode || "NGN",
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currencyCode || ""} ${amount.toLocaleString()}`.trim();
  }
}

export default async function CustomersPage({
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

  const { data: customers, error: customersError } = await supabase
    .from("customers")
    .select(
      "id, customer_name, customer_type, email, phone, currency_code, payment_terms, credit_limit, is_active, created_at"
    )
    .eq("organisation_id", id)
    .order("customer_name", { ascending: true });

  if (customersError) {
    throw new Error(customersError.message);
  }

  const customerRows = (customers || []) as CustomerRecord[];

  const activeCustomers = customerRows.filter(
    (customer) => customer.is_active !== false
  ).length;

  const inactiveCustomers = customerRows.length - activeCustomers;

  const organisationName =
    organisation.trading_name || organisation.legal_name || "Organisation";

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
                <UserRound className="h-6 w-6" />
              </div>

              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                  Sales
                </div>

                <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
                  Customers
                </h1>

                <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                  Manage customer master data for {organisationName}, including
                  billing details, currencies, receivable accounts, payment
                  terms and credit controls.
                </p>
              </div>
            </div>

            <Link
              href={`/portal/organisations/${organisation.id}/customers/new`}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#073D7F] px-6 py-3 text-sm font-semibold text-white"
            >
              <Plus className="h-4 w-4" />
              Create Customer
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="grid gap-5 md:grid-cols-3">
          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">
              Total Customers
            </div>
            <div className="mt-3 text-3xl font-semibold text-slate-950">
              {customerRows.length}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">
              Active Customers
            </div>
            <div className="mt-3 text-3xl font-semibold text-emerald-700">
              {activeCustomers}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">
              Inactive Customers
            </div>
            <div className="mt-3 text-3xl font-semibold text-slate-950">
              {inactiveCustomers}
            </div>
          </div>
        </div>

        <section className="mt-8 overflow-hidden rounded-[2rem] border border-[#D9E3F4] bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-[#D9E3F4] px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                Customer register
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Customer records available to sales invoices, receipts,
                statements and receivables reporting.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-[#D9E3F4] bg-[#F8FAFC] px-4 py-2 text-sm text-slate-500">
              <Search className="h-4 w-4" />
              Search and filters will follow
            </div>
          </div>

          {customerRows.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F8FAFC] text-[#073D7F]">
                <UserRound className="h-6 w-6" />
              </div>

              <h3 className="mt-5 text-lg font-semibold text-slate-950">
                No customers yet
              </h3>

              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
                Create the first customer for this organisation before creating
                sales invoices or customer receipts.
              </p>

              <Link
                href={`/portal/organisations/${organisation.id}/customers/new`}
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-[#073D7F] px-6 py-3 text-sm font-semibold text-white"
              >
                <Plus className="h-4 w-4" />
                Create Customer
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#D9E3F4]">
                <thead className="bg-[#F8FAFC]">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Customer
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Contact
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Currency
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Payment Terms
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Credit Limit
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#D9E3F4] bg-white">
                  {customerRows.map((customer) => (
                    <tr key={customer.id} className="hover:bg-[#F8FAFC]">
                      <td className="px-6 py-5">
                        <div className="flex items-start gap-3">
                          <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F1F1F1] text-[#073D7F]">
                            <Building2 className="h-4 w-4" />
                          </div>

                          <div>
                            <Link
  href={`/portal/organisations/${organisation.id}/customers/${customer.id}`}
  className="font-semibold text-[#073D7F] hover:underline"
>
  {customer.customer_name}
</Link>
                            <div className="mt-1 text-sm text-slate-500">
                              {formatCustomerType(customer.customer_type)}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-5 text-sm text-slate-600">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Mail className="h-3.5 w-3.5" />
                            {customer.email || "No email"}
                          </div>
                          <div>{customer.phone || "No phone"}</div>
                        </div>
                      </td>

                      <td className="px-6 py-5 text-sm font-semibold text-slate-700">
                        {customer.currency_code ||
                          organisation.base_currency_code ||
                          "—"}
                      </td>

                      <td className="px-6 py-5 text-sm text-slate-600">
                        {customer.payment_terms || "Not set"}
                      </td>

                      <td className="px-6 py-5 text-sm text-slate-600">
                        {formatMoney(
                          customer.currency_code ||
                            organisation.base_currency_code,
                          customer.credit_limit
                        )}
                      </td>

                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            customer.is_active !== false
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {customer.is_active !== false
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