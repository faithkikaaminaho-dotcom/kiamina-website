import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import QuickEngagementForm from "./QuickEngagementForm";
import {
  ArrowLeft,
  Archive,
  Building2,
  CheckCircle,
  Clock,
  Coins,
  FileText,
  Globe2,
  Mail,
  MessageSquare,
  ShieldCheck,
  UserRound,
} from "lucide-react";

export const dynamic = "force-dynamic";

function formatFramework(code?: string | null) {
  if (!code) return "—";

  const labels: Record<string, string> = {
    IFRS: "IFRS",
    US_GAAP: "US GAAP",
    IFRS_SME: "IFRS for SMEs",
  };

  return labels[code] || code;
}

function formatStatus(status?: string | null) {
  if (!status) return "—";

  return status
    .split("_")
    .join(" ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatAccessRole(role?: string | null) {
  if (!role) return "—";

  return role
    .split("_")
    .join(" ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default async function OrganisationDetailPage({
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

  const role = profile?.role as string | undefined;

  if (!role || !["SUPER_ADMIN", "ADMIN", "STAFF"].includes(role)) {
    redirect("/portal");
  }

  const { data: organisation } = await supabase
    .from("organisations")
    .select(
      "id, legal_name, trading_name, organisation_type, status, jurisdiction_code, reporting_framework_code, base_currency_code, registration_number, tax_identification_number, financial_year_end_month, financial_year_end_day, primary_contact_name, primary_contact_email, primary_contact_phone, risk_rating, legacy_client_id, created_at"
    )
    .eq("id", id)
    .single();

  if (!organisation) {
    redirect("/portal/organisations");
  }

  const { count: documentsCount } = await supabase
    .from("documents")
    .select("*", { count: "exact", head: true })
    .eq("organisation_id", id);

  const { count: pendingReviewCount } = await supabase
    .from("document_reviews")
    .select("*", { count: "exact", head: true })
    .eq("organisation_id", id)
    .eq("status", "PENDING_REVIEW");

  const { count: approvedCount } = await supabase
    .from("document_reviews")
    .select("*", { count: "exact", head: true })
    .eq("organisation_id", id)
    .eq("status", "APPROVED");

  const { count: engagementsCount } = await supabase
    .from("engagements")
    .select("*", { count: "exact", head: true })
    .eq("organisation_id", id);

  const { data: recentDocuments } = await supabase
    .from("documents")
    .select("id, file_name, module, status, created_at, client_id")
    .eq("organisation_id", id)
    .order("created_at", { ascending: false })
    .limit(6);

  const { data: engagements } = await supabase
    .from("engagements")
    .select(
      "id, name, engagement_type, status, reporting_period_start, reporting_period_end"
    )
    .eq("organisation_id", id)
    .order("created_at", { ascending: false })
    .limit(6);
    const { data: organisationUsers } = await supabase
  .from("organisation_users")
  .select("id, user_id, role, access_role, status, created_at")
  .eq("organisation_id", id)
  .order("created_at", { ascending: false });

const assignedUserIds =
  organisationUsers?.map((record) => record.user_id).filter(Boolean) || [];

let assignedProfiles: {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string | null;
  status: string | null;
}[] = [];

if (assignedUserIds.length > 0) {
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, status")
    .in("id", assignedUserIds);

  assignedProfiles = profiles || [];
}

const assignedClientUsers =
  organisationUsers?.map((record) => {
    const profile = assignedProfiles.find(
      (person) => person.id === record.user_id
    );

    return {
      ...record,
      profile,
    };
  }) || [];

const { data: chartAccounts } = await supabase
  .from("chart_of_accounts")
  .select(
    "id, account_code, account_name, account_type, fs_section, fs_line_item, is_active"
  )
  .eq("organisation_id", id)
  .order("account_code", { ascending: true })
  .limit(8);

  const stats = [
  {
    label: "Documents",
    value: documentsCount ?? 0,
    icon: FileText,
  },
  {
    label: "Pending Reviews",
    value: pendingReviewCount ?? 0,
    icon: Clock,
  },
  {
    label: "Approved Reviews",
    value: approvedCount ?? 0,
    icon: CheckCircle,
  },
  {
    label: "Engagements",
    value: engagementsCount ?? 0,
    icon: Archive,
  },
  {
    label: "Client Users",
    value: assignedClientUsers.length,
    icon: UserRound,
  },
];

  const financialYearEnd =
    organisation.financial_year_end_month && organisation.financial_year_end_day
      ? `${organisation.financial_year_end_day}/${organisation.financial_year_end_month}`
      : "—";

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <section className="border-b border-[#D9E3F4] bg-white">
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          <a
            href="/portal/organisations"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#073D7F]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to organisations
          </a>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_0.35fr]">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                Organisation
              </div>

              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
                {organisation.legal_name}
              </h1>

              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                Manage organisation-level configuration, documents,
                engagements, accounting, reporting, tax, payroll, compliance,
                and advisory workflows.
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-[#F1F1F1] p-5">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-[#073D7F]" />
                <div className="text-sm font-semibold text-slate-950">
                  Organisation Status
                </div>
              </div>

              <div className="mt-4 inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#073D7F]">
                {formatStatus(organisation.status)}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
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

                <div className="mt-5 text-3xl font-semibold text-slate-950">
                  {stat.value}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 grid gap-8 xl:grid-cols-[0.8fr_1.2fr]">
          <section className="rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm">
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
              Organisation Profile
            </div>

            <div className="mt-6 space-y-4 text-sm text-slate-600">
              <p>
                <span className="font-semibold text-slate-950">
                  Trading Name:
                </span>{" "}
                {organisation.trading_name || "—"}
              </p>

              <p>
                <span className="font-semibold text-slate-950">
                  Organisation Type:
                </span>{" "}
                {organisation.organisation_type || "—"}
              </p>

              <p>
                <span className="font-semibold text-slate-950">
                  Registration Number:
                </span>{" "}
                {organisation.registration_number || "—"}
              </p>

              <p>
                <span className="font-semibold text-slate-950">
                  Tax Identification Number:
                </span>{" "}
                {organisation.tax_identification_number || "—"}
              </p>

              <p>
                <span className="font-semibold text-slate-950">
                  Financial Year End:
                </span>{" "}
                {financialYearEnd}
              </p>

              <p>
                <span className="font-semibold text-slate-950">
                  Risk Rating:
                </span>{" "}
                {formatStatus(organisation.risk_rating)}
              </p>
            </div>
          </section>

          <section className="rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm">
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
              Jurisdiction Configuration
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-[#F1F1F1] p-5">
                <Globe2 className="h-5 w-5 text-[#073D7F]" />
                <div className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Jurisdiction
                </div>
                <div className="mt-2 font-semibold text-slate-950">
                  {organisation.jurisdiction_code || "—"}
                </div>
              </div>

              <div className="rounded-2xl bg-[#F1F1F1] p-5">
                <FileText className="h-5 w-5 text-[#073D7F]" />
                <div className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Framework
                </div>
                <div className="mt-2 font-semibold text-slate-950">
                  {formatFramework(organisation.reporting_framework_code)}
                </div>
              </div>

              <div className="rounded-2xl bg-[#F1F1F1] p-5">
                <Coins className="h-5 w-5 text-[#073D7F]" />
                <div className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Base Currency
                </div>
                <div className="mt-2 font-semibold text-slate-950">
                  {organisation.base_currency_code || "—"}
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-[#D9E3F4] bg-white p-5 text-sm text-slate-600">
              This configuration will drive accounting, financial reporting,
              tax, payroll, compliance, and advisory workflows for this
              organisation.
            </div>
          </section>
        </div>

        <section className="mt-8 rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm">
          <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
            Primary Contact
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-[#F1F1F1] p-5 text-sm text-slate-600">
              <div className="font-semibold text-slate-950">Name</div>
              <div className="mt-2">
                {organisation.primary_contact_name || "—"}
              </div>
            </div>

            <div className="rounded-2xl bg-[#F1F1F1] p-5 text-sm text-slate-600">
              <div className="font-semibold text-slate-950">Email</div>
              <div className="mt-2">
                {organisation.primary_contact_email || "—"}
              </div>
            </div>

            <div className="rounded-2xl bg-[#F1F1F1] p-5 text-sm text-slate-600">
              <div className="font-semibold text-slate-950">Phone</div>
              <div className="mt-2">
                {organisation.primary_contact_phone || "—"}
              </div>
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-8 xl:grid-cols-2">
                  <section className="mt-8 overflow-hidden rounded-[2rem] border border-[#D9E3F4] bg-white shadow-sm">
          <div className="flex flex-col gap-4 px-6 py-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                Client User Access
              </div>

              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                Assigned client users
              </h2>

              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                These users are linked to this organisation and will later be
                restricted to organisation-specific documents, engagements, and
                client workflows.
              </p>
            </div>

            <a
              href="/portal/people"
              className="inline-flex rounded-full border border-[#D9E3F4] bg-white px-5 py-3 text-sm font-semibold text-[#073D7F]"
            >
              Manage People Access
            </a>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[850px]">
              <div className="grid grid-cols-[1.4fr_1.7fr_1fr_1fr_0.9fr] bg-[#F1F1F1] px-5 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                <div>Name</div>
                <div>Email</div>
                <div>Access Role</div>
                <div>Status</div>
                <div>Profile</div>
              </div>

              <div className="divide-y divide-[#D9E3F4]">
                {assignedClientUsers.length > 0 ? (
                  assignedClientUsers.map((record) => (
                    <div
                      key={record.id}
                      className="grid grid-cols-[1.4fr_1.7fr_1fr_1fr_0.9fr] px-5 py-4 text-sm text-slate-700"
                    >
                      <div>
                        <div className="font-semibold text-slate-950">
                          {record.profile?.full_name || "Unnamed Client User"}
                        </div>

                        <div className="mt-1 text-xs text-slate-500">
                          {formatAccessRole(record.profile?.role || record.role)}
                        </div>
                      </div>

                      <div className="flex min-w-0 items-center gap-2">
                        <Mail className="h-4 w-4 shrink-0 text-slate-400" />
                        <span className="break-all">
                          {record.profile?.email || "—"}
                        </span>
                      </div>

                      <div>{formatAccessRole(record.access_role)}</div>

                      <div>
                        <span className="rounded-full bg-[#F1F1F1] px-3 py-1 text-xs font-semibold text-[#073D7F]">
                          {formatStatus(record.status)}
                        </span>
                      </div>

                      <div>
                        <a
                          href={`/portal/people/${record.user_id}`}
                          className="font-semibold text-[#073D7F] hover:underline"
                        >
                          Open
                        </a>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-5 py-8 text-sm text-slate-500">
                    No client users have been assigned to this organisation yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
          <section className="rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm">
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
              Recent Documents
            </div>

            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
              Latest uploaded records
            </h2>

            <div className="mt-8 space-y-4">
              {recentDocuments && recentDocuments.length > 0 ? (
                recentDocuments.map((doc) => (
                  <a
                    key={doc.id}
                    href={`/portal/documents/${doc.id}`}
                    className="block rounded-2xl border border-[#D9E3F4] bg-[#F8FAFC] p-5 transition hover:border-[#073D7F]"
                  >
                    <div className="font-semibold text-[#073D7F]">
                      {doc.file_name}
                    </div>

                    <div className="mt-2 text-sm text-slate-600">
                      {doc.module} · {doc.status}
                    </div>
                  </a>
                ))
              ) : (
                <div className="rounded-2xl border border-[#D9E3F4] bg-[#F8FAFC] p-5 text-sm text-slate-500">
                  No documents uploaded yet.
                </div>
              )}
            </div>
          </section>

          <section className="rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm">
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
              Engagements
            </div>

            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
              Create and manage engagement workspaces
            </h2>

            <p className="mt-3 text-sm leading-7 text-slate-600">
              Quickly set up a service engagement for this organisation, or use
              the advanced setup flow when you need to configure a more detailed
              engagement structure.
            </p>

            <div className="mt-6 rounded-[1.5rem] border border-[#D9E3F4] bg-[#F8FAFC] p-5">
              <QuickEngagementForm organisationId={organisation.id} />
            </div>

            <a
              href={`/portal/organisations/${organisation.id}/engagements/new`}
              className="mt-5 inline-flex rounded-full border border-[#D9E3F4] bg-white px-5 py-3 text-sm font-semibold text-[#073D7F]"
            >
              Advanced Engagement Setup
            </a>

            <div className="mt-8 space-y-4">
              {engagements && engagements.length > 0 ? (
                engagements.map((engagement) => (
                  <a
                    key={engagement.id}
                    href={`/portal/engagements/${engagement.id}`}
                    className="block rounded-2xl border border-[#D9E3F4] bg-[#F8FAFC] p-5 transition hover:border-[#073D7F]"
                  >
                    <div className="font-semibold text-slate-950">
                      {engagement.name}
                    </div>

                    <div className="mt-2 text-sm text-slate-600">
                      {engagement.engagement_type} ·{" "}
                      {formatStatus(engagement.status)}
                    </div>
                  </a>
                ))
              ) : (
                <div className="rounded-2xl border border-[#D9E3F4] bg-[#F8FAFC] p-5 text-sm text-slate-500">
                  No engagements created yet.
                </div>
              )}
            </div>
          </section>
        </div>

                <section className="mt-8 rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                Accounting System
              </div>

              <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
                Chart of accounts
              </h2>

              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                Organisation-specific account structure for transaction
                categorisation, posting, trial balance, general ledger, IFRS
                18-ready financial statement mapping, and management reporting.
              </p>
            </div>

            <a
              href={`/portal/organisations/${organisation.id}/chart-of-accounts/new`}
              className="rounded-full bg-[#073D7F] px-6 py-3 text-center text-sm font-semibold text-white"
            >
              Add Account
            </a>
          </div>

          <div className="mt-8 overflow-hidden rounded-[1.5rem] border border-[#D9E3F4]">
            <div className="grid grid-cols-[0.7fr_1.5fr_1fr_1.2fr] bg-[#F1F1F1] px-5 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              <div>Code</div>
              <div>Account</div>
              <div>Type</div>
              <div>FS Mapping</div>
            </div>

            <div className="divide-y divide-[#D9E3F4]">
              {chartAccounts && chartAccounts.length > 0 ? (
                chartAccounts.map((account) => (
                  <div
                    key={account.id}
                    className="grid grid-cols-[0.7fr_1.5fr_1fr_1.2fr] px-5 py-4 text-sm text-slate-700"
                  >
                    <div className="font-semibold text-slate-950">
                      {account.account_code}
                    </div>

                    <div>
                      <div className="font-semibold text-slate-950">
                        {account.account_name}
                      </div>

                      <div className="mt-1 text-xs text-slate-500">
                        {account.is_active ? "Active" : "Inactive"}
                      </div>
                    </div>

                    <div>{account.account_type?.split("_").join(" ")}</div>

                    <div>
                      {account.fs_line_item ||
                        account.fs_section ||
                        "Not mapped yet"}
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-5 py-8 text-sm text-slate-500">
                  No chart of accounts has been created for this organisation
                  yet.
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] bg-[#073D7F] p-8 text-white">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                Long-Term Architecture
              </div>

              <h2 className="mt-4 text-3xl font-semibold tracking-tight">
                This organisation record will become the centre of client work.
              </h2>

              <p className="mt-4 max-w-3xl text-base leading-8 text-blue-100">
                Documents, engagements, accounting records, tax, payroll,
                compliance, financial reporting, and advisory workflows will
                connect through this organisation model.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                "Documents",
                "Engagements",
                "Accounting",
                "Financial Reporting",
                "Tax",
                "Payroll",
                "Compliance",
                "Advisory",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-semibold text-blue-100"
                >
                  <ShieldCheck className="mb-3 h-5 w-5 text-[#6491DE]" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        {organisation.legacy_client_id ? (
          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href={`/portal/clients/${organisation.legacy_client_id}`}
              className="rounded-full border border-[#D9E3F4] bg-white px-6 py-3 text-sm font-semibold text-[#073D7F]"
            >
              Open Legacy Client Workspace
            </a>

            <a
              href={`/portal/clients/${organisation.legacy_client_id}/upload`}
              className="rounded-full bg-[#073D7F] px-6 py-3 text-sm font-semibold text-white"
            >
              Upload Document
            </a>
          </div>
        ) : null}
      </section>
    </main>
  );
}