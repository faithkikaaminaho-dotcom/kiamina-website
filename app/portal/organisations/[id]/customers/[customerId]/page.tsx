import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  Edit3,
  FileText,
  Mail,
  MapPin,
  Phone,
  Plus,
  ReceiptText,
  UserRound,
  WalletCards,
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

type InvoiceRecord = {
  id: string;
  invoice_number: string | null;
  invoice_date: string | null;
  due_date: string | null;
  currency_code: string | null;
  total_amount: number | null;
  balance_due: number | null;
  status: string | null;
};

type ReceiptRecord = {
  id: string;
  receipt_number: string | null;
  receipt_date: string | null;
  currency_code: string | null;
  amount_received: number | null;
  status: string | null;
};

function formatDate(value: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatMoney(currencyCode: string | null, amount: number | null) {
  return `${currencyCode || "—"} ${Number(amount || 0).toLocaleString(
    undefined,
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )}`;
}

function formatLabel(value: string | null) {
  if (!value) return "—";

  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string; customerId: string }>;
}) {
  const { id, customerId } = await params;
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

  const { data: customer } = await supabase
    .from("customers")
    .select("*")
    .eq("id", customerId)
    .eq("organisation_id", id)
    .single();

  if (!customer) {
    redirect(`/portal/organisations/${id}/customers`);
  }

  const { data: invoices } = await supabase
    .from("sales_invoices")
    .select(
      "id, invoice_number, invoice_date, due_date, currency_code, total_amount, balance_due, status"
    )
    .eq("organisation_id", id)
    .eq("customer_id", customerId)
    .order("invoice_date", { ascending: false })
    .limit(10);

  const { data: receipts } = await supabase
    .from("customer_receipts")
    .select(
      "id, receipt_number, receipt_date, currency_code, amount_received, status"
    )
    .eq("organisation_id", id)
    .eq("customer_id", customerId)
    .order("receipt_date", { ascending: false })
    .limit(10);

  let receivableAccount: {
    account_code: string | null;
    account_name: string | null;
  } | null = null;

  if (customer.receivable_account_id) {
    const { data: account } = await supabase
      .from("chart_of_accounts")
      .select("account_code, account_name")
      .eq("id", customer.receivable_account_id)
      .eq("organisation_id", id)
      .single();

    receivableAccount = account;
  }

  const invoiceRows = (invoices || []) as InvoiceRecord[];
  const receiptRows = (receipts || []) as ReceiptRecord[];

  const totalInvoiced = invoiceRows.reduce(
    (sum, invoice) => sum + Number(invoice.total_amount || 0),
    0
  );

  const outstandingBalance = invoiceRows.reduce(
    (sum, invoice) => sum + Number(invoice.balance_due || 0),
    0
  );

  const totalReceipts = receiptRows.reduce(
    (sum, receipt) => sum + Number(receipt.amount_received || 0),
    0
  );

  const customerCurrency =
    customer.currency_code || organisation.base_currency_code;

  const organisationName =
    organisation.trading_name || organisation.legal_name || "Organisation";

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <section className="border-b border-[#D9E3F4] bg-white">
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          <Link
            href={`/portal/organisations/${organisation.id}/customers`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#073D7F]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to customers
          </Link>

          <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-start gap-5">
              <div className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#F1F1F1] text-[#073D7F]">
                <UserRound className="h-6 w-6" />
              </div>

              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                  Customer Master Record
                </div>

                <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
                  {customer.customer_name}
                </h1>

                <p className="mt-3 text-sm text-slate-500">
                  {formatLabel(customer.customer_type)} customer for{" "}
                  {organisationName}
                </p>

                <span
                  className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                    customer.is_active !== false
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {customer.is_active !== false ? "Active" : "Inactive"}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href={`/portal/organisations/${id}/sales-invoices/new?customerId=${customerId}`}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#073D7F] px-5 py-3 text-sm font-semibold text-white"
              >
                <Plus className="h-4 w-4" />
                New Invoice
              </Link>

              <Link
                href={`/portal/organisations/${id}/customers/${customerId}/edit`}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#D9E3F4] bg-white px-5 py-3 text-sm font-semibold text-[#073D7F]"
              >
                <Edit3 className="h-4 w-4" />
                Edit Customer
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="grid gap-5 md:grid-cols-3">
          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">
              Total Invoiced
            </div>
            <div className="mt-3 text-2xl font-semibold text-slate-950">
              {formatMoney(customerCurrency, totalInvoiced)}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">
              Receipts Recorded
            </div>
            <div className="mt-3 text-2xl font-semibold text-emerald-700">
              {formatMoney(customerCurrency, totalReceipts)}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">
              Outstanding Balance
            </div>
            <div className="mt-3 text-2xl font-semibold text-[#073D7F]">
              {formatMoney(customerCurrency, outstandingBalance)}
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <section className="rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-950">
              Contact and billing
            </h2>

            <div className="mt-6 space-y-5 text-sm text-slate-600">
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 text-[#073D7F]" />
                <div>
                  <div className="font-semibold text-slate-950">Email</div>
                  <div className="mt-1">{customer.email || "Not provided"}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 text-[#073D7F]" />
                <div>
                  <div className="font-semibold text-slate-950">Phone</div>
                  <div className="mt-1">{customer.phone || "Not provided"}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 text-[#073D7F]" />
                <div>
                  <div className="font-semibold text-slate-950">
                    Billing address
                  </div>
                  <div className="mt-1 whitespace-pre-line">
                    {customer.billing_address || "Not provided"}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-950">
              Credit and accounting
            </h2>

            <dl className="mt-6 grid gap-5 text-sm sm:grid-cols-2">
              <div>
                <dt className="font-semibold text-slate-950">Currency</dt>
                <dd className="mt-1 text-slate-600">{customerCurrency || "—"}</dd>
              </div>

              <div>
                <dt className="font-semibold text-slate-950">Payment terms</dt>
                <dd className="mt-1 text-slate-600">
                  {customer.payment_terms || "Not set"}
                </dd>
              </div>

              <div>
                <dt className="font-semibold text-slate-950">Credit limit</dt>
                <dd className="mt-1 text-slate-600">
                  {customer.credit_limit === null
                    ? "Not set"
                    : formatMoney(customerCurrency, customer.credit_limit)}
                </dd>
              </div>

              <div>
                <dt className="font-semibold text-slate-950">
                  Receivable account
                </dt>
                <dd className="mt-1 text-slate-600">
                  {receivableAccount
                    ? `${receivableAccount.account_code || "No code"} - ${
                        receivableAccount.account_name || "Unnamed account"
                      }`
                    : "Not selected"}
                </dd>
              </div>

              <div>
                <dt className="font-semibold text-slate-950">Tax ID</dt>
                <dd className="mt-1 text-slate-600">
                  {customer.tax_identification_number || "Not provided"}
                </dd>
              </div>

              <div>
                <dt className="font-semibold text-slate-950">
                  Registration number
                </dt>
                <dd className="mt-1 text-slate-600">
                  {customer.registration_number || "Not provided"}
                </dd>
              </div>
            </dl>

            <div className="mt-6 rounded-2xl bg-[#F8FAFC] p-5 text-sm">
              <div className="font-semibold text-slate-950">Notes</div>
              <div className="mt-2 whitespace-pre-line leading-7 text-slate-600">
                {customer.notes || "No customer notes recorded."}
              </div>
            </div>
          </section>
        </div>

        <section className="mt-8 overflow-hidden rounded-[2rem] border border-[#D9E3F4] bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-[#D9E3F4] px-6 py-5">
            <ReceiptText className="h-5 w-5 text-[#073D7F]" />
            <h2 className="text-lg font-semibold text-slate-950">
              Recent sales invoices
            </h2>
          </div>

          {invoiceRows.length === 0 ? (
            <div className="px-6 py-10 text-sm text-slate-500">
              No sales invoices have been created for this customer.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#D9E3F4]">
                <thead className="bg-[#F8FAFC]">
                  <tr>
                    {[
                      "Invoice",
                      "Invoice Date",
                      "Due Date",
                      "Total",
                      "Balance",
                      "Status",
                      "",
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

                <tbody className="divide-y divide-[#D9E3F4]">
                  {invoiceRows.map((invoice) => (
                    <tr key={invoice.id}>
                      <td className="px-6 py-5 text-sm font-semibold text-slate-950">
                        {invoice.invoice_number || "Draft invoice"}
                      </td>
                      <td className="px-6 py-5 text-sm text-slate-600">
                        {formatDate(invoice.invoice_date)}
                      </td>
                      <td className="px-6 py-5 text-sm text-slate-600">
                        {formatDate(invoice.due_date)}
                      </td>
                      <td className="px-6 py-5 text-sm text-slate-600">
                        {formatMoney(
                          invoice.currency_code,
                          invoice.total_amount
                        )}
                      </td>
                      <td className="px-6 py-5 text-sm font-semibold text-[#073D7F]">
                        {formatMoney(invoice.currency_code, invoice.balance_due)}
                      </td>
                      <td className="px-6 py-5 text-sm text-slate-600">
                        {formatLabel(invoice.status)}
                      </td>
                      <td className="px-6 py-5">
                        <Link
                          href={`/portal/organisations/${id}/sales-invoices/${invoice.id}`}
                          className="text-sm font-semibold text-[#073D7F]"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="mt-8 overflow-hidden rounded-[2rem] border border-[#D9E3F4] bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-[#D9E3F4] px-6 py-5">
            <WalletCards className="h-5 w-5 text-[#073D7F]" />
            <h2 className="text-lg font-semibold text-slate-950">
              Recent customer receipts
            </h2>
          </div>

          {receiptRows.length === 0 ? (
            <div className="px-6 py-10 text-sm text-slate-500">
              No customer receipts have been recorded for this customer.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#D9E3F4]">
                <thead className="bg-[#F8FAFC]">
                  <tr>
                    {["Receipt", "Date", "Amount", "Status", ""].map(
                      (heading) => (
                        <th
                          key={heading}
                          className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500"
                        >
                          {heading}
                        </th>
                      )
                    )}
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#D9E3F4]">
                  {receiptRows.map((receipt) => (
                    <tr key={receipt.id}>
                      <td className="px-6 py-5 text-sm font-semibold text-slate-950">
                        {receipt.receipt_number || "Draft receipt"}
                      </td>
                      <td className="px-6 py-5 text-sm text-slate-600">
                        {formatDate(receipt.receipt_date)}
                      </td>
                      <td className="px-6 py-5 text-sm text-slate-600">
                        {formatMoney(
                          receipt.currency_code,
                          receipt.amount_received
                        )}
                      </td>
                      <td className="px-6 py-5 text-sm text-slate-600">
                        {formatLabel(receipt.status)}
                      </td>
                      <td className="px-6 py-5">
                        <Link
                          href={`/portal/organisations/${id}/customer-receipts/${receipt.id}`}
                          className="text-sm font-semibold text-[#073D7F]"
                        >
                          View
                        </Link>
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