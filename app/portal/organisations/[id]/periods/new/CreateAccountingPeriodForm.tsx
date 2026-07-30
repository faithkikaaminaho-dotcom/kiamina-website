"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type EngagementOption = {
  id: string;
  name: string | null;
  engagement_type?: string | null;
};

const periodTypes = [
  {
    value: "MONTHLY",
    label: "Monthly reporting period",
  },
  {
    value: "QUARTERLY",
    label: "Quarterly reporting period",
  },
  {
    value: "SIX_MONTHLY",
    label: "Six-monthly reporting period",
  },
  {
    value: "YEARLY",
    label: "Year-end reporting period",
  },
  {
    value: "INTERIM_FS",
    label: "Interim financial statements period",
  },
  {
    value: "PERIOD_LOCK",
    label: "Period lock range",
  },
  {
    value: "PERIOD_CLOSE",
    label: "Period close range",
  },
  {
    value: "CUSTOM",
    label: "Custom date range",
  },
];

const statusOptions = [
  {
    value: "OPEN",
    label: "Open",
  },
  {
    value: "UNDER_REVIEW",
    label: "Under Review",
  },
  {
    value: "LOCKED",
    label: "Locked",
  },
  {
    value: "CLOSED",
    label: "Closed",
  },
];

export default function CreateAccountingPeriodForm({
  organisationId,
  engagements,
  defaultFramework,
  defaultCurrency,
}: {
  organisationId: string;
  engagements: EngagementOption[];
  defaultFramework?: string | null;
  defaultCurrency?: string | null;
}) {
  const router = useRouter();

  const [periodName, setPeriodName] = useState("");
  const [periodType, setPeriodType] = useState("PERIOD_LOCK");
  const [status, setStatus] = useState("LOCKED");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [lockReason, setLockReason] = useState("");
  const [engagementId, setEngagementId] = useState("");
  const [reportingFramework, setReportingFramework] = useState(
    defaultFramework || ""
  );
  const [currencyCode, setCurrencyCode] = useState(defaultCurrency || "");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  function handlePeriodTypeChange(nextPeriodType: string) {
    setPeriodType(nextPeriodType);

    if (nextPeriodType === "PERIOD_LOCK") {
      setStatus("LOCKED");
    }

    if (nextPeriodType === "PERIOD_CLOSE") {
      setStatus("CLOSED");
    }

    if (
      nextPeriodType !== "PERIOD_LOCK" &&
      nextPeriodType !== "PERIOD_CLOSE" &&
      (status === "LOCKED" || status === "CLOSED")
    ) {
      setStatus("OPEN");
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/accounting-periods", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organisation_id: organisationId,
          engagement_id: engagementId || null,
          period_name: periodName,
          name: periodName,
          period_type: periodType,
          start_date: startDate,
          end_date: endDate,
          status,
          lock_reason: lockReason || null,
          reporting_framework: reportingFramework || null,
          currency_code: currencyCode || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to create period control.");
      }

      router.push(`/portal/organisations/${organisationId}/periods`);
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to create period control."
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

      <div className="mb-8 rounded-[1.5rem] border border-[#D9E3F4] bg-[#F8FAFC] p-6">
        <div className="text-sm font-semibold uppercase tracking-[0.2em] text-[#6491DE]">
          Date-Range Control
        </div>

        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
          Create lock, close, or reporting period
        </h2>

        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
          Use this form to define the exact date range you want to use for
          reporting, review, lock, or close control. If the status is Locked or
          Closed, journal posting into this date range will be blocked.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <label className="block md:col-span-2">
          <span className="text-sm font-semibold text-slate-700">
            Period label
          </span>
          <input
            value={periodName}
            onChange={(event) => setPeriodName(event.target.value)}
            placeholder="Example: January 2026 Lock, FY2026 Close, Grant Period Q1"
            required
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Period type
          </span>
          <select
            value={periodType}
            onChange={(event) => handlePeriodTypeChange(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          >
            {periodTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Control status
          </span>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            From date
          </span>
          <input
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            required
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            To date
          </span>
          <input
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            required
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Link to engagement
          </span>
          <select
            value={engagementId}
            onChange={(event) => setEngagementId(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          >
            <option value="">No specific engagement</option>
            {engagements.map((engagement) => (
              <option key={engagement.id} value={engagement.id}>
                {engagement.name || "Untitled engagement"}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Reporting framework
          </span>
          <input
            value={reportingFramework}
            onChange={(event) => setReportingFramework(event.target.value)}
            placeholder="IFRS / IFRS_SME / US_GAAP"
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
            placeholder="NGN / USD / GBP"
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          />
        </label>

        <label className="block md:col-span-2">
          <span className="text-sm font-semibold text-slate-700">
            Reason / note
          </span>
          <textarea
            value={lockReason}
            onChange={(event) => setLockReason(event.target.value)}
            placeholder="Example: January 2026 management accounts reviewed and locked. No further posting allowed without approval."
            rows={5}
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          />
        </label>
      </div>

      <div className="mt-8 rounded-[1.5rem] border border-[#D9E3F4] bg-[#F8FAFC] p-5">
        <p className="text-sm leading-7 text-slate-600">
          <span className="font-semibold text-slate-950">Control note:</span>{" "}
          Locked or closed date ranges are used by the posting engine to protect
          the General Ledger. If a journal date falls within a locked or closed
          range, posting should be blocked.
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-[#073D7F] px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Creating control..." : "Create Lock / Period"}
        </button>

        <a
          href={`/portal/organisations/${organisationId}/periods`}
          className="rounded-full border border-[#D9E3F4] bg-white px-6 py-3 text-center text-sm font-semibold text-[#073D7F]"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}