"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  CreditCard,
  FileSpreadsheet,
  HeartHandshake,
  Layers3,
  LineChart,
  ReceiptText,
  ShieldCheck,
  UsersRound,
  WalletCards,
} from "lucide-react";

type JurisdictionKey = "NG" | "US" | "UK_IE" | "CA" | "EU" | "AU";

const jurisdictionLabels: Record<JurisdictionKey, string> = {
  NG: "Nigeria",
  US: "United States",
  UK_IE: "United Kingdom and Ireland",
  CA: "Canada",
  EU: "Europe",
  AU: "Australia",
};

function normalizeJurisdiction(value?: string | null): JurisdictionKey {
  const rawValue = String(value || "").trim();
  const upperValue = rawValue.toUpperCase();

  if (upperValue === "NG" || upperValue === "NIGERIA") {
    return "NG";
  }

  if (
    upperValue === "US" ||
    upperValue === "USA" ||
    upperValue === "UNITED STATES" ||
    upperValue === "UNITED STATES OF AMERICA"
  ) {
    return "US";
  }

  if (
    upperValue === "UK" ||
    upperValue === "GB" ||
    upperValue === "GBR" ||
    upperValue === "UNITED KINGDOM" ||
    upperValue === "IRELAND" ||
    upperValue === "IE" ||
    upperValue === "IRL" ||
    upperValue === "UK_IE" ||
    upperValue === "UK-IE" ||
    upperValue === "GB_IE" ||
    upperValue === "GB-IE" ||
    upperValue === "UNITED KINGDOM AND IRELAND"
  ) {
    return "UK_IE";
  }

  if (upperValue === "CA" || upperValue === "CANADA") {
    return "CA";
  }

  if (
    upperValue === "EU" ||
    upperValue === "EUR" ||
    upperValue === "EUROPE" ||
    upperValue === "EUROPEAN UNION"
  ) {
    return "EU";
  }

  if (upperValue === "AU" || upperValue === "AUS" || upperValue === "AUSTRALIA") {
    return "AU";
  }

  return "NG";
}

const pricingByJurisdiction: Record<
  JurisdictionKey,
  {
    currency: string;
    tier1: string;
    tier2: string;
    tier3: string;
    payroll: string;
    tax: string;
    modelling: string;
    paymentRail: string;
  }
> = {
  NG: {
    currency: "NGN",
    tier1: "₦250k–₦400k / month",
    tier2: "₦650k–₦900k / month",
    tier3: "₦1.8M+ / month",
    payroll: "Base fee + per-employee charge",
    tax: "Monthly statutory filing retainer",
    modelling: "Fixed project fee or monthly update retainer",
    paymentRail: "Paystack",
  },
  US: {
    currency: "USD",
    tier1: "$450–$750 / month",
    tier2: "$950–$1,500 / month",
    tier3: "$2,800+ / month",
    payroll: "Base fee + per-employee charge",
    tax: "Monthly compliance retainer",
    modelling: "Fixed project fee or monthly update retainer",
    paymentRail: "Paystack international card payment",
  },
  UK_IE: {
    currency: "GBP",
    tier1: "£350–£600 / month",
    tier2: "£750–£1,200 / month",
    tier3: "£2,000+ / month",
    payroll: "Base fee + per-employee charge",
    tax: "Monthly compliance retainer",
    modelling: "Fixed project fee or monthly update retainer",
    paymentRail: "Paystack international card payment",
  },
  CA: {
    currency: "CAD",
    tier1: "CA$500–CA$800 / month",
    tier2: "CA$950–CA$1,500 / month",
    tier3: "CA$2,500+ / month",
    payroll: "Base fee + per-employee charge",
    tax: "Monthly compliance retainer",
    modelling: "Fixed project fee or monthly update retainer",
    paymentRail: "Paystack international card payment",
  },
  EU: {
    currency: "EUR",
    tier1: "€400–€650 / month",
    tier2: "€850–€1,350 / month",
    tier3: "€2,300+ / month",
    payroll: "Base fee + per-employee charge",
    tax: "Monthly compliance retainer",
    modelling: "Fixed project fee or monthly update retainer",
    paymentRail: "Paystack international card payment",
  },
  AU: {
    currency: "AUD",
    tier1: "A$600–A$900 / month",
    tier2: "A$1,200–A$1,800 / month",
    tier3: "A$3,200+ / month",
    payroll: "Base fee + per-employee charge",
    tax: "Monthly compliance retainer",
    modelling: "Fixed project fee or monthly update retainer",
    paymentRail: "Paystack international card payment",
  },
};

const tiers = [
  {
    tier: "Tier 1",
    name: "Core Compliance & Reporting",
    shortName: "Core Compliance",
    icon: ShieldCheck,
    summary: "Bookkeeping, financial reporting, and tax compliance.",
    includes: [
      "Monthly bookkeeping and close support",
      "Chart of accounts maintenance",
      "Bank and ledger reconciliations",
      "Standard profit or loss, balance sheet, and cash flow reporting",
      "Monthly tax tracking and statutory filing preparation",
    ],
    priceKey: "tier1" as const,
    volumeBasis: "Based on transaction volume and reporting complexity.",
    bestFor:
      "Businesses and nonprofits that need reliable monthly compliance, clean records, statutory readiness, and standard reporting discipline.",
  },
  {
    tier: "Tier 2",
    name: "Integrated Finance Operations",
    shortName: "Integrated Finance Operations",
    icon: Layers3,
    summary:
      "Everything in Tier 1 plus payroll, management reporting, and AR/AP support.",
    includes: [
      "Everything in Tier 1",
      "Payroll processing, payslips, PAYE, pension, and statutory deductions",
      "Management reporting packs with trend and variance analysis",
      "Accounts receivable and payable support",
      "Vendor scheduling, invoicing, donor receivable tracking, and cash cycle support",
    ],
    priceKey: "tier2" as const,
    volumeBasis:
      "Based on employee headcount, invoice volume, reporting cadence, and operational complexity.",
    bestFor:
      "Growing businesses, NGOs, schools, churches, clinics, professional firms, and mission-driven organisations that need a managed finance function without building a full internal team.",
  },
  {
    tier: "Tier 3",
    name: "Strategic CFO & Growth",
    shortName: "Strategic CFO",
    icon: LineChart,
    summary:
      "Everything in Tier 2 plus financial modelling, strategic reporting, and CFO consulting.",
    includes: [
      "Everything in Tier 2",
      "Financial modelling and scenario analysis",
      "12-month rolling forecasts",
      "CFO consulting and strategic decision support",
      "Board, lender, investor, donor, and grant reporting packs",
    ],
    priceKey: "tier3" as const,
    volumeBasis: "High-value monthly retainer based on strategic support scope.",
    bestFor:
      "Funded startups, investor-backed companies, multi-entity businesses, NGOs, foundations, donor-funded organisations, and growth-stage organisations needing CFO-level insight.",
  },
];

const outsourcingBenefits = [
  {
    title: "One employee gives you one person",
    description:
      "Kiamina gives you a structured finance function with bookkeeping, reporting, compliance support, review discipline, and senior oversight.",
  },
  {
    title: "Lower hiring and supervision burden",
    description:
      "Avoid recruitment time, training, benefits, software setup, leave cover, replacement risk, and the management time required to supervise finance staff.",
  },
  {
    title: "Scalable finance capacity",
    description:
      "Start with core compliance, expand into finance operations, then add CFO-level modelling and decision support as your business or nonprofit grows.",
  },
];

export default function PricingPage() {
  const [jurisdiction, setJurisdiction] = useState<JurisdictionKey>("NG");

  useEffect(() => {
    const stored = window.localStorage.getItem("kiamina_jurisdiction");

    setJurisdiction(normalizeJurisdiction(stored));

    function handleJurisdictionChange(event: Event) {
      const customEvent = event as CustomEvent<{
        jurisdiction?: string;
        country?: string;
        region?: string;
        value?: string;
      }>;

      const incomingJurisdiction =
        customEvent.detail?.jurisdiction ||
        customEvent.detail?.country ||
        customEvent.detail?.region ||
        customEvent.detail?.value;

      setJurisdiction(normalizeJurisdiction(incomingJurisdiction));
    }

    window.addEventListener(
      "kiamina-jurisdiction-change",
      handleJurisdictionChange
    );

    return () => {
      window.removeEventListener(
        "kiamina-jurisdiction-change",
        handleJurisdictionChange
      );
    };
  }, []);

  const pricing = useMemo(
    () => pricingByJurisdiction[jurisdiction],
    [jurisdiction]
  );

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <section className="border-b border-[#D9E3F4] bg-white">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="max-w-4xl">
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
              Pricing
            </div>

            <h1 className="mt-6 text-5xl font-semibold tracking-tight text-slate-950 md:text-6xl">
              Finance subscriptions for businesses, nonprofits, and
              mission-driven organisations.
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
              Choose a monthly finance tier based on the level of support your
              organisation needs. Kiamina serves both commercial organisations
              and nonprofits that need reliable finance operations, compliance
              discipline, reporting clarity, and strategic financial support.
            </p>

            <div className="mt-8 inline-flex rounded-full border border-[#D9E3F4] bg-[#F1F1F1] px-5 py-3 text-sm font-semibold text-[#073D7F]">
              Showing indicative pricing for {jurisdictionLabels[jurisdiction]}{" "}
              · {pricing.currency}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
        <div className="rounded-[2rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
          <div className="grid gap-4">
            <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-[#073D7F] p-6 text-white">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-white/70">
                Tier 3: Strategic CFO
              </div>
              <div className="mt-3 text-xl font-semibold">
                Includes Tier 2 + Financial Modelling + CFO Consulting
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-[#6491DE] p-6 text-white">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-white/80">
                Tier 2: Integrated Finance Operations
              </div>
              <div className="mt-3 text-xl font-semibold">
                Includes Tier 1 + Payroll + Management Reporting + AR/AP
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-[#F1F1F1] p-6 text-slate-950">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6491DE]">
                Tier 1: Core Compliance
              </div>
              <div className="mt-3 text-xl font-semibold">
                Bookkeeping + Financial Reporting + Tax Compliance
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {tiers.map((tier) => {
            const Icon = tier.icon;

            return (
              <article
                key={tier.tier}
                className="rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm"
              >
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F1F1F1] text-[#073D7F]">
                  <Icon className="h-6 w-6" />
                </div>

                <div className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-[#6491DE]">
                  {tier.tier}
                </div>

                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                  {tier.name}
                </h2>

                <p className="mt-4 text-sm leading-7 text-slate-600">
                  {tier.summary}
                </p>

                <div className="mt-6 rounded-[1.25rem] bg-[#F8FAFC] p-5">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Monthly subscription
                  </div>

                  <div className="mt-2 text-2xl font-semibold text-slate-950">
                    {pricing[tier.priceKey]}
                  </div>

                  <p className="mt-2 text-xs leading-6 text-slate-500">
                    {tier.volumeBasis}
                  </p>
                </div>

                <div className="mt-6 rounded-[1.25rem] border border-[#D9E3F4] bg-white p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6491DE]">
                    Best for
                  </div>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    {tier.bestFor}
                  </p>
                </div>

                <div className="mt-6 space-y-3">
                  {tier.includes.map((item) => (
                    <div key={item} className="flex gap-3 text-sm text-slate-600">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-[#073D7F]" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-14 lg:px-8">
        <div className="rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F1F1F1] text-[#073D7F]">
              <UsersRound className="h-6 w-6" />
            </div>

            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                Why Outsource Instead of Hiring?
              </div>

              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                Hiring one employee gives you one person. Kiamina gives you a
                managed finance function.
              </h2>

              <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-600">
                Kiamina is designed for organisations that need reliable finance
                capacity before they are ready to build a full in-house finance
                department. Instead of hiring, training, supervising, and
                replacing one finance employee, clients get access to structured
                finance operations, monthly close discipline, compliance support,
                management reporting, and senior review.
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {outsourcingBenefits.map((benefit) => (
              <div
                key={benefit.title}
                className="rounded-[1.5rem] border border-[#D9E3F4] bg-[#F8FAFC] p-6"
              >
                <h3 className="text-lg font-semibold text-slate-950">
                  {benefit.title}
                </h3>

                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-[1.5rem] bg-[#073D7F] p-6 text-white">
            <div className="text-sm font-semibold uppercase tracking-[0.22em] text-white/60">
              Positioning
            </div>

            <p className="mt-3 max-w-4xl text-base leading-8 text-white/80">
              Our subscription model is best for businesses and nonprofits that
              need more than basic bookkeeping, but do not yet need to hire a
              bookkeeper, accountant, finance manager, payroll officer, grants
              finance specialist, and part-time CFO separately.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-14 lg:px-8">
        <div className="rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F1F1F1] text-[#073D7F]">
              <HeartHandshake className="h-6 w-6" />
            </div>

            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                Nonprofit & Social Impact Pricing
              </div>

              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                Mission-driven organisations may qualify for adjusted pricing.
              </h2>

              <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-600">
                Kiamina serves both businesses and nonprofit organisations.
                Eligible nonprofits, NGOs, foundations, schools, churches, and
                mission-driven organisations may qualify for adjusted pricing
                based on funding structure, reporting complexity, donor or grant
                requirements, transaction volume, payroll size, and the level of
                finance support required.
              </p>

              <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-600">
                Where nonprofit discounts apply, they are designed to support
                mission-driven work without reducing service quality, reporting
                discipline, compliance standards, financial control, or review
                procedures.
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-[#F8FAFC] p-6">
              <h3 className="text-lg font-semibold text-slate-950">
                Eligibility is scope-based
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Discounts are considered after reviewing funding sources,
                restricted grants, donor reports, statutory obligations,
                transaction volume, and payroll complexity.
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-[#F8FAFC] p-6">
              <h3 className="text-lg font-semibold text-slate-950">
                Complex reporting may require more support
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Nonprofits with donor restrictions, multi-currency grants,
                project reporting, fund accounting, or audit requirements may
                need higher-level finance support.
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-[#F8FAFC] p-6">
              <h3 className="text-lg font-semibold text-slate-950">
                Quality remains the same
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Adjusted pricing does not reduce monthly close discipline,
                compliance monitoring, reporting standards, documentation, or
                senior review.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-14 lg:px-8">
        <div className="rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F1F1F1] text-[#073D7F]">
              <WalletCards className="h-6 w-6" />
            </div>

            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                Modular Add-Ons
              </div>

              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                Add high-impact services without changing your core tier.
              </h2>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
                Use add-ons when you need a specific finance function, a
                project-based deliverable, donor reporting support, grant
                finance support, or extra capacity outside your core monthly
                subscription.
              </p>
            </div>
          </div>

          <div className="mt-8 overflow-hidden rounded-[1.5rem] border border-[#D9E3F4]">
            <table className="min-w-full divide-y divide-[#D9E3F4]">
              <thead className="bg-[#F8FAFC]">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Modular Service
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Subscription / Billing Structure
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#D9E3F4] bg-white">
                <tr>
                  <td className="px-6 py-5 text-sm font-semibold text-slate-950">
                    Standalone Payroll Processing
                  </td>
                  <td className="px-6 py-5 text-sm leading-7 text-slate-600">
                    {pricing.payroll}. Suitable where the client only needs
                    payroll, payslips, PAYE, pension, and statutory deduction
                    support.
                  </td>
                </tr>

                <tr>
                  <td className="px-6 py-5 text-sm font-semibold text-slate-950">
                    Standalone Tax Compliance
                  </td>
                  <td className="px-6 py-5 text-sm leading-7 text-slate-600">
                    {pricing.tax}. Covers local statutory filings, tax tracking,
                    and tax authority correspondence support.
                  </td>
                </tr>

                <tr>
                  <td className="px-6 py-5 text-sm font-semibold text-slate-950">
                    Financial Modelling
                  </td>
                  <td className="px-6 py-5 text-sm leading-7 text-slate-600">
                    {pricing.modelling}. Suitable for fundraising, project
                    finance, expansion planning, scenario analysis, and quarterly
                    model updates.
                  </td>
                </tr>

                <tr>
                  <td className="px-6 py-5 text-sm font-semibold text-slate-950">
                    Grant & Donor Reporting Support
                  </td>
                  <td className="px-6 py-5 text-sm leading-7 text-slate-600">
                    Monthly or project-based support for restricted funding,
                    grant utilisation reports, donor schedules, fund tracking,
                    and audit-ready grant documentation.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm">
            <CreditCard className="h-7 w-7 text-[#073D7F]" />
            <h3 className="mt-5 text-xl font-semibold text-slate-950">
              Upfront payment collection
            </h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Clients pay through {pricing.paymentRail}. Nigerian clients may
              use Paystack recurring billing where available; international
              clients can pay by supported international cards.
            </p>
          </div>

          <div className="rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm">
            <ReceiptText className="h-7 w-7 text-[#073D7F]" />
            <h3 className="mt-5 text-xl font-semibold text-slate-950">
              Scope boundaries
            </h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Engagement letters define limits for transactions, employees,
              invoices, grant reports, reporting frequency, response times, and
              compliance support. If volumes exceed agreed limits for two
              consecutive months, the subscription may scale to the next level.
            </p>
          </div>

          <div className="rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm">
            <FileSpreadsheet className="h-7 w-7 text-[#073D7F]" />
            <h3 className="mt-5 text-xl font-semibold text-slate-950">
              Setup and catch-up fee
            </h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Where prior books, grant records, fund schedules, payroll records,
              or statutory filings are incomplete, a one-time setup and catch-up
              fee is charged before the monthly subscription starts.
            </p>
          </div>
        </div>

        <div className="mt-10 rounded-[2rem] bg-[#073D7F] p-8 text-white lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-white/60">
                Start with the right finance tier
              </div>

              <h2 className="mt-4 text-3xl font-semibold tracking-tight">
                Build a finance operating system that grows with your
                organisation.
              </h2>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/75">
                Kiamina can begin with core compliance, expand into integrated
                finance operations, and support strategic CFO decisions as your
                business or nonprofit grows.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
              <a
                href="/get-started"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#073D7F]"
              >
                Get Started
                <ArrowRight className="h-4 w-4" />
              </a>

              <a
                href="/contact"
                className="inline-flex items-center justify-center rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white"
              >
                Talk to Us
              </a>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-start gap-3 rounded-[1.5rem] border border-[#D9E3F4] bg-white p-5 text-sm leading-7 text-slate-500">
          <BarChart3 className="mt-1 h-5 w-5 flex-none text-[#073D7F]" />
          <p>
            Pricing shown is indicative and may vary based on transaction
            volume, employee headcount, number of entities, reporting cadence,
            catch-up work, industry complexity, statutory requirements, donor or
            grant reporting needs, restricted funding complexity, and scope
            boundaries agreed in the engagement letter.
          </p>
        </div>
      </section>
    </main>
  );
}