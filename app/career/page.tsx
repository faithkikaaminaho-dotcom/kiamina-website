import React from "react";
import { Briefcase, Users } from "lucide-react";

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
  title: "Careers | Kiamina Accounting Services",
  description:
    "Explore career opportunities at Kiamina Accounting Services. No vacancies are currently available, but future openings will be published here.",
};

export default function CareerPage() {
  return (
    <main>
      <section className="relative overflow-hidden bg-[#073D7F] py-24 text-white">
        <div className="absolute inset-0">
          <img
            src="/career.png"
            alt="Careers at Kiamina Accounting Services"
            className="h-full w-full object-cover opacity-20"
          />
        </div>

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(100,145,222,0.16),transparent_28%),radial-gradient(circle_at_left,rgba(255,255,255,0.06),transparent_20%)]" />

        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="max-w-4xl">
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
              Career
            </div>

            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
              Build your career with a firm focused on precision, integrity, and growth.
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-blue-100">
              We are building a high-standard accounting and advisory practice designed to support businesses and nonprofits with clarity, compliance, and strategic financial insight.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <img
          src="/career.png"
          alt="Career opportunities at Kiamina"
          className="mb-10 h-[320px] w-full rounded-[2rem] object-cover"
        />

        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm">
            <IconBadge icon={Users} />

            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
              Why Join Kiamina
            </div>

            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
              A growing environment for professionals who value excellence.
            </h2>

            <p className="mt-5 text-base leading-8 text-slate-600">
              At Kiamina Accounting Services, we believe strong careers are built on technical excellence, continuous improvement, and meaningful client impact.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                "Exposure to real client challenges",
                "Professional and ethical work culture",
                "Growth-oriented environment",
                "Opportunities to build specialist expertise",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-[1.25rem] border border-[#D9E3F4] bg-[#F1F1F1] p-4 text-sm leading-7 text-slate-700"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-[#D9E3F4] bg-[#F1F1F1] p-8 shadow-sm">
            <IconBadge icon={Briefcase} />

            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
              Current Openings
            </div>

            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
              No vacancies at the moment.
            </h2>

            <p className="mt-5 text-base leading-8 text-slate-600">
              We do not have any active openings right now. When opportunities become available, they will be published here with full role details and application instructions.
            </p>

            <div className="mt-8 rounded-[1.5rem] border border-dashed border-[#D9E3F4] bg-white p-8">
              <div className="text-lg font-semibold text-slate-950">
                Please check back later.
              </div>

              <p className="mt-3 text-sm leading-7 text-slate-600">
                You can also follow Kiamina Accounting Services for future announcements and career updates.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}