import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  CheckCircle,
  Coins,
  FileText,
  FolderOpen,
  Globe2,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";

export const dynamic = "force-dynamic";

function statusBadge(isActive?: boolean | null) {
  return isActive ? "Active" : "Inactive";
}

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
      .select(
        "id, code, name, module_code, description, is_kyc, display_order, is_active"
      )
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
      href: "#jurisdictions",
    },
    {
      label: "Reporting Frameworks",
      value: reportingFrameworks.length,
      icon: FileText,
      href: "#reporting-frameworks",
    },
    {
      label: "Currencies",
      value: currencies.length,
      icon: Coins,
      href: "#currencies",
    },
    {
      label: "Document Categories",
      value: documentCategories.length,
      icon: FolderOpen,
      href: "#document-categories",
    },
    {
      label: "Teams",
      value: teams.length,
      icon: Users,
      href: "#teams",
    },
    {
      label: "Offices",
      value: offices.length,
      icon: Building2,
      href: "#offices",
    },
    {
      label: "Industries",
      value: industries.length,
      icon: Briefcase,
      href: "#industries",
    },
  ];

  const settingsSections = [
    {
      title: "Jurisdiction Setup",
      body: "Country-level configuration for reporting frameworks, currencies, tax authorities, corporate registries, and payroll regulators.",
      icon: Globe2,
    },
    {
      title: "Accounting Standards",
      body: "Reporting framework configuration for IFRS, IFRS for SMEs, US GAAP, and future standards supported by Kiamina.",
      icon: FileText,
    },
    {
      title: "Document Classification",
      body: "Document category rules used for client uploads, engagement evidence, document reviews, and compliance workflows.",
      icon: FolderOpen,
    },
    {
      title: "Operating Structure",
      body: "Internal offices, teams, industries, job roles, and other configuration records used across the platform.",
      icon: Building2,
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

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_0.35fr]">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                Platform Settings
              </div>

              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
                Settings Hub
              </h1>

              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                Manage and review the core configuration data that powers
                jurisdictions, reporting frameworks, currencies, document
                intake, teams, offices, industries, and administrative setup
                across Kiamina Platform.
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-[#F1F1F1] p-5">
              <div className="flex items-center gap-3">
                <Settings className="h-5 w-5 text-[#073D7F]" />
                <div className="text-sm font-semibold text-slate-950">
                  Admin Configuration
                </div>
              </div>

              <p className="mt-4 text-sm leading-7 text-slate-600">
                This area is restricted to Super Admin users and should be
                updated carefully because it affects platform-wide workflows.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <section className="rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm">
          <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
            Settings Overview
          </div>

          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
            Core platform configuration
          </h2>

          <p className="mt-4 max-w-4xl text-base leading-8 text-slate-600">
            These master data records support client onboarding, organisation
            setup, engagement creation, document classification, financial
            reporting, tax compliance, payroll, and review workflows.
          </p>

          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {settingsSections.map((section) => {
              const Icon = section.icon;

              return (
                <div
                  key={section.title}
                  className="rounded-[1.5rem] border border-[#D9E3F4] bg-[#F8FAFC] p-6"
                >
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#073D7F]">
                    <Icon className="h-5 w-5" />
                  </div>

                  <h3 className="mt-5 text-lg font-semibold text-slate-950">
                    {section.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {section.body}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => {
            const Icon = card.icon;

            return (
              <a
                key={card.label}
                href={card.href}
                className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-[#073D7F]"
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
              </a>
            );
          })}
        </div>

        <section
          id="jurisdictions"
          className="mt-8 overflow-hidden rounded-[2rem] border border-[#D9E3F4] bg-white shadow-sm"
        >
          <div className="px-6 py-6">
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
              Jurisdictions
            </div>

            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
              Country, framework, currency, and regulator setup
            </h2>

            <p className="mt-3 text-sm leading-7 text-slate-600">
              This configuration drives country-specific onboarding, reporting,
              tax, payroll, and compliance context.
            </p>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[1100px]">
              <div className="grid grid-cols-7 bg-[#F1F1F1] px-5 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                <div>Country</div>
                <div>Framework</div>
                <div>Currency</div>
                <div>Tax Authority</div>
                <div>Corporate Registry</div>
                <div>Payroll Authority</div>
                <div>Status</div>
              </div>

              <div className="divide-y divide-[#D9E3F4]">
                {jurisdictions.map((item) => (
                  <div
                    key={item.code}
                    className="grid grid-cols-7 px-5 py-4 text-sm text-slate-700"
                  >
                    <div>
                      <div className="font-semibold text-slate-950">
                        {item.name}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {item.code}
                      </div>
                    </div>

                    <div>{item.reporting_framework_code || "—"}</div>

                    <div>{item.currency_code || "—"}</div>

                    <div>{item.primary_tax_authority || "—"}</div>

                    <div>{item.corporate_registry || "—"}</div>

                    <div>{item.payroll_authority || "—"}</div>

                    <div>
                      <span className="rounded-full bg-[#F1F1F1] px-3 py-1 text-xs font-semibold text-[#073D7F]">
                        {statusBadge(item.is_active)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-8 xl:grid-cols-2">
          <section
            id="reporting-frameworks"
            className="overflow-hidden rounded-[2rem] border border-[#D9E3F4] bg-white shadow-sm"
          >
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
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-semibold text-slate-950">
                        {item.name}
                      </div>
                      <div className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                        {item.code}
                      </div>
                    </div>

                    <span className="rounded-full bg-[#F1F1F1] px-3 py-1 text-xs font-semibold text-[#073D7F]">
                      {statusBadge(item.is_active)}
                    </span>
                  </div>

                  <div className="mt-3 text-sm leading-7 text-slate-600">
                    {item.description || "—"}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section
            id="currencies"
            className="overflow-hidden rounded-[2rem] border border-[#D9E3F4] bg-white shadow-sm"
          >
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
                  className="flex items-center justify-between gap-4 px-6 py-4"
                >
                  <div>
                    <div className="font-semibold text-slate-950">
                      {item.code}
                    </div>
                    <div className="mt-1 text-sm text-slate-600">
                      {item.name}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-semibold text-[#073D7F]">
                      {item.symbol || item.code}
                    </div>

                    <div className="mt-1 text-xs font-semibold text-slate-500">
                      {statusBadge(item.is_active)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section
          id="document-categories"
          className="mt-8 overflow-hidden rounded-[2rem] border border-[#D9E3F4] bg-white shadow-sm"
        >
          <div className="px-6 py-6">
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
              Document Categories
            </div>

            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
              Document intake and classification setup
            </h2>

            <p className="mt-3 text-sm leading-7 text-slate-600">
              These records drive document upload categorisation, engagement
              evidence classification, document reviews, and future extraction
              workflows.
            </p>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[900px]">
              <div className="grid grid-cols-6 bg-[#F1F1F1] px-5 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                <div>Code</div>
                <div>Name</div>
                <div>Module</div>
                <div>KYC</div>
                <div>Order</div>
                <div>Status</div>
              </div>

              <div className="divide-y divide-[#D9E3F4]">
                {documentCategories.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-6 px-5 py-4 text-sm text-slate-700"
                  >
                    <div className="font-semibold text-slate-950">
                      {item.code}
                    </div>

                    <div>
                      <div className="font-semibold text-slate-950">
                        {item.name}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {item.description || "—"}
                      </div>
                    </div>

                    <div>{item.module_code || "—"}</div>

                    <div>{item.is_kyc ? "Yes" : "No"}</div>

                    <div>{item.display_order ?? "—"}</div>

                    <div>
                      <span className="rounded-full bg-[#F1F1F1] px-3 py-1 text-xs font-semibold text-[#073D7F]">
                        {statusBadge(item.is_active)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-8 xl:grid-cols-2">
          <section
            id="teams"
            className="overflow-hidden rounded-[2rem] border border-[#D9E3F4] bg-white shadow-sm"
          >
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
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-semibold text-slate-950">
                        {item.name}
                      </div>
                      <div className="mt-1 text-sm text-slate-600">
                        {item.description || "—"}
                      </div>
                    </div>

                    <span className="rounded-full bg-[#F1F1F1] px-3 py-1 text-xs font-semibold text-[#073D7F]">
                      {statusBadge(item.is_active)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section
            id="offices"
            className="overflow-hidden rounded-[2rem] border border-[#D9E3F4] bg-white shadow-sm"
          >
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
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-semibold text-slate-950">
                        {item.name}
                      </div>
                      <div className="mt-1 text-sm text-slate-600">
                        {item.city || "—"} · {item.jurisdiction_code || "—"}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {item.address || "—"}
                      </div>
                    </div>

                    <span className="rounded-full bg-[#F1F1F1] px-3 py-1 text-xs font-semibold text-[#073D7F]">
                      {statusBadge(item.is_active)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section
          id="industries"
          className="mt-8 overflow-hidden rounded-[2rem] border border-[#D9E3F4] bg-white shadow-sm"
        >
          <div className="px-6 py-6">
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
              Industries
            </div>

            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
              Service-sector industry configuration
            </h2>
          </div>

          <div className="divide-y divide-[#D9E3F4]">
            {industries.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between gap-6 px-6 py-4"
              >
                <div>
                  <div className="font-semibold text-slate-950">
                    {item.name}
                  </div>
                  <div className="mt-1 text-sm leading-7 text-slate-600">
                    {item.description || "—"}
                  </div>
                </div>

                <span className="shrink-0 rounded-full bg-[#F1F1F1] px-3 py-1 text-xs font-semibold text-[#073D7F]">
                  {statusBadge(item.is_active)}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] bg-[#073D7F] p-8 text-white">
          <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                Governance Note
              </div>

              <h2 className="mt-4 text-3xl font-semibold tracking-tight">
                Settings should remain controlled and reviewed.
              </h2>

              <p className="mt-4 max-w-3xl text-base leading-8 text-blue-100">
                Changes to master data affect onboarding, organisation setup,
                engagement creation, document classification, reporting,
                compliance, payroll, and review workflows. Editing capability
                should be introduced with approval controls and audit logging.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                "Super Admin access only",
                "Audit trail recommended",
                "Approval workflow before edits",
                "Periodic configuration review",
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