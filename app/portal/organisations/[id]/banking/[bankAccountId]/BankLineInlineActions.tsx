"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AddBankLineToBooksForm from "./AddBankLineToBooksForm";
import BankLineAllocationHistory from "./BankLineAllocationHistory";

type SourceCandidate = {
  source_module: string;
  source_record_id: string;
  label: string;
  description: string;
  amount: number;
  currency_code: string | null;
  transaction_date: string | null;
  status: string | null;
};

type PartyOption = {
  id: string;
  name: string;
};

type AccountOption = {
  id: string;
  label: string;
  account_type: string | null;
};

type BankLine = {
  id: string;
  description: string | null;
  money_in: number | null;
  money_out: number | null;
  currency_code: string | null;
  reconciliation_status: string | null;
  allocated_amount?: number | null;
  unallocated_amount?: number | null;
};

type AllocationHistoryItem = {
  id: string;
  bank_statement_line_id: string;
  allocation_type: string | null;
  source_module: string | null;
  source_record_id: string | null;
  allocation_description: string | null;
  allocation_amount: number | null;
  bank_charge_treatment: string | null;
  bank_charge_amount: number | null;
  status: string | null;
  created_at: string | null;
};

type BankChargeTreatment =
  | "NONE"
  | "INCLUDED_IN_BANK_LINE"
  | "EXCLUDED_FROM_BANK_LINE"
  | "SEPARATE_BANK_LINE";

function formatStatus(status?: string | null) {
  if (!status) return "—";

  return status
    .split("_")
    .join(" ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function toNumber(value: unknown) {
  const numericValue = Number(value || 0);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function roundMoney(value: number) {
  return Number(value.toFixed(2));
}

function formatMoney(currencyCode?: string | null, amount?: number | null) {
  return `${currencyCode || "—"} ${Number(amount || 0).toLocaleString(
    "en-US",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )}`;
}

function getExpectedBankLineCoverage({
  sourceAmount,
  chargeAmount,
  treatment,
  isMoneyIn,
}: {
  sourceAmount: number;
  chargeAmount: number;
  treatment: BankChargeTreatment;
  isMoneyIn: boolean;
}) {
  if (treatment !== "INCLUDED_IN_BANK_LINE") {
    return sourceAmount;
  }

  if (isMoneyIn) {
    return roundMoney(sourceAmount - chargeAmount);
  }

  return roundMoney(sourceAmount + chargeAmount);
}

function getRecommendedSourceMatchAmount({
  candidateAmount,
  bankLineAmount,
  chargeAmount,
  treatment,
  isMoneyIn,
}: {
  candidateAmount: number;
  bankLineAmount: number;
  chargeAmount: number;
  treatment: BankChargeTreatment;
  isMoneyIn: boolean;
}) {
  if (treatment === "INCLUDED_IN_BANK_LINE") {
    const expectedSourceAmount = isMoneyIn
      ? roundMoney(bankLineAmount + chargeAmount)
      : roundMoney(Math.max(bankLineAmount - chargeAmount, 0));

    if (expectedSourceAmount > 0) {
      return roundMoney(Math.min(candidateAmount, expectedSourceAmount));
    }
  }

  return roundMoney(Math.min(candidateAmount, bankLineAmount));
}

export default function BankLineInlineActions({
  organisationId,
  bankAccountId,
  line,
  candidates,
  customers,
  suppliers,
  investors,
  incomeAccounts,
  expenseAccounts,
  allocationHistory,
}: {
  organisationId: string;
  bankAccountId: string;
  line: BankLine;
  candidates: SourceCandidate[];
  customers: PartyOption[];
  suppliers: PartyOption[];
  investors: PartyOption[];
  incomeAccounts: AccountOption[];
  expenseAccounts: AccountOption[];
  allocationHistory: AllocationHistoryItem[];
}) {
  const router = useRouter();

  const moneyIn = toNumber(line.money_in);
  const moneyOut = toNumber(line.money_out);

  const bankLineAmount = moneyIn > 0 ? moneyIn : moneyOut;
  const isMoneyIn = moneyIn > 0;

  const allocatedAmount = roundMoney(toNumber(line.allocated_amount));

  const calculatedUnallocatedAmount = roundMoney(
    Math.max(bankLineAmount - allocatedAmount, 0)
  );

  const unallocatedAmount =
    line.unallocated_amount === null || line.unallocated_amount === undefined
      ? calculatedUnallocatedAmount
      : roundMoney(toNumber(line.unallocated_amount));

  const isLocked = [
    "RECONCILED",
    "ADDED_TO_BOOKS",
    "IGNORED",
    "EXCLUDED",
  ].includes(line.reconciliation_status || "");

  const bankChargeAccounts = useMemo(() => {
    const preferredAccounts = expenseAccounts.filter((account) => {
      const label = account.label.toLowerCase();

      return (
        label.includes("bank charge") ||
        label.includes("bank charges") ||
        label.includes("bank fee") ||
        label.includes("bank fees") ||
        label.includes("charges") ||
        label.includes("fees")
      );
    });

    return preferredAccounts.length > 0 ? preferredAccounts : expenseAccounts;
  }, [expenseAccounts]);

  const likelyCandidates = useMemo(() => {
    return candidates
      .filter((candidate) => {
        const candidateAmount = toNumber(candidate.amount);

        const sameAmount =
          Math.abs(candidateAmount - unallocatedAmount) < 0.01 ||
          Math.abs(candidateAmount - bankLineAmount) < 0.01;

        if (isMoneyIn) {
          return (
            [
              "CUSTOMER_RECEIPT",
              "FUNDING_TRANSACTION",
              "CAPITAL_CALL",
              "SALES_INVOICE",
              "JOURNAL_ENTRY",
              "GENERAL_LEDGER_ENTRY",
            ].includes(candidate.source_module) || sameAmount
          );
        }

        return (
          [
            "SUPPLIER_PAYMENT",
            "PURCHASE_BILL",
            "JOURNAL_ENTRY",
            "GENERAL_LEDGER_ENTRY",
          ].includes(candidate.source_module) || sameAmount
        );
      })
      .sort((a, b) => {
        const aAmountMatch =
          Math.abs(toNumber(a.amount) - unallocatedAmount) < 0.01 ? 0 : 1;

        const bAmountMatch =
          Math.abs(toNumber(b.amount) - unallocatedAmount) < 0.01 ? 0 : 1;

        return aAmountMatch - bAmountMatch;
      });
  }, [bankLineAmount, candidates, isMoneyIn, unallocatedAmount]);

  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedKey, setSelectedKey] = useState("");
  const [matchedAmount, setMatchedAmount] = useState(
    unallocatedAmount > 0 ? String(unallocatedAmount) : String(bankLineAmount)
  );
  const [bankChargeTreatment, setBankChargeTreatment] =
    useState<BankChargeTreatment>("NONE");
  const [bankChargeAmount, setBankChargeAmount] = useState("0");
  const [bankChargeGlAccountId, setBankChargeGlAccountId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [excluding, setExcluding] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const selectedCandidate = likelyCandidates.find((candidate) => {
    const key = `${candidate.source_module}:${candidate.source_record_id}`;
    return key === selectedKey;
  });

  const shouldShowBankChargeFields = bankChargeTreatment !== "NONE";
  const currentChargeAmount = roundMoney(toNumber(bankChargeAmount));
  const currentSourceAmount = roundMoney(toNumber(matchedAmount));

  const expectedBankLineCoverage = getExpectedBankLineCoverage({
    sourceAmount: currentSourceAmount,
    chargeAmount: currentChargeAmount,
    treatment: bankChargeTreatment,
    isMoneyIn,
  });

  function updateSelectedCandidate(nextKey: string) {
    setSelectedKey(nextKey);

    const nextCandidate = likelyCandidates.find((candidate) => {
      const key = `${candidate.source_module}:${candidate.source_record_id}`;
      return key === nextKey;
    });

    if (!nextCandidate) return;

    const recommendedAmount = getRecommendedSourceMatchAmount({
      candidateAmount: roundMoney(toNumber(nextCandidate.amount)),
      bankLineAmount: unallocatedAmount,
      chargeAmount: currentChargeAmount,
      treatment: bankChargeTreatment,
      isMoneyIn,
    });

    setMatchedAmount(String(recommendedAmount));
  }

  function updateBankChargeTreatment(nextTreatment: BankChargeTreatment) {
    setBankChargeTreatment(nextTreatment);

    if (nextTreatment === "NONE") {
      setBankChargeAmount("0");
      setBankChargeGlAccountId("");
    }

    if (selectedCandidate) {
      const recommendedAmount = getRecommendedSourceMatchAmount({
        candidateAmount: roundMoney(toNumber(selectedCandidate.amount)),
        bankLineAmount: unallocatedAmount,
        chargeAmount: nextTreatment === "NONE" ? 0 : currentChargeAmount,
        treatment: nextTreatment,
        isMoneyIn,
      });

      setMatchedAmount(String(recommendedAmount));
    }
  }

  function updateBankChargeAmount(nextAmount: string) {
    setBankChargeAmount(nextAmount);

    const nextChargeAmount = roundMoney(toNumber(nextAmount));

    if (selectedCandidate) {
      const recommendedAmount = getRecommendedSourceMatchAmount({
        candidateAmount: roundMoney(toNumber(selectedCandidate.amount)),
        bankLineAmount: unallocatedAmount,
        chargeAmount: nextChargeAmount,
        treatment: bankChargeTreatment,
        isMoneyIn,
      });

      setMatchedAmount(String(recommendedAmount));
    }
  }

  async function handleMatch() {
    setSubmitting(true);
    setErrorMessage("");

    try {
      if (!selectedCandidate) {
        throw new Error("Select a transaction to match.");
      }

      const sourceAmount = roundMoney(toNumber(matchedAmount));
      const chargeAmount = roundMoney(toNumber(bankChargeAmount));

      if (sourceAmount <= 0) {
        throw new Error("Enter a source transaction amount greater than zero.");
      }

      if (sourceAmount > toNumber(selectedCandidate.amount)) {
        throw new Error(
          `Source transaction amount cannot exceed the unallocated source transaction amount of ${formatMoney(
            selectedCandidate.currency_code,
            selectedCandidate.amount
          )}.`
        );
      }

      if (bankChargeTreatment === "NONE" && chargeAmount > 0) {
        throw new Error(
          "Select a bank charge treatment or clear the bank charge amount."
        );
      }

      if (bankChargeTreatment !== "NONE" && chargeAmount <= 0) {
        throw new Error("Enter a bank charge amount greater than zero.");
      }

      if (bankChargeTreatment !== "NONE" && !bankChargeGlAccountId) {
        throw new Error("Select the Bank Charges GL account.");
      }

      if (chargeAmount < 0) {
        throw new Error("Bank charge amount cannot be negative.");
      }

      const bankLineCoverage = getExpectedBankLineCoverage({
        sourceAmount,
        chargeAmount,
        treatment: bankChargeTreatment,
        isMoneyIn,
      });

      if (bankLineCoverage <= 0) {
        throw new Error(
          "The bank charge is too high for this source transaction amount."
        );
      }

      if (bankLineCoverage > unallocatedAmount) {
        throw new Error(
          `The amount covered on the bank line cannot exceed the remaining bank line amount of ${formatMoney(
            line.currency_code,
            unallocatedAmount
          )}.`
        );
      }

      const response = await fetch(
        `/api/bank-statement-lines/${line.id}/match`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            source_module: selectedCandidate.source_module,
            source_record_id: selectedCandidate.source_record_id,
            matched_amount: sourceAmount,
            match_note:
              bankChargeTreatment === "INCLUDED_IN_BANK_LINE"
                ? "Matched inline from banking feed with bank charge included in bank line."
                : "Matched inline from banking feed.",
            bank_charge_treatment: bankChargeTreatment,
            bank_charge_amount:
              bankChargeTreatment === "NONE" ? 0 : chargeAmount,
            bank_charge_gl_account_id:
              bankChargeTreatment === "NONE" ? null : bankChargeGlAccountId,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to match bank line.");
      }

      setSelectedKey("");
      setMatchedAmount("0");
      setBankChargeTreatment("NONE");
      setBankChargeAmount("0");
      setBankChargeGlAccountId("");
      setIsExpanded(false);
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to match bank line."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleExclude() {
    const confirmed = window.confirm(
      "Exclude this bank line from reconciliation? This should only be used for duplicate, irrelevant, or non-accounting bank feed items."
    );

    if (!confirmed) return;

    setExcluding(true);
    setErrorMessage("");

    try {
      const response = await fetch(
        `/api/bank-statement-lines/${line.id}/exclude`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            exclude_note: "Excluded inline from banking feed.",
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to exclude bank line.");
      }

      setIsExpanded(false);
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to exclude bank line."
      );
    } finally {
      setExcluding(false);
    }
  }

  return (
    <div className="min-w-[220px] text-right">
      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={() => setIsExpanded((current) => !current)}
          className="rounded-full bg-[#073D7F] px-4 py-2 text-xs font-semibold text-white"
        >
          {isExpanded ? "Close" : "Open"}
        </button>

        <a
          href={`/portal/organisations/${organisationId}/banking/${bankAccountId}/lines/${line.id}`}
          className="rounded-full border border-[#D9E3F4] bg-white px-4 py-2 text-xs font-semibold text-[#073D7F]"
        >
          Details
        </a>
      </div>

      {!isExpanded ? null : (
        <div className="mt-4 min-w-[520px] space-y-3 text-right">
          {errorMessage ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-left text-xs leading-5 text-red-700">
              {errorMessage}
            </div>
          ) : null}

          <div className="grid gap-2 rounded-2xl border border-[#D9E3F4] bg-[#F8FAFC] p-3 text-left text-xs text-slate-600 sm:grid-cols-3">
            <div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-slate-400">
                Bank line
              </div>
              <div className="mt-1 font-semibold text-slate-950">
                {formatMoney(line.currency_code, bankLineAmount)}
              </div>
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-slate-400">
                Allocated
              </div>
              <div className="mt-1 font-semibold text-slate-950">
                {formatMoney(line.currency_code, allocatedAmount)}
              </div>
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-slate-400">
                Remaining
              </div>
              <div className="mt-1 font-semibold text-slate-950">
                {formatMoney(line.currency_code, unallocatedAmount)}
              </div>
            </div>
          </div>

          <BankLineAllocationHistory allocations={allocationHistory} />

          {isLocked ? (
            <div className="rounded-2xl border border-[#D9E3F4] bg-[#F8FAFC] px-4 py-3 text-left text-xs leading-6 text-slate-600">
              This bank line is {formatStatus(line.reconciliation_status)}. Open
              the details page for the full audit trail.
            </div>
          ) : (
            <>
              <div className="grid gap-2 lg:grid-cols-[1fr_180px]">
                <select
                  value={selectedKey}
                  onChange={(event) =>
                    updateSelectedCandidate(event.target.value)
                  }
                  className="w-full rounded-2xl border border-[#D9E3F4] px-3 py-2 text-xs outline-none focus:border-[#073D7F]"
                >
                  <option value="">Select match</option>
                  {likelyCandidates.map((candidate) => {
                    const key = `${candidate.source_module}:${candidate.source_record_id}`;
                    const amountText = formatMoney(
                      candidate.currency_code,
                      candidate.amount
                    );

                    return (
                      <option key={key} value={key}>
                        {formatStatus(candidate.source_module)} ·{" "}
                        {candidate.label} · {amountText}
                      </option>
                    );
                  })}
                </select>

                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={matchedAmount}
                  onChange={(event) => setMatchedAmount(event.target.value)}
                  className="w-full rounded-2xl border border-[#D9E3F4] px-3 py-2 text-xs outline-none focus:border-[#073D7F]"
                  placeholder="Source amount"
                />
              </div>

              <div className="rounded-2xl border border-[#D9E3F4] bg-white p-3 text-left">
                <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6491DE]">
                  Bank Charge Treatment
                </div>

                <select
                  value={bankChargeTreatment}
                  onChange={(event) =>
                    updateBankChargeTreatment(
                      event.target.value as BankChargeTreatment
                    )
                  }
                  className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-3 py-2 text-xs outline-none focus:border-[#073D7F]"
                >
                  <option value="NONE">No bank charge</option>
                  <option value="INCLUDED_IN_BANK_LINE">
                    Bank charge included in bank line
                  </option>
                  <option value="EXCLUDED_FROM_BANK_LINE">
                    Bank charge excluded / separate from bank line
                  </option>
                  <option value="SEPARATE_BANK_LINE">
                    Separate bank charge line
                  </option>
                </select>

                {shouldShowBankChargeFields ? (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={bankChargeAmount}
                      onChange={(event) =>
                        updateBankChargeAmount(event.target.value)
                      }
                      className="w-full rounded-2xl border border-[#D9E3F4] px-3 py-2 text-xs outline-none focus:border-[#073D7F]"
                      placeholder="Bank charge amount"
                    />

                    <select
                      value={bankChargeGlAccountId}
                      onChange={(event) =>
                        setBankChargeGlAccountId(event.target.value)
                      }
                      className="w-full rounded-2xl border border-[#D9E3F4] px-3 py-2 text-xs outline-none focus:border-[#073D7F]"
                    >
                      <option value="">
                        Select Bank Charges GL account
                      </option>
                      {bankChargeAccounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}

                {shouldShowBankChargeFields ? (
                  <div className="mt-3 rounded-xl bg-[#F8FAFC] px-3 py-2 text-[11px] leading-5 text-slate-600">
                    <div>
                      Source transaction amount:{" "}
                      <span className="font-semibold">
                        {formatMoney(
                          selectedCandidate?.currency_code || line.currency_code,
                          currentSourceAmount
                        )}
                      </span>
                    </div>
                    <div>
                      Bank charge amount:{" "}
                      <span className="font-semibold">
                        {formatMoney(line.currency_code, currentChargeAmount)}
                      </span>
                    </div>
                    <div>
                      Expected bank line coverage:{" "}
                      <span className="font-semibold">
                        {formatMoney(
                          line.currency_code,
                          expectedBankLineCoverage
                        )}
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={handleMatch}
                  disabled={
                    submitting || !selectedCandidate || unallocatedAmount <= 0
                  }
                  className="rounded-full bg-[#073D7F] px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Matching..." : "Match"}
                </button>

                <button
                  type="button"
                  onClick={() => setShowAddForm((current) => !current)}
                  disabled={unallocatedAmount <= 0}
                  className="rounded-full border border-[#D9E3F4] bg-white px-4 py-2 text-xs font-semibold text-[#073D7F] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {showAddForm ? "Close Add" : "Add"}
                </button>

                <button
                  type="button"
                  onClick={handleExclude}
                  disabled={excluding || allocatedAmount > 0}
                  className="rounded-full border border-[#D9E3F4] bg-white px-4 py-2 text-xs font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {excluding ? "Excluding..." : "Exclude"}
                </button>
              </div>

              {showAddForm ? (
                <AddBankLineToBooksForm
                  line={line}
                  customers={customers}
                  suppliers={suppliers}
                  investors={investors}
                  incomeAccounts={incomeAccounts}
                  expenseAccounts={expenseAccounts}
                />
              ) : null}
            </>
          )}
        </div>
      )}
    </div>
  );
}