"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AutoNumberInput from "@/app/portal/components/AutoNumberInput";
import CurrencySelect from "@/app/portal/components/CurrencySelect";

type InvestorOption = {
  id: string;
  investor_name: string | null;
  investor_type: string | null;
  funding_type: string | null;
  currency_code: string | null;
  committed_amount: number | null;
  contributed_amount: number | null;
  outstanding_amount: number | null;
};

type AccountOption = {
  id: string;
  account_code: string | null;
  account_name: string | null;
  account_type: string | null;
  account_subtype?: string | null;
  fs_line_item?: string | null;
  management_report_category?: string | null;
  is_control_account?: boolean | null;
};

type PeriodOption = {
  id: string;
  name: string | null;
};

type EngagementOption = {
  id: string;
  name: string | null;
};

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function toNumber(value: string, fallback = 0) {
  if (!value) return fallback;

  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : fallback;
}

export default function CreateCapitalCallForm({
  organisationId,
  defaultCurrency,
  investors,
  receivableAccounts,
  equityAccounts,
  liabilityAccounts,
  accountingPeriods,
  engagements,
}: {
  organisationId: string;
  defaultCurrency?: string | null;
  investors: InvestorOption[];
  receivableAccounts: AccountOption[];
  equityAccounts: AccountOption[];
  liabilityAccounts: AccountOption[];
  accountingPeriods: PeriodOption[];
  engagements: EngagementOption[];
}) {
  const router = useRouter();

  const [investorId, setInvestorId] = useState("");
  const [accountingPeriodId, setAccountingPeriodId] = useState("");
  const [engagementId, setEngagementId] = useState("");
  const [callNumber, setCallNumber] = useState("");
  const [callDate, setCallDate] = useState(todayDate());
  const [dueDate, setDueDate] = useState("");
  const [currencyCode, setCurrencyCode] = useState(defaultCurrency || "");
  const [exchangeRate, setExchangeRate] = useState("1");
  const [committedAmount, setCommittedAmount] = useState("");
  const [calledAmount, setCalledAmount] = useState("");
  const [fundingType, setFundingType] = useState("");
  const [fundingPurpose, setFundingPurpose] = useState("");
  const [terms, setTerms] = useState("");
  const [receivableAccountId, setReceivableAccountId] = useState("");
  const [equityAccountId, setEquityAccountId] = useState("");
  const [liabilityAccountId, setLiabilityAccountId] = useState("");
  const [internalNotes, setInternalNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const selectedInvestor = useMemo(() => {
    return investors.find((investor) => investor.id === investorId) || null;
  }, [investorId, investors]);

  const outstandingAmount = useMemo(() => {
    return Number((toNumber(calledAmount, 0) - 0).toFixed(2));
  }, [calledAmount]);

  function handleInvestorSelect(value: string) {
    setInvestorId(value);

    const investor = investors.find((item) => item.id === value);

    if (!investor) return;

    if (investor.currency_code) {
      setCurrencyCode(investor.currency_code);
    }

    if (investor.funding_type) {
      setFundingType(investor.funding_type);
    }

    if (
      investor.committed_amount !== null &&
      investor.committed_amount !== undefined
    ) {
      setCommittedAmount(String(investor.committed_amount));
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/capital-calls", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organisation_id: organisationId,
          investor_id: investorId,
          accounting_period_id: accountingPeriodId || null,
          engagement_id: engagementId || null,
          call_number: callNumber,
          call_date: callDate,
          due_date: dueDate || null,
          currency_code: currencyCode || null,
          exchange_rate: exchangeRate || "1",
          committed_amount: committedAmount || "0",
          called_amount: calledAmount,
          funding_type: fundingType || null,
          funding_purpose: fundingPurpose || null,
          terms: terms || null,
          receivable_account_id: receivableAccountId || null,
          equity_account_id: equityAccountId || null,
          liability_account_id: liabilityAccountId || null,
          internal_notes: internalNotes || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to create capital call.");
      }

      router.push(`/portal/organisations/${organisationId}`);
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to create capital call."
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
            Investor / Funder
          </span>
          <select
            value={investorId}
            onChange={(event) => handleInvestorSelect(event.target.value)}
            required
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          >
            <option value="">Select investor / funder</option>
            {investors.map((investor) => (
              <option key={investor.id} value={investor.id}>
                {investor.investor_name}
              </option>
            ))}
          </select>
          {selectedInvestor ? (
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Funding type: {selectedInvestor.funding_type || "Not specified"}.
              Outstanding commitment:{" "}
              {selectedInvestor.currency_code || currencyCode || "—"}{" "}
              {Number(selectedInvestor.outstanding_amount || 0).toLocaleString()}
            </p>
          ) : null}
        </label>

        <AutoNumberInput
  label="Capital call number"
  value={callNumber}
  onChange={setCallNumber}
  organisationId={organisationId}
  documentType="CAPITAL_CALL"
  placeholder="CAPCALL-0001"
/>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Call date
          </span>
          <input
            type="date"
            value={callDate}
            onChange={(event) => setCallDate(event.target.value)}
            required
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Due date
          </span>
          <input
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Accounting period
          </span>
          <select
            value={accountingPeriodId}
            onChange={(event) => setAccountingPeriodId(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          >
            <option value="">No accounting period selected</option>
            {accountingPeriods.map((period) => (
              <option key={period.id} value={period.id}>
                {period.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Engagement
          </span>
          <select
            value={engagementId}
            onChange={(event) => setEngagementId(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          >
            <option value="">No engagement selected</option>
            {engagements.map((engagement) => (
              <option key={engagement.id} value={engagement.id}>
                {engagement.name}
              </option>
            ))}
          </select>
        </label>

        <CurrencySelect
  label="Currency"
  value={currencyCode}
  onChange={setCurrencyCode}
  required
/>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Exchange rate
          </span>
          <input
            type="number"
            step="0.000001"
            value={exchangeRate}
            onChange={(event) => setExchangeRate(event.target.value)}
            placeholder="1"
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Committed amount
          </span>
          <input
            type="number"
            step="0.01"
            value={committedAmount}
            onChange={(event) => setCommittedAmount(event.target.value)}
            placeholder="0"
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Amount called
          </span>
          <input
            type="number"
            step="0.01"
            value={calledAmount}
            onChange={(event) => setCalledAmount(event.target.value)}
            required
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Funding type
          </span>
          <select
            value={fundingType}
            onChange={(event) => setFundingType(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          >
            <option value="">Select funding type</option>
            <option value="EQUITY">Equity</option>
            <option value="DEBT">Debt</option>
            <option value="GRANT">Grant</option>
            <option value="DONATION">Donation</option>
            <option value="DIRECTOR_LOAN">Director Loan</option>
            <option value="SHAREHOLDER_LOAN">Shareholder Loan</option>
            <option value="OTHER">Other</option>
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Receivable account
          </span>
          <select
            value={receivableAccountId}
            onChange={(event) => setReceivableAccountId(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          >
            <option value="">Select receivable account</option>
            {receivableAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.account_code} - {account.account_name}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            Used to track the amount called but not yet received.
          </p>
        </label>

        {["EQUITY", "DONATION"].includes(fundingType) ? (
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Equity / fund account
            </span>
            <select
              value={equityAccountId}
              onChange={(event) => setEquityAccountId(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
            >
              <option value="">Select equity / fund account</option>
              {equityAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.account_code} - {account.account_name}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {["DEBT", "DIRECTOR_LOAN", "SHAREHOLDER_LOAN"].includes(
          fundingType
        ) ? (
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Liability account
            </span>
            <select
              value={liabilityAccountId}
              onChange={(event) => setLiabilityAccountId(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
            >
              <option value="">Select liability account</option>
              {liabilityAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.account_code} - {account.account_name}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <label className="block md:col-span-2">
          <span className="text-sm font-semibold text-slate-700">
            Funding purpose
          </span>
          <input
            value={fundingPurpose}
            onChange={(event) => setFundingPurpose(event.target.value)}
            placeholder="Working capital, project funding, expansion, operating support, etc."
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          />
        </label>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_0.45fr]">
        <div className="space-y-5">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Terms
            </span>
            <textarea
              value={terms}
              onChange={(event) => setTerms(event.target.value)}
              rows={4}
              placeholder="Capital call terms, expected settlement conditions, repayment terms, or donor/funder conditions."
              className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm leading-7 outline-none focus:border-[#073D7F]"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Internal notes
            </span>
            <textarea
              value={internalNotes}
              onChange={(event) => setInternalNotes(event.target.value)}
              rows={4}
              placeholder="Internal review notes. Not for client use."
              className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm leading-7 outline-none focus:border-[#073D7F]"
            />
          </label>
        </div>

        <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-[#073D7F] p-6 text-white">
          <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#6491DE]">
            Draft Capital Call
          </div>

          <div className="mt-5 space-y-3 text-sm text-blue-100">
            <div className="flex justify-between gap-4">
              <span>Committed amount</span>
              <span>
                {currencyCode || "—"}{" "}
                {toNumber(committedAmount, 0).toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span>Amount called</span>
              <span>
                {currencyCode || "—"} {toNumber(calledAmount, 0).toLocaleString()}
              </span>
            </div>

            <div className="border-t border-white/20 pt-4">
              <div className="flex justify-between gap-4 text-lg font-semibold text-white">
                <span>Outstanding call</span>
                <span>
                  {currencyCode || "—"} {outstandingAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-white/10 p-4 text-sm leading-7 text-blue-100">
            This capital call will be saved as draft. It represents a funding
            request or obligation and will later be linked to actual funding
            receipts or funding transactions.
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-[#073D7F] px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Creating capital call..." : "Create Draft Capital Call"}
        </button>

        <a
          href={`/portal/organisations/${organisationId}`}
          className="rounded-full border border-[#D9E3F4] bg-white px-6 py-3 text-center text-sm font-semibold text-[#073D7F]"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}