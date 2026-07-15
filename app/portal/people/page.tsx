import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import {
  ArrowLeft,
  Building2,
  Briefcase,
  Mail,
  Phone,
  ShieldCheck,
  UserPlus,
  Users,
} from "lucide-react";

export const dynamic = "force-dynamic";

function roleLabel(role?: string | null) {
  const labels: Record<string, string> = {
    SUPER_ADMIN: "Platform Owner",
    ADMIN: "Administrator",
    STAFF: "Team Member",
    CLIENT: "Client User",
    IT_ADMIN: "IT Administrator",
    ACCOUNTANT_ADMIN: "Accounting Admin",
    ACCOUNTANT_USER: "Accounting User",
    CUSTOMER_SUPPORT: "Customer Support",
    COMPLIANCE_ADMIN: "Compliance Admin",
    OPERATIONS_ADMIN: "Operations Admin",
  };

  if (!role) return "—";

  return labels[role] || role;
}

function formatStatus(status?: string | null) {
  if (!status) return "Active";

  return status
    .split("_")
    .join(" ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function isInternalRole(role?: string | null) {
  return [
    "SUPER_ADMIN",
    "ADMIN",
    "STAFF",
    "IT_ADMIN",
    "ACCOUNTANT_ADMIN",
    "ACCOUNTANT_USER",
    "CUSTOMER_SUPPORT",
    "COMPLIANCE_ADMIN",
    "OPERATIONS_ADMIN",
  ].includes(role || "");
}

function teamLabel(role?: string | null, team?: string | null) {
  if (role === "CLIENT") {
    return "Client User";
  }

  return team || "—";
}

export default async function PeoplePage() {
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

  if (!profile || profile.role !== "SUPER_ADMIN") {
    redirect("/portal");
  }

  const { data: people } = await supabase
    .from("profiles")
    .select(
      "id, email, full_name, role, job_title, team, office, phone, status, created_at"
    )
    .order("created_at", { ascending: false });

  const totalPeople = people?.length || 0;

  const internalCount =
    people?.filter((person) => isInternalRole(person.role)).length || 0;

  const clientUserCount =
    people?.filter((person) => person.role === "CLIENT").length || 0;

  const activeCount =
    people?.filter((person) => !person.status || person.status === "active")
      .length || 0;

  const inactiveCount =
    people?.filter((person) => person.status && person.status !== "active")
      .length || 0;

  const stats = [
    {
      label: "Total People",
      value: totalPeople,
      icon: Users,
    },
    {
      label: "Internal Team",
      value: internalCount,
      icon: Briefcase,
    },
    {
      label: "Client Users",
      value: clientUserCount,
      icon: Building2,
    },
    {
      label: "Active Users",
      value: activeCount,
      icon: ShieldCheck,
    },
  ];

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <section className="border-b border-[#D9E3F4] bg-white">
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          <a
            href="/portal"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#073D7F]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </a>

          <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                People & Access
              </div>

              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
                Team members and platform users
              </h1>

              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                Manage people who work inside Kiamina Platform, including
                internal team members, administrators, accounting users, support
                users, compliance users, operations users, and client users.
              </p>
            </div>

            <a
              href="/portal/people/new"
              className="inline-flex items-center gap-2 rounded-full bg-[#073D7F] px-6 py-3 text-sm font-semibold text-white"
            >
              <UserPlus className="h-4 w-4" />
              Invite Person
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

                <div className="mt-5 text-3xl font-semibold text-slate-950">
                  {stat.value}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 grid gap-8 xl:grid-cols-[0.75fr_1.25fr]">
          <section className="rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm">
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
              Access Overview
            </div>

            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
              Role-based access control
            </h2>

            <p className="mt-4 text-sm leading-7 text-slate-600">
              People records are linked to authentication profiles and determine
              what each user can access inside the portal.
            </p>

            <div className="mt-6 space-y-4">
              <div className="rounded-2xl bg-[#F8FAFC] p-5">
                <div className="text-sm font-semibold text-slate-950">
                  Internal users
                </div>
                <div className="mt-2 text-sm leading-7 text-slate-600">
                  Super Admin, Admin, Staff, Accounting, Compliance, Operations,
                  IT, and Support roles. These users can be assigned internal
                  teams, offices, and job titles.
                </div>
              </div>

              <div className="rounded-2xl bg-[#F8FAFC] p-5">
                <div className="text-sm font-semibold text-slate-950">
                  Client users
                </div>
                <div className="mt-2 text-sm leading-7 text-slate-600">
                  Client-facing users should be linked to organisations or
                  client workspaces, not internal Kiamina teams. Organisation
                  access will be managed separately.
                </div>
              </div>

              <div className="rounded-2xl bg-[#F8FAFC] p-5">
                <div className="text-sm font-semibold text-slate-950">
                  Inactive records
                </div>
                <div className="mt-2 text-sm leading-7 text-slate-600">
                  {inactiveCount} user record{inactiveCount === 1 ? "" : "s"}{" "}
                  currently appear inactive or not marked as active.
                </div>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-[2rem] border border-[#D9E3F4] bg-white shadow-sm">
            <div className="flex flex-col gap-4 px-6 py-6 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                  People Directory
                </div>

                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                  Users, roles, access, and contact details
                </h2>

                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                  Internal users can have teams and offices. Client users should
                  be managed through organisation access.
                </p>
              </div>

              <a
                href="/portal/people/new"
                className="inline-flex rounded-full border border-[#D9E3F4] bg-white px-5 py-3 text-sm font-semibold text-[#073D7F]"
              >
                Add New Person
              </a>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-[1250px]">
                <div className="grid grid-cols-[1.25fr_1.7fr_1.15fr_1.1fr_1fr_1fr_1fr_0.8fr] bg-[#F1F1F1] px-5 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  <div>Name</div>
                  <div>Email</div>
                  <div>Access</div>
                  <div>Job Title</div>
                  <div>Team / Client Access</div>
                  <div>Office</div>
                  <div>Phone</div>
                  <div>Status</div>
                </div>

                <div className="divide-y divide-[#D9E3F4]">
                  {people && people.length > 0 ? (
                    people.map((person) => (
                      <div
                        key={person.id}
                        className="grid grid-cols-[1.25fr_1.7fr_1.15fr_1.1fr_1fr_1fr_1fr_0.8fr] px-5 py-4 text-sm text-slate-700"
                      >
                        <div className="min-w-0">
                          <a
                            href={`/portal/people/${person.id}`}
                            className="font-semibold text-[#073D7F] hover:underline"
                          >
                            {person.full_name || "Unnamed Person"}
                          </a>

                          <div className="mt-1 text-xs text-slate-500">
                            Created{" "}
                            {person.created_at
                              ? new Date(person.created_at).toLocaleDateString()
                              : "—"}
                          </div>
                        </div>

                        <div className="flex min-w-0 items-center gap-2">
                          <Mail className="h-4 w-4 shrink-0 text-slate-400" />
                          <span className="break-all">
                            {person.email || "—"}
                          </span>
                        </div>

                        <div>{roleLabel(person.role)}</div>

                        <div>{person.job_title || "—"}</div>

                        <div>{teamLabel(person.role, person.team)}</div>

                        <div>
                          {person.role === "CLIENT"
                            ? "Client Workspace"
                            : person.office || "—"}
                        </div>

                        <div className="flex min-w-0 items-center gap-2">
                          <Phone className="h-4 w-4 shrink-0 text-slate-400" />
                          <span className="break-all">
                            {person.phone || "—"}
                          </span>
                        </div>

                        <div>
                          <span className="rounded-full bg-[#F1F1F1] px-3 py-1 text-xs font-semibold text-[#073D7F]">
                            {formatStatus(person.status)}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-5 py-8 text-sm text-slate-500">
                      No people found.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>

        <section className="mt-8 rounded-[2rem] bg-[#073D7F] p-8 text-white">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                Governance Note
              </div>

              <h2 className="mt-4 text-3xl font-semibold tracking-tight">
                People access should be reviewed regularly.
              </h2>

              <p className="mt-4 max-w-3xl text-base leading-8 text-blue-100">
                User roles determine who can view organisations, engagement
                workspaces, document reviews, settings, and administrative
                records. Client users should be restricted to assigned
                organisations and relevant document workflows.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                "Super Admin controls platform settings",
                "Internal users manage workflows",
                "Client users should have restricted access",
                "Inactive users should be reviewed",
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
      </section>
    </main>
  );
}