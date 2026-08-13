"use client";

import { use, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Briefcase, CheckCircle } from "lucide-react";

const engagementTypes = [
  {
    value: "monthly_bookkeeping",
    label: "Monthly Bookkeeping",
  },
  {
    value: "management_reporting",
    label: "Monthly Management Reporting",
  },
  {
    value: "unaudited_financial_statements",
    label: "Unaudited Financial Statements",
  },
  {
    value: "tax_compliance",
    label: "Tax Compliance",
  },
  {
    value: "payroll",
    label: "Payroll",
  },
  {
    value: "kyc_compliance",
    label: "KYC / Compliance",
  },
  {
    value: "cfo_advisory",
    label: "CFO Advisory",
  },
  {
    value: "financial_modelling",
    label: "Financial Modelling",
  },
];

export default function NewEngagementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    engagement_type: "monthly_bookkeeping",
    reporting_period_start: "",
    reporting_period_end: "",
  });

  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formData.name || !formData.engagement_type) {
      setStatus("error");
      setMessage("Engagement name and type are required.");
      return;
    }

    try {
      setStatus("loading");
      setMessage("Creating engagement workspace...");

      const response = await fetch("/api/engagements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organisation_id: id,
          ...formData,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to create engagement.");
      }

      setStatus("success");
      setMessage("Engagement workspace created successfully.");

      router.push(`/portal/engagements/${result.engagementId}`);
      router.refresh();
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to create engagement."
      );
    }
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <section className="border-b border-[#D9E3F4] bg-white">
        <div className="mx-auto max-w-4xl px-6 py-8 lg:px-8">
          <a
            href={`/portal/organisations/${id}/engagements`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#073D7F]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to engagements
          </a>

          <div className="mt-8">
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
              Engagements
            </div>

            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
              Create engagement workspace
            </h1>

            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
              Create a structured workspace for bookkeeping, payroll, tax,
              compliance, financial reporting, management reporting, or advisory
              work.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-12 lg:px-8">
        <div className="rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F1F1F1] text-[#073D7F]">
            <Briefcase className="h-5 w-5" />
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="text-sm font-medium text-slate-700">
                Engagement Name *
              </label>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="mt-2 w-full rounded-xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
                placeholder="Example: July 2026 Management Reporting"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Engagement Type *
              </label>
              <select
                name="engagement_type"
                value={formData.engagement_type}
                onChange={handleChange}
                className="mt-2 w-full rounded-xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
              >
                {engagementTypes.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Reporting Period Start
                </label>
                <input
                  type="date"
                  name="reporting_period_start"
                  value={formData.reporting_period_start}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Reporting Period End
                </label>
                <input
                  type="date"
                  name="reporting_period_end"
                  value={formData.reporting_period_end}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                disabled={status === "loading"}
                className="rounded-full bg-[#073D7F] px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
              >
                {status === "loading" ? "Creating..." : "Create Engagement"}
              </button>

              <a
                href={`/portal/organisations/${id}/engagements`}
                className="rounded-full border border-[#D9E3F4] bg-white px-6 py-3 text-center text-sm font-semibold text-[#073D7F]"
              >
                Cancel
              </a>
            </div>

            {message ? (
              <div
                className={`rounded-xl px-4 py-3 text-sm leading-7 ${
                  status === "success"
                    ? "bg-emerald-50 text-emerald-700"
                    : status === "error"
                    ? "bg-red-50 text-red-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {status === "success" ? (
                  <div className="flex gap-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{message}</span>
                  </div>
                ) : (
                  message
                )}
              </div>
            ) : null}
          </form>
        </div>
      </section>
    </main>
  );
}