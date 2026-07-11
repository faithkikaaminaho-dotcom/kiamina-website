import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import {
  ArrowLeft,
  Building2,
  Coins,
  FileText,
  Globe2,
  ShieldCheck,
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

export default async function OrganisationsPage() {
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

  const { data: organisations } = await supabase
    .from("organisations")
    .select(
      "id, legal_name, trading_name, organisation_type, status, jurisdiction_code, reporting_framework_code, base_currency_code, primary_contact_name, primary_contact_email, created_at"
    )
    .order("created_at", { ascending: false });

  const totalOrganisations = organisations?.length || 0;
  const onboardingCount =
    organisations?.filter((item) => item.status === "onboarding").length || 0;
  const activeCount =
    organisations?.filter((item) => item.status === "active").length || 0;

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
                Organisations
              </div>

              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
                Client organisations
              </h1>

              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                Manage organisation records that support documents, accounting,
                engagements, reporting, tax, payroll, compliance, and advisory
                workflows.
              </p>
            </div>

            <a
              href="/portal/clients/new"
              className="inline-flex rounded-full bg-[#073D7F] px-6 py-3 text-sm font-semibold text-white"
            >
              Create Organisation
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="grid gap-5 md:grid-cols-3">
          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <Building2 className="h-6 w-6 text-[#073D7F]" />
            <div className="mt-5 text-3xl font-semibold text-slate-950">
              {totalOrganisations}
            </div>
            <div className="mt-2 text-sm text-slate-500">
              Total Organisations
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <ShieldCheck className="h-6 w-6 text-[#073D7F]" />
            <div className="mt-5 text-3xl font-semibold text-slate-950">
              {onboardingCount}
            </div>
            <div className="mt-2 text-sm text-slate-500">Onboarding</div>
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
          <div className="overflow-x-auto">
            <div className="min-w-[950px]">
              <div className="grid grid-cols-7 bg-[#F1F1F1] px-5 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                <div>Organisation</div>
                <div>Jurisdiction</div>
                <div>Framework</div>
                <div>Currency</div>
                <div>Type</div>
                <div>Contact</div>
                <div>Status</div>
              </div>

              <div className="divide-y divide-[#D9E3F4]">
                {organisations && organisations.length > 0 ? (
                  organisations.map((item) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-7 px-5 py-4 text-sm text-slate-700"
                    >
                      <a
                        href={`/portal/organisations/${item.id}`}
                        className="font-semibold text-[#073D7F] hover:underline"
                      >
                        {item.legal_name}
                      </a>

                      <div className="flex items-center gap-2">
                        <Globe2 className="h-4 w-4 text-[#073D7F]" />
                        {item.jurisdiction_code || "—"}
                      </div>

                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-[#073D7F]" />
                        {formatFramework(item.reporting_framework_code)}
                      </div>

                      <div className="flex items-center gap-2">
                        <Coins className="h-4 w-4 text-[#073D7F]" />
                        {item.base_currency_code || "—"}
                      </div>

                      <div>{item.organisation_type || "—"}</div>

                      <div>{item.primary_contact_email || "—"}</div>

                      <div>
                        <span className="rounded-full bg-[#F1F1F1] px-3 py-1 text-xs font-semibold text-[#073D7F]">
                          {formatStatus(item.status)}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-5 py-8 text-sm text-slate-500">
                    No organisations found.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}