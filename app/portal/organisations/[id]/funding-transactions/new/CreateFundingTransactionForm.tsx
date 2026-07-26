"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AutoNumberInput from "@/app/portal/components/AutoNumberInput";

type InvestorOption = {
  id: string;
  investor_name: string | null;
  investor_type: string | null;
  funding_type: string | null;
  currency_code: string | null;
};

type CapitalCallOption = {
  id: string;
  call_number: string | null;
  investor_id: string | null;
  currency_code: string | null;
  funding_type: string | null;
  funding_purpose: string | null;
  called_amount: number | null;
  received_amount: number | null;
  outstanding_amount: number | null;
  receivable_account_id: string | null;
  equity_account_id: string | null;
  liability_account_id: string | null;
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
  tax_relevant?: boolean | null;
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

function needsEquityAccount(transactionType: string) {
  return ["CAPITAL_CONTRIBUTION", "CAPITAL_CALL_RECEIPT", "INVESTOR_FUNDING"].includes(
    transactionType
  );
}

function needsLiabilityAccount(transactionType: string) {
  return [
    "LOAN_DRAWDOWN",
    "DIRECTOR_LOAN",
    "SHAREHOLDER_LOAN",
    "LOAN_REPAYMENT",
  ].includes(transactionType);
}

function needsIncomeAccount(transactionType: string) {
  return [
    "GRANT_RECEIPT",
    "DONATION_RECEIPT",
    "OTHER_FUNDING_RECEIPT",
  ].includes(transactionType);
}

function needsInterestExpenseAccount(transactionType: string) {
  return transactionType === "INTEREST_PAYMENT";
}

export default function CreateFundingTransactionForm({
  organisationId,
  defaultCurrency,
  investors,
  capitalCalls,
  bankAccounts,
  equityAccounts,
  liabilityAccounts,
  incomeAccounts,
  interestExpenseAccounts,
  accountingPeriods,
  engagements,
}: {
  organisationId: string;
  defaultCurrency?: string | null;
  investors: InvestorOption[];
  capitalCalls: CapitalCallOption[];
  bankAccounts: AccountOption[];
  equityAccounts: AccountOption[];
  liabilityAccounts: AccountOption[];
  incomeAccounts: AccountOption[];
  interestExpenseAccounts: AccountOption[];
  accountingPeriods: PeriodOption[];
  engagements: EngagementOption[];
}) {
  const router = useRouter();

  const [investorId, setInvestorId] = useState("");
  const [capitalCallId, setCapitalCallId] = useState("");
  const [accountingPeriodId, setAccountingPeriodId] = useState("");
  const [engagementId, setEngagementId] = useState("");
  const [transactionNumber, setTransactionNumber] = useState("");
  const [transactionDate, setTransactionDate] = useState(todayDate());
  const [transactionType, setTransactionType] = useState("");
  const [currencyCode, setCurrencyCode] = useState(defaultCurrency || "");
  const [exchangeRate, setExchangeRate] = useState("1");
  const [amount, setAmount] = useState("");
  const [bankCharges, setBankCharges] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [bankAccountId, setBankAccountId] = useState("");
  const [equityAccountId, setEquityAccountId] = useState("");
  const [liabilityAccountId, setLiabilityAccountId] = useState("");
  const [incomeAccountId, setIncomeAccountId] = useState("");
  const [interestExpenseAccountId, setInterestExpenseAccountId] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [fundingPurpose, setFundingPurpose] = useState("");
  const [narration, setNarration] = useState("");
  const [internalNotes, setInternalNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const selectedCapitalCall = useMemo(() => {
    return capitalCalls.find((call) => call.id === capitalCallId) || null;
  }, [capitalCallId, capitalCalls]);

  const filteredCapitalCalls = useMemo(() => {
    if (!investorId) return capitalCalls;

    return capitalCalls.filter((call) => call.investor_id === investorId);
  }, [investorId, capitalCalls]);

  const netAmount = useMemo(() => {
    const grossAmount = toNumber(amount, 0);
    const charges = toNumber(bankCharges, 0);

    if (["LOAN_REPAYMENT", "INTEREST_PAYMENT"].includes(transactionType)) {
      return Number((grossAmount + charges).toFixed(2));
    }

    return Number((grossAmount - charges).toFixed(2));
  }, [amount, bankCharges, transactionType]);

  function handleInvestorSelect(value: string) {
    setInvestorId(value);

    const selectedInvestor = investors.find((investor) => investor.id === value);

    if (selectedInvestor?.currency_code) {
      setCurrencyCode(selectedInvestor.currency_code);
    }
  }

  function handleCapitalCallSelect(value: string) {
    setCapitalCallId(value);

    const call = capitalCalls.find((item) => item.id === value);

    if (!call) return;

    if (call.investor_id) {
      setInvestorId(call.investor_id);
    }

    if (call.currency_code) {
      setCurrencyCode(call.currency_code);
    }

    if (call.funding_purpose) {
      setFundingPurpose(call.funding_purpose);
    }

    if (call.outstanding_amount !== null && call.outstanding_amount !== undefined) {
      setAmount(String(call.outstanding_amount));
    }

    if (!transactionType) {
      setTransactionType("CAPITAL_CALL_RECEIPT");
    }

    if (call.equity_account_id) {
      setEquityAccountId(call.equity_account_id);
    }

    if (call.liability_account_id) {
      setLiabilityAccountId(call.liability_account_id);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/funding-transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organisation_id: organisationId,
          investor_id: investorId || null,
          capital_call_id: capitalCallId || null,
          accounting_period_id: accountingPeriodId || null,
          engagement_id: engagementId || null,
          transaction_number: transactionNumber,
          transaction_date: transactionDate,
          transaction_type: transactionType,
          currency_code: currencyCode || null,
          exchange_rate: exchangeRate || "1",
          amount,
          bank_charges: bankCharges || "0",
          payment_method: paymentMethod || null,
          bank_account_id: bankAccountId || null,
          equity_account_id: needsEquityAccount(transactionType)
            ? equityAccountId || null
            : null,
          liability_account_id: needsLiabilityAccount(transactionType)
            ? liabilityAccountId || null
            : null,
          income_account_id: needsIncomeAccount(transactionType)
            ? incomeAccountId || null
            : null,
          interest_expense_account_id: needsInterestExpenseAccount(transactionType)
            ? interestExpenseAccountId || null
            : null,
          reference_number: referenceNumber || null,
          funding_purpose: fundingPurpose || null,
          narration: narration || null,
          internal_notes: internalNotes || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to create funding transaction.");
      }

      router.push(`/portal/organisations/${organisationId}`);
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to create funding transaction."
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
            Capital call optional
          </span>
          <select
            value={capitalCallId}
            onChange={(event) => handleCapitalCallSelect(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          >
            <option value="">No capital call linked</option>
            {filteredCapitalCalls.map((call) => (
              <option key={call.id} value={call.id}>
                {call.call_number} - {call.currency_code || ""}{" "}
                {Number(call.outstanding_amount || 0).toLocaleString()}
              </option>
            ))}
          </select>

          {selectedCapitalCall ? (
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Outstanding call: {selectedCapitalCall.currency_code || currencyCode || "—"}{" "}
              {Number(selectedCapitalCall.outstanding_amount || 0).toLocaleString()}
            </p>
          ) : null}
        </label>

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
        </label>

        <AutoNumberInput
  label="Transaction number"
  value={transactionNumber}
  onChange={setTransactionNumber}
  organisationId={organisationId}
  documentType="FUNDING_TRANSACTION"
  placeholder="FUND-0001"
/>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Transaction date
          </span>
          <input
            type="date"
            value={transactionDate}
            onChange={(event) => setTransactionDate(event.target.value)}
            required
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Transaction type
          </span>
          <select
            value={transactionType}
            onChange={(event) => setTransactionType(event.target.value)}
            required
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          >
            <option value="">Select transaction type</option>
            <option value="CAPITAL_CONTRIBUTION">Capital Contribution</option>
            <option value="CAPITAL_CALL_RECEIPT">Capital Call Receipt</option>
            <option value="GRANT_RECEIPT">Grant Receipt</option>
            <option value="DONATION_RECEIPT">Donation Receipt</option>
            <option value="LOAN_DRAWDOWN">Loan Drawdown</option>
            <option value="DIRECTOR_LOAN">Director Loan</option>
            <option value="SHAREHOLDER_LOAN">Shareholder Loan</option>
            <option value="INVESTOR_FUNDING">Investor Funding</option>
            <option value="LOAN_REPAYMENT">Loan Repayment</option>
            <option value="INTEREST_PAYMENT">Interest Payment</option>
            <option value="OTHER_FUNDING_RECEIPT">Other Funding Receipt</option>
          </select>
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

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Currency
          </span>
          <input
            value={currencyCode}
            onChange={(event) => setCurrencyCode(event.target.value.toUpperCase())}
            placeholder="NGN"
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm uppercase outline-none focus:border-[#073D7F]"
          />
        </label>

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
            Amount
          </span>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            required
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Bank charges
          </span>
          <input
            type="number"
            step="0.01"
            value={bankCharges}
            onChange={(event) => setBankCharges(event.target.value)}
            placeholder="0"
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Payment method
          </span>
          <select
            value={paymentMethod}
            onChange={(event) => setPaymentMethod(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          >
            <option value="">Select payment method</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
            <option value="CASH">Cash</option>
            <option value="CARD">Card</option>
            <option value="CHEQUE">Cheque</option>
            <option value="ONLINE_PAYMENT">Online Payment</option>
            <option value="OTHER">Other</option>
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Bank account
          </span>
          <select
            value={bankAccountId}
            onChange={(event) => setBankAccountId(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          >
            <option value="">Select bank account</option>
            {bankAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.account_code} - {account.account_name}
              </option>
            ))}
          </select>
        </label>

        {needsEquityAccount(transactionType) ? (
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

        {needsLiabilityAccount(transactionType) ? (
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

        {needsIncomeAccount(transactionType) ? (
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Income / grant account
            </span>
            <select
              value={incomeAccountId}
              onChange={(event) => setIncomeAccountId(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
            >
              <option value="">Select income / grant account</option>
              {incomeAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.account_code} - {account.account_name}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {needsInterestExpenseAccount(transactionType) ? (
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Interest expense account
            </span>
            <select
              value={interestExpenseAccountId}
              onChange={(event) =>
                setInterestExpenseAccountId(event.target.value)
              }
              className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
            >
              <option value="">Select interest expense account</option>
              {interestExpenseAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.account_code} - {account.account_name}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <label className="block md:col-span-2">
          <span className="text-sm font-semibold text-slate-700">
            Reference number
          </span>
          <input
            value={referenceNumber}
            onChange={(event) => setReferenceNumber(event.target.value)}
            placeholder="Bank reference / funding reference"
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          />
        </label>

        <label className="block md:col-span-2">
          <span className="text-sm font-semibold text-slate-700">
            Funding purpose
          </span>
          <input
            value={fundingPurpose}
            onChange={(event) => setFundingPurpose(event.target.value)}
            placeholder="Working capital, expansion, project funding, loan repayment, donor restriction, etc."
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          />
        </label>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_0.45fr]">
        <div className="space-y-5">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Narration
            </span>
            <textarea
              value={narration}
              onChange={(event) => setNarration(event.target.value)}
              rows={4}
              placeholder="Funding transaction description."
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
            Draft Funding Summary
          </div>

          <div className="mt-5 space-y-3 text-sm text-blue-100">
            <div className="flex justify-between gap-4">
              <span>Transaction amount</span>
              <span>
                {currencyCode || "—"} {toNumber(amount, 0).toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span>Bank charges</span>
              <span>
                {currencyCode || "—"} {toNumber(bankCharges, 0).toLocaleString()}
              </span>
            </div>

            <div className="border-t border-white/20 pt-4">
              <div className="flex justify-between gap-4 text-lg font-semibold text-white">
                <span>
                  {["LOAN_REPAYMENT", "INTEREST_PAYMENT"].includes(
                    transactionType
                  )
                    ? "Total cash outflow"
                    : "Net amount received"}
                </span>
                <span>
                  {currencyCode || "—"} {netAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-white/10 p-4 text-sm leading-7 text-blue-100">
            This funding transaction will be saved as draft only. It will not
            update the ledger, investor balance, loan balance, capital call, or
            bank balance until posting and approval controls are added.
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-[#073D7F] px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting
            ? "Creating funding transaction..."
            : "Create Draft Funding Transaction"}
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