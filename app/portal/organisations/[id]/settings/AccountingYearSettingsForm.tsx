"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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

const days = Array.from({ length: 31 }, (_, index) => index + 1);

export default function AccountingYearSettingsForm({
  organisationId,
  startMonth,
  startDay,
  endMonth,
  endDay,
}: {
  organisationId: string;
  startMonth: number | null;
  startDay: number | null;
  endMonth: number | null;
  endDay: number | null;
}) {
  const router = useRouter();

  const [accountingYearStartMonth, setAccountingYearStartMonth] = useState(
    startMonth || 1
  );
  const [accountingYearStartDay, setAccountingYearStartDay] = useState(
    startDay || 1
  );
  const [accountingYearEndMonth, setAccountingYearEndMonth] = useState(
    endMonth || 12
  );
  const [accountingYearEndDay, setAccountingYearEndDay] = useState(
    endDay || 31
  );

  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitting(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const response = await fetch(
        `/api/organisations/${organisationId}/accounting-year`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            accounting_year_start_month: accountingYearStartMonth,
            accounting_year_start_day: accountingYearStartDay,
            accounting_year_end_month: accountingYearEndMonth,
            accounting_year_end_day: accountingYearEndDay,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Unable to save accounting year settings."
        );
      }

      setSuccessMessage("Accounting year settings saved successfully.");
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to save accounting year settings."
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
      <div>
        <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
          Accounting Year
        </div>

        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
          Accounting year setup
        </h2>

        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
          Set the organisation’s accounting year start and end date. This will
          support reporting defaults, year-end close, period locks, and future
          automated financial statement period generation.
        </p>
      </div>

      {successMessage ? (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
          {successMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-[#F8FAFC] p-6">
          <h3 className="text-base font-semibold text-slate-950">
            Accounting year start
          </h3>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                Start month
              </span>
              <select
                value={accountingYearStartMonth}
                onChange={(event) =>
                  setAccountingYearStartMonth(Number(event.target.value))
                }
                className="mt-2 w-full rounded-2xl border border-[#D9E3F4] bg-white px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
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
                Start day
              </span>
              <select
                value={accountingYearStartDay}
                onChange={(event) =>
                  setAccountingYearStartDay(Number(event.target.value))
                }
                className="mt-2 w-full rounded-2xl border border-[#D9E3F4] bg-white px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
              >
                {days.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-[#F8FAFC] p-6">
          <h3 className="text-base font-semibold text-slate-950">
            Accounting year end
          </h3>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                End month
              </span>
              <select
                value={accountingYearEndMonth}
                onChange={(event) =>
                  setAccountingYearEndMonth(Number(event.target.value))
                }
                className="mt-2 w-full rounded-2xl border border-[#D9E3F4] bg-white px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
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
                End day
              </span>
              <select
                value={accountingYearEndDay}
                onChange={(event) =>
                  setAccountingYearEndDay(Number(event.target.value))
                }
                className="mt-2 w-full rounded-2xl border border-[#D9E3F4] bg-white px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
              >
                {days.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-[1.5rem] border border-[#D9E3F4] bg-[#F8FAFC] p-5">
        <p className="text-sm leading-7 text-slate-600">
          <span className="font-semibold text-slate-950">Example:</span> If the
          accounting year runs from 1 January to 31 December, select January 1
          as the start and December 31 as the end. If it runs from 1 April to 31
          March, select April 1 as the start and March 31 as the end.
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-[#073D7F] px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Saving..." : "Save Accounting Year"}
        </button>

        <a
          href={`/portal/organisations/${organisationId}`}
          className="rounded-full border border-[#D9E3F4] bg-white px-6 py-3 text-center text-sm font-semibold text-[#073D7F]"
        >
          Back to Workspace
        </a>
      </div>
    </form>
  );
}