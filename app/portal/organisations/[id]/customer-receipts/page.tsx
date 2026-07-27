import { redirect } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  Plus,
  Search,
  Eye,
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
  "COMPLIANCE_ADMIN",
  "OPERATIONS_ADMIN",
];

type CustomerReceiptRow = {
  id: string;
  receipt_number: string | null;
  customer_id: string | null;
  sales_invoice_id: string | null;
  receipt_date: string | null;
  currency_code: string | null;
  amount_received: number | null;
  bank_charges: number | null;
  net_amount: number | null;
  payment_method: string | null;
  reference_number: string | null;
  status: string | null;
  created_at: string | null;
};

type CustomerRow = {
  id: string;
  customer_name: string | null;
};

type InvoiceRow = {
  id: string;
  invoice_number: string | null;
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
  const numericAmount = Number(amount || 0);

  return `${currencyCode || "—"} ${numericAmount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatStatus(status: string | null) {
  if (!status) return "Draft";

  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatMethod(method: string | null) {
  if (!method) return "—";

  return method
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default async function CustomerReceiptsPage({
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

  const { data: receipts } = await supabase
    .from("customer_receipts")
    .select(
      "id, receipt_number, customer_id, sales_invoice_id, receipt_date, currency_code, amount_received, bank_charges, net_amount, payment_method, reference_number, status, created_at"
    )
    .eq("organisation_id", id)
    .order("receipt_date", { ascending: false })
    .order("created_at", { ascending: false });

  const { data: customers } = await supabase
    .from("customers")
    .select("id, customer_name")
    .eq("organisation_id", id)
    .order("customer_name", { ascending: true });

  const { data: invoices } = await supabase
    .from("sales_invoices")
    .select("id, invoice_number")
    .eq("organisation_id", id)
    .order("created_at", { ascending: false });

  const receiptRows = (receipts || []) as CustomerReceiptRow[];
  const customerRows = (customers || []) as CustomerRow[];
  const invoiceRows = (invoices || []) as InvoiceRow[];

  const customerMap = new Map(
    customerRows.map((customer) => [customer.id, customer.customer_name])
  );

  const invoiceMap = new Map(
    invoiceRows.map((invoice) => [invoice.id, invoice.invoice_number])
  );

  const organisationName =
    organisation.trading_name || organisation.legal_name || "Organisation";

  const totalReceived = receiptRows.reduce(
    (sum, receipt) => sum + Number(receipt.amount_received || 0),
    0
  );

  const totalBankCharges = receiptRows.reduce(
    (sum, receipt) => sum + Number(receipt.bank_charges || 0),
    0
  );

  const totalNetAmount = receiptRows.reduce(
    (sum, receipt) => sum + Number(receipt.net_amount || 0),
    0
  );

  const draftCount = receiptRows.filter(
    (receipt) => (receipt.status || "DRAFT") === "DRAFT"
  ).length;

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <section className="border-b border-[#D9E3F4] bg-white">
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          <a
            href={`/portal/organisations/${organisation.id}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#073D7F]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to organisation workspace
          </a>

          <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-5">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F1F1F1] text-[#073D7F]">
                <WalletCards className="h-6 w-6" />
              </div>

              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                  Customer Receipts
                </div>

                <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
                  Customer receipts
                </h1>

                <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                  Review draft and recorded customer receipts for{" "}
                  {organisationName}. These support cash receipt tracking,
                  receivables settlement, customer statements, bank
                  reconciliation, management reporting, and later posting
                  workflows.
                </p>
              </div>
            </div>

            <a
              href={`/portal/organisations/${organisation.id}/customer-receipts/new`}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#073D7F] px-6 py-3 text-sm font-semibold text-white shadow-sm"
            >
              <Plus className="h-4 w-4" />
              New Receipt
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="grid gap-5 md:grid-cols-4">
          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">
              Total Receipts
            </div>
            <div className="mt-3 text-3xl font-semibold text-slate-950">
              {receiptRows.length}
            </div>
            <p className="mt-2 text-sm text-slate-500">
              All customer receipts recorded.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">
              Draft Receipts
            </div>
            <div className="mt-3 text-3xl font-semibold text-slate-950">
              {draftCount}
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Not yet posted to the ledger.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">
              Amount Received
            </div>
            <div className="mt-3 text-3xl font-semibold text-slate-950">
              {formatMoney(
                organisation.base_currency_code,
                Number(totalReceived.toFixed(2))
              )}
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Gross amount received.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">
              Net Receipts
            </div>
            <div className="mt-3 text-3xl font-semibold text-slate-950">
              {formatMoney(
                organisation.base_currency_code,
                Number(totalNetAmount.toFixed(2))
              )}
            </div>
            <p className="mt-2 text-sm text-slate-500">
              After bank charges of{" "}
              {formatMoney(
                organisation.base_currency_code,
                Number(totalBankCharges.toFixed(2))
              )}
              .
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-[2rem] border border-[#D9E3F4] bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-[#D9E3F4] px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                Receipt register
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                A working register of customer receipts created for this
                organisation.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-[#D9E3F4] bg-[#F8FAFC] px-4 py-2 text-sm text-slate-500">
              <Search className="h-4 w-4" />
              Search and filters will be added later
            </div>
          </div>

          {receiptRows.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F8FAFC] text-[#073D7F]">
                <FileText className="h-6 w-6" />
              </div>

              <h3 className="mt-5 text-lg font-semibold text-slate-950">
                No customer receipts yet
              </h3>

              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
                Create the first draft customer receipt for this organisation.
                It will appear here for review before future posting, bank
                reconciliation, and reporting workflows.
              </p>

              <a
                href={`/portal/organisations/${organisation.id}/customer-receipts/new`}
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-[#073D7F] px-6 py-3 text-sm font-semibold text-white"
              >
                <Plus className="h-4 w-4" />
                Create Customer Receipt
              </a>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#D9E3F4]">
                <thead className="bg-[#F8FAFC]">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Receipt
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Customer
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Linked Invoice
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Receipt Date
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Net Amount
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Method
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Status
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#D9E3F4] bg-white">
                  {receiptRows.map((receipt) => (
                    <tr key={receipt.id} className="hover:bg-[#F8FAFC]">
                      <td className="whitespace-nowrap px-6 py-5">
                        <div className="font-semibold text-slate-950">
                          {receipt.receipt_number || "Untitled receipt"}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          Ref: {receipt.reference_number || "Not provided"}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          Created {formatDate(receipt.created_at)}
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-6 py-5 text-sm text-slate-600">
                        {customerMap.get(receipt.customer_id || "") ||
                          "No customer"}
                      </td>

                      <td className="whitespace-nowrap px-6 py-5 text-sm text-slate-600">
                        {invoiceMap.get(receipt.sales_invoice_id || "") ||
                          "Not linked"}
                      </td>

                      <td className="whitespace-nowrap px-6 py-5 text-sm text-slate-600">
                        {formatDate(receipt.receipt_date)}
                      </td>

                      <td className="whitespace-nowrap px-6 py-5 text-right text-sm font-semibold text-slate-950">
                        {formatMoney(
                          receipt.currency_code,
                          receipt.amount_received
                        )}
                      </td>

                      <td className="whitespace-nowrap px-6 py-5 text-right text-sm font-semibold text-slate-950">
                        {formatMoney(receipt.currency_code, receipt.net_amount)}
                      </td>

                      <td className="whitespace-nowrap px-6 py-5 text-sm text-slate-600">
                        {formatMethod(receipt.payment_method)}
                      </td>

                      <td className="whitespace-nowrap px-6 py-5">
                        <span className="inline-flex rounded-full bg-[#F1F1F1] px-3 py-1 text-xs font-semibold text-[#073D7F]">
                          {formatStatus(receipt.status)}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-6 py-5 text-right">
                        <button
                          type="button"
                          disabled
                          className="inline-flex cursor-not-allowed items-center gap-2 rounded-full border border-[#D9E3F4] bg-white px-4 py-2 text-xs font-semibold text-slate-400"
                        >
                          <Eye className="h-4 w-4" />
                          View later
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-6 rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 text-sm leading-7 text-slate-600 shadow-sm">
          <span className="font-semibold text-slate-950">Control note:</span>{" "}
          These customer receipts are draft operational records. They do not
          affect the ledger, receivables, customer statements, or bank balances
          until Kiamina adds posting, review, approval, and audit trail controls.
        </div>
      </section>
    </main>
  );
}