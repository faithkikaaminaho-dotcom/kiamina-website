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

const months = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getLastDayOfMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function makeDate(year: number, month: number, day: number) {
  const safeDay = Math.min(day, getLastDayOfMonth(year, month));
  return new Date(year, month - 1, safeDay);
}

function addMonths(date: Date, monthsToAdd: number) {
  const result = new Date(date);
  result.setMonth(result.getMonth() + monthsToAdd);
  return result;
}

function addDays(date: Date, daysToAdd: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + daysToAdd);
  return result;
}

function formatAccountingYear({
  startMonth,
  startDay,
  endMonth,
  endDay,
}: {
  startMonth?: number | null;
  startDay?: number | null;
  endMonth?: number | null;
  endDay?: number | null;
}) {
  if (!startMonth || !startDay || !endMonth || !endDay) {
    return "Not configured";
  }

  return `${String(startDay).padStart(2, "0")}/${String(startMonth).padStart(
    2,
    "0"
  )} to ${String(endDay).padStart(2, "0")}/${String(endMonth).padStart(
    2,
    "0"
  )}`;
}

export default function CreateAccountingPeriodForm({
  organisationId,
  engagements,
  defaultFramework,
  defaultCurrency,
  accountingYearStartMonth,
  accountingYearStartDay,
  accountingYearEndMonth,
  accountingYearEndDay,
}: {
  organisationId: string;
  engagements: EngagementOption[];
  defaultFramework?: string | null;
  defaultCurrency?: string | null;
  accountingYearStartMonth?: number | null;
  accountingYearStartDay?: number | null;
  accountingYearEndMonth?: number | null;
  accountingYearEndDay?: number | null;
}) {
  const router = useRouter();

  const currentYear = new Date().getFullYear();

  const [periodName, setPeriodName] = useState("");
  const [periodType, setPeriodType] = useState("PERIOD_LOCK");
  const [status, setStatus] = useState("LOCKED");
  const [rangeYear, setRangeYear] = useState(currentYear);
  const [rangeMonth, setRangeMonth] = useState(1);
  const [rangeQuarter, setRangeQuarter] = useState(1);
  const [rangeHalf, setRangeHalf] = useState(1);
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

  const accountingYearIsConfigured =
    Boolean(accountingYearStartMonth) &&
    Boolean(accountingYearStartDay) &&
    Boolean(accountingYearEndMonth) &&
    Boolean(accountingYearEndDay);

  const accountingYearLabel = formatAccountingYear({
    startMonth: accountingYearStartMonth,
    startDay: accountingYearStartDay,
    endMonth: accountingYearEndMonth,
    endDay: accountingYearEndDay,
  });

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

  function generateMonthlyRange() {
    const start = makeDate(rangeYear, rangeMonth, 1);
    const end = makeDate(rangeYear, rangeMonth, getLastDayOfMonth(rangeYear, rangeMonth));

    setStartDate(toDateInputValue(start));
    setEndDate(toDateInputValue(end));
    setPeriodType("MONTHLY");

    if (!periodName) {
      const monthLabel =
        months.find((month) => month.value === rangeMonth)?.label || "Month";
      setPeriodName(`${monthLabel} ${rangeYear} Period Lock`);
    }

    setStatus("LOCKED");
  }

  function generateQuarterRange() {
    const firstMonth = (rangeQuarter - 1) * 3 + 1;
    const lastMonth = firstMonth + 2;

    const start = makeDate(rangeYear, firstMonth, 1);
    const end = makeDate(
      rangeYear,
      lastMonth,
      getLastDayOfMonth(rangeYear, lastMonth)
    );

    setStartDate(toDateInputValue(start));
    setEndDate(toDateInputValue(end));
    setPeriodType("QUARTERLY");

    if (!periodName) {
      setPeriodName(`Q${rangeQuarter} ${rangeYear} Period Lock`);
    }

    setStatus("LOCKED");
  }

  function generateSixMonthRange() {
    const firstMonth = rangeHalf === 1 ? 1 : 7;
    const lastMonth = rangeHalf === 1 ? 6 : 12;

    const start = makeDate(rangeYear, firstMonth, 1);
    const end = makeDate(
      rangeYear,
      lastMonth,
      getLastDayOfMonth(rangeYear, lastMonth)
    );

    setStartDate(toDateInputValue(start));
    setEndDate(toDateInputValue(end));
    setPeriodType("SIX_MONTHLY");

    if (!periodName) {
      setPeriodName(
        `${rangeHalf === 1 ? "First" : "Second"} Half ${rangeYear} Period Lock`
      );
    }

    setStatus("LOCKED");
  }

  function generateAccountingYearRange() {
    if (!accountingYearIsConfigured) {
      setErrorMessage(
        "Accounting year is not configured. Go to Organisation Settings and save the accounting year first."
      );
      return;
    }

    setErrorMessage("");

    const startMonth = Number(accountingYearStartMonth);
    const startDay = Number(accountingYearStartDay);
    const endMonth = Number(accountingYearEndMonth);
    const endDay = Number(accountingYearEndDay);

    const endYear = endMonth < startMonth ? rangeYear + 1 : rangeYear;

    const start = makeDate(rangeYear, startMonth, startDay);
    const end = makeDate(endYear, endMonth, endDay);

    setStartDate(toDateInputValue(start));
    setEndDate(toDateInputValue(end));
    setPeriodType("YEARLY");
    setStatus("CLOSED");

    if (!periodName) {
      setPeriodName(`FY${endYear} Year-End Close`);
    }

    if (!lockReason) {
      setLockReason(
        `Accounting year close generated from organisation setup: ${accountingYearLabel}.`
      );
    }
  }

  function generateAccountingYearQuarterRange() {
    if (!accountingYearIsConfigured) {
      setErrorMessage(
        "Accounting year is not configured. Go to Organisation Settings and save the accounting year first."
      );
      return;
    }

    setErrorMessage("");

    const startMonth = Number(accountingYearStartMonth);
    const startDay = Number(accountingYearStartDay);

    const accountingYearStart = makeDate(rangeYear, startMonth, startDay);
    const quarterStart = addMonths(accountingYearStart, (rangeQuarter - 1) * 3);
    const quarterEnd = addDays(addMonths(quarterStart, 3), -1);

    setStartDate(toDateInputValue(quarterStart));
    setEndDate(toDateInputValue(quarterEnd));
    setPeriodType("QUARTERLY");
    setStatus("LOCKED");

    if (!periodName) {
      setPeriodName(`Accounting Year Q${rangeQuarter} ${rangeYear} Period Lock`);
    }
  }

  function generateAccountingYearMonthRange() {
    if (!accountingYearIsConfigured) {
      setErrorMessage(
        "Accounting year is not configured. Go to Organisation Settings and save the accounting year first."
      );
      return;
    }

    setErrorMessage("");

    const startMonth = Number(accountingYearStartMonth);
    const startDay = Number(accountingYearStartDay);

    const accountingYearStart = makeDate(rangeYear, startMonth, startDay);
    const monthStart = addMonths(accountingYearStart, rangeMonth - 1);
    const monthEnd = addDays(addMonths(monthStart, 1), -1);

    setStartDate(toDateInputValue(monthStart));
    setEndDate(toDateInputValue(monthEnd));
    setPeriodType("MONTHLY");
    setStatus("LOCKED");

    if (!periodName) {
      setPeriodName(`Accounting Year Month ${rangeMonth} ${rangeYear} Lock`);
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
          Use this form to define the exact date range for reporting, review,
          lock, or close control. The saved accounting year is{" "}
          <span className="font-semibold text-slate-950">
            {accountingYearLabel}
          </span>
          .
        </p>

        {!accountingYearIsConfigured ? (
          <a
            href={`/portal/organisations/${organisationId}/settings`}
            className="mt-4 inline-flex rounded-full bg-[#073D7F] px-5 py-3 text-sm font-semibold text-white"
          >
            Configure Accounting Year
          </a>
        ) : null}
      </div>

      <div className="mb-8 rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6">
        <div className="text-sm font-semibold uppercase tracking-[0.2em] text-[#6491DE]">
          Smart Date Range Generator
        </div>

        <h3 className="mt-3 text-xl font-semibold tracking-tight text-slate-950">
          Generate date range from calendar or accounting year
        </h3>

        <p className="mt-2 text-sm leading-7 text-slate-600">
          Select a year and choose the type of range to auto-fill the From Date
          and To Date fields below.
        </p>

        <div className="mt-6 grid gap-5 md:grid-cols-4">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Year</span>
            <input
              type="number"
              value={rangeYear}
              onChange={(event) => setRangeYear(Number(event.target.value))}
              className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Calendar month
            </span>
            <select
              value={rangeMonth}
              onChange={(event) => setRangeMonth(Number(event.target.value))}
              className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
            >
              {months.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Quarter
            </span>
            <select
              value={rangeQuarter}
              onChange={(event) => setRangeQuarter(Number(event.target.value))}
              className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
            >
              <option value={1}>Q1</option>
              <option value={2}>Q2</option>
              <option value={3}>Q3</option>
              <option value={4}>Q4</option>
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Six-month period
            </span>
            <select
              value={rangeHalf}
              onChange={(event) => setRangeHalf(Number(event.target.value))}
              className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
            >
              <option value={1}>First half</option>
              <option value={2}>Second half</option>
            </select>
          </label>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <button
            type="button"
            onClick={generateMonthlyRange}
            className="rounded-full border border-[#D9E3F4] bg-white px-5 py-3 text-sm font-semibold text-[#073D7F]"
          >
            Calendar Month
          </button>

          <button
            type="button"
            onClick={generateQuarterRange}
            className="rounded-full border border-[#D9E3F4] bg-white px-5 py-3 text-sm font-semibold text-[#073D7F]"
          >
            Calendar Quarter
          </button>

          <button
            type="button"
            onClick={generateSixMonthRange}
            className="rounded-full border border-[#D9E3F4] bg-white px-5 py-3 text-sm font-semibold text-[#073D7F]"
          >
            Calendar Six-Month
          </button>

          <button
            type="button"
            onClick={generateAccountingYearMonthRange}
            className="rounded-full bg-[#F1F1F1] px-5 py-3 text-sm font-semibold text-[#073D7F]"
          >
            Accounting Year Month
          </button>

          <button
            type="button"
            onClick={generateAccountingYearQuarterRange}
            className="rounded-full bg-[#F1F1F1] px-5 py-3 text-sm font-semibold text-[#073D7F]"
          >
            Accounting Year Quarter
          </button>

          <button
            type="button"
            onClick={generateAccountingYearRange}
            className="rounded-full bg-[#073D7F] px-5 py-3 text-sm font-semibold text-white"
          >
            Accounting Year Close
          </button>
        </div>
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
          <span className="text-sm font-semibold text-slate-700">To date</span>
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
          <span className="text-sm font-semibold text-slate-700">Currency</span>
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