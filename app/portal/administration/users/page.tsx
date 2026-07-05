import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { ArrowLeft, Users, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
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

  const { data: users } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, job_title, team, office, phone, status, created_at")
    .order("created_at", { ascending: false });

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
                Administration
              </div>

              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
                Users
              </h1>

              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                Manage internal staff and client users across Kiamina Platform.
              </p>
            </div>

            <a
              href="/portal/administration/users/new"
              className="inline-flex rounded-full bg-[#073D7F] px-6 py-3 text-sm font-semibold text-white"
            >
              Invite User
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="grid gap-5 md:grid-cols-3">
          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <Users className="h-6 w-6 text-[#073D7F]" />
            <div className="mt-5 text-3xl font-semibold text-slate-950">
              {users?.length || 0}
            </div>
            <div className="mt-2 text-sm text-slate-500">Total Users</div>
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <ShieldCheck className="h-6 w-6 text-[#073D7F]" />
            <div className="mt-5 text-3xl font-semibold text-slate-950">
              {users?.filter((item) => item.status === "active").length || 0}
            </div>
            <div className="mt-2 text-sm text-slate-500">Active Users</div>
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <ShieldCheck className="h-6 w-6 text-[#073D7F]" />
            <div className="mt-5 text-3xl font-semibold text-slate-950">
              {users?.filter((item) => item.role === "SUPER_ADMIN").length || 0}
            </div>
            <div className="mt-2 text-sm text-slate-500">Super Admins</div>
          </div>
        </div>

        <section className="mt-8 overflow-hidden rounded-[2rem] border border-[#D9E3F4] bg-white shadow-sm">
          <div className="grid grid-cols-7 bg-[#F1F1F1] px-5 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            <div>Name</div>
            <div>Email</div>
            <div>Role</div>
            <div>Job Title</div>
            <div>Team</div>
            <div>Office</div>
            <div>Status</div>
          </div>

          <div className="divide-y divide-[#D9E3F4]">
            {users && users.length > 0 ? (
              users.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-7 px-5 py-4 text-sm text-slate-700"
                >
                  <div className="font-semibold text-slate-950">
                    {item.full_name || "—"}
                  </div>
                  <div>{item.email}</div>
                  <div>{item.role}</div>
                  <div>{item.job_title || "—"}</div>
                  <div>{item.team || "—"}</div>
                  <div>{item.office || "—"}</div>
                  <div>
                    <span className="rounded-full bg-[#F1F1F1] px-3 py-1 text-xs font-semibold text-[#073D7F]">
                      {item.status || "active"}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-5 py-8 text-sm text-slate-500">
                No users found.
              </div>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}