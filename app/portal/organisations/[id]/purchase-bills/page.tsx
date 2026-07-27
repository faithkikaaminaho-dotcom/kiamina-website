import { redirect } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  Plus,
  Search,
  Eye,
  ReceiptText,
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

type PurchaseBillRow = {
  id: string;
  bill_number: string | null;
  supplier_invoice_number: string | null;
  supplier_id: string | null;
  bill_date: string | null;
  due_date: string | null;
  currency_code: string | null;
  total_amount: number | null;
  balance_due: number | null;
  status: string | null;
  created_at: string | null;
};

type SupplierRow = {
  id: string;
  supplier_name: string | null;
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

export default async function PurchaseBillsPage({
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

  const { data: bills } = await supabase
    .from("purchase_bills")
    .select(
      "id, bill_number, supplier_invoice_number, supplier_id, bill_date, due_date, currency_code, total_amount, balance_due, status, created_at"
    )
    .eq("organisation_id", id)
    .order("bill_date", { ascending: false })
    .order("created_at", { ascending: false });

  const { data: suppliers } = await supabase
    .from("suppliers")
    .select("id, supplier_name")
    .eq("organisation_id", id)
    .order("supplier_name", { ascending: true });

  const billRows = (bills || []) as PurchaseBillRow[];
  const supplierRows = (suppliers || []) as SupplierRow[];

  const supplierMap = new Map(
    supplierRows.map((supplier) => [supplier.id, supplier.supplier_name])
  );

  const organisationName =
    organisation.trading_name || organisation.legal_name || "Organisation";

  const totalBillValue = billRows.reduce(
    (sum, bill) => sum + Number(bill.total_amount || 0),
    0
  );

  const totalBalanceDue = billRows.reduce(
    (sum, bill) => sum + Number(bill.balance_due || 0),
    0
  );

  const draftCount = billRows.filter(
    (bill) => (bill.status || "DRAFT") === "DRAFT"
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
                <ReceiptText className="h-6 w-6" />
              </div>

              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                  Purchase Bills
                </div>

                <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
                  Purchase bills
                </h1>

                <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                  Review draft and recorded purchase bills for {organisationName}.
                  These support expense capture, payables tracking, supplier
                  statements, procurement analysis, management reporting, and
                  later posting workflows.
                </p>
              </div>
            </div>

            <a
              href={`/portal/organisations/${organisation.id}/purchase-bills/new`}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#073D7F] px-6 py-3 text-sm font-semibold text-white shadow-sm"
            >
              <Plus className="h-4 w-4" />
              New Bill
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="grid gap-5 md:grid-cols-3">
          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">
              Total Bills
            </div>
            <div className="mt-3 text-3xl font-semibold text-slate-950">
              {billRows.length}
            </div>
            <p className="mt-2 text-sm text-slate-500">
              All purchase bills recorded for this organisation.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">
              Draft Bills
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
              Balance Due
            </div>
            <div className="mt-3 text-3xl font-semibold text-slate-950">
              {formatMoney(
                organisation.base_currency_code,
                Number(totalBalanceDue.toFixed(2))
              )}
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Aggregate outstanding purchase bill balance.
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-[2rem] border border-[#D9E3F4] bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-[#D9E3F4] px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                Bill register
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                A working register of supplier bills created for this
                organisation.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-[#D9E3F4] bg-[#F8FAFC] px-4 py-2 text-sm text-slate-500">
              <Search className="h-4 w-4" />
              Search and filters will be added later
            </div>
          </div>

          {billRows.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F8FAFC] text-[#073D7F]">
                <FileText className="h-6 w-6" />
              </div>

              <h3 className="mt-5 text-lg font-semibold text-slate-950">
                No purchase bills yet
              </h3>

              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
                Create the first draft purchase bill for this organisation.
                It will appear here for review before future posting and
                reporting workflows.
              </p>

              <a
                href={`/portal/organisations/${organisation.id}/purchase-bills/new`}
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-[#073D7F] px-6 py-3 text-sm font-semibold text-white"
              >
                <Plus className="h-4 w-4" />
                Create Purchase Bill
              </a>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#D9E3F4]">
                <thead className="bg-[#F8FAFC]">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Bill
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Supplier
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Bill Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Due Date
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Total
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Balance Due
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
                  {billRows.map((bill) => (
                    <tr key={bill.id} className="hover:bg-[#F8FAFC]">
                      <td className="whitespace-nowrap px-6 py-5">
                        <div className="font-semibold text-slate-950">
                          {bill.bill_number || "Untitled bill"}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          Supplier ref:{" "}
                          {bill.supplier_invoice_number || "Not provided"}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          Created {formatDate(bill.created_at)}
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-6 py-5 text-sm text-slate-600">
                        {supplierMap.get(bill.supplier_id || "") ||
                          "No supplier"}
                      </td>

                      <td className="whitespace-nowrap px-6 py-5 text-sm text-slate-600">
                        {formatDate(bill.bill_date)}
                      </td>

                      <td className="whitespace-nowrap px-6 py-5 text-sm text-slate-600">
                        {formatDate(bill.due_date)}
                      </td>

                      <td className="whitespace-nowrap px-6 py-5 text-right text-sm font-semibold text-slate-950">
                        {formatMoney(bill.currency_code, bill.total_amount)}
                      </td>

                      <td className="whitespace-nowrap px-6 py-5 text-right text-sm font-semibold text-slate-950">
                        {formatMoney(bill.currency_code, bill.balance_due)}
                      </td>

                      <td className="whitespace-nowrap px-6 py-5">
                        <span className="inline-flex rounded-full bg-[#F1F1F1] px-3 py-1 text-xs font-semibold text-[#073D7F]">
                          {formatStatus(bill.status)}
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
          These bills are draft operational records. They do not affect the
          ledger until Kiamina adds posting, review, approval, and audit trail
          controls.
        </div>
      </section>
    </main>
  );
}