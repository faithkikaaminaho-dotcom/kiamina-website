"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import CurrencySelect from "@/app/portal/components/CurrencySelect";
import ExchangeRateFields from "@/app/portal/components/ExchangeRateFields";

type InvestorOption = {
  id: string;
  investor_name: string | null;
};

type CapitalCallOption = {
  id: string;
  call_number: string | null;
  investor_id: string | null;
  currency_code: string | null;
  amount_called: number | null;
  outstanding_amount: number | null;
  status: string | null;
};

type BankAccountOption = {
  id: string;
  account_code: string | null;
  account_name: string | null;
  account_type: string | null;
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

type FundingTransactionRecord = {
  id: string;
  organisation_id: string;
  investor_id: string | null;
  capital_call_id: string | null;
  transaction_number: string | null;
  transaction_date: string | null;
  transaction_type: string | null;
  currency_code: string | null;
  exchange_rate: number | null;
  exchange_rate_date: string | null;
  exchange_rate_source: string | null;
  exchange_rate_is_locked: boolean | null;
  amount: number | null;
  bank_charges: number | null;
  net_amount: number | null;
  payment_method: string | null;
  bank_account_id: string | null;
  equity_account_id: string | null;
  liability_account_id: string | null;
  income_account_id: string | null;
  interest_expense_account_id: string | null;
  reference_number: string | null;
  purpose: string | null;
  narration: string | null;
  internal_notes: string | null;
  status: string | null;
};

function toNumber(value: string, fallback = 0) {
  if (!value) return fallback;

  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function toInputNumber(value?: number | null) {
  if (value === null || value === undefined) return "";
  return String(value);
}

function requiresEquityAccount(transactionType: string) {
  return [
    "CAPITAL_CONTRIBUTION",
    "CAPITAL_CALL_RECEIPT",
    "INVESTOR_FUNDING",
  ].includes(transactionType);
}

function requiresLiabilityAccount(transactionType: string) {
  return [
    "LOAN_DRAWDOWN",
    "DIRECTOR_LOAN",
    "SHAREHOLDER_LOAN",
    "LOAN_REPAYMENT",
  ].includes(transactionType);
}

function requiresIncomeAccount(transactionType: string) {
  return ["GRANT_RECEIPT", "DONATION_RECEIPT", "OTHER_FUNDING_RECEIPT"].includes(
    transactionType
  );
}

function requiresInterestExpenseAccount(transactionType: string) {
  return ["INTEREST_PAYMENT"].includes(transactionType);
}

function isOutflow(transactionType: string) {
  return transactionType === "LOAN_REPAYMENT" || transactionType === "INTEREST_PAYMENT";
}

export default function EditFundingTransactionForm({
  organisationId,
  transaction,
  defaultCurrency,
  investors,
  capitalCalls,
  bankAccounts,
  equityAccounts,
  liabilityAccounts,
  incomeAccounts,
  expenseAccounts,
}: {
  organisationId: string;
  transaction: FundingTransactionRecord;
  defaultCurrency?: string | null;
  investors: InvestorOption[];
  capitalCalls: CapitalCallOption[];
  bankAccounts: BankAccountOption[];
  equityAccounts: AccountOption[];
  liabilityAccounts: AccountOption[];
  incomeAccounts: AccountOption[];
  expenseAccounts: AccountOption[];
}) {
  const router = useRouter();

  const [investorId, setInvestorId] = useState(transaction.investor_id || "");
  const [capitalCallId, setCapitalCallId] = useState(
    transaction.capital_call_id || ""
  );
  const [transactionDate, setTransactionDate] = useState(
    transaction.transaction_date || ""
  );
  const [transactionType, setTransactionType] = useState(
    transaction.transaction_type || ""
  );
  const [currencyCode, setCurrencyCode] = useState(
    transaction.currency_code || defaultCurrency || ""
  );
  const [exchangeRate, setExchangeRate] = useState(
    String(transaction.exchange_rate || 1)
  );
  const [exchangeRateDate, setExchangeRateDate] = useState(
    transaction.exchange_rate_date || transaction.transaction_date || ""
  );
  const [exchangeRateSource, setExchangeRateSource] = useState(
    transaction.exchange_rate_source || ""
  );
  const [exchangeRateIsLocked, setExchangeRateIsLocked] = useState(
    Boolean(transaction.exchange_rate_is_locked)
  );
  const [amount, setAmount] = useState(toInputNumber(transaction.amount));
  const [bankCharges, setBankCharges] = useState(
    toInputNumber(transaction.bank_charges)
  );
  const [paymentMethod, setPaymentMethod] = useState(
    transaction.payment_method || ""
  );
  const [bankAccountId, setBankAccountId] = useState(
    transaction.bank_account_id || ""
  );
  const [equityAccountId, setEquityAccountId] = useState(
    transaction.equity_account_id || ""
  );
  const [liabilityAccountId, setLiabilityAccountId] = useState(
    transaction.liability_account_id || ""
  );
  const [incomeAccountId, setIncomeAccountId] = useState(
    transaction.income_account_id || ""
  );
  const [interestExpenseAccountId, setInterestExpenseAccountId] = useState(
    transaction.interest_expense_account_id || ""
  );
  const [referenceNumber, setReferenceNumber] = useState(
    transaction.reference_number || ""
  );
  const [purpose, setPurpose] = useState(transaction.purpose || "");
  const [narration, setNarration] = useState(transaction.narration || "");
  const [internalNotes, setInternalNotes] = useState(
    transaction.internal_notes || ""
  );

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const filteredCapitalCalls = useMemo(() => {
    if (!investorId) return capitalCalls;

    return capitalCalls.filter((call) => call.investor_id === investorId);
  }, [investorId, capitalCalls]);

  const netAmount = useMemo(() => {
    const grossAmount = toNumber(amount, 0);
    const charges = toNumber(bankCharges, 0);

    if (isOutflow(transactionType)) {
      return Number((grossAmount + charges).toFixed(2));
    }

    return Number(Math.max(grossAmount - charges, 0).toFixed(2));
  }, [amount, bankCharges, transactionType]);

  function handleCapitalCallSelect(nextCapitalCallId: string) {
    setCapitalCallId(nextCapitalCallId);

    if (!nextCapitalCallId) {
      return;
    }

    const selectedCall = capitalCalls.find(
      (call) => call.id === nextCapitalCallId
    );

    if (!selectedCall) {
      return;
    }

    if (selectedCall.investor_id) {
      setInvestorId(selectedCall.investor_id);
    }

    if (selectedCall.currency_code) {
      setCurrencyCode(selectedCall.currency_code);
    }

    if (!transactionType) {
      setTransactionType("CAPITAL_CALL_RECEIPT");
    }
  }

  function handleTransactionTypeChange(nextType: string) {
    setTransactionType(nextType);

    if (!requiresEquityAccount(nextType)) {
      setEquityAccountId("");
    }

    if (!requiresLiabilityAccount(nextType)) {
      setLiabilityAccountId("");
    }

    if (!requiresIncomeAccount(nextType)) {
      setIncomeAccountId("");
    }

    if (!requiresInterestExpenseAccount(nextType)) {
      setInterestExpenseAccountId("");
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch(
        `/api/funding-transactions/${transaction.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            organisation_id: organisationId,
            investor_id: investorId || null,
            capital_call_id: capitalCallId || null,
            transaction_date: transactionDate,
            transaction_type: transactionType,
            currency_code: currencyCode || null,
            exchange_rate: exchangeRate || "1",
            exchange_rate_date: exchangeRateDate || transactionDate || null,
            exchange_rate_source: exchangeRateSource || null,
            exchange_rate_is_locked: exchangeRateIsLocked,
            amount,
            bank_charges: bankCharges || "0",
            payment_method: paymentMethod || null,
            bank_account_id: bankAccountId || null,
            equity_account_id: requiresEquityAccount(transactionType)
              ? equityAccountId || null
              : null,
            liability_account_id: requiresLiabilityAccount(transactionType)
              ? liabilityAccountId || null
              : null,
            income_account_id: requiresIncomeAccount(transactionType)
              ? incomeAccountId || null
              : null,
            interest_expense_account_id: requiresInterestExpenseAccount(
              transactionType
            )
              ? interestExpenseAccountId || null
              : null,
            reference_number: referenceNumber || null,
            purpose: purpose || null,
            narration: narration || null,
            internal_notes: internalNotes || null,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Unable to update funding transaction."
        );
      }

      router.push(
        `/portal/organisations/${organisationId}/funding-transactions/${transaction.id}`
      );
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to update funding transaction."
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

      <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-7 text-amber-800">
        You are editing a draft funding transaction. Changes may affect the
        linked bank-line coverage. Review the Banking Reconciliation Context
        before posting linked drafts to GL.
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Investor / Funder
          </span>
          <select
            value={investorId}
            onChange={(event) => setInvestorId(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          >
            <option value="">No investor / funder selected</option>
            {investors.map((investor) => (
              <option key={investor.id} value={investor.id}>
                {investor.investor_name}
              </option>
            ))}
          </select>
        </label>

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
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Transaction number
          </span>
          <input
            value={transaction.transaction_number || ""}
            disabled
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] bg-[#F8FAFC] px-4 py-3 text-sm text-slate-500 outline-none"
          />
          <p className="mt-2 text-xs leading-5 text-slate-500">
            Transaction number is locked during editing.
          </p>
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Transaction date
          </span>
          <input
            type="date"
            value={transactionDate}
            onChange={(event) => {
              const nextDate = event.target.value;
              setTransactionDate(nextDate);

              if (!exchangeRateDate) {
                setExchangeRateDate(nextDate);
              }
            }}
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
            onChange={(event) => handleTransactionTypeChange(event.target.value)}
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
            <option value="OTHER_FUNDING_RECEIPT">
              Other Funding Receipt
            </option>
          </select>
        </label>

        <CurrencySelect
          label="Currency"
          value={currencyCode}
          onChange={setCurrencyCode}
          required
        />

        <ExchangeRateFields
          exchangeRate={exchangeRate}
          setExchangeRate={setExchangeRate}
          exchangeRateDate={exchangeRateDate}
          setExchangeRateDate={setExchangeRateDate}
          exchangeRateSource={exchangeRateSource}
          setExchangeRateSource={setExchangeRateSource}
          exchangeRateIsLocked={exchangeRateIsLocked}
          setExchangeRateIsLocked={setExchangeRateIsLocked}
        />

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Amount</span>
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

        {requiresEquityAccount(transactionType) ? (
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Equity GL account
            </span>
            <select
              value={equityAccountId}
              onChange={(event) => setEquityAccountId(event.target.value)}
              required
              className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
            >
              <option value="">Select equity GL account</option>
              {equityAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.account_code} - {account.account_name}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {requiresLiabilityAccount(transactionType) ? (
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Liability GL account
            </span>
            <select
              value={liabilityAccountId}
              onChange={(event) => setLiabilityAccountId(event.target.value)}
              required
              className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
            >
              <option value="">Select liability GL account</option>
              {liabilityAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.account_code} - {account.account_name}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {requiresIncomeAccount(transactionType) ? (
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Income GL account
            </span>
            <select
              value={incomeAccountId}
              onChange={(event) => setIncomeAccountId(event.target.value)}
              required
              className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
            >
              <option value="">Select income GL account</option>
              {incomeAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.account_code} - {account.account_name}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {requiresInterestExpenseAccount(transactionType) ? (
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Interest expense GL account
            </span>
            <select
              value={interestExpenseAccountId}
              onChange={(event) =>
                setInterestExpenseAccountId(event.target.value)
              }
              required
              className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
            >
              <option value="">Select interest expense GL account</option>
              {expenseAccounts.map((account) => (
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
          <span className="text-sm font-semibold text-slate-700">Purpose</span>
          <input
            value={purpose}
            onChange={(event) => setPurpose(event.target.value)}
            placeholder="Purpose of funding transaction"
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
            Updated Funding Summary
          </div>

          <div className="mt-5 space-y-3 text-sm text-blue-100">
            <div className="flex justify-between gap-4">
              <span>Amount</span>
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
                  {isOutflow(transactionType)
                    ? "Total cash outflow"
                    : "Net amount"}
                </span>
                <span>
                  {currencyCode || "—"} {netAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-white/10 p-4 text-sm leading-7 text-blue-100">
            Saving this update will not post to the ledger. The linked bank-line
            group still needs group posting to GL.
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-[#073D7F] px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Saving changes..." : "Save Draft Changes"}
        </button>

        <a
          href={`/portal/organisations/${organisationId}/funding-transactions/${transaction.id}`}
          className="rounded-full border border-[#D9E3F4] bg-white px-6 py-3 text-center text-sm font-semibold text-[#073D7F]"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}