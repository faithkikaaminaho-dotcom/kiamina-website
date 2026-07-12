"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Calculator,
  ClipboardCheck,
  Coins,
  FileSpreadsheet,
  FileText,
  Landmark,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

const jurisdictions = [
  {
    code: "NG",
    country: "Nigeria",
    currency: "NGN",
    framework: "IFRS",
    marketPosition:
      "Nigeria-focused accounting and finance support for service-based organisations",
    servicePrices: {
      bookkeeping: "₦50,000 / month",
      payroll: "₦30,000 / month",
      financialReporting: "₦100,000 / project",
      managementReporting: "₦120,000 / month",
      arAp: "₦60,000 / month",
      cfo: "₦200,000 / month",
      modelling: "₦180,000 / project",
      tax: "₦60,000 / project",
      fullService: "₦250,000 / month",
    },
  },
  {
    code: "CA",
    country: "Canada",
    currency: "CAD",
    framework: "IFRS",
    marketPosition:
      "Canada-focused remote accounting and finance operations support",
    servicePrices: {
      bookkeeping: "CAD 250 / month",
      payroll: "CAD 120 / month",
      financialReporting: "CAD 500 / project",
      managementReporting: "CAD 450 / month",
      arAp: "CAD 250 / month",
      cfo: "CAD 1,000 / month",
      modelling: "CAD 700 / project",
      tax: "CAD 350 / project",
      fullService: "CAD 850 / month",
    },
  },
  {
    code: "US",
    country: "United States",
    currency: "USD",
    framework: "US GAAP",
    marketPosition:
      "US-focused remote accounting and US GAAP-aligned finance support",
    servicePrices: {
      bookkeeping: "USD 250 / month",
      payroll: "USD 120 / month",
      financialReporting: "USD 500 / project",
      managementReporting: "USD 450 / month",
      arAp: "USD 250 / month",
      cfo: "USD 1,000 / month",
      modelling: "USD 700 / project",
      tax: "USD 350 / project",
      fullService: "USD 850 / month",
    },
  },
  {
    code: "GB",
    country: "United Kingdom",
    currency: "GBP",
    framework: "IFRS",
    marketPosition:
      "UK-focused remote accounting and finance operations support",
    servicePrices: {
      bookkeeping: "£150 / month",
      payroll: "£80 / month",
      financialReporting: "£350 / project",
      managementReporting: "£300 / month",
      arAp: "£180 / month",
      cfo: "£750 / month",
      modelling: "£500 / project",
      tax: "£250 / project",
      fullService: "£600 / month",
    },
  },
  {
    code: "AU",
    country: "Australia",
    currency: "AUD",
    framework: "IFRS",
    marketPosition:
      "Australia-focused remote accounting and finance operations support",
    servicePrices: {
      bookkeeping: "AUD 300 / month",
      payroll: "AUD 150 / month",
      financialReporting: "AUD 550 / project",
      managementReporting: "AUD 500 / month",
      arAp: "AUD 300 / month",
      cfo: "AUD 1,200 / month",
      modelling: "AUD 800 / project",
      tax: "AUD 400 / project",
      fullService: "AUD 950 / month",
    },
  },
  {
    code: "IE",
    country: "Ireland",
    currency: "EUR",
    framework: "IFRS",
    marketPosition:
      "Ireland-focused remote accounting and finance operations support",
    servicePrices: {
      bookkeeping: "€180 / month",
      payroll: "€90 / month",
      financialReporting: "€400 / project",
      managementReporting: "€350 / month",
      arAp: "€200 / month",
      cfo: "€850 / month",
      modelling: "€550 / project",
      tax: "€280 / project",
      fullService: "€700 / month",
    },
  },
];

const services = [
  {
    key: "bookkeeping",
    service: "Bookkeeping",
    icon: BookOpen,
    billing: "Monthly",
    description:
      "Structured bookkeeping support for service-based organisations that require reliable, current, and properly classified accounting records.",
    includes: [
      "Monthly transaction classification, posting, and coding review",
      "Bank, cashbook, wallet, and control account reconciliation support",
      "Accounts ledger maintenance with exception identification and follow-up",
      "Review of supporting documents for completeness and audit trail quality",
      "Month-end bookkeeping status summary for management visibility",
    ],
    bestFor:
      "Service businesses that require clean accounting records, stronger documentation discipline, and timely month-end updates.",
  },
  {
    key: "payroll",
    service: "Payroll Processing",
    icon: Users,
    billing: "Monthly",
    description:
      "Payroll processing support for organisations that require accurate payroll records, payroll schedules, and statutory payroll documentation.",
    includes: [
      "Monthly payroll computation and payroll schedule preparation",
      "Review of employee earnings, deductions, benefits, and statutory payroll items",
      "Payroll cost analysis and staff cost reporting support",
      "Payslip preparation support and payroll documentation pack",
      "Payroll control summary for management review and approval",
    ],
    bestFor:
      "Employers that require accurate payroll processing, controlled payroll records, and stronger visibility over staff cost obligations.",
  },
  {
    key: "financialReporting",
    service: "Financial Reporting",
    icon: FileText,
    billing: "Project or monthly",
    description:
      "Financial reporting support aligned to the applicable reporting framework in the selected jurisdiction.",
    includes: [
      "Trial balance review and reporting readiness assessment",
      "Preparation support for financial statements and supporting schedules",
      "IFRS or US GAAP alignment based on the selected jurisdiction",
      "Review of key balances, classifications, and reporting disclosures",
      "Management-ready reporting pack for executive, board, lender, donor, or stakeholder review",
    ],
    bestFor:
      "Organisations preparing periodic, annual, board-level, lender-facing, donor-facing, or stakeholder-facing financial reports.",
  },
  {
    key: "managementReporting",
    service: "Management Reporting",
    icon: BarChart3,
    billing: "Monthly",
    description:
      "Decision-focused reporting for executives, directors, founders, boards, and finance leaders who require insight beyond basic accounting records.",
    includes: [
      "Monthly management accounts and performance reporting pack",
      "Revenue, cost, margin, cash flow, and working capital analysis",
      "Budget versus actual reporting with variance commentary",
      "Key performance indicators tailored to the organisation’s operating model",
      "Executive commentary highlighting trends, risks, exceptions, and management actions",
    ],
    bestFor:
      "Leadership teams that require timely financial visibility, stronger operational control, and decision-ready reporting.",
  },
  {
    key: "arAp",
    service: "Accounts Receivable and Payable Management",
    icon: ReceiptText,
    billing: "Monthly",
    description:
      "Structured support for receivables, payables, customer invoicing, supplier bills, ageing analysis, and payment tracking.",
    includes: [
      "Receivables and payables ledger monitoring",
      "Customer invoice tracking and collection status reporting",
      "Supplier bill tracking and payment obligation review",
      "Ageing analysis for receivables, payables, overdue balances, and exposure",
      "Working capital insights to support cash flow planning and management action",
    ],
    bestFor:
      "Service organisations with recurring customer invoices, supplier obligations, collection follow-up needs, and working capital pressure.",
  },
  {
    key: "cfo",
    service: "CFO Consulting",
    icon: Landmark,
    billing: "Monthly retainer or project",
    description:
      "Senior finance support for organisations that require strategic financial guidance without maintaining a full-time CFO function.",
    includes: [
      "Monthly financial performance review with leadership",
      "Cash flow, profitability, liquidity, and working capital advisory",
      "Board, management, investor, lender, or donor reporting support",
      "Financial control, reporting structure, and finance process recommendations",
      "Strategic finance guidance for growth, restructuring, funding, or operational decisions",
    ],
    bestFor:
      "Executives, founders, boards, and finance leaders requiring senior-level financial insight, financial control, and commercial decision support.",
  },
  {
    key: "modelling",
    service: "Financial Modelling",
    icon: Calculator,
    billing: "Project",
    description:
      "Structured financial modelling support for planning, investment decisions, fundraising, expansion, projects, and scenario analysis.",
    includes: [
      "Revenue, cost, cash flow, and profitability model development",
      "Scenario, sensitivity, and assumption-driven analysis",
      "Funding, expansion, project, or investment model support",
      "Model outputs structured for management, investors, lenders, or board review",
      "Assumptions documentation and management presentation support",
    ],
    bestFor:
      "Organisations evaluating growth, funding, expansion, restructuring, new projects, or major commercial decisions.",
  },
  {
    key: "tax",
    service: "Tax Compliance",
    icon: ShieldCheck,
    billing: "Project or recurring compliance",
    description:
      "Tax compliance support focused on documentation readiness, schedules, filing coordination, and compliance visibility.",
    includes: [
      "Tax compliance calendar and filing obligation tracking",
      "Preparation and review of supporting tax schedules",
      "Review of source documents for tax readiness and completeness",
      "Tax filing coordination support based on applicable jurisdiction",
      "Compliance status reporting highlighting outstanding items, risks, and deadlines",
    ],
    bestFor:
      "Businesses and nonprofits that require stronger tax compliance control, better documentation, and clearer visibility over filing obligations.",
  },
];

const fullServiceIncludes = [
  "Bookkeeping operations",
  "Payroll processing support",
  "Management reporting pack",
  "Receivables and payables monitoring",
  "Tax compliance coordination",
  "Monthly financial review",
  "Document quality follow-up",
  "Compliance status reporting",
];

const fullServiceScope = [
  "Structured month-end close support, including review of transactions, reconciliations, and outstanding documentation.",
  "Monthly management reporting pack covering performance, cash flow, working capital, exceptions, and key financial movements.",
  "Payroll processing coordination, payroll records maintenance, and staff cost visibility for management review.",
  "Receivables and payables monitoring, including ageing analysis, collection visibility, payment obligations, and working capital insights.",
  "Tax compliance coordination with documentation readiness checks, filing support, compliance calendar tracking, and status reporting.",
  "Monthly finance review discussion focused on key issues, risks, decisions, and management actions.",
];

const pricingFactors = [
  "Transaction volume and document quality",
  "Number of bank accounts and payment channels",
  "Payroll size and payroll complexity",
  "Reporting frequency and stakeholder requirements",
  "Number of entities, branches, locations, or projects",
  "Jurisdiction-specific compliance requirements",
  "Backlog level and urgency of remediation",
  "Level of management review and advisory support required",
];

const industries = [
  {
    industry: "Oil & Gas Servicing",
    focus:
      "Project cost tracking, vendor obligations, contract billing, receivables control, tax documentation, payroll visibility, and management reporting.",
  },
  {
    industry: "Real Estate",
    focus:
      "Rental income tracking, project expenditure, service charge records, contractor payments, investor reporting, and cash flow visibility.",
  },
  {
    industry: "ICT",
    focus:
      "Recurring revenue, implementation projects, contractor payments, cloud costs, project profitability, tax compliance, and management reporting.",
  },
  {
    industry: "Construction",
    focus:
      "Contract revenue, supplier payments, project costs, retention balances, payroll, progress reporting, and cash flow control.",
  },
  {
    industry: "Nonprofits",
    focus:
      "Donor reporting, restricted funds, grant documentation, compliance records, management accounts, accountability reporting, and expenditure tracking.",
  },
  {
    industry: "Other Service Organisations",
    focus:
      "Client billing, payroll, supplier obligations, receivables monitoring, working capital visibility, compliance support, and decision-ready reporting.",
  },
];

type Jurisdiction = (typeof jurisdictions)[number];
type ServicePrices = Jurisdiction["servicePrices"];
type ServiceKey = keyof ServicePrices;

function getJurisdiction(code: string) {
  return (
    jurisdictions.find((jurisdiction) => jurisdiction.code === code) ||
    jurisdictions[0]
  );
}

export default function PricingPage() {
  const [selectedCode, setSelectedCode] = useState("NG");

  useEffect(() => {
    const savedCode = localStorage.getItem("kiamina_jurisdiction");

    if (savedCode && jurisdictions.some((item) => item.code === savedCode)) {
      setSelectedCode(savedCode);
    }

    const handleCustomJurisdictionChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ code?: string }>;
      const code = customEvent.detail?.code;

      if (code && jurisdictions.some((item) => item.code === code)) {
        setSelectedCode(code);
      }
    };

    const handleStorageChange = (event: StorageEvent) => {
      if (
        event.key === "kiamina_jurisdiction" &&
        event.newValue &&
        jurisdictions.some((item) => item.code === event.newValue)
      ) {
        setSelectedCode(event.newValue);
      }
    };

    window.addEventListener(
      "kiamina-jurisdiction-change",
      handleCustomJurisdictionChange
    );

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener(
        "kiamina-jurisdiction-change",
        handleCustomJurisdictionChange
      );

      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const selectedJurisdiction = useMemo(
    () => getJurisdiction(selectedCode),
    [selectedCode]
  );

  return (
    <main className="bg-white">
      <section className="relative overflow-hidden bg-[#073D7F] px-6 py-24 text-white lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(100,145,222,0.35),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.16),transparent_30%)]" />

        <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div className="max-w-4xl">
            <div className="text-sm font-semibold uppercase tracking-[0.28em] text-[#A9C7FF]">
              Pricing
            </div>

            <h1 className="mt-6 text-5xl font-semibold tracking-tight sm:text-6xl">
              Structured accounting support, priced by jurisdiction, scope, and
              operating complexity.
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-9 text-blue-100">
              Kiamina Accounting Services provides jurisdiction-specific
              indicative starting fees for service-based organisations. Final
              pricing is determined after assessing transaction volume, payroll
              structure, reporting requirements, compliance obligations,
              documentation quality, and the level of finance support required.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#073D7F] transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                Request Pricing
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="/services"
                className="inline-flex items-center justify-center rounded-full border border-white/25 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                View Services
              </Link>
            </div>

            <p className="mt-6 max-w-3xl text-sm leading-7 text-blue-100">
              Prices shown are indicative starting fees. A final quote is issued
              after scope review, including documentation readiness, reporting
              complexity, backlog, number of entities, payroll structure, and
              compliance exposure.
            </p>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 rounded-[2.5rem] bg-white/10 blur-2xl" />

            <div className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-white/10 p-3 shadow-2xl">
              <Image
                src="/pricing-advisory.png"
                alt="Finance professionals reviewing accounting reports"
                width={900}
                height={700}
                priority
                className="h-[420px] w-full rounded-[1.5rem] object-cover"
              />

              <div className="absolute bottom-6 left-6 right-6 rounded-2xl border border-white/15 bg-[#073D7F]/85 p-5 text-white backdrop-blur">
                <div className="text-sm font-semibold uppercase tracking-[0.22em] text-[#A9C7FF]">
                  Scope-Led Pricing
                </div>

                <p className="mt-2 text-sm leading-6 text-blue-100">
                  Indicative fees are aligned to jurisdiction, service scope,
                  documentation quality, reporting requirements, and operating
                  complexity.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#F8FAFC] px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm">
              <Coins className="h-7 w-7 text-[#073D7F]" />

              <h2 className="mt-6 text-2xl font-semibold text-slate-950">
                Scope-led starting fees
              </h2>

              <p className="mt-4 text-sm leading-7 text-slate-600">
                Our starting fees provide an accessible entry point for
                service-based organisations, while final pricing is determined
                by transaction volume, documentation quality, reporting
                frequency, and compliance complexity.
              </p>
            </div>

            <div className="rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm">
              <ClipboardCheck className="h-7 w-7 text-[#073D7F]" />

              <h2 className="mt-6 text-2xl font-semibold text-slate-950">
                Scope review before final quote
              </h2>

              <p className="mt-4 text-sm leading-7 text-slate-600">
                Before final pricing, we assess documentation readiness,
                reporting frequency, transaction volume, payroll structure, tax
                exposure, backlog, and urgency.
              </p>
            </div>

            <div className="rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm">
              <ShieldCheck className="h-7 w-7 text-[#073D7F]" />

              <h2 className="mt-6 text-2xl font-semibold text-slate-950">
                Integrated finance support
              </h2>

              <p className="mt-4 text-sm leading-7 text-slate-600">
                Our integrated service model is designed for organisations that
                require coordinated support across bookkeeping, payroll,
                reporting, receivables, payables, tax compliance, and financial
                review.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                Integrated Finance Operations Support
              </div>

              <h2 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
                Coordinated monthly support for the finance function.
              </h2>

              <p className="mt-4 text-base leading-8 text-slate-600">
                The full service option is structured for organisations that
                require consistent finance function support across core
                accounting operations, payroll processing, management reporting,
                receivables, payables, tax compliance coordination, and monthly
                financial review.
              </p>

              <p className="mt-4 text-base leading-8 text-slate-600">
                This option is not a basic bookkeeping bundle. It is designed to
                provide management with stronger financial visibility,
                documentation discipline, compliance coordination, and
                decision-ready reporting.
              </p>
            </div>

            <div className="rounded-[2rem] border border-[#D9E3F4] bg-[#073D7F] p-8 text-white shadow-xl">
              <div className="flex items-start justify-between gap-5">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white">
                  <Sparkles className="h-6 w-6" />
                </div>

                <span className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-[#073D7F]">
                  Integrated Support
                </span>
              </div>

              <h3 className="mt-6 text-3xl font-semibold">Full Service</h3>

              <div className="mt-4 text-4xl font-semibold">
                {selectedJurisdiction.servicePrices.fullService}
              </div>

              <p className="mt-4 text-sm leading-7 text-blue-100">
                Indicative starting monthly fee for integrated finance
                operations support in {selectedJurisdiction.country}. Final fee
                depends on transaction volume, payroll size, reporting needs,
                documentation quality, and compliance complexity.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {fullServiceIncludes.map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-blue-100"
                  >
                    {item}
                  </div>
                ))}
              </div>

              <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="text-sm font-semibold text-white">
                  Scope typically covers:
                </div>

                <ul className="mt-4 space-y-3">
                  {fullServiceScope.map((scope) => (
                    <li
                      key={scope}
                      className="flex gap-3 text-sm leading-6 text-blue-100"
                    >
                      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#A9C7FF]" />
                      <span>{scope}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                href="/contact"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#073D7F]"
              >
                Request Full Service Pricing
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#F8FAFC] px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
              Pricing by Service
            </div>

            <h2 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
              Indicative starting fees in {selectedJurisdiction.currency}.
            </h2>

            <p className="mt-4 text-base leading-8 text-slate-600">
              The starting fees below are shown for{" "}
              <span className="font-semibold text-slate-950">
                {selectedJurisdiction.country}
              </span>
              . Use the location selector in the header to view pricing for
              another jurisdiction.
            </p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            {services.map((item) => {
              const Icon = item.icon;
              const price =
                selectedJurisdiction.servicePrices[item.key as ServiceKey];

              return (
                <article
                  key={`${selectedJurisdiction.code}-${item.service}`}
                  className="rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F1F1F1] text-[#073D7F]">
                      <Icon className="h-6 w-6" />
                    </div>

                    <span className="w-fit rounded-full bg-[#F1F1F1] px-4 py-2 text-xs font-semibold text-[#073D7F]">
                      Starting from {price}
                    </span>
                  </div>

                  <h3 className="mt-6 text-2xl font-semibold text-slate-950">
                    {item.service}
                  </h3>

                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#6491DE]">
                    {item.billing}
                  </p>

                  <p className="mt-4 text-sm leading-7 text-slate-600">
                    {item.description}
                  </p>

                  <div className="mt-6 rounded-2xl border border-[#D9E3F4] bg-[#F8FAFC] p-5">
                    <div className="text-sm font-semibold text-slate-950">
                      Scope typically includes:
                    </div>

                    <ul className="mt-4 space-y-3">
                      {item.includes.map((scope) => (
                        <li
                          key={scope}
                          className="flex gap-3 text-sm leading-6 text-slate-600"
                        >
                          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#073D7F]" />
                          <span>{scope}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <p className="mt-5 text-sm leading-7 text-slate-500">
                    <span className="font-semibold text-slate-950">
                      Relevant for:
                    </span>{" "}
                    {item.bestFor}
                  </p>

                  <Link
                    href="/contact"
                    className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#073D7F]"
                  >
                    Request pricing for {item.service}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
              Pricing Drivers
            </div>

            <h2 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
              What determines the final quote?
            </h2>

            <p className="mt-4 text-base leading-8 text-slate-600">
              Starting fees provide a baseline. Final pricing is determined
              after we understand the structure, complexity, reporting needs,
              compliance exposure, and documentation quality of the organisation.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {pricingFactors.map((factor) => (
              <div
                key={factor}
                className="rounded-2xl border border-[#D9E3F4] bg-white p-5 text-sm font-semibold text-slate-700 shadow-sm"
              >
                <FileSpreadsheet className="mb-4 h-5 w-5 text-[#073D7F]" />
                {factor}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                Industries We Serve
              </div>

              <h2 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
                Pricing aligned to the operating realities of service-based
                organisations.
              </h2>

              <p className="mt-5 text-base leading-8 text-slate-600">
                Our pricing approach reflects the way service organisations
                operate: contract-driven revenue, recurring payroll obligations,
                documentation gaps, project-based costs, compliance exposure,
                management reporting needs, and cash flow pressure.
              </p>

              <p className="mt-5 text-base leading-8 text-slate-600">
                We do not use a one-size-fits-all pricing model. Fees are shaped
                by transaction volume, reporting expectations, compliance
                requirements, documentation quality, stakeholder reporting needs,
                and the level of finance support required.
              </p>

              <div className="mt-8 rounded-[1.5rem] border border-[#D9E3F4] bg-[#F8FAFC] p-6">
                <div className="text-sm font-semibold text-slate-950">
                  Sector focus
                </div>

                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Kiamina Accounting Services focuses on oil and gas servicing,
                  real estate, ICT, construction, nonprofits, and other
                  service-based organisations.
                </p>
              </div>
            </div>

            <div className="grid gap-5">
              {industries.map((item) => (
                <div
                  key={item.industry}
                  className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm"
                >
                  <div className="text-lg font-semibold text-slate-950">
                    {item.industry}
                  </div>

                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {item.focus}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#F8FAFC] px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
            Request a Quote
          </div>

          <h2 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
            Request pricing based on your actual accounting needs.
          </h2>

          <p className="mt-5 text-base leading-8 text-slate-600">
            Share your jurisdiction, industry, service requirements, reporting
            frequency, payroll size, documentation status, and compliance needs.
            We will recommend the appropriate scope and pricing structure.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#073D7F] px-6 py-3 text-sm font-semibold text-white"
            >
              Request Pricing
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/get-started"
              className="inline-flex items-center justify-center rounded-full border border-[#D9E3F4] bg-white px-6 py-3 text-sm font-semibold text-[#073D7F]"
            >
              Get Started
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}