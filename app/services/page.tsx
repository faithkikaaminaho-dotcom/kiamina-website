import React from "react";
import {
  BookOpen,
  Wallet,
  FileText,
  BarChart3,
  Briefcase,
  LineChart,
  ShieldCheck,
  Users,
} from "lucide-react";

const services = [
  {
    title: "Bookkeeping",
    slug: "bookkeeping",
    problem:
      "Disorganized records create blind spots, slow reporting, and increase compliance risk.",
    outcome:
      "Structured, audit-ready records that create control and confidence.",
    fit: "Growing businesses and nonprofits that need a reliable financial foundation.",
    intro:
      "Structured bookkeeping is the operating layer behind reliable reporting, clean compliance, and better decision-making.",
    bullets: [
      "Monthly bookkeeping workflows with disciplined close processes",
      "Chart of accounts aligned with reporting needs",
      "Transaction classification and reconciliation",
    ],
  },
  {
    title: "Payroll Processing",
    slug: "payroll-processing",
    problem:
      "Manual or poorly managed payroll creates compliance risks, errors, and employee dissatisfaction.",
    outcome:
      "Accurate, timely, and compliant payroll that builds trust and meets statutory requirements.",
    fit: "Businesses and nonprofits with employees requiring structured payroll management.",
    intro:
      "Payroll processing ensures employees are paid accurately while maintaining compliance and proper documentation.",
    bullets: [
      "End-to-end payroll processing and payslip generation",
      "PAYE, pension, and statutory deductions",
      "Compliance with Nigerian payroll regulations",
    ],
  },
  {
    title: "Financial Reporting",
    slug: "financial-reporting",
    problem:
      "Delayed or unclear reporting makes timely decision-making difficult.",
    outcome: "Decision-ready reports that show performance clearly.",
    fit: "Executives who need visibility without chasing numbers.",
    intro: "Financial reporting should clarify performance, risk, and priorities.",
    bullets: [
      "Monthly financial statements",
      "Management-ready reporting",
      "Structured reporting support",
    ],
  },
  {
    title: "Management Reporting",
    slug: "management-reporting",
    problem: "Data exists, but not in a form leaders can act on quickly.",
    outcome: "Clear insight into trends and performance drivers.",
    fit: "CEOs, founders, and decision-makers.",
    intro:
      "Management reporting translates financial data into actionable insight.",
    bullets: [
      "Performance reporting",
      "Trend and variance analysis",
      "Executive-ready formats",
    ],
  },
  {
    title: "Accounts Receivable & Payable",
    slug: "receivables-payables",
    problem: "Weak payables and receivables control disrupts liquidity.",
    outcome: "Improved cash flow and financial discipline.",
    fit: "Businesses handling recurring transactions.",
    intro:
      "Cash discipline depends on structured receivables and payables management.",
    bullets: [
      "Receivables tracking",
      "Payables scheduling",
      "Cash cycle management",
    ],
  },
  {
    title: "CFO Consulting",
    slug: "cfo-consulting",
    problem:
      "Growing organizations need strategic finance support without full-time CFO cost.",
    outcome: "Executive-level financial insight for better decisions.",
    fit: "Growth-stage businesses and nonprofits.",
    intro: "CFO consulting provides leadership-level financial guidance.",
    bullets: [
      "Strategic financial oversight",
      "Decision support",
      "Financial structure advisory",
    ],
  },
  {
    title: "Financial Modelling",
    slug: "financial-modelling",
    problem:
      "Lack of structured projections limits planning and investment decisions.",
    outcome: "Clear financial projections for growth and planning.",
    fit: "Businesses and nonprofits planning expansion or funding.",
    intro:
      "Financial modelling supports planning, forecasting, and investment decisions.",
    bullets: [
      "Forecasting and projections",
      "Scenario analysis",
      "Investment modelling",
    ],
  },
  {
    title: "Tax Compliance",
    slug: "tax-compliance",
    problem: "Regulatory complexity creates exposure and penalties.",
    outcome: "Structured compliance and reduced risk.",
    fit: "Organizations operating under regulatory requirements.",
    intro: "Tax compliance should be controlled and predictable.",
    bullets: ["Tax filings and reporting", "Regulatory compliance", "Risk reduction"],
  },
];

const serviceIcons: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  bookkeeping: BookOpen,
  "payroll-processing": Wallet,
  "financial-reporting": FileText,
  "management-reporting": BarChart3,
  "receivables-payables": Briefcase,
  "cfo-consulting": Users,
  "financial-modelling": LineChart,
  "tax-compliance": ShieldCheck,
};

const IconBadge = ({
  icon: Icon,
}: {
  icon: React.ComponentType<{ className?: string }>;
}) => (
  <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[#D9E3F4] bg-[#F1F1F1] text-[#073D7F]">
    <Icon className="h-5 w-5" />
  </div>
);

export const metadata = {
  title: "Accounting Services | Kiamina Accounting Services",
  description:
    "Explore Kiamina Accounting Services including bookkeeping, payroll processing, financial reporting, management reporting, tax compliance, financial modelling, and CFO consulting.",
};

export default function ServicesPage() {
  return (
    <main>
      <section className="relative overflow-hidden bg-[#073D7F] py-24 text-white">
        <div className="absolute inset-0">
          <img
            src="/services.png"
            alt="Professional accounting services"
            className="h-full w-full object-cover opacity-25"
          />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="max-w-4xl">
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
              Services
            </div>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
              Accounting, reporting, compliance, and strategic finance support designed for serious businesses.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-blue-100">
              Each capability is designed to improve financial visibility, strengthen control, and support better leadership decisions.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid gap-8">
          {services.map((service) => {
            const Icon = serviceIcons[service.slug] || Briefcase;

            return (
              <div
                key={service.slug}
                className="rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm lg:p-10"
              >
                <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr]">
                  <div>
                    <IconBadge icon={Icon} />
                    <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                      {service.title}
                    </div>
                    <p className="mt-4 text-lg leading-8 text-slate-600">
                      {service.intro}
                    </p>
                  </div>

                  <div>
                    <div className="grid gap-5 md:grid-cols-3">
                      <div className="rounded-2xl bg-[#F1F1F1] p-5">
                        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                          Problem
                        </div>
                        <p className="mt-3 text-sm leading-7 text-slate-700">
                          {service.problem}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-[#F1F1F1] p-5">
                        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                          Outcome
                        </div>
                        <p className="mt-3 text-sm leading-7 text-slate-700">
                          {service.outcome}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-[#F1F1F1] p-5">
                        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                          Best suited for
                        </div>
                        <p className="mt-3 text-sm leading-7 text-slate-700">
                          {service.fit}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-4 md:grid-cols-3">
                      {service.bullets.map((bullet) => (
                        <div
                          key={bullet}
                          className="rounded-2xl border border-[#D9E3F4] p-5 text-sm leading-7 text-slate-600"
                        >
                          {bullet}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}