"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const eventTypes = [
  ["THEFT", "Theft"],
  ["FRAUD", "Fraud"],
  ["BAD_DEBT", "Bad Debt"],
  ["CUSTOMER_DEFAULT", "Customer Default"],
  ["NEW_CONTRACT", "New Contract Won"],
  ["CONTRACT_LOSS", "Contract Loss"],
  ["MAJOR_REPAIR", "Major Repair"],
  ["TAX_PENALTY", "Tax Penalty"],
  ["REGULATORY_ISSUE", "Regulatory Issue"],
  ["FUNDING_RECEIVED", "Funding Received"],
  ["DONATION_RECEIVED", "Donation Received"],
  ["ASSET_PURCHASE", "Asset Purchase"],
  ["LOAN_OBTAINED", "Loan Obtained"],
  ["PAYROLL_INCREASE", "Payroll Increase"],
  ["EXCHANGE_RATE_IMPACT", "Exchange Rate Impact"],
  ["OPERATIONAL_DISRUPTION", "Operational Disruption"],
  ["LITIGATION", "Litigation"],
  ["PROJECT_DELAY", "Project Delay"],
  ["OTHER", "Other"],
];

const impactAreas = [
  "Revenue",
  "Cost of Sales",
  "Operating Expenses",
  "Cash Flow",
  "Receivables",
  "Payables",
  "Payroll",
  "Tax",
  "Compliance",
  "Inventory / Assets",
  "Operations",
  "Governance / Controls",
  "Financial Statements",
  "Management Reporting",
  "Other",
];

export default function CreatePeriodEventForm({
  accountingPeriodId,
  defaultCurrency,
}: {
  accountingPeriodId: string;
  defaultCurrency?: string | null;
}) {
  const router = useRouter();

  const [eventType, setEventType] = useState("OTHER");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [financialImpactAmount, setFinancialImpactAmount] = useState("");
  const [currencyCode, setCurrencyCode] = useState(defaultCurrency || "");
  const [impactArea, setImpactArea] = useState("");
  const [severity, setSeverity] = useState("MEDIUM");
  const [managementResponse, setManagementResponse] = useState("");
  const [advisoryNote, setAdvisoryNote] = useState("");
  const [recommendedAction, setRecommendedAction] = useState("");
  const [includeInManagementReport, setIncludeInManagementReport] =
    useState(true);
  const [
    includeInFinancialStatementNotes,
    setIncludeInFinancialStatementNotes,
  ] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/period-events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accounting_period_id: accountingPeriodId,
          event_type: eventType,
          title,
          description: description || null,
          event_date: eventDate || null,
          financial_impact_amount: financialImpactAmount || null,
          currency_code: currencyCode || null,
          impact_area: impactArea || null,
          severity,
          management_response: managementResponse || null,
          advisory_note: advisoryNote || null,
          recommended_action: recommendedAction || null,
          include_in_management_report: includeInManagementReport,
          include_in_financial_statement_notes: includeInFinancialStatementNotes,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to create period event.");
      }

      router.push(`/portal/accounting-periods/${result.accountingPeriodId}`);
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to create period event."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm"
    >
      {errorMessage ? (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Event type
          </span>
          <select
            value={eventType}
            onChange={(event) => setEventType(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          >
            {eventTypes.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Severity
          </span>
          <select
            value={severity}
            onChange={(event) => setSeverity(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </label>

        <label className="block md:col-span-2">
          <span className="text-sm font-semibold text-slate-700">
            Event title
          </span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Diesel theft at project site"
            required
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          />
        </label>

        <label className="block md:col-span-2">
          <span className="text-sm font-semibold text-slate-700">
            What happened during the period?
          </span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={5}
            placeholder="Describe the event, when it occurred, how it affected the business, and any known financial or operational implication."
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm leading-7 outline-none focus:border-[#073D7F]"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Event date
          </span>
          <input
            type="date"
            value={eventDate}
            onChange={(event) => setEventDate(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Impact area
          </span>
          <select
            value={impactArea}
            onChange={(event) => setImpactArea(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          >
            <option value="">Select impact area</option>
            {impactAreas.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Estimated financial impact
          </span>
          <input
            type="number"
            step="0.01"
            value={financialImpactAmount}
            onChange={(event) =>
              setFinancialImpactAmount(event.target.value)
            }
            placeholder="2500000"
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Currency
          </span>
          <input
            value={currencyCode}
            onChange={(event) => setCurrencyCode(event.target.value)}
            placeholder="NGN"
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm uppercase outline-none focus:border-[#073D7F]"
          />
        </label>

        <label className="block md:col-span-2">
          <span className="text-sm font-semibold text-slate-700">
            Management response
          </span>
          <textarea
            value={managementResponse}
            onChange={(event) => setManagementResponse(event.target.value)}
            rows={4}
            placeholder="What did management do or plan to do in response?"
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm leading-7 outline-none focus:border-[#073D7F]"
          />
        </label>

        <label className="block md:col-span-2">
          <span className="text-sm font-semibold text-slate-700">
            Advisory note
          </span>
          <textarea
            value={advisoryNote}
            onChange={(event) => setAdvisoryNote(event.target.value)}
            rows={4}
            placeholder="Kiamina advisory view: implications, risks, controls, and strategic observations."
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm leading-7 outline-none focus:border-[#073D7F]"
          />
        </label>

        <label className="block md:col-span-2">
          <span className="text-sm font-semibold text-slate-700">
            Recommended action
          </span>
          <textarea
            value={recommendedAction}
            onChange={(event) => setRecommendedAction(event.target.value)}
            rows={4}
            placeholder="Recommended action points for management."
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm leading-7 outline-none focus:border-[#073D7F]"
          />
        </label>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <label className="flex items-start gap-3 rounded-2xl border border-[#D9E3F4] bg-[#F8FAFC] p-4 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={includeInManagementReport}
            onChange={(event) =>
              setIncludeInManagementReport(event.target.checked)
            }
            className="mt-1"
          />
          <span>
            <span className="font-semibold text-slate-950">
              Include in management report
            </span>
            <span className="mt-1 block text-slate-500">
              Use this event when preparing management commentary and advisory
              notes.
            </span>
          </span>
        </label>

        <label className="flex items-start gap-3 rounded-2xl border border-[#D9E3F4] bg-[#F8FAFC] p-4 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={includeInFinancialStatementNotes}
            onChange={(event) =>
              setIncludeInFinancialStatementNotes(event.target.checked)
            }
            className="mt-1"
          />
          <span>
            <span className="font-semibold text-slate-950">
              Consider for FS notes
            </span>
            <span className="mt-1 block text-slate-500">
              Mark this event for later consideration in interim or annual
              financial statement disclosures.
            </span>
          </span>
        </label>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-[#073D7F] px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Saving event..." : "Save Period Event"}
        </button>

        <a
          href={`/portal/accounting-periods/${accountingPeriodId}`}
          className="rounded-full border border-[#D9E3F4] bg-white px-6 py-3 text-center text-sm font-semibold text-[#073D7F]"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}