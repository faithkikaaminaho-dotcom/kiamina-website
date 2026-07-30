import { redirect } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle,
  Lock,
  Plus,
  ShieldCheck,
} from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import PeriodStatusActions from "./PeriodStatusActions";

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

type AccountingPeriod = {
  id: string;
  name: string | null;
  period_name: string | null;
  period_type: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string | null;
  lock_reason: string | null;
  created_at: string | null;
};

type Organisation = {
  id: string;
  legal_name: string | null;
  trading_name: string | null;
  base_currency_code: string | null;
  accounting_year_start_month: number | null;
  accounting_year_start_day: number | null;
  accounting_year_end_month: number | null;
  accounting_year_end_day: number | null;
};

function formatDate(value: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatStatus(status: string | null) {
  if (!status) return "Open";

  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatPeriodType(value: string | null) {
  if (!value) return "Custom";

  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatAccountingYear(organisation: Organisation) {
  const startMonth = organisation.accounting_year_start_month;
  const startDay = organisation.accounting_year_start_day;
  const endMonth = organisation.accounting_year_end_month;
  const endDay = organisation.accounting_year_end_day;

  if (!startMonth || !startDay || !endMonth || !endDay) {
    return "Not configured";
  }

  return `${String(startDay).padStart(2, "0")}/${String(startMonth).padStart(
    2,
    "0"
  )} to ${String(endDay).padStart(2, "0")}/${String(endMonth).padStart(
    2,
    "0"
  )}`;
}

function statusClassName(status: string | null) {
  const normalizedStatus = status || "OPEN";

  if (normalizedStatus === "CLOSED") {
    return "bg-slate-900 text-white";
  }

  if (normalizedStatus === "LOCKED") {
    return "bg-[#073D7F] text-white";
  }

  if (normalizedStatus === "UNDER_REVIEW") {
    return "bg-[#EAF1FF] text-[#073D7F]";
  }

  return "bg-[#F1F1F1] text-[#073D7F]";
}

export default async function AccountingPeriodsPage({
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

  const { data: organisationRow } = await supabase
    .from("organisations")
    .select(
      "id, legal_name, trading_name, base_currency_code, accounting_year_start_month, accounting_year_start_day, accounting_year_end_month, accounting_year_end_day"
    )
    .eq("id", id)
    .single();

  if (!organisationRow) {
    redirect("/portal/organisations");
  }

  const organisation = organisationRow as Organisation;

  const { data: periodRows } = await supabase
    .from("accounting_periods")
    .select(
      "id, name, period_name, period_type, start_date, end_date, status, lock_reason, created_at"
    )
    .eq("organisation_id", id)
    .order("start_date", { ascending: false });

  const accountingPeriods = (periodRows || []) as AccountingPeriod[];

  const openCount = accountingPeriods.filter(
    (period) => (period.status || "OPEN") === "OPEN"
  ).length;

  const underReviewCount = accountingPeriods.filter(
    (period) => period.status === "UNDER_REVIEW"
  ).length;

  const lockedCount = accountingPeriods.filter(
    (period) => period.status === "LOCKED"
  ).length;

  const closedCount = accountingPeriods.filter(
    (period) => period.status === "CLOSED"
  ).length;

  const organisationName =
    organisation.trading_name || organisation.legal_name || "Organisation";

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
                <CalendarDays className="h-6 w-6" />
              </div>

              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                  Period Control
                </div>

                <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
                  Date-range lock and close foundation
                </h1>

                <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                  Manage reporting periods, lock ranges, and close ranges for{" "}
                  {organisationName}. A locked or closed date range protects the
                  General Ledger from postings within that period.
                </p>

                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
                  During onboarding, each organisation should define its
                  accounting year start and end month/day. Period locks and
                  closes can still be created for any custom date range,
                  including grant periods and project periods.
                </p>
              </div>
            </div>

            <a
              href={`/portal/organisations/${organisation.id}/periods/new`}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#073D7F] px-6 py-3 text-sm font-semibold text-white shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Create Lock / Period
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm xl:col-span-1">
            <div className="text-sm font-semibold text-slate-500">
              Accounting Year
            </div>
            <div className="mt-3 text-xl font-semibold text-slate-950">
              {formatAccountingYear(organisation)}
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Onboarding default for annual reporting.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">
              Open Ranges
            </div>
            <div className="mt-3 text-3xl font-semibold text-slate-950">
              {openCount}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">
              Under Review
            </div>
            <div className="mt-3 text-3xl font-semibold text-slate-950">
              {underReviewCount}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">
              Locked Ranges
            </div>
            <div className="mt-3 text-3xl font-semibold text-slate-950">
              {lockedCount}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">
              Closed Ranges
            </div>
            <div className="mt-3 text-3xl font-semibold text-slate-950">
              {closedCount}
            </div>
          </div>
        </div>

        <section className="mt-8 rounded-[2rem] border border-[#D9E3F4] bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-[#D9E3F4] px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                Date-range period controls
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Lock or close any date range. The posting engine checks journal
                dates against locked and closed ranges.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full bg-[#F1F1F1] px-4 py-2 text-sm font-semibold text-[#073D7F]">
              <Lock className="h-4 w-4" />
              Date-range control
            </div>
          </div>

          {accountingPeriods.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F8FAFC] text-[#073D7F]">
                <CalendarDays className="h-6 w-6" />
              </div>

              <h3 className="mt-5 text-lg font-semibold text-slate-950">
                No period controls yet
              </h3>

              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
                Create a date range for monthly reporting, year-end close, grant
                reporting, project reporting, or a period lock.
              </p>

              <div className="mt-6">
                <a
                  href={`/portal/organisations/${organisation.id}/periods/new`}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#073D7F] px-6 py-3 text-sm font-semibold text-white"
                >
                  <Plus className="h-4 w-4" />
                  Create Lock / Period
                </a>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#D9E3F4]">
                <thead className="bg-[#F8FAFC]">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Label
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Date Range
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Reason
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Controls
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#D9E3F4] bg-white">
                  {accountingPeriods.map((period) => (
                    <tr key={period.id} className="hover:bg-[#F8FAFC]">
                      <td className="whitespace-nowrap px-6 py-5">
                        <div className="font-semibold text-slate-950">
                          {period.period_name ||
                            period.name ||
                            "Date range period"}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          Created {formatDate(period.created_at)}
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-6 py-5 text-sm text-slate-600">
                        {formatPeriodType(period.period_type)}
                      </td>

                      <td className="whitespace-nowrap px-6 py-5 text-sm text-slate-600">
                        {formatDate(period.start_date)} to{" "}
                        {formatDate(period.end_date)}
                      </td>

                      <td className="whitespace-nowrap px-6 py-5">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClassName(
                            period.status
                          )}`}
                        >
                          {formatStatus(period.status)}
                        </span>
                      </td>

                      <td className="max-w-sm px-6 py-5 text-sm text-slate-600">
                        {period.lock_reason || "—"}
                      </td>

                      <td className="whitespace-nowrap px-6 py-5 text-right">
                        <div className="flex justify-end">
                          <PeriodStatusActions
                            periodId={period.id}
                            currentStatus={period.status || "OPEN"}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

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
                Foundation-stage date-range lock control
              </h2>

              <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-600">
                This module tracks date-range reporting periods, locks, and
                closes. Journal posting protection checks whether the journal
                date falls inside any locked or closed range. Later phases will
                add accounting year onboarding, automated year-end period
                generation, adjustment approval workflows, reopening controls,
                and full audit trail enforcement.
              </p>

              <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#F1F1F1] px-4 py-2 text-sm font-semibold text-[#073D7F]">
                <CheckCircle className="h-4 w-4" />
                Ready for onboarding accounting year setup
              </div>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}