import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { ArrowLeft, UserPlus } from "lucide-react";
import InvitePersonForm from "./InvitePersonForm";

export const dynamic = "force-dynamic";

export default async function NewPersonPage() {
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

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <section className="border-b border-[#D9E3F4] bg-white">
        <div className="mx-auto max-w-5xl px-6 py-8 lg:px-8">
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
                Invite a person
              </h1>

              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                Add internal Kiamina users or client users to the platform. If
                Client User is selected, internal team fields will be hidden
                because client access should be managed through organisation
                assignment.
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-[#F1F1F1] p-5">
              <div className="flex items-center gap-3">
                <UserPlus className="h-5 w-5 text-[#073D7F]" />
                <div className="text-sm font-semibold text-slate-950">
                  User Invitation
                </div>
              </div>

              <p className="mt-4 text-sm leading-7 text-slate-600">
                Internal users can have teams, offices, and job titles. Client
                users should be tied to organisation access.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-10 lg:px-8">
        <section className="rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm">
          <InvitePersonForm />
        </section>
      </section>
    </main>
  );
}