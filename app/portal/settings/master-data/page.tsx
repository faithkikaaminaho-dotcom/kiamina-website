import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import {
  ArrowLeft,
  Globe2,
  FileText,
  Coins,
  Building2,
  Users,
  Briefcase,
  FolderOpen,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MasterDataPage() {
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

  const [
    reportingFrameworksResult,
    currenciesResult,
    jurisdictionsResult,
    officesResult,
    teamsResult,
    industriesResult,
    documentCategoriesResult,
  ] = await Promise.all([
    supabase
      .from("reporting_frameworks")
      .select("code, name, description, is_active")
      .order("code"),

    supabase
      .from("currencies")
      .select("code, name, symbol, is_active")
      .order("code"),

    supabase
      .from("jurisdictions")
      .select(
        "code, name, reporting_framework_code, currency_code, primary_tax_authority, corporate_registry, financial_reporting_regulator, payroll_authority, is_active"
      )
      .order("name"),

    supabase
      .from("offices")
      .select("id, name, jurisdiction_code, city, address, is_active")
      .order("name"),

    supabase
      .from("teams")
      .select("id, name, description, is_active")
      .order("name"),

    supabase
      .from("industries")
      .select("id, name, description, is_active")
      .order("name"),

    supabase
      .from("document_categories")
      .select("id, code, name, module_code, description, is_kyc, display_order, is_active")
      .order("display_order"),
  ]);

  const reportingFrameworks = reportingFrameworksResult.data || [];
  const currencies = currenciesResult.data || [];
  const jurisdictions = jurisdictionsResult.data || [];
  const offices = officesResult.data || [];
  const teams = teamsResult.data || [];
  const industries = industriesResult.data || [];
  const documentCategories = documentCategoriesResult.data || [];

  const summaryCards = [
    {
      label: "Jurisdictions",
      value: jurisdictions.length,
      icon: Globe2,
    },
    {
      label: "Reporting Frameworks",
      value: reportingFrameworks.length,
      icon: FileText,
    },
    {
      label: "Currencies",
      value: currencies.length,
      icon: Coins,
    },
    {
      label: "Offices",
      value: offices.length,
      icon: Building2,
    },
    {
      label: "Teams",
      value: teams.length,
      icon: Users,
    },
    {
      label: "Industries",
      value: industries.length,
      icon: Briefcase,
    },
    {
      label: "Document Categories",
      value: documentCategories.length,
      icon: FolderOpen,
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
            Back to portal
          </a>

          <div className="mt-8">
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
              Platform Settings
            </div>

            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
              Master Data
            </h1>

            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
              View the core configuration data that powers jurisdictions,
              reporting frameworks, currencies, offices, teams, industries, and
              document categories across Kiamina Platform.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => {
            const Icon = card.icon;

            return (
              <div
                key={card.label}
                className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-slate-500">
                    {card.label}
                  </div>

                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F1F1F1] text-[#073D7F]">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>

                <div className="mt-5 text-3xl font-semibold text-slate-950">
                  {card.value}
                </div>
              </div>
            );
          })}
        </div>

        <section className="mt-8 overflow-hidden rounded-[2rem] border border-[#D9E3F4] bg-white shadow-sm">
          <div className="px-6 py-6">
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
              Jurisdictions
            </div>

            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
              Country, framework, currency, and regulator setup
            </h2>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[950px]">
              <div className="grid grid-cols-6 bg-[#F1F1F1] px-5 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                <div>Country</div>
                <div>Framework</div>
                <div>Currency</div>
                <div>Tax Authority</div>
                <div>Corporate Registry</div>
                <div>Status</div>
              </div>

              <div className="divide-y divide-[#D9E3F4]">
                {jurisdictions.map((item) => (
                  <div
                    key={item.code}
                    className="grid grid-cols-6 px-5 py-4 text-sm text-slate-700"
                  >
                    <div className="font-semibold text-slate-950">
                      {item.name}
                    </div>

                    <div>{item.reporting_framework_code}</div>

                    <div>{item.currency_code}</div>

                    <div>{item.primary_tax_authority || "—"}</div>

                    <div>{item.corporate_registry || "—"}</div>

                    <div>
                      <span className="rounded-full bg-[#F1F1F1] px-3 py-1 text-xs font-semibold text-[#073D7F]">
                        {item.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-8 xl:grid-cols-2">
          <section className="overflow-hidden rounded-[2rem] border border-[#D9E3F4] bg-white shadow-sm">
            <div className="px-6 py-6">
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                Reporting Frameworks
              </div>

              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                Accounting standards
              </h2>
            </div>

            <div className="divide-y divide-[#D9E3F4]">
              {reportingFrameworks.map((item) => (
                <div key={item.code} className="px-6 py-4">
                  <div className="font-semibold text-slate-950">
                    {item.name}
                  </div>
                  <div className="mt-1 text-sm text-slate-600">
                    {item.description || "—"}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="overflow-hidden rounded-[2rem] border border-[#D9E3F4] bg-white shadow-sm">
            <div className="px-6 py-6">
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                Currencies
              </div>

              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                Currency setup
              </h2>
            </div>

            <div className="divide-y divide-[#D9E3F4]">
              {currencies.map((item) => (
                <div
                  key={item.code}
                  className="flex items-center justify-between px-6 py-4"
                >
                  <div>
                    <div className="font-semibold text-slate-950">
                      {item.code}
                    </div>
                    <div className="mt-1 text-sm text-slate-600">
                      {item.name}
                    </div>
                  </div>

                  <div className="text-lg font-semibold text-[#073D7F]">
                    {item.symbol || item.code}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="mt-8 grid gap-8 xl:grid-cols-2">
          <section className="overflow-hidden rounded-[2rem] border border-[#D9E3F4] bg-white shadow-sm">
            <div className="px-6 py-6">
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                Teams
              </div>

              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                Internal team structure
              </h2>
            </div>

            <div className="divide-y divide-[#D9E3F4]">
              {teams.map((item) => (
                <div key={item.id} className="px-6 py-4">
                  <div className="font-semibold text-slate-950">
                    {item.name}
                  </div>
                  <div className="mt-1 text-sm text-slate-600">
                    {item.description || "—"}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="overflow-hidden rounded-[2rem] border border-[#D9E3F4] bg-white shadow-sm">
            <div className="px-6 py-6">
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                Offices
              </div>

              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                Office and remote operating locations
              </h2>
            </div>

            <div className="divide-y divide-[#D9E3F4]">
              {offices.map((item) => (
                <div key={item.id} className="px-6 py-4">
                  <div className="font-semibold text-slate-950">
                    {item.name}
                  </div>
                  <div className="mt-1 text-sm text-slate-600">
                    {item.city || "—"} · {item.jurisdiction_code || "—"}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="mt-8 overflow-hidden rounded-[2rem] border border-[#D9E3F4] bg-white shadow-sm">
          <div className="px-6 py-6">
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
              Document Categories
            </div>

            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
              Document intake and classification setup
            </h2>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[850px]">
              <div className="grid grid-cols-5 bg-[#F1F1F1] px-5 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                <div>Code</div>
                <div>Name</div>
                <div>Module</div>
                <div>KYC</div>
                <div>Status</div>
              </div>

              <div className="divide-y divide-[#D9E3F4]">
                {documentCategories.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-5 px-5 py-4 text-sm text-slate-700"
                  >
                    <div className="font-semibold text-slate-950">
                      {item.code}
                    </div>

                    <div>{item.name}</div>

                    <div>{item.module_code}</div>

                    <div>{item.is_kyc ? "Yes" : "No"}</div>

                    <div>
                      <span className="rounded-full bg-[#F1F1F1] px-3 py-1 text-xs font-semibold text-[#073D7F]">
                        {item.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}