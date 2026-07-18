import { redirect } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  FileSpreadsheet,
  MessageSquareText,
  ShieldCheck,
} from "lucide-react";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

function formatPeriodType(type?: string | null) {
  if (!type) return "—";

  return type
    .split("_")
    .join(" ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString();
}

export default async function AccountingPeriodPage({
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

  const { data: period } = await supabase
    .from("accounting_periods")
    .select(
      `
      id,
      organisation_id,
      engagement_id,
      name,
      period_type,
      start_date,
      end_date,
      reporting_framework,
      currency_code,
      status,
      created_at,
      organisations (
        id,
        legal_name,
        trading_name,
        jurisdiction_code
      ),
      engagements (
        id,
        name,
        engagement_type,
        status
      )
    `
    )
    .eq("id", id)
    .single();

  if (!period) {
    redirect("/portal/organisations");
  }

  const { count: eventsCount } = await supabase
    .from("period_events")
    .select("id", { count: "exact", head: true })
    .eq("accounting_period_id", period.id);

  const { data: events } = await supabase
    .from("period_events")
    .select(
      "id, event_type, title, severity, financial_impact_amount, currency_code, status, include_in_management_report, created_at"
    )
    .eq("accounting_period_id", period.id)
    .order("created_at", { ascending: false })
    .limit(6);

  const organisation = Array.isArray(period.organisations)
    ? period.organisations[0]
    : period.organisations;

  const engagement = Array.isArray(period.engagements)
    ? period.engagements[0]
    : period.engagements;

  const organisationName =
    organisation?.trading_name || organisation?.legal_name || "Organisation";

  const stats = [
    {
      label: "Period Type",
      value: formatPeriodType(period.period_type),
      icon: CalendarDays,
    },
    {
      label: "Period Events",
      value: eventsCount ?? 0,
      icon: MessageSquareText,
    },
    {
      label: "Framework",
      value: period.reporting_framework || "—",
      icon: FileSpreadsheet,
    },
    {
      label: "Status",
      value: period.status || "—",
      icon: ShieldCheck,
    },
  ];

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <section className="border-b border-[#D9E3F4] bg-white">
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          <a
            href={`/portal/organisations/${period.organisation_id}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#073D7F]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to organisation workspace
          </a>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_0.35fr]">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                Accounting Period
              </div>

              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
                {period.name}
              </h1>

              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                {organisationName} · {formatDate(period.start_date)} to{" "}
                {formatDate(period.end_date)}
              </p>

              {engagement ? (
                <p className="mt-2 text-sm text-slate-500">
                  Linked engagement:{" "}
                  <span className="font-semibold text-slate-800">
                    {engagement.name}
                  </span>
                </p>
              ) : null}
            </div>

            <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-[#F1F1F1] p-5">
              <div className="text-sm font-semibold text-slate-950">
                Reporting Currency
              </div>

              <div className="mt-4 inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#073D7F]">
                {period.currency_code || "—"}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      {item.label}
                    </div>
                    <div className="mt-3 text-2xl font-semibold text-slate-950">
                      {item.value}
                    </div>
                  </div>

                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F1F1F1] text-[#073D7F]">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <section className="mt-8 rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                Management Context
              </div>

              <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
                Period events and advisory context
              </h2>

              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                Capture what happened during this period: theft, fraud, bad
                debts, major repairs, delayed payments, new contracts, tax
                issues, regulatory matters, funding received, operational
                disruption, and other matters that should shape management
                reporting and strategic advisory.
              </p>
            </div>

            <a
              href={`/portal/accounting-periods/${period.id}/events/new`}
              className="rounded-full bg-[#073D7F] px-6 py-3 text-center text-sm font-semibold text-white"
            >
              Add Period Event
            </a>
          </div>

          <div className="mt-8 overflow-hidden rounded-[1.5rem] border border-[#D9E3F4]">
            <div className="grid grid-cols-[1.3fr_1fr_1fr_1fr] bg-[#F1F1F1] px-5 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              <div>Event</div>
              <div>Type</div>
              <div>Impact</div>
              <div>Status</div>
            </div>

            <div className="divide-y divide-[#D9E3F4]">
              {events && events.length > 0 ? (
                events.map((event) => (
                  <div
                    key={event.id}
                    className="grid grid-cols-[1.3fr_1fr_1fr_1fr] px-5 py-4 text-sm text-slate-700"
                  >
                    <div>
                      <div className="font-semibold text-slate-950">
                        {event.title}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        Severity: {event.severity}
                      </div>
                    </div>

                    <div>{formatPeriodType(event.event_type)}</div>

                    <div>
                      {event.financial_impact_amount
                        ? `${event.currency_code || period.currency_code || ""} ${
                            event.financial_impact_amount
                          }`
                        : "Not quantified"}
                    </div>

                    <div>
                      <span className="rounded-full bg-[#F1F1F1] px-3 py-1 text-xs font-semibold text-[#073D7F]">
                        {event.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-5 py-8 text-sm text-slate-500">
                  No period events have been added yet.
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] bg-[#073D7F] p-8 text-white">
          <h2 className="text-3xl font-semibold tracking-tight">
            This period is the bridge between accounting data and advisory
            reporting.
          </h2>

          <p className="mt-4 max-w-3xl text-base leading-8 text-blue-100">
            Later, this workspace will combine ledger transactions, trial
            balance, sales reports, accounts payable, period events, financial
            statement mapping, and management commentary into monthly,
            quarterly, six-monthly, yearly, and interim financial reporting.
          </p>
        </section>
      </section>
    </main>
  );
}