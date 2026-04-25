import React from "react";
import { Briefcase, Search, Globe2, ShieldCheck } from "lucide-react";

const differentiators = [
  {
    title: "Strategic, not clerical",
    body: "Financial reporting built to inform growth decisions, not simply record transactions.",
  },
  {
    title: "Multi-country capability",
    body: "Remote service delivery across Nigeria, Canada, United States, United Kingdom, Australia, and Ireland with consistent standards and professional execution.",
  },
  {
    title: "Precision by design",
    body: "Structured workflows, reporting discipline, and reliable financial controls.",
  },
  {
    title: "Sector-aware delivery",
    body: "Financial systems shaped around the realities of complex industries and operating models.",
  },
];

const differentiatorIcons: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  "Strategic, not clerical": Search,
  "Multi-country capability": Globe2,
  "Precision by design": ShieldCheck,
  "Sector-aware delivery": Briefcase,
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

const SectionHeading = ({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body?: string;
}) => (
  <div className="max-w-3xl">
    <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
      {eyebrow}
    </div>
    <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
      {title}
    </h2>
    {body ? <p className="mt-5 text-lg leading-8 text-slate-600">{body}</p> : null}
  </div>
);

export const metadata = {
  title: "About Kiamina Accounting Services",
  description:
    "Learn about Kiamina Accounting Services, a Nigeria-based accounting and advisory firm supporting businesses and nonprofits with financial clarity, compliance, and strategic insight.",
};

export default function AboutPage() {
  return (
    <main>
      <section className="bg-[#073D7F] py-24 text-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="max-w-4xl">
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
              About Kiamina
            </div>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
              A Nigeria-based accounting and advisory firm built for business leaders who need more than basic compliance.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-blue-100">
              Kiamina Accounting Services combines financial accuracy, reporting clarity, and strategic finance support for companies operating across multiple jurisdictions. The firm works remotely across Nigeria, Canada, United States, United Kingdom, Australia, and Ireland.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <img
          src="/about.png"
          alt="About Kiamina Accounting Services"
          className="mb-10 h-[360px] w-full rounded-[2rem] object-cover"
        />

        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
              Our Mission
            </div>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              To empower businesses and nonprofits with accurate accounting systems, compliant tax structures, and strategic financial insight that support long term growth, transparency, and accountability.
            </p>

            <div className="mt-10 text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
              Our Vision
            </div>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              To redefine accounting and financial advisory as a strategic growth engine for businesses and mission-driven organizations worldwide.
            </p>
          </div>

          <div className="rounded-[2rem] border border-[#D9E3F4] bg-[#F1F1F1] p-8">
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
              Core Values
            </div>
            <ul className="mt-6 space-y-4 text-sm leading-7 text-slate-600">
              <li>
                <span className="font-semibold text-slate-900">Accuracy:</span>{" "}
                Precision in financial reporting and data integrity underpins every engagement, supporting both businesses and nonprofits.
              </li>
              <li>
                <span className="font-semibold text-slate-900">Integrity:</span>{" "}
                We operate with uncompromising ethical standards and transparent accountability, supporting both businesses and nonprofits.
              </li>
              <li>
                <span className="font-semibold text-slate-900">Compliance:</span>{" "}
                Strict adherence to statutory, regulatory, and professional requirements across all jurisdictions, supporting both businesses and nonprofits.
              </li>
              <li>
                <span className="font-semibold text-slate-900">Partnership:</span>{" "}
                Long-term client relationships built on trust, alignment, and shared objectives, supporting both businesses and nonprofits.
              </li>
              <li>
                <span className="font-semibold text-slate-900">
                  Continuous Improvement:
                </span>{" "}
                Ongoing refinement of processes, systems, and expertise in response to evolving environments, supporting both businesses and nonprofits.
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-[#F1F1F1]">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <SectionHeading
            eyebrow="Why clients choose Kiamina"
            title="Built for executives who value control, precision, and professional execution."
          />
          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {differentiators.map((item) => {
              const Icon = differentiatorIcons[item.title] || Briefcase;

              return (
                <div
                  key={item.title}
                  className="rounded-[1.75rem] bg-white p-7 ring-1 ring-[#D9E3F4] shadow-sm"
                >
                  <IconBadge icon={Icon} />
                  <h3 className="text-lg font-semibold text-slate-950">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {item.body}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}