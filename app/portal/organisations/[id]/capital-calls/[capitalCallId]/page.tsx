import { redirect } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle,
  Coins,
  FileText,
  Landmark,
  ShieldCheck,
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

type AnyRecord = Record<string, any>;

function formatDate(value?: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatMoney(currencyCode?: string | null, amount?: number | null) {
  return `${currencyCode || "—"} ${Number(amount || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatNumber(value?: number | string | null) {
  return Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
}

function formatStatus(status?: string | null) {
  if (!status) return "—";

  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatAccount(account?: AnyRecord | null) {
  if (!account) return "Not selected";

  const code = account.account_code || "No code";
  const name = account.account_name || "Unnamed account";

  return `${code} - ${name}`;
}

export default async function CapitalCallDetailPage({
  params,
}: {
  params: Promise<{ id: string; capitalCallId: string }>;
}) {
  const { id, capitalCallId } = await params;

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

  const { data: capitalCall } = await supabase
    .from("capital_calls")
    .select("*")
    .eq("id", capitalCallId)
    .eq("organisation_id", id)
    .single();

  if (!capitalCall) {
    redirect(`/portal/organisations/${id}/capital-calls`);
  }

  const { data: investor } = await supabase
    .from("investors")
    .select(
      "id, investor_name, investor_type, funding_type, email, phone, currency_code, committed_amount, contributed_amount, outstanding_amount"
    )
    .eq("id", capitalCall.investor_id)
    .eq("organisation_id", id)
    .single();

  const accountIds = [
    capitalCall.receivable_account_id,
    capitalCall.equity_account_id,
    capitalCall.liability_account_id,
  ].filter(Boolean);

  let accounts: AnyRecord[] = [];

  if (accountIds.length > 0) {
    const { data: chartAccounts } = await supabase
      .from("chart_of_accounts")
      .select(
        "id, account_code, account_name, account_type, account_subtype, fs_section, fs_line_item"
      )
      .eq("organisation_id", id)
      .in("id", accountIds);

    accounts = chartAccounts || [];
  }

  const accountMap = new Map(accounts.map((account) => [account.id, account]));

  const organisationName =
    organisation.trading_name || organisation.legal_name || "Organisation";

  const receivableAccount = accountMap.get(capitalCall.receivable_account_id);
  const equityAccount = accountMap.get(capitalCall.equity_account_id);
  const liabilityAccount = accountMap.get(capitalCall.liability_account_id);

  const collectionRate =
    Number(capitalCall.called_amount || 0) > 0
      ? Number(
          (
            (Number(capitalCall.amount_received || 0) /
              Number(capitalCall.called_amount || 0)) *
            100
          ).toFixed(2)
        )
      : 0;

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <section className="border-b border-[#D9E3F4] bg-white">
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          <a
            href={`/portal/organisations/${organisation.id}/capital-calls`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#073D7F]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to capital calls
          </a>

          <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-5">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F1F1F1] text-[#073D7F]">
                <Landmark className="h-6 w-6" />
              </div>

              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                  Capital Call
                </div>

                <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
                  {capitalCall.call_number || "Untitled capital call"}
                </h1>

                <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                  Review the full draft capital call for {organisationName},
                  including investor or funder details, funding terms, call
                  value, outstanding amount, GL mapping, FX information, and
                  control status.
                </p>

                <div className="mt-5 flex flex-wrap gap-3">
                  <span className="rounded-full bg-[#F1F1F1] px-4 py-2 text-sm font-semibold text-[#073D7F]">
                    {formatStatus(capitalCall.status)}
                  </span>

                  <span className="rounded-full bg-[#F1F1F1] px-4 py-2 text-sm font-semibold text-slate-700">
                    {capitalCall.currency_code || organisation.base_currency_code}
                  </span>

                  <span className="rounded-full bg-[#F1F1F1] px-4 py-2 text-sm font-semibold text-slate-700">
                    Call Date: {formatDate(capitalCall.call_date)}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-[#F1F1F1] p-5 text-sm text-slate-600">
              <div className="font-semibold text-slate-950">
                Investor / Funder
              </div>
              <div className="mt-2 text-lg font-semibold text-[#073D7F]">
                {investor?.investor_name || "Investor / funder not found"}
              </div>
              <div className="mt-2">{investor?.email || "No email"}</div>
              <div className="mt-1">{investor?.phone || "No phone"}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">
              Committed Amount
            </div>
            <div className="mt-3 text-2xl font-semibold text-slate-950">
              {formatMoney(capitalCall.currency_code, capitalCall.committed_amount)}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">
              Called Amount
            </div>
            <div className="mt-3 text-2xl font-semibold text-slate-950">
              {formatMoney(capitalCall.currency_code, capitalCall.called_amount)}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">
              Amount Received
            </div>
            <div className="mt-3 text-2xl font-semibold text-slate-950">
              {formatMoney(capitalCall.currency_code, capitalCall.amount_received)}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">
              Outstanding
            </div>
            <div className="mt-3 text-2xl font-semibold text-slate-950">
              {formatMoney(
                capitalCall.currency_code,
                capitalCall.outstanding_amount
              )}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">
              Collection Rate
            </div>
            <div className="mt-3 text-2xl font-semibold text-slate-950">
              {collectionRate.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
              %
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-[#073D7F]" />
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                Capital Call Details
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm">
                <div className="font-semibold text-slate-950">
                  Capital Call Number
                </div>
                <div className="mt-2 text-slate-600">
                  {capitalCall.call_number || "—"}
                </div>
              </div>

              <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm">
                <div className="font-semibold text-slate-950">Status</div>
                <div className="mt-2 text-slate-600">
                  {formatStatus(capitalCall.status)}
                </div>
              </div>

              <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm">
                <div className="font-semibold text-slate-950">Call Date</div>
                <div className="mt-2 text-slate-600">
                  {formatDate(capitalCall.call_date)}
                </div>
              </div>

              <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm">
                <div className="font-semibold text-slate-950">Due Date</div>
                <div className="mt-2 text-slate-600">
                  {formatDate(capitalCall.due_date)}
                </div>
              </div>

              <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm">
                <div className="font-semibold text-slate-950">
                  Funding Type
                </div>
                <div className="mt-2 text-slate-600">
                  {formatStatus(capitalCall.funding_type)}
                </div>
              </div>

              <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm">
                <div className="font-semibold text-slate-950">Currency</div>
                <div className="mt-2 text-slate-600">
                  {capitalCall.currency_code || "—"}
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-[#D9E3F4] bg-white p-5 text-sm leading-7 text-slate-600">
              <div className="font-semibold text-slate-950">
                Funding Purpose
              </div>
              <div className="mt-2">
                {capitalCall.purpose || "No funding purpose provided."}
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-[#D9E3F4] bg-white p-5 text-sm leading-7 text-slate-600">
              <div className="font-semibold text-slate-950">Terms</div>
              <div className="mt-2">
                {capitalCall.terms || "No terms provided."}
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-[#D9E3F4] bg-white p-5 text-sm leading-7 text-slate-600">
              <div className="font-semibold text-slate-950">Internal Notes</div>
              <div className="mt-2">
                {capitalCall.internal_notes || "No internal notes."}
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm">
            <div className="flex items-center gap-3">
              <Coins className="h-5 w-5 text-[#073D7F]" />
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                GL & FX Mapping
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm">
                <div className="font-semibold text-slate-950">
                  Receivable Account
                </div>
                <div className="mt-2 text-slate-600">
                  {formatAccount(receivableAccount)}
                </div>
              </div>

              <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm">
                <div className="font-semibold text-slate-950">
                  Equity / Fund Account
                </div>
                <div className="mt-2 text-slate-600">
                  {formatAccount(equityAccount)}
                </div>
              </div>

              <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm">
                <div className="font-semibold text-slate-950">
                  Liability Account
                </div>
                <div className="mt-2 text-slate-600">
                  {formatAccount(liabilityAccount)}
                </div>
              </div>

              <div className="rounded-2xl border border-[#D9E3F4] bg-white p-5 text-sm">
                <div className="font-semibold text-slate-950">
                  Exchange Rate
                </div>
                <div className="mt-2 text-slate-600">
                  {formatNumber(capitalCall.exchange_rate)}
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Rate Date
                    </div>
                    <div className="mt-1 text-slate-600">
                      {formatDate(capitalCall.exchange_rate_date)}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Source
                    </div>
                    <div className="mt-1 text-slate-600">
                      {formatStatus(capitalCall.exchange_rate_source)}
                    </div>
                  </div>
                </div>

                <div className="mt-4 inline-flex rounded-full bg-[#F1F1F1] px-3 py-1 text-xs font-semibold text-[#073D7F]">
                  {capitalCall.exchange_rate_is_locked
                    ? "FX Rate Locked"
                    : "FX Rate Not Locked"}
                </div>
              </div>
            </div>
          </section>
        </div>

        <section className="mt-8 rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F1F1F1] text-[#073D7F]">
              <ShieldCheck className="h-5 w-5" />
            </div>

            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                Control Status
              </div>

              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                Draft capital call record
              </h2>

              <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-600">
                This capital call is currently an operational draft record. It
                represents a funding request or obligation and does not post to
                the general ledger, funder statement, receivables, bank
                reconciliation, financial reporting, or management reporting
                until Kiamina adds posting, review, approval, and audit trail
                controls.
              </p>

              <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#F1F1F1] px-4 py-2 text-sm font-semibold text-[#073D7F]">
                <CheckCircle className="h-4 w-4" />
                Ready for future review, receipt, and posting workflow
              </div>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}