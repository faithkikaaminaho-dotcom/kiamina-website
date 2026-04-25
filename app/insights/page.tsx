"use client";

import { useState } from "react";

const insights = [
  {
    slug: "costly-accounting-mistakes-nigerian-smes",
    title: "5 Costly Accounting Mistakes Nigerian SMEs Make",
    category: "SME Accounting",
    readTime: "6 min read",
    summary:
      "Avoidable accounting errors can weaken cash flow, distort reporting, create compliance risk, and limit growth. This resource outlines five common mistakes and how SMEs can fix them.",
    sections: [
      {
        heading: "Introduction",
        body: "Many SMEs in Nigeria struggle not because of poor products or services, but because of common accounting errors. Neglecting accounting can create serious cash flow problems, penalties, and missed opportunities for growth and investment. This guide outlines five common mistakes and practical ways to avoid them.",
      },
      {
        heading: "Mistake 1: Mixing Personal and Business Finances",
        body: "Always maintain a separate business bank account. Mixing personal and business transactions leads to disorganized records, distorted profit calculations, and unnecessary difficulty during tax reporting.",
      },
      {
        heading: "Mistake 2: Not Keeping Proper Financial Records",
        body: "Accurate records are the foundation of reliable reporting and informed decision-making.",
        bullets: [
          "Maintain receipts, invoices, and bank statements in an organized manner.",
          "Use digital bookkeeping tools to improve consistency and save time.",
          "Ensure transactions are properly categorized and documented.",
        ],
      },
      {
        heading: "Mistake 3: Ignoring Tax Compliance",
        body: "Tax compliance is non-negotiable. Missed obligations can result in penalties, disruption, and avoidable legal exposure.",
        bullets: [
          "File and pay all applicable taxes on time, including PAYE, VAT, withholding tax, and company or personal income tax where relevant.",
          "Stay current with changes in tax law and reporting requirements.",
          "Seek professional guidance where complexity exists.",
        ],
      },
      {
        heading: "Mistake 4: Failing to Reconcile Accounts",
        body: "Regular bank reconciliation ensures that transactions are properly captured and that records align with bank activity. Missing reconciliations can hide fraud, accounting errors, or cash shortages.",
      },
      {
        heading: "Mistake 5: Neglecting Management Reporting",
        body: "Monthly management reports help track revenue, expenses, profitability, and performance trends. Without them, decision-making becomes reactive and imprecise.",
      },
      {
        heading: "How to Fix These Mistakes",
        bullets: [
          "Set up a proper bookkeeping system.",
          "Automate accounting processes where practical to reduce manual errors and improve efficiency.",
          "Work with a trusted accounting partner like Kiamina Accounting Services to strengthen compliance and financial management.",
        ],
      },
      {
        heading: "Checklist for SMEs",
        bullets: [
          "Separate business and personal accounts",
          "Maintain organized financial records",
          "File all taxes on time",
          "Reconcile bank statements monthly",
          "Review monthly financial reports",
        ],
      },
    ],
    cta: "Do not let accounting mistakes hold your business back. Kiamina Accounting Services helps SMEs stay compliant, organized, and profitable. Book a free consultation today.",
  },
  {
    slug: "fund-reporting-mistakes-nonprofits",
    title: "5 Critical Fund Reporting Mistakes Nonprofits Must Avoid",
    category: "Nonprofit Finance",
    readTime: "6 min read",
    summary:
      "Maintain transparency and donor trust by avoiding common fund reporting errors. This guide outlines five critical mistakes and how nonprofits can correct them.",
    sections: [
      {
        heading: "Introduction",
        body: "Nonprofits rely on diverse funding streams including grants, donations, membership fees, and government allocations. Accurate fund reporting is essential for transparency, compliance, and donor trust.",
      },
      {
        heading: "Mistake 1: Failing to Separate Funds by Purpose",
        body: "Each fund or grant should have its own reporting structure. Mixing funds makes accurate reporting difficult and risks misuse.",
        bullets: ["Use fund codes to track each funding source and purpose."],
      },
      {
        heading: "Mistake 2: Not Tracking Restricted vs. Unrestricted Funds",
        body: "Restricted funds must only be used for designated purposes, while unrestricted funds support general operations. Misuse can lead to donor and legal issues.",
      },
      {
        heading: "Mistake 3: Late or Inaccurate Grant Reporting",
        body: "Grants often require periodic reporting. Delays or inaccuracies can affect future funding.",
        bullets: ["Maintain a reporting calendar.", "Document all expenditures clearly."],
      },
      {
        heading: "Mistake 4: Ignoring Internal Controls",
        body: "Weak approval processes increase risk of error and fraud.",
        bullets: [
          "Implement dual approvals.",
          "Maintain supporting documentation.",
          "Reconcile accounts monthly.",
        ],
      },
      {
        heading: "Mistake 5: Not Reconciling Accounts Regularly",
        body: "Regular reconciliation ensures accuracy of fund balances and prevents hidden discrepancies.",
      },
      {
        heading: "Best Practices",
        bullets: [
          "Maintain fund codes.",
          "Use nonprofit accounting software.",
          "Train staff on fund restrictions.",
          "Conduct regular internal reviews.",
          "Provide transparent reporting to stakeholders.",
        ],
      },
      {
        heading: "Checklist for Nonprofits",
        bullets: [
          "Separate funds by purpose",
          "Track restricted vs. unrestricted funds",
          "Meet all reporting deadlines",
          "Maintain strong internal controls",
          "Reconcile accounts monthly",
        ],
      },
    ],
    cta: "Proper fund reporting protects your nonprofit and builds donor confidence. Kiamina Accounting Services helps nonprofits stay compliant, organized, and transparent. Book a free consultation today.",
  },
  {
    slug: "payroll-guide-nigeria",
    title: "Payroll Made Simple: A Step-by-Step Guide for Nigerian SMEs and Nonprofits",
    category: "Payroll & Compliance",
    readTime: "8 min read",
    summary:
      "A practical step-by-step guide to setting up and managing compliant payroll in Nigeria, covering employee records, deductions, statutory obligations, and common payroll mistakes.",
    sections: [
      {
        heading: "Introduction",
        body: "Payroll is a critical function for any Nigerian SME or nonprofit. Accurate and timely payroll processing supports employee satisfaction, legal compliance, and financial stability.",
      },
      {
        heading: "Step 1: Set Up Employee Records",
        body: "Comprehensive employee records are the foundation of accurate payroll. Maintain full employee details including salary, bank information, pension details, tax identification, address, attendance, and leave records.",
      },
      {
        heading: "Step 2: Calculate Gross Pay",
        body: "Gross pay includes basic salary, allowances, and overtime pay where applicable. Each element should be consistently documented and calculated according to employment terms and labour rules.",
      },
      {
        heading: "Step 3: Deduct Employee Contributions and Taxes",
        body: "Apply payroll deductions accurately, including PAYE tax, pension contributions, and any other lawful deductions relevant to the employee.",
        bullets: [
          "Use current tax tables and statutory rules.",
          "Remit all deductions on time to avoid penalties.",
        ],
      },
      {
        heading: "Step 4: Deduct Employee Disciplinary Fines",
        body: "Where disciplinary fines apply, follow due process, maintain documentation, and ensure the employee is aware before any deduction is made.",
      },
      {
        heading: "Step 5: Generate Pay Slips",
        body: "Each payslip should clearly show gross pay, deductions, net pay, pay period, and employer details. Payroll records should be retained accurately for statutory and operational purposes.",
      },
      {
        heading: "Step 6: Payroll Compliance",
        body: "Payroll compliance includes registration with relevant authorities, timely remittances, annual returns, minimum wage compliance, and retention of payroll records.",
      },
      {
        heading: "Step 7: Handle Promotions and Bonuses",
        body: "Promotions and bonuses should be reflected correctly in payroll records and taxed appropriately. All related changes should be documented and communicated clearly.",
      },
      {
        heading: "Common Payroll Mistakes Organisations Make",
        bullets: [
          "Misclassifying employees",
          "Incorrect tax calculations",
          "Late remittances",
          "Poor record-keeping",
          "Ignoring changes in legislation",
        ],
      },
      {
        heading: "Tips to Streamline Payroll",
        bullets: [
          "Automate payroll where possible.",
          "Centralize employee data.",
          "Set clear payroll, leave, and overtime policies.",
          "Audit payroll regularly.",
          "Seek expert advice when needed.",
        ],
      },
    ],
    cta: "Kiamina Accounting Services offers payroll management and consultation support to help SMEs and nonprofits streamline payroll, ensure compliance, and save time. Book a free consultation today.",
  },
];

export default function InsightsPage() {
  const [selectedInsight, setSelectedInsight] = useState(insights[0]);

  const insight = selectedInsight;
  const featured = insights[0];
  const secondary = insights.slice(1);

  return (
    <main>
      <section className="relative overflow-hidden bg-[#073D7F] py-24 text-white">
        <div className="absolute inset-0">
          <img
            src="/insights.png"
            alt="Financial insights and publications"
            className="h-full w-full object-cover opacity-20"
          />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(100,145,222,0.18),transparent_30%),radial-gradient(circle_at_left,rgba(255,255,255,0.06),transparent_22%)]" />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="max-w-5xl">
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
              Insights
            </div>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              Financial insight for leaders, operators, and mission-driven organizations.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-blue-100">
              A curated resource library covering accounting, reporting, payroll, compliance, and financial decision-making for businesses and nonprofits operating in complex environments.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-[#D9E3F4] bg-white">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <button
              type="button"
              onClick={() => setSelectedInsight(featured)}
              className="group rounded-[2rem] border border-[#D9E3F4] bg-[#073D7F] p-8 text-left text-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#6491DE]">
                Featured Insight
              </div>
              <div className="mt-6 text-sm font-semibold uppercase tracking-[0.22em] text-blue-100">
                {featured.category}
              </div>
              <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-tight">
                {featured.title}
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-8 text-blue-100">
                {featured.summary}
              </p>
              <div className="mt-6 text-sm text-blue-200">{featured.readTime}</div>
            </button>

            <div className="grid gap-5">
              {secondary.map((item) => (
                <button
                  key={item.slug}
                  type="button"
                  onClick={() => setSelectedInsight(item)}
                  className={`rounded-[1.75rem] border p-6 text-left transition duration-300 hover:-translate-y-1 hover:shadow-lg ${
                    insight.slug === item.slug
                      ? "border-[#073D7F] bg-[#073D7F] text-white shadow-lg"
                      : "border-[#D9E3F4] bg-white text-slate-900"
                  }`}
                >
                  <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6491DE]">
                    {item.category}
                  </div>
                  <h3 className="mt-3 text-xl font-semibold leading-tight">
                    {item.title}
                  </h3>
                  <p
                    className={`mt-3 text-sm leading-7 ${
                      insight.slug === item.slug ? "text-blue-100" : "text-slate-600"
                    }`}
                  >
                    {item.summary}
                  </p>
                  <div
                    className={`mt-4 text-xs ${
                      insight.slug === item.slug ? "text-blue-200" : "text-slate-500"
                    }`}
                  >
                    {item.readTime}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#F1F1F1]">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.34fr_0.66fr] lg:items-start">
            <aside className="space-y-6 lg:sticky lg:top-28">
              <div className="rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm">
                <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                  Resource Library
                </div>
                <div className="mt-6 space-y-4">
                  {insights.map((item) => (
                    <button
                      key={item.slug}
                      type="button"
                      onClick={() => setSelectedInsight(item)}
                      className={`w-full rounded-[1.25rem] border p-5 text-left transition duration-300 ${
                        insight.slug === item.slug
                          ? "border-[#073D7F] bg-[#073D7F] text-white shadow-md"
                          : "border-[#D9E3F4] bg-[#F1F1F1] text-slate-900 hover:bg-white hover:shadow-sm"
                      }`}
                    >
                      <div
                        className={`text-xs font-semibold uppercase tracking-[0.2em] ${
                          insight.slug === item.slug ? "text-[#6491DE]" : "text-slate-500"
                        }`}
                      >
                        {item.category}
                      </div>
                      <div className="mt-2 text-base font-semibold leading-7">
                        {item.title}
                      </div>
                      <div
                        className={`mt-2 text-xs ${
                          insight.slug === item.slug ? "text-blue-200" : "text-slate-500"
                        }`}
                      >
                        {item.readTime}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm">
                <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                  Why this matters
                </div>
                <p className="mt-4 text-sm leading-7 text-slate-600">
                  These publications are designed to help decision-makers strengthen financial control, reduce compliance risk, and improve reporting quality across both businesses and nonprofits.
                </p>
              </div>
            </aside>

            <article className="overflow-hidden rounded-[2.25rem] border border-[#D9E3F4] bg-white shadow-sm">
              <div className="border-b border-[#D9E3F4] bg-[#073D7F] px-8 py-10 text-white lg:px-10 lg:py-12">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#6491DE]">
                    {insight.category}
                  </div>
                  <div className="text-xs text-blue-200">{insight.readTime}</div>
                </div>
                <h2 className="mt-5 max-w-4xl text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
                  {insight.title}
                </h2>
                <p className="mt-5 max-w-3xl text-lg leading-8 text-blue-100">
                  {insight.summary}
                </p>
              </div>

              <div className="grid gap-10 px-8 py-10 lg:grid-cols-[0.24fr_0.76fr] lg:px-10 lg:py-12">
                <div className="space-y-8">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Publication focus
                    </div>
                    <div className="mt-3 text-sm leading-7 text-slate-700">
                      Practical guidance for financial operations, compliance discipline, and management decision-making.
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Audience
                    </div>
                    <div className="mt-3 text-sm leading-7 text-slate-700">
                      Founders, executives, finance leads, administrators, and nonprofit decision-makers.
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Use
                    </div>
                    <div className="mt-3 text-sm leading-7 text-slate-700">
                      Use this insight to strengthen internal finance processes and reduce operational risk.
                    </div>
                  </div>
                </div>

                <div className="space-y-10">
                  {insight.sections.map((section, index) => (
                    <section
                      key={section.heading}
                      className="border-b border-slate-100 pb-10 last:border-b-0 last:pb-0"
                    >
                      <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6491DE]">
                        Section {index + 1}
                      </div>
                      <h3 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                        {section.heading}
                      </h3>
                      {section.body ? (
                        <p className="mt-4 text-base leading-8 text-slate-600">
                          {section.body}
                        </p>
                      ) : null}
                      {section.bullets ? (
                        <ul className="mt-5 space-y-4 text-base leading-8 text-slate-600">
                          {section.bullets.map((bullet) => (
                            <li key={bullet} className="flex gap-4">
                              <span className="mt-3 h-1.5 w-1.5 rounded-full bg-[#6491DE]" />
                              <span>{bullet}</span>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </section>
                  ))}

                  <div className="rounded-[1.75rem] bg-[#073D7F] p-8 text-white">
                    <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                      Take Action
                    </div>
                    <p className="mt-4 text-base leading-8 text-blue-100">
                      {insight.cta}
                    </p>
                    <a
                      href="/contact"
                      className="mt-6 inline-flex items-center rounded-full bg-[#6491DE] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#4F7FD1]"
                    >
                      Book a Free Consultation
                    </a>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}