import type { LucideIcon } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import {
  ArrowLeft,
  Archive,
  Banknote,
  BarChart3,
  BookOpenCheck,
  Building2,
  CalendarDays,
  ClipboardCheck,
  Coins,
  FileSpreadsheet,
  Mail,
  MapPinned,
  ReceiptText,
  Settings,
  UserRound,
  WalletCards,
} from "lucide-react";

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

type WorkspaceSection = {
  label: string;
  active: boolean;
  icon: LucideIcon;
  items: {
    label: string;
    href?: string;
    comingSoon?: boolean;
  }[];
};

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
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatAccountingYear({
  startMonth,
  startDay,
  endMonth,
  endDay,
}: {
  startMonth?: number | null;
  startDay?: number | null;
  endMonth?: number | null;
  endDay?: number | null;
}) {
  if (!startMonth || !startDay || !endMonth || !endDay) {
    return "Not configured";
  }

  return `${String(startDay).padStart(2, "0")}/${String(startMonth).padStart(
    2,
    "0"
  )} to ${String(endDay).padStart(2, "0")}/${String(endMonth).padStart(
    2,
    "0"
  )}`;
}

function valueOrDash(value?: string | null) {
  return value && value.trim().length > 0 ? value : "—";
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

  if (!role || !internalRoles.includes(role)) {
    redirect("/portal");
  }

  const { data: organisation } = await supabase
    .from("organisations")
    .select(
      "id, legal_name, trading_name, logo_url, logo_storage_path, organisation_type, status, onboarding_status, jurisdiction_code, country_code, country_name, reporting_framework_code, base_currency_code, registration_number, tax_identification_number, primary_email, primary_phone, primary_contact_name, primary_contact_email, primary_contact_phone, accounting_year_start_month, accounting_year_start_day, accounting_year_end_month, accounting_year_end_day, risk_rating, legacy_client_id, created_at"
    )
    .eq("id", id)
    .single();

  if (!organisation) {
    redirect("/portal/organisations");
  }

  const organisationName =
    organisation.trading_name || organisation.legal_name || "Organisation";

  const accountingYear = formatAccountingYear({
    startMonth: organisation.accounting_year_start_month,
    startDay: organisation.accounting_year_start_day,
    endMonth: organisation.accounting_year_end_month,
    endDay: organisation.accounting_year_end_day,
  });

  const countryDisplay =
    organisation.country_name ||
    organisation.country_code ||
    organisation.jurisdiction_code ||
    "Country not set";

  const onboardingDisplay =
    organisation.onboarding_status || organisation.status || "Not set";

  const [
    engagementsCountResult,
    chartAccountsCountResult,
    trackingCategoriesCountResult,
    trackingOptionsCountResult,
  ] = await Promise.all([
    supabase
      .from("engagements")
      .select("*", { count: "exact", head: true })
      .eq("organisation_id", id),

    supabase
      .from("chart_of_accounts")
      .select("*", { count: "exact", head: true })
      .eq("organisation_id", id)
      .eq("is_active", true),

    supabase
      .from("tracking_categories")
      .select("*", { count: "exact", head: true })
      .eq("organisation_id", id)
      .eq("is_active", true),

    supabase
      .from("tracking_options")
      .select("*", { count: "exact", head: true })
      .eq("organisation_id", id)
      .eq("is_active", true),
  ]);

  const engagementsCount = engagementsCountResult.count ?? 0;
  const chartAccountsCount = chartAccountsCountResult.count ?? 0;
  const trackingCategoriesCount = trackingCategoriesCountResult.count ?? 0;
  const trackingOptionsCount = trackingOptionsCountResult.count ?? 0;

  const setupReadiness = [
    {
      label: "Organisation Settings",
      value:
        organisation.reporting_framework_code &&
        organisation.base_currency_code &&
        accountingYear !== "Not configured"
          ? "Configured"
          : "Review",
      icon: Settings,
    },
    {
      label: "Engagements",
      value: `${engagementsCount} records`,
      icon: Archive,
    },
    {
      label: "Chart of Accounts",
      value: `${chartAccountsCount} active`,
      icon: FileSpreadsheet,
    },
    {
      label: "Tracking Dimensions",
      value: `${trackingOptionsCount} options`,
      icon: MapPinned,
    },
  ];

  const workspaceSections: WorkspaceSection[] = [
    {
      label: "Core Setup",
      active: true,
      icon: Settings,
      items: [
        {
          label: "Organisation Settings",
          href: `/portal/organisations/${organisation.id}/settings`,
        },
        {
          label: "Engagements",
          href: `/portal/organisations/${organisation.id}/engagements/new`,
        },
        {
          label: "Period Control",
          href: `/portal/organisations/${organisation.id}/periods`,
        },
        {
          label: "Chart of Accounts",
          href: `/portal/organisations/${organisation.id}/chart-of-accounts`,
        },
        {
          label: "Tracking Dimensions",
          href: `/portal/organisations/${organisation.id}/tracking`,
        },
      ],
    },
    {
      label: "Sales",
      active: false,
      icon: ReceiptText,
      items: [
        {
          label: "Customers",
          href: `/portal/organisations/${organisation.id}/customers/new`,
        },
        {
          label: "Products / Services",
          href: `/portal/organisations/${organisation.id}/products-services/new`,
        },
        {
          label: "Sales Invoices",
          href: `/portal/organisations/${organisation.id}/sales-invoices`,
        },
        {
          label: "Customer Receipts",
          href: `/portal/organisations/${organisation.id}/customer-receipts`,
        },
        {
          label: "Customer Statements",
          comingSoon: true,
        },
        {
          label: "Receivables Ageing",
          comingSoon: true,
        },
      ],
    },
    {
      label: "Purchases",
      active: false,
      icon: WalletCards,
      items: [
        {
          label: "Suppliers",
          href: `/portal/organisations/${organisation.id}/suppliers/new`,
        },
        {
          label: "Products / Services",
          href: `/portal/organisations/${organisation.id}/products-services/new`,
        },
        {
          label: "Purchase Bills",
          href: `/portal/organisations/${organisation.id}/purchase-bills`,
        },
        {
          label: "Supplier Payments",
          href: `/portal/organisations/${organisation.id}/supplier-payments`,
        },
        {
          label: "Supplier Statements",
          comingSoon: true,
        },
        {
          label: "Payables Ageing",
          comingSoon: true,
        },
      ],
    },
    {
      label: "Banking",
      active: false,
      icon: Banknote,
      items: [
        {
          label: "Bank Accounts",
          href: `/portal/organisations/${organisation.id}/banking`,
        },
        {
          label: "Bank Feed / Statement Lines",
          href: `/portal/organisations/${organisation.id}/banking`,
        },
        {
          label: "Matching & Reconciliation",
          href: `/portal/organisations/${organisation.id}/banking`,
        },
        {
          label: "Excluded Bank Lines",
          href: `/portal/organisations/${organisation.id}/banking`,
        },
        {
          label: "Reconciliation Report",
          comingSoon: true,
        },
      ],
    },
    {
      label: "Funding",
      active: false,
      icon: Coins,
      items: [
        {
          label: "Investors / Funders",
          href: `/portal/organisations/${organisation.id}/investors/new`,
        },
        {
          label: "Capital Commitments",
          comingSoon: true,
        },
        {
          label: "Capital Calls",
          href: `/portal/organisations/${organisation.id}/capital-calls`,
        },
        {
          label: "Funding Transactions",
          href: `/portal/organisations/${organisation.id}/funding-transactions`,
        },
        {
          label: "Investor / Funder Statements",
          comingSoon: true,
        },
        {
          label: "Funding Utilisation Report",
          comingSoon: true,
        },
      ],
    },
    {
      label: "Journals & Ledger",
      active: false,
      icon: BookOpenCheck,
      items: [
        {
          label: "Journal Entries",
          href: `/portal/organisations/${organisation.id}/journal-entries`,
        },
        {
          label: "Reversals / Adjustments",
          comingSoon: true,
        },
        {
          label: "General Ledger",
          href: `/portal/organisations/${organisation.id}/general-ledger`,
        },
        {
          label: "Posting History",
          comingSoon: true,
        },
      ],
    },
    {
      label: "Review",
      active: false,
      icon: ClipboardCheck,
      items: [
        {
          label: "Draft Sales Invoices",
          href: `/portal/organisations/${organisation.id}/sales-invoices`,
        },
        {
          label: "Draft Customer Receipts",
          href: `/portal/organisations/${organisation.id}/customer-receipts`,
        },
        {
          label: "Draft Purchase Bills",
          href: `/portal/organisations/${organisation.id}/purchase-bills`,
        },
        {
          label: "Draft Supplier Payments",
          href: `/portal/organisations/${organisation.id}/supplier-payments`,
        },
        {
          label: "Draft Capital Commitments",
          comingSoon: true,
        },
        {
          label: "Draft Capital Calls",
          href: `/portal/organisations/${organisation.id}/capital-calls`,
        },
        {
          label: "Draft Funding Transactions",
          href: `/portal/organisations/${organisation.id}/funding-transactions`,
        },
        {
          label: "Draft Journals",
          href: `/portal/organisations/${organisation.id}/journal-entries`,
        },
        {
          label: "Bank Reconciliation Review",
          href: `/portal/organisations/${organisation.id}/banking`,
        },
        {
          label: "Posting Review",
          comingSoon: true,
        },
        {
          label: "Review Reports",
          comingSoon: true,
        },
      ],
    },
    {
      label: "Reports",
      active: false,
      icon: BarChart3,
      items: [
        {
          label: "Trial Balance",
          href: `/portal/organisations/${organisation.id}/trial-balance`,
        },
        {
          label: "General Ledger Report",
          href: `/portal/organisations/${organisation.id}/general-ledger`,
        },
        {
          label: "Account Transactions Report",
          comingSoon: true,
        },
        {
          label: "Journal Report",
          href: `/portal/organisations/${organisation.id}/journal-entries`,
        },
        {
          label: "Financial Statements",
          href: `/portal/organisations/${organisation.id}/financial-statements`,
        },
        {
          label: "Sales by Customer",
          comingSoon: true,
        },
        {
          label: "Sales by User / Salesperson",
          comingSoon: true,
        },
        {
          label: "Sales by Product or Service",
          comingSoon: true,
        },
        {
          label: "Sales by Department",
          comingSoon: true,
        },
        {
          label: "Sales by Location",
          comingSoon: true,
        },
        {
          label: "Sales by Project",
          comingSoon: true,
        },
        {
          label: "Sales by Fund / Grant",
          comingSoon: true,
        },
        {
          label: "Cash / Bank / Receivable Sales Breakdown",
          comingSoon: true,
        },
        {
          label: "Purchases by Supplier",
          comingSoon: true,
        },
        {
          label: "Purchases by User / Buyer",
          comingSoon: true,
        },
        {
          label: "Purchases by Product or Service",
          comingSoon: true,
        },
        {
          label: "Purchases by Department",
          comingSoon: true,
        },
        {
          label: "Purchases by Location",
          comingSoon: true,
        },
        {
          label: "Purchases by Project",
          comingSoon: true,
        },
        {
          label: "Purchases by Fund / Grant",
          comingSoon: true,
        },
        {
          label: "Cash / Bank / Payable Purchase Breakdown",
          comingSoon: true,
        },
        {
          label: "Cash in Hand Report",
          comingSoon: true,
        },
        {
          label: "Bank Account Movement Report",
          comingSoon: true,
        },
        {
          label: "Bank Reconciliation Report",
          comingSoon: true,
        },
        {
          label: "Unreconciled Bank Lines",
          href: `/portal/organisations/${organisation.id}/banking`,
        },
        {
          label: "Excluded Bank Lines",
          href: `/portal/organisations/${organisation.id}/banking`,
        },
        {
          label: "Capital Commitment Report",
          comingSoon: true,
        },
        {
          label: "Capital Call Report",
          comingSoon: true,
        },
        {
          label: "Funding Transactions Report",
          href: `/portal/organisations/${organisation.id}/funding-transactions`,
        },
        {
          label: "Investor / Funder Statement",
          comingSoon: true,
        },
        {
          label: "Fund / Grant Report",
          comingSoon: true,
        },
        {
          label: "Funding Utilisation Report",
          comingSoon: true,
        },
        {
          label: "Management Report",
          comingSoon: true,
        },
        {
          label: "Department Report",
          comingSoon: true,
        },
        {
          label: "Location Report",
          comingSoon: true,
        },
        {
          label: "Project Report",
          comingSoon: true,
        },
        {
          label: "Cost Centre Report",
          comingSoon: true,
        },
        {
          label: "Service Line Report",
          comingSoon: true,
        },
        {
          label: "Class Report",
          comingSoon: true,
        },
      ],
    },
  ];

  const trackingDimensions = [
    "Departments",
    "Locations",
    "Projects",
    "Cost Centres",
    "Classes",
    "Funds / Grants",
    "Service Lines",
  ];

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

          <div className="mt-8 grid gap-8 xl:grid-cols-[0.55fr_0.45fr]">
            <div>
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[2rem] border border-[#D9E3F4] bg-[#F8FAFC] p-3">
                  {organisation.logo_url ? (
                    <img
                      src={organisation.logo_url}
                      alt={`${organisationName} logo`}
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <Building2 className="h-10 w-10 text-[#073D7F]" />
                  )}
                </div>

                <div>
                  <div className="inline-flex rounded-full bg-[#F1F1F1] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#073D7F]">
                    Organisation Workspace
                  </div>

                  <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-950">
                    {organisation.legal_name || "Untitled organisation"}
                  </h1>

                  <p className="mt-3 text-lg font-semibold text-[#073D7F]">
                    Trading Name: {valueOrDash(organisation.trading_name)}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <span className="rounded-full bg-[#F1F1F1] px-4 py-2 text-sm font-semibold text-[#073D7F]">
                  {formatStatus(onboardingDisplay)}
                </span>

                <span className="rounded-full bg-[#F1F1F1] px-4 py-2 text-sm font-semibold text-slate-700">
                  {countryDisplay}
                </span>

                <span className="rounded-full bg-[#F1F1F1] px-4 py-2 text-sm font-semibold text-slate-700">
                  {formatFramework(organisation.reporting_framework_code)}
                </span>

                <span className="rounded-full bg-[#F1F1F1] px-4 py-2 text-sm font-semibold text-slate-700">
                  {organisation.base_currency_code || "No currency"}
                </span>

                <span className="rounded-full bg-[#F1F1F1] px-4 py-2 text-sm font-semibold text-slate-700">
                  Risk: {formatStatus(organisation.risk_rating)}
                </span>

                <span className="rounded-full bg-[#F1F1F1] px-4 py-2 text-sm font-semibold text-slate-700">
                  Accounting Year: {accountingYear}
                </span>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-[#F8FAFC] p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                  <Mail className="h-4 w-4 text-[#073D7F]" />
                  General Contact
                </div>

                <div className="mt-4 space-y-2 text-sm leading-6 text-slate-600">
                  <div>Email: {valueOrDash(organisation.primary_email)}</div>
                  <div>Phone: {valueOrDash(organisation.primary_phone)}</div>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-[#F8FAFC] p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                  <UserRound className="h-4 w-4 text-[#073D7F]" />
                  Primary Contact
                </div>

                <div className="mt-4 space-y-2 text-sm leading-6 text-slate-600">
                  <div>Name: {valueOrDash(organisation.primary_contact_name)}</div>
                  <div>Email: {valueOrDash(organisation.primary_contact_email)}</div>
                  <div>Phone: {valueOrDash(organisation.primary_contact_phone)}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={`/portal/organisations/${organisation.id}/settings`}
              className="inline-flex items-center gap-2 rounded-full bg-[#073D7F] px-5 py-3 text-sm font-semibold text-white"
            >
              <Settings className="h-4 w-4" />
              Organisation Settings
            </a>

            <a
              href={`/portal/organisations/${organisation.id}/chart-of-accounts`}
              className="inline-flex items-center gap-2 rounded-full border border-[#D9E3F4] bg-white px-5 py-3 text-sm font-semibold text-[#073D7F]"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Chart of Accounts
            </a>

            <a
              href={`/portal/organisations/${organisation.id}/tracking`}
              className="inline-flex items-center gap-2 rounded-full border border-[#D9E3F4] bg-white px-5 py-3 text-sm font-semibold text-[#073D7F]"
            >
              <MapPinned className="h-4 w-4" />
              Tracking Dimensions
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {setupReadiness.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-slate-500">
                    {item.label}
                  </div>

                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F1F1F1] text-[#073D7F]">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>

                <div className="mt-5 text-2xl font-semibold text-slate-950">
                  {item.value}
                </div>
              </div>
            );
          })}
        </div>

        <section className="mt-8 rounded-[2rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {workspaceSections.map((section) => {
              const Icon = section.icon;

              return (
                <details
                  key={section.label}
                  open={section.active}
                  className="group rounded-2xl border border-[#D9E3F4] bg-white"
                >
                  <summary
                    className={
                      section.active
                        ? "flex cursor-pointer list-none items-center justify-between rounded-2xl bg-[#073D7F] px-5 py-4 text-sm font-semibold text-white marker:hidden"
                        : "flex cursor-pointer list-none items-center justify-between rounded-2xl px-5 py-4 text-sm font-semibold text-[#073D7F] marker:hidden"
                    }
                  >
                    <span className="inline-flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {section.label}
                    </span>
                    <span className="text-xs opacity-70 transition group-open:rotate-180">
                      ▼
                    </span>
                  </summary>

                  <div className="border-t border-[#D9E3F4] p-3">
                    <div className="grid gap-2">
                      {section.items.map((item) =>
                        item.comingSoon ? (
                          <div
                            key={item.label}
                            className="flex items-center justify-between gap-3 rounded-xl bg-[#F8FAFC] px-4 py-3 text-sm text-slate-500"
                          >
                            <span>{item.label}</span>
                            <span className="shrink-0 rounded-full bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200">
                              Later
                            </span>
                          </div>
                        ) : (
                          <a
                            key={item.label}
                            href={item.href}
                            className="rounded-xl bg-[#F8FAFC] px-4 py-3 text-sm font-semibold text-[#073D7F] hover:bg-[#EEF4FF]"
                          >
                            {item.label}
                          </a>
                        )
                      )}
                    </div>
                  </div>
                </details>
              );
            })}
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                Core Accounting Setup
              </div>

              <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
                Organisation foundation
              </h2>
            </div>

            <div className="rounded-2xl bg-[#F8FAFC] px-4 py-3 text-right">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Setup Status
              </div>
              <div className="mt-1 text-sm font-semibold text-[#073D7F]">
                In Progress
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <a
              href={`/portal/organisations/${organisation.id}/settings`}
              className="rounded-[1.5rem] border border-[#D9E3F4] bg-[#F8FAFC] p-5 transition hover:border-[#073D7F] hover:bg-white"
            >
              <Settings className="h-6 w-6 text-[#073D7F]" />
              <div className="mt-5 font-semibold text-slate-950">
                Organisation Settings
              </div>
              <div className="mt-2 text-sm leading-6 text-slate-600">
                Framework, jurisdiction, currency, accounting year, and profile.
              </div>
            </a>

            <a
              href={`/portal/organisations/${organisation.id}/engagements/new`}
              className="rounded-[1.5rem] border border-[#D9E3F4] bg-[#F8FAFC] p-5 transition hover:border-[#073D7F] hover:bg-white"
            >
              <Archive className="h-6 w-6 text-[#073D7F]" />
              <div className="mt-5 font-semibold text-slate-950">
                Engagements
              </div>
              <div className="mt-2 text-sm leading-6 text-slate-600">
                Service workspaces for bookkeeping, reporting, tax, payroll, and
                advisory.
              </div>
            </a>

            <a
              href={`/portal/organisations/${organisation.id}/periods`}
              className="rounded-[1.5rem] border border-[#D9E3F4] bg-[#F8FAFC] p-5 transition hover:border-[#073D7F] hover:bg-white"
            >
              <CalendarDays className="h-6 w-6 text-[#073D7F]" />
              <div className="mt-5 font-semibold text-slate-950">
                Period Control
              </div>
              <div className="mt-2 text-sm leading-6 text-slate-600">
                Open, review, lock, and close accounting periods.
              </div>
            </a>

            <a
              href={`/portal/organisations/${organisation.id}/chart-of-accounts`}
              className="rounded-[1.5rem] border border-[#D9E3F4] bg-[#F8FAFC] p-5 transition hover:border-[#073D7F] hover:bg-white"
            >
              <FileSpreadsheet className="h-6 w-6 text-[#073D7F]" />
              <div className="mt-5 font-semibold text-slate-950">
                Chart of Accounts
              </div>
              <div className="mt-2 text-sm leading-6 text-slate-600">
                GL accounts, FS mapping, cash flow category, and management
                categories.
              </div>
            </a>

            <a
              href={`/portal/organisations/${organisation.id}/tracking`}
              className="rounded-[1.5rem] border border-[#D9E3F4] bg-[#F8FAFC] p-5 transition hover:border-[#073D7F] hover:bg-white"
            >
              <MapPinned className="h-6 w-6 text-[#073D7F]" />
              <div className="mt-5 font-semibold text-slate-950">
                Tracking Dimensions
              </div>
              <div className="mt-2 text-sm leading-6 text-slate-600">
                Departments, locations, projects, cost centres, classes, funds,
                and service lines.
              </div>
            </a>
          </div>

          <div className="mt-8 rounded-[1.5rem] border border-[#D9E3F4] bg-[#F8FAFC] p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="font-semibold text-slate-950">
                  Tracking Dimensions
                </div>
                <div className="mt-1 text-sm text-slate-600">
                  {trackingCategoriesCount} categories · {trackingOptionsCount}{" "}
                  options
                </div>
              </div>

              <a
                href={`/portal/organisations/${organisation.id}/tracking`}
                className="rounded-full bg-[#073D7F] px-5 py-3 text-sm font-semibold text-white"
              >
                Open Tracking
              </a>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {trackingDimensions.map((item) => (
                <a
                  key={item}
                  href={`/portal/organisations/${organisation.id}/tracking`}
                  className="rounded-2xl border border-[#D9E3F4] bg-white px-4 py-3 text-sm font-semibold text-[#073D7F]"
                >
                  {item}
                </a>
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