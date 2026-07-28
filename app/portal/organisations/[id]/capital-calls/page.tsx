import { redirect } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  Plus,
  Search,
  Eye,
  Landmark,
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

type CapitalCallRow = {
  id: string;
  call_number: string | null;
  investor_id: string | null;
  call_date: string | null;
  due_date: string | null;
  currency_code: string | null;
  committed_amount: number | null;
  called_amount: number | null;
  amount_received: number | null;
  outstanding_amount: number | null;
  funding_type: string | null;
  purpose: string | null;
  status: string | null;
  created_at: string | null;
};

type InvestorRow = {
  id: string;
  investor_name: string | null;
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

  return `${currencyCode || "—"} ${numericAmount.toLocaleString("en-US", {
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

function formatType(value: string | null) {
  if (!value) return "—";

  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default async function CapitalCallsPage({
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

  const { data: capitalCalls, error: capitalCallsError } = await supabase
    .from("capital_calls")
    .select(
      "id, call_number, investor_id, call_date, due_date, currency_code, committed_amount, called_amount, amount_received, outstanding_amount, funding_type, purpose, status, created_at"
    )
    .eq("organisation_id", id)
    .order("call_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (capitalCallsError) {
    console.error("Capital calls register error:", capitalCallsError.message);
  }

  const { data: investors } = await supabase
    .from("investors")
    .select("id, investor_name")
    .eq("organisation_id", id)
    .order("investor_name", { ascending: true });

  const callRows = (capitalCalls || []) as CapitalCallRow[];
  const investorRows = (investors || []) as InvestorRow[];

  const investorMap = new Map(
    investorRows.map((investor) => [investor.id, investor.investor_name])
  );

  const organisationName =
    organisation.trading_name || organisation.legal_name || "Organisation";

  const totalCommitted = callRows.reduce(
    (sum, call) => sum + Number(call.committed_amount || 0),
    0
  );

  const totalCalled = callRows.reduce(
    (sum, call) => sum + Number(call.called_amount || 0),
    0
  );

  const totalReceived = callRows.reduce(
    (sum, call) => sum + Number(call.amount_received || 0),
    0
  );

  const totalOutstanding = callRows.reduce(
    (sum, call) => sum + Number(call.outstanding_amount || 0),
    0
  );

  const draftCount = callRows.filter(
    (call) => (call.status || "DRAFT") === "DRAFT"
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
                <Landmark className="h-6 w-6" />
              </div>

              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                  Capital Calls
                </div>

                <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
                  Capital calls
                </h1>

                <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                  Review draft and recorded capital calls for {organisationName}.
                  These support funding requests, shareholder commitments, donor
                  funding obligations, director loans, shareholder loans, and
                  committed funding arrangements before cash is received.
                </p>
              </div>
            </div>

            <a
              href={`/portal/organisations/${organisation.id}/capital-calls/new`}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#073D7F] px-6 py-3 text-sm font-semibold text-white shadow-sm"
            >
              <Plus className="h-4 w-4" />
              New Capital Call
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="grid gap-5 md:grid-cols-5">
          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">
              Total Calls
            </div>
            <div className="mt-3 text-3xl font-semibold text-slate-950">
              {callRows.length}
            </div>
            <p className="mt-2 text-sm text-slate-500">
              All capital calls recorded.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">
              Draft Calls
            </div>
            <div className="mt-3 text-3xl font-semibold text-slate-950">
              {draftCount}
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Not yet posted or settled.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">
              Committed
            </div>
            <div className="mt-3 text-2xl font-semibold text-slate-950">
              {formatMoney(
                organisation.base_currency_code,
                Number(totalCommitted.toFixed(2))
              )}
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Total funding commitment captured.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">Called</div>
            <div className="mt-3 text-2xl font-semibold text-slate-950">
              {formatMoney(
                organisation.base_currency_code,
                Number(totalCalled.toFixed(2))
              )}
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Amount formally called.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">
              Outstanding
            </div>
            <div className="mt-3 text-2xl font-semibold text-slate-950">
              {formatMoney(
                organisation.base_currency_code,
                Number(totalOutstanding.toFixed(2))
              )}
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Received:{" "}
              {formatMoney(
                organisation.base_currency_code,
                Number(totalReceived.toFixed(2))
              )}
              .
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-[2rem] border border-[#D9E3F4] bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-[#D9E3F4] px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                Capital call register
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                A working register of funding calls created for this
                organisation.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-[#D9E3F4] bg-[#F8FAFC] px-4 py-2 text-sm text-slate-500">
              <Search className="h-4 w-4" />
              Search and filters will be added later
            </div>
          </div>

          {callRows.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F8FAFC] text-[#073D7F]">
                <FileText className="h-6 w-6" />
              </div>

              <h3 className="mt-5 text-lg font-semibold text-slate-950">
                No capital calls yet
              </h3>

              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
                Create the first draft capital call for this organisation. It
                will appear here for review before future funding receipt,
                settlement, and reporting workflows.
              </p>

              <a
                href={`/portal/organisations/${organisation.id}/capital-calls/new`}
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-[#073D7F] px-6 py-3 text-sm font-semibold text-white"
              >
                <Plus className="h-4 w-4" />
                Create Capital Call
              </a>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#D9E3F4]">
                <thead className="bg-[#F8FAFC]">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Capital Call
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Investor / Funder
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Call Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Due Date
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Called
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Received
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Outstanding
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
                  {callRows.map((call) => (
                    <tr key={call.id} className="hover:bg-[#F8FAFC]">
                      <td className="whitespace-nowrap px-6 py-5">
                        <div className="font-semibold text-slate-950">
                          {call.call_number || "Untitled capital call"}
                        </div>
                        <div className="mt-1 max-w-xs truncate text-xs text-slate-500">
                          Purpose: {call.purpose || "Not provided"}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          Created {formatDate(call.created_at)}
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-6 py-5 text-sm text-slate-600">
                        {investorMap.get(call.investor_id || "") ||
                          "No investor"}
                      </td>

                      <td className="whitespace-nowrap px-6 py-5 text-sm text-slate-600">
                        {formatType(call.funding_type)}
                      </td>

                      <td className="whitespace-nowrap px-6 py-5 text-sm text-slate-600">
                        {formatDate(call.call_date)}
                      </td>

                      <td className="whitespace-nowrap px-6 py-5 text-sm text-slate-600">
                        {formatDate(call.due_date)}
                      </td>

                      <td className="whitespace-nowrap px-6 py-5 text-right text-sm font-semibold text-slate-950">
                        {formatMoney(call.currency_code, call.called_amount)}
                      </td>

                      <td className="whitespace-nowrap px-6 py-5 text-right text-sm font-semibold text-slate-950">
                        {formatMoney(call.currency_code, call.amount_received)}
                      </td>

                      <td className="whitespace-nowrap px-6 py-5 text-right text-sm font-semibold text-slate-950">
                        {formatMoney(
                          call.currency_code,
                          call.outstanding_amount
                        )}
                      </td>

                      <td className="whitespace-nowrap px-6 py-5">
                        <span className="inline-flex rounded-full bg-[#F1F1F1] px-3 py-1 text-xs font-semibold text-[#073D7F]">
                          {formatStatus(call.status)}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-6 py-5 text-right">
                        <a
                          href={`/portal/organisations/${organisation.id}/capital-calls/${call.id}`}
                          className="inline-flex items-center gap-2 rounded-full border border-[#D9E3F4] bg-white px-4 py-2 text-xs font-semibold text-[#073D7F] hover:border-[#073D7F]"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </a>
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
          These capital calls are draft funding records. They do not affect the
          ledger, investor balances, loan balances, receivables, or bank balances
          until Kiamina adds posting, review, approval, and audit trail controls.
        </div>
      </section>
    </main>
  );
}