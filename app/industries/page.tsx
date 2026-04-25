import React from "react";
import {
  Briefcase,
  Building2,
  Laptop,
  Hammer,
  Landmark,
} from "lucide-react";

const industries = [
  {
    title: "Oil & Gas",
    body: "Support for complex cost structures, regulatory requirements, and reporting needs across capital-intensive operations.",
  },
  {
    title: "Real Estate",
    body: "Financial visibility for project-based operations, asset performance, and cash flow planning.",
  },
  {
    title: "ICT",
    body: "Scalable finance support for fast-moving technology businesses that need clear reporting and operational structure.",
  },
  {
    title: "Construction",
    body: "Control across contracts, project costs, and financial reporting requirements for execution-heavy businesses.",
  },
  {
    title: "Nonprofits",
    body: "Transparent reporting, fund accountability, and structured compliance support for mission-driven organizations.",
  },
  {
    title: "Other Service Organizations",
    body: "Financial systems and reporting clarity for service-led businesses seeking stronger control and profitability insight.",
  },
];

const industryIcons: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  "Oil & Gas": Building2,
  "Real Estate": Building2,
  ICT: Laptop,
  Construction: Hammer,
  Nonprofits: Landmark,
  "Other Service Organizations": Briefcase,
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
  title: "Industries Served | Kiamina Accounting Services",
  description:
    "Kiamina Accounting Services supports oil and gas, real estate, ICT, construction, nonprofits, and service organizations with sector-aware accounting and advisory support.",
};

export default function IndustriesPage() {
  return (
    <main>
      <section className="relative overflow-hidden bg-[#073D7F] py-24 text-white">
        <div className="absolute inset-0">
          <img
            src="/industries.png"
            alt="Industry-focused financial support"
            className="h-full w-full object-cover opacity-25"
          />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="max-w-4xl">
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
              Industries
            </div>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
              Industry-aware financial support for organizations with real operational complexity.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-blue-100">
              Kiamina supports companies and organizations whose reporting, compliance, and financial control needs require more than generic accounting support.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {industries.map((industry) => {
            const Icon = industryIcons[industry.title] || Briefcase;

            return (
              <div
                key={industry.title}
                className="rounded-[1.75rem] border border-[#D9E3F4] bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >
                <IconBadge icon={Icon} />
                <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                  Sector
                </div>
                <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
                  {industry.title}
                </h2>
                <p className="mt-4 text-sm leading-7 text-slate-600">
                  {industry.body}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}