import { redirect } from "next/navigation";
import {
  ArrowLeft,
  Briefcase,
  CalendarDays,
  CheckCircle,
  Clock,
  FileText,
  Plus,
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

function formatLabel(value?: string | null) {
  if (!value) return "—";

  const special: Record<string, string> = {
    US_GAAP: "US GAAP",
    IFRS_SME: "IFRS for SMEs",
  };

  if (special[value]) return special[value];

  return value
    .split("_")
    .join(" ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function getStatusClass(status?: string | null) {
  const normalised = String(status || "").toLowerCase();

  if (["active", "in_progress", "open"].includes(normalised)) {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  }

  if (["completed", "closed", "approved"].includes(normalised)) {
    return "bg-blue-50 text-blue-700 ring-blue-200";
  }

  if (["paused", "on_hold"].includes(normalised)) {
    return "bg-amber-50 text-amber-700 ring-amber-200";
  }

  if (["cancelled", "void", "archived"].includes(normalised)) {
    return "bg-slate-100 text-slate-600 ring-slate-200";
  }

  return "bg-[#F1F1F1] text-[#073D7F] ring-[#D9E3F4]";
}

export default async function OrganisationEngagementsPage({
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
    .select(
      "id, legal_name, trading_name, reporting_framework_code, base_currency_code, country_name, country_code"
    )
    .eq("id", id)
    .single();

  if (!organisation) {
    redirect("/portal/organisations");
  }

  const { data: engagements } = await supabase
    .from("engagements")
    .select(
      "id, name, engagement_type, status, reporting_period_start, reporting_period_end, reporting_framework_code, currency_code, created_at"
    )
    .eq("organisation_id", id)
    .order("created_at", { ascending: false });

  const engagementRows = engagements || [];

  const plannedCount = engagementRows.filter(
    (item) => String(item.status || "").toLowerCase() === "planned"
  ).length;

  const activeCount = engagementRows.filter((item) =>
    ["active", "in_progress", "open"].includes(
      String(item.status || "").toLowerCase()
    )
  ).length;

  const completedCount = engagementRows.filter((item) =>
    ["completed", "closed", "approved"].includes(
      String(item.status || "").toLowerCase()
    )
  ).length;

  const organisationName =
    organisation.trading_name || organisation.legal_name || "Organisation";

  const stats = [
    {
      label: "Total Engagements",
      value: engagementRows.length,
      icon: Briefcase,
    },
    {
      label: "Planned",
      value: plannedCount,
      icon: Clock,
    },
    {
      label: "Active",
      value: activeCount,
      icon: CalendarDays,
    },
    {
      label: "Completed / Closed",
      value: completedCount,
      icon: CheckCircle,
    },
  ];

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
            <div>
              <div className="inline-flex rounded-full bg-[#F1F1F1] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#073D7F]">
                Engagement Register
              </div>

              <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-950">
                Engagements for {organisationName}
              </h1>

              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                Organise client workspaces by service type, reporting period,
                framework, and status. Each engagement can hold documents,
                review activity, working papers, and reporting deliverables.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <span className="rounded-full bg-[#F1F1F1] px-4 py-2 text-sm font-semibold text-slate-700">
                  {formatLabel(organisation.reporting_framework_code)}
                </span>

                <span className="rounded-full bg-[#F1F1F1] px-4 py-2 text-sm font-semibold text-slate-700">
                  {organisation.base_currency_code || "No currency"}
                </span>

                <span className="rounded-full bg-[#F1F1F1] px-4 py-2 text-sm font-semibold text-slate-700">
                  {organisation.country_name ||
                    organisation.country_code ||
                    "Country not set"}
                </span>
              </div>
            </div>

            <a
              href={`/portal/organisations/${organisation.id}/engagements/new`}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#073D7F] px-6 py-3 text-sm font-semibold text-white"
            >
              <Plus className="h-4 w-4" />
              Create Engagement
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.label}
                className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-slate-500">
                    {stat.label}
                  </div>

                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F1F1F1] text-[#073D7F]">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>

                <div className="mt-5 text-2xl font-semibold text-slate-950">
                  {stat.value}
                </div>
              </div>
            );
          })}
        </div>

        <section className="mt-8 rounded-[2rem] border border-[#D9E3F4] bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-[#D9E3F4] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                Engagement list
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                All engagement workspaces linked to this organisation.
              </p>
            </div>

            <a
              href={`/portal/organisations/${organisation.id}/engagements/new`}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[#D9E3F4] bg-white px-5 py-3 text-sm font-semibold text-[#073D7F]"
            >
              <Plus className="h-4 w-4" />
              New Engagement
            </a>
          </div>

          {engagementRows.length === 0 ? (
            <div className="px-6 py-12">
              <div className="rounded-[1.5rem] border border-dashed border-[#D9E3F4] bg-[#F8FAFC] p-8 text-center">
                <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#073D7F]">
                  <Briefcase className="h-5 w-5" />
                </div>

                <h3 className="mt-5 text-lg font-semibold text-slate-950">
                  No engagements yet
                </h3>

                <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                  Create the first engagement workspace for bookkeeping,
                  reporting, tax, payroll, compliance, financial statements, or
                  advisory work.
                </p>

                <a
                  href={`/portal/organisations/${organisation.id}/engagements/new`}
                  className="mt-6 inline-flex rounded-full bg-[#073D7F] px-6 py-3 text-sm font-semibold text-white"
                >
                  Create Engagement
                </a>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#D9E3F4]">
                <thead className="bg-[#F8FAFC]">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Engagement
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Period
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Framework / Currency
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Created
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#D9E3F4] bg-white">
                  {engagementRows.map((engagement) => (
                    <tr key={engagement.id} className="hover:bg-[#F8FAFC]">
                      <td className="px-6 py-5">
                        <div className="font-semibold text-slate-950">
                          {engagement.name || "Untitled engagement"}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          ID: {engagement.id}
                        </div>
                      </td>

                      <td className="px-6 py-5 text-sm text-slate-600">
                        {formatLabel(engagement.engagement_type)}
                      </td>

                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getStatusClass(
                            engagement.status
                          )}`}
                        >
                          {formatLabel(engagement.status)}
                        </span>
                      </td>

                      <td className="px-6 py-5 text-sm text-slate-600">
                        {formatDate(engagement.reporting_period_start)} to{" "}
                        {formatDate(engagement.reporting_period_end)}
                      </td>

                      <td className="px-6 py-5 text-sm text-slate-600">
                        <div>{formatLabel(engagement.reporting_framework_code)}</div>
                        <div className="mt-1 text-xs text-slate-500">
                          {engagement.currency_code || "—"}
                        </div>
                      </td>

                      <td className="px-6 py-5 text-sm text-slate-600">
                        {formatDate(engagement.created_at)}
                      </td>

                      <td className="px-6 py-5 text-right">
                        <a
                          href={`/portal/engagements/${engagement.id}`}
                          className="inline-flex rounded-full bg-[#073D7F] px-5 py-2.5 text-sm font-semibold text-white"
                        >
                          Open
                        </a>
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
              <FileText className="h-5 w-5" />
            </div>

            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                Engagement workflow
              </div>

              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                Workspaces for service delivery
              </h2>

              <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-600">
                Use engagements to organise source documents, working papers,
                review notes, accounting records, reporting packs, compliance
                work, and advisory deliverables by service line and reporting
                period.
              </p>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}