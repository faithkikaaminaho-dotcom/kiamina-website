import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { ArrowLeft, Users, ShieldCheck, Briefcase, Building2 } from "lucide-react";

export const dynamic = "force-dynamic";

function roleLabel(role: string) {
  const labels: Record<string, string> = {
    SUPER_ADMIN: "Platform Owner",
    ADMIN: "Administrator",
    STAFF: "Team Member",
    CLIENT: "Client User",
  };

  return labels[role] || role;
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
    .select("id, email, full_name, role, job_title, team, office, phone, status, created_at")
    .order("created_at", { ascending: false });

  const staffCount =
    people?.filter((person) =>
      ["SUPER_ADMIN", "ADMIN", "STAFF"].includes(person.role)
    ).length || 0;

  const clientUserCount =
    people?.filter((person) => person.role === "CLIENT").length || 0;

  const activeCount =
    people?.filter((person) => person.status === "active").length || 0;

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <section className="border-b border-[#D9E3F4] bg-white">
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          <a
            href="/portal"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#073D7F]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to portal
          </a>

          <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                People
              </div>

              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
                Staff and client users
              </h1>

              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                Manage the people who work inside Kiamina Platform, including
                internal staff, administrators, and client users.
              </p>
            </div>

            <a
              href="/portal/people/new"
              className="inline-flex rounded-full bg-[#073D7F] px-6 py-3 text-sm font-semibold text-white"
            >
              Invite Person
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="grid gap-5 md:grid-cols-4">
          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <Users className="h-6 w-6 text-[#073D7F]" />
            <div className="mt-5 text-3xl font-semibold text-slate-950">
              {people?.length || 0}
            </div>
            <div className="mt-2 text-sm text-slate-500">Total People</div>
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <Briefcase className="h-6 w-6 text-[#073D7F]" />
            <div className="mt-5 text-3xl font-semibold text-slate-950">
              {staffCount}
            </div>
            <div className="mt-2 text-sm text-slate-500">Internal Staff</div>
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <Building2 className="h-6 w-6 text-[#073D7F]" />
            <div className="mt-5 text-3xl font-semibold text-slate-950">
              {clientUserCount}
            </div>
            <div className="mt-2 text-sm text-slate-500">Client Users</div>
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <ShieldCheck className="h-6 w-6 text-[#073D7F]" />
            <div className="mt-5 text-3xl font-semibold text-slate-950">
              {activeCount}
            </div>
            <div className="mt-2 text-sm text-slate-500">Active</div>
          </div>
        </div>

        <section className="mt-8 overflow-hidden rounded-[2rem] border border-[#D9E3F4] bg-white shadow-sm">
          <div className="grid grid-cols-7 bg-[#F1F1F1] px-5 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            <div>Name</div>
            <div>Email</div>
            <div>Access</div>
            <div>Job Title</div>
            <div>Team</div>
            <div>Office</div>
            <div>Status</div>
          </div>

          <div className="divide-y divide-[#D9E3F4]">
            {people && people.length > 0 ? (
              people.map((person) => (
                <div
                  key={person.id}
                  className="grid grid-cols-7 px-5 py-4 text-sm text-slate-700"
                >
                  <a
                    href={`/portal/people/${person.id}`}
                    className="font-semibold text-[#073D7F] hover:underline"
                  >
                    {person.full_name || "Unnamed Person"}
                  </a>
                  <div>{person.email}</div>
                  <div>{roleLabel(person.role)}</div>
                  <div>{person.job_title || "—"}</div>
                  <div>{person.team || "—"}</div>
                  <div>{person.office || "—"}</div>
                  <div>
                    <span className="rounded-full bg-[#F1F1F1] px-3 py-1 text-xs font-semibold text-[#073D7F]">
                      {person.status || "active"}
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
        </section>
      </section>
    </main>
  );
}