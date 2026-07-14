"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Loader2, Plus } from "lucide-react";

const services = [
  "Bookkeeping",
  "Payroll Processing",
  "Financial Reporting",
  "Management Reporting",
  "Accounts Receivable and Payable Management",
  "CFO Consulting",
  "Financial Modelling",
  "Tax Compliance",
  "Full Service Finance Support",
];

export default function QuickEngagementForm({
  organisationId,
}: {
  organisationId: string;
}) {
  const router = useRouter();
  const [serviceName, setServiceName] = useState("Full Service Finance Support");
  const [customName, setCustomName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [message, setMessage] = useState("");

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsCreating(true);
    setMessage("");

    try {
      const response = await fetch(
        `/api/organisations/${organisationId}/engagements/quick-create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            service_name: serviceName,
            engagement_name: customName,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to create engagement.");
      }

      if (result.engagementId) {
        router.push(`/portal/engagements/${result.engagementId}`);
        return;
      }

      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to create engagement."
      );
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <form onSubmit={handleCreate} className="space-y-5">
      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
          Service line
        </span>

        <select
          value={serviceName}
          onChange={(event) => setServiceName(event.target.value)}
          className="mt-3 h-12 w-full rounded-2xl border border-[#D9E3F4] bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#073D7F]"
        >
          {services.map((service) => (
            <option key={service} value={service}>
              {service}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
          Custom engagement name
        </span>

        <input
          value={customName}
          onChange={(event) => setCustomName(event.target.value)}
          className="mt-3 h-12 w-full rounded-2xl border border-[#D9E3F4] px-4 text-sm outline-none transition focus:border-[#073D7F]"
          placeholder="Optional. Example: Monthly Bookkeeping - ABC Limited"
        />
      </label>

      {message ? (
        <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {message}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isCreating}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#073D7F] px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isCreating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Creating...
          </>
        ) : (
          <>
            <Plus className="h-4 w-4" />
            Create Engagement
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>
    </form>
  );
}