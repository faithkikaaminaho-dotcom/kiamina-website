"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

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

type BankLine = {
  id: string;
  money_in: number | null;
  money_out: number | null;
  currency_code: string | null;
  reconciliation_status: string | null;
};

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

function formatMoney(currencyCode?: string | null, amount?: number | null) {
  return `${currencyCode || "—"} ${Number(amount || 0).toLocaleString(
    "en-US",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )}`;
}

export default function BankLineInlineActions({
  organisationId,
  bankAccountId,
  line,
  candidates,
}: {
  organisationId: string;
  bankAccountId: string;
  line: BankLine;
  candidates: SourceCandidate[];
}) {
  const router = useRouter();

  const bankLineAmount =
    toNumber(line.money_in) > 0 ? toNumber(line.money_in) : toNumber(line.money_out);

  const isMoneyIn = toNumber(line.money_in) > 0;

  const isLocked = [
    "MATCHED",
    "RECONCILED",
    "ADDED_TO_BOOKS",
    "IGNORED",
    "EXCLUDED",
  ].includes(line.reconciliation_status || "");

  const likelyCandidates = useMemo(() => {
    return candidates
      .filter((candidate) => {
        const sameAmount =
          Math.abs(toNumber(candidate.amount) - toNumber(bankLineAmount)) < 0.01;

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
          Math.abs(toNumber(a.amount) - toNumber(bankLineAmount)) < 0.01 ? 0 : 1;
        const bAmountMatch =
          Math.abs(toNumber(b.amount) - toNumber(bankLineAmount)) < 0.01 ? 0 : 1;

        return aAmountMatch - bAmountMatch;
      });
  }, [bankLineAmount, candidates, isMoneyIn]);

  const [selectedKey, setSelectedKey] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [excluding, setExcluding] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const selectedCandidate = likelyCandidates.find((candidate) => {
    const key = `${candidate.source_module}:${candidate.source_record_id}`;
    return key === selectedKey;
  });

  async function handleMatch() {
    setSubmitting(true);
    setErrorMessage("");

    try {
      if (!selectedCandidate) {
        throw new Error("Select a transaction to match.");
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
            matched_amount: bankLineAmount,
            match_note: "Matched inline from banking feed.",
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to match bank line.");
      }

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

      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to exclude bank line."
      );
    } finally {
      setExcluding(false);
    }
  }

  if (isLocked) {
    return (
      <div className="space-y-2 text-right">
        <a
          href={`/portal/organisations/${organisationId}/banking/${bankAccountId}/lines/${line.id}`}
          className="inline-flex rounded-full border border-[#D9E3F4] bg-white px-4 py-2 text-xs font-semibold text-[#073D7F]"
        >
          Details
        </a>
      </div>
    );
  }

  return (
    <div className="min-w-[340px] space-y-3 text-right">
      {errorMessage ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-left text-xs leading-5 text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <select
        value={selectedKey}
        onChange={(event) => setSelectedKey(event.target.value)}
        className="w-full rounded-2xl border border-[#D9E3F4] px-3 py-2 text-xs outline-none focus:border-[#073D7F]"
      >
        <option value="">Select match</option>
        {likelyCandidates.map((candidate) => {
          const key = `${candidate.source_module}:${candidate.source_record_id}`;
          const amountText = formatMoney(candidate.currency_code, candidate.amount);

          return (
            <option key={key} value={key}>
              {formatStatus(candidate.source_module)} · {candidate.label} ·{" "}
              {amountText}
            </option>
          );
        })}
      </select>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={handleMatch}
          disabled={submitting || !selectedCandidate}
          className="rounded-full bg-[#073D7F] px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Matching..." : "Match"}
        </button>

        <a
          href={`/portal/organisations/${organisationId}/banking/${bankAccountId}/lines/${line.id}`}
          className="rounded-full border border-[#D9E3F4] bg-white px-4 py-2 text-xs font-semibold text-[#073D7F]"
        >
          Details
        </a>

        <button
          type="button"
          onClick={handleExclude}
          disabled={excluding}
          className="rounded-full border border-[#D9E3F4] bg-white px-4 py-2 text-xs font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {excluding ? "Excluding..." : "Exclude"}
        </button>
      </div>
    </div>
  );
}