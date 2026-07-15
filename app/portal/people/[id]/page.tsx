import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import {
  ArrowLeft,
  Building2,
  Briefcase,
  Mail,
  Phone,
  ShieldCheck,
  User,
} from "lucide-react";
import AssignOrganisationAccessForm from "./AssignOrganisationAccessForm";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

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

function formatAccessRole(role?: string | null) {
  if (!role) return "—";

  return role
    .split("_")
    .join(" ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default async function PersonDetailPage({ params }: RouteContext) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin");
  }

  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!currentProfile || currentProfile.role !== "SUPER_ADMIN") {
    redirect("/portal");
  }

  const { data: person } = await supabase
    .from("profiles")
    .select(
      "id, email, full_name, role, job_title, team, office, phone, status, created_at"
    )
    .eq("id", id)
    .single();

  if (!person) {
    redirect("/portal/people");
  }

  const { data: organisations } = await supabase
    .from("organisations")
    .select("id, legal_name, trading_name, jurisdiction_code")
    .order("legal_name", { ascending: true });

  const { data: accessRecords } = await supabase
    .from("organisation_users")
    .select(
      `
      id,
      organisation_id,
      user_id,
      access_role,
      status,
      created_at,
      organisations (
        id,
        legal_name,
        trading_name,
        jurisdiction_code
      )
    `
    )
    .eq("user_id", id)
    .order("created_at", { ascending: false });

  const isClientUser = person.role === "CLIENT";

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <section className="border-b border-[#D9E3F4] bg-white">
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          <a
            href="/portal/people"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#073D7F]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to people
          </a>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_0.35fr]">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                People & Access
              </div>

              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
                {person.full_name || "Unnamed Person"}
              </h1>

              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                Review user profile, platform role, contact details, internal
                team information, and client organisation access.
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-[#F1F1F1] p-5">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-[#073D7F]" />
                <div className="text-sm font-semibold text-slate-950">
                  Access Role
                </div>
              </div>

              <div className="mt-4 inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#073D7F]">
                {roleLabel(person.role)}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="grid gap-8 xl:grid-cols-[0.8fr_1.2fr]">
          <section className="rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm">
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
              Profile Summary
            </div>

            <div className="mt-6 space-y-5 text-sm text-slate-600">
              <div className="flex gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[#073D7F]" />
                <div className="min-w-0 break-all">{person.email || "—"}</div>
              </div>

              <div className="flex gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-[#073D7F]" />
                <div>{person.phone || "—"}</div>
              </div>

              <div>
                <span className="font-semibold text-slate-950">Status:</span>{" "}
                {formatStatus(person.status)}
              </div>

              <div>
                <span className="font-semibold text-slate-950">Created:</span>{" "}
                {person.created_at
                  ? new Date(person.created_at).toLocaleDateString()
                  : "—"}
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm">
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
              Internal Assignment
            </div>

            {isClientUser ? (
              <div className="mt-6 rounded-[1.5rem] bg-[#F8FAFC] p-6">
                <div className="flex items-start gap-4">
                  <Building2 className="mt-1 h-5 w-5 shrink-0 text-[#073D7F]" />
                  <div>
                    <h2 className="text-lg font-semibold text-slate-950">
                      Client user
                    </h2>

                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      This user is a client user and should not be assigned to
                      an internal Kiamina team, office, or job title. Access
                      should be controlled through organisation assignment.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl bg-[#F8FAFC] p-5">
                  <Briefcase className="h-5 w-5 text-[#073D7F]" />
                  <div className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Job Title
                  </div>
                  <div className="mt-2 text-sm font-semibold text-slate-950">
                    {person.job_title || "—"}
                  </div>
                </div>

                <div className="rounded-2xl bg-[#F8FAFC] p-5">
                  <ShieldCheck className="h-5 w-5 text-[#073D7F]" />
                  <div className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Team
                  </div>
                  <div className="mt-2 text-sm font-semibold text-slate-950">
                    {person.team || "—"}
                  </div>
                </div>

                <div className="rounded-2xl bg-[#F8FAFC] p-5">
                  <Building2 className="h-5 w-5 text-[#073D7F]" />
                  <div className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Office
                  </div>
                  <div className="mt-2 text-sm font-semibold text-slate-950">
                    {person.office || "—"}
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>

        {isClientUser ? (
          <div className="mt-8 grid gap-8 xl:grid-cols-[0.85fr_1.15fr]">
            <section className="rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm">
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                Assign Organisation Access
              </div>

              <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
                Link this client user to an organisation
              </h2>

              <p className="mt-4 text-sm leading-7 text-slate-600">
                Select the organisation this client user should access. This
                will support future client portal permissions.
              </p>

              <div className="mt-6">
                <AssignOrganisationAccessForm
                  personId={person.id}
                  organisations={organisations || []}
                />
              </div>
            </section>

            <section className="overflow-hidden rounded-[2rem] border border-[#D9E3F4] bg-white shadow-sm">
              <div className="px-6 py-6">
                <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                  Current Organisation Access
                </div>

                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                  Assigned organisations
                </h2>
              </div>

              <div className="divide-y divide-[#D9E3F4]">
                {accessRecords && accessRecords.length > 0 ? (
                  accessRecords.map((record) => {
                    const organisation = Array.isArray(record.organisations)
                      ? record.organisations[0]
                      : record.organisations;

                    return (
                      <a
                        key={record.id}
                        href={`/portal/organisations/${record.organisation_id}`}
                        className="block px-6 py-5 transition hover:bg-[#F8FAFC]"
                      >
                        <div className="font-semibold text-[#073D7F]">
                          {organisation?.trading_name ||
                            organisation?.legal_name ||
                            "Organisation"}
                        </div>

                        <div className="mt-2 text-sm text-slate-600">
                          {organisation?.jurisdiction_code || "—"} ·{" "}
                          {formatAccessRole(record.access_role)} ·{" "}
                          {formatStatus(record.status)}
                        </div>
                      </a>
                    );
                  })
                ) : (
                  <div className="px-6 py-8 text-sm text-slate-500">
                    No organisation access assigned yet.
                  </div>
                )}
              </div>
            </section>
          </div>
        ) : null}

        <section className="mt-8 rounded-[2rem] bg-[#073D7F] p-8 text-white">
          <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
            Access Governance
          </div>

          <h2 className="mt-4 text-3xl font-semibold tracking-tight">
            Client access should be organisation-specific.
          </h2>

          <p className="mt-4 max-w-4xl text-base leading-8 text-blue-100">
            Internal Kiamina users work through teams and office assignments.
            Client users should be restricted to assigned organisations and
            relevant engagement or document workflows.
          </p>
        </section>
      </section>
    </main>
  );
}