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

function formatStatus(status?: string | null) {
  if (!status) return "—";

  return status
    .split("_")
    .join(" ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
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

function formatDate(value?: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default function MatchBankLineForm({
  organisationId,
  bankAccountId,
  lineId,
  bankLineAmount,
  bankLineCurrency,
  candidates,
  isAlreadyMatched,
}: {
  organisationId: string;
  bankAccountId: string;
  lineId: string;
  bankLineAmount: number;
  bankLineCurrency?: string | null;
  candidates: SourceCandidate[];
  isAlreadyMatched: boolean;
}) {
  const router = useRouter();

  const [selectedKey, setSelectedKey] = useState("");
  const [matchedAmount, setMatchedAmount] = useState(String(bankLineAmount || ""));
  const [matchNote, setMatchNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const selectedCandidate = useMemo(() => {
    return candidates.find((candidate) => {
      const key = `${candidate.source_module}:${candidate.source_record_id}`;
      return key === selectedKey;
    });
  }, [candidates, selectedKey]);

  const groupedCandidates = useMemo(() => {
    return candidates.reduce<Record<string, SourceCandidate[]>>(
      (groups, candidate) => {
        if (!groups[candidate.source_module]) {
          groups[candidate.source_module] = [];
        }

        groups[candidate.source_module].push(candidate);

        return groups;
      },
      {}
    );
  }, [candidates]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitting(true);
    setErrorMessage("");

    try {
      if (!selectedCandidate) {
        throw new Error("Select a source transaction to match.");
      }

      const response = await fetch(
        `/api/bank-statement-lines/${lineId}/match`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            source_module: selectedCandidate.source_module,
            source_record_id: selectedCandidate.source_record_id,
            matched_amount: matchedAmount,
            match_note: matchNote || null,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to match bank statement line.");
      }

      router.push(
        `/portal/organisations/${organisationId}/banking/${bankAccountId}`
      );
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to match bank statement line."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (isAlreadyMatched) {
    return (
      <div className="rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm">
        <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
          Match Locked
        </div>

        <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
          This bank line has already been matched or added.
        </h2>

        <p className="mt-3 text-sm leading-7 text-slate-600">
          To change the match later, we will add an authorised unmatch/reopen
          control with audit trail.
        </p>

        <a
          href={`/portal/organisations/${organisationId}/banking/${bankAccountId}`}
          className="mt-6 inline-flex rounded-full bg-[#073D7F] px-6 py-3 text-sm font-semibold text-white"
        >
          Back to Bank Account
        </a>
      </div>
    );
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

      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <div>
          <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
            Match Transaction
          </div>

          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
            Select the source transaction
          </h2>

          <p className="mt-3 text-sm leading-7 text-slate-600">
            Match this bank statement line to an existing receipt, payment,
            funding transaction, capital call, journal, invoice, bill, or posted
            General Ledger entry.
          </p>

          <div className="mt-6 rounded-[1.5rem] bg-[#F8FAFC] p-5">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Bank Line Amount
            </div>

            <div className="mt-2 text-2xl font-semibold text-slate-950">
              {formatMoney(bankLineCurrency, bankLineAmount)}
            </div>

            <label className="mt-5 block">
              <span className="text-sm font-semibold text-slate-700">
                Matched amount
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                max={bankLineAmount}
                value={matchedAmount}
                onChange={(event) => setMatchedAmount(event.target.value)}
                required
                className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
              />
            </label>

            <label className="mt-5 block">
              <span className="text-sm font-semibold text-slate-700">
                Match note optional
              </span>
              <textarea
                value={matchNote}
                onChange={(event) => setMatchNote(event.target.value)}
                rows={4}
                placeholder="Example: Matched based on narration, amount, and receipt date."
                className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm leading-7 outline-none focus:border-[#073D7F]"
              />
            </label>
          </div>
        </div>

        <div>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Source transaction
            </span>
            <select
              value={selectedKey}
              onChange={(event) => setSelectedKey(event.target.value)}
              required
              className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
            >
              <option value="">Select transaction to match</option>
              {Object.entries(groupedCandidates).map(
                ([sourceModule, moduleCandidates]) => (
                  <optgroup key={sourceModule} label={formatStatus(sourceModule)}>
                    {moduleCandidates.map((candidate) => {
                      const key = `${candidate.source_module}:${candidate.source_record_id}`;

                      return (
                        <option key={key} value={key}>
                          {candidate.label} ·{" "}
                          {formatMoney(
                            candidate.currency_code,
                            candidate.amount
                          )}{" "}
                          · {formatDate(candidate.transaction_date)}
                        </option>
                      );
                    })}
                  </optgroup>
                )
              )}
            </select>
          </label>

          {selectedCandidate ? (
            <div className="mt-5 rounded-[1.5rem] border border-[#D9E3F4] bg-[#F8FAFC] p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6491DE]">
                Selected Transaction
              </div>

              <h3 className="mt-3 text-lg font-semibold text-slate-950">
                {selectedCandidate.label}
              </h3>

              <p className="mt-2 text-sm leading-7 text-slate-600">
                {selectedCandidate.description}
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-white p-4 text-sm">
                  <div className="text-xs text-slate-500">Amount</div>
                  <div className="mt-1 font-semibold text-slate-950">
                    {formatMoney(
                      selectedCandidate.currency_code,
                      selectedCandidate.amount
                    )}
                  </div>
                </div>

                <div className="rounded-2xl bg-white p-4 text-sm">
                  <div className="text-xs text-slate-500">Date</div>
                  <div className="mt-1 font-semibold text-slate-950">
                    {formatDate(selectedCandidate.transaction_date)}
                  </div>
                </div>

                <div className="rounded-2xl bg-white p-4 text-sm">
                  <div className="text-xs text-slate-500">Status</div>
                  <div className="mt-1 font-semibold text-slate-950">
                    {formatStatus(selectedCandidate.status)}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-[1.5rem] border border-dashed border-[#D9E3F4] bg-[#F8FAFC] p-8 text-sm leading-7 text-slate-500">
              Select a transaction to preview its amount, date, status, and
              description.
            </div>
          )}

          {candidates.length === 0 ? (
            <div className="mt-5 rounded-[1.5rem] border border-amber-200 bg-amber-50 p-5 text-sm leading-7 text-amber-800">
              No source transactions are available for matching yet. You can
              create receipts, payments, funding transactions, capital calls,
              invoices, bills, journals, or GL entries first.
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          disabled={submitting || candidates.length === 0}
          className="rounded-full bg-[#073D7F] px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Matching..." : "Match Bank Line"}
        </button>

        <a
          href={`/portal/organisations/${organisationId}/banking/${bankAccountId}`}
          className="rounded-full border border-[#D9E3F4] bg-white px-6 py-3 text-center text-sm font-semibold text-[#073D7F]"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}