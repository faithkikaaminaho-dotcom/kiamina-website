"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type StatementLine = {
  transaction_date: string;
  value_date: string;
  description: string;
  reference_number: string;
  money_in: string;
  money_out: string;
  running_balance: string;
  notes: string;
};

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function emptyLine(): StatementLine {
  return {
    transaction_date: todayDate(),
    value_date: "",
    description: "",
    reference_number: "",
    money_in: "",
    money_out: "",
    running_balance: "",
    notes: "",
  };
}

function toNumber(value: string, fallback = 0) {
  if (!value) return fallback;

  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function formatMoney(amount: number) {
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function CreateBankStatementLinesForm({
  organisationId,
  bankAccountId,
  currencyCode,
}: {
  organisationId: string;
  bankAccountId: string;
  currencyCode?: string | null;
}) {
  const router = useRouter();

  const [fileName, setFileName] = useState("");
  const [statementStartDate, setStatementStartDate] = useState("");
  const [statementEndDate, setStatementEndDate] = useState("");
  const [openingBalance, setOpeningBalance] = useState("");
  const [closingBalance, setClosingBalance] = useState("");
  const [lines, setLines] = useState<StatementLine[]>([emptyLine()]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const totals = useMemo(() => {
    const totalMoneyIn = lines.reduce(
      (sum, line) => sum + toNumber(line.money_in, 0),
      0
    );

    const totalMoneyOut = lines.reduce(
      (sum, line) => sum + toNumber(line.money_out, 0),
      0
    );

    const netMovement = totalMoneyIn - totalMoneyOut;

    return {
      totalMoneyIn: Number(totalMoneyIn.toFixed(2)),
      totalMoneyOut: Number(totalMoneyOut.toFixed(2)),
      netMovement: Number(netMovement.toFixed(2)),
    };
  }, [lines]);

  function updateLine(index: number, field: keyof StatementLine, value: string) {
    setLines((currentLines) =>
      currentLines.map((line, lineIndex) => {
        if (lineIndex !== index) return line;

        if (field === "money_in" && value) {
          return {
            ...line,
            money_in: value,
            money_out: "",
          };
        }

        if (field === "money_out" && value) {
          return {
            ...line,
            money_out: value,
            money_in: "",
          };
        }

        return {
          ...line,
          [field]: value,
        };
      })
    );
  }

  function addLine() {
    setLines((currentLines) => [...currentLines, emptyLine()]);
  }

  function removeLine(index: number) {
    setLines((currentLines) => {
      if (currentLines.length <= 1) return currentLines;

      return currentLines.filter((_, lineIndex) => lineIndex !== index);
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/bank-statement-imports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organisation_id: organisationId,
          bank_account_id: bankAccountId,
          document_id: null,
          file_name: fileName || null,
          statement_start_date: statementStartDate || null,
          statement_end_date: statementEndDate || null,
          opening_balance: openingBalance || null,
          closing_balance: closingBalance || null,
          lines: lines.map((line) => ({
            transaction_date: line.transaction_date || null,
            value_date: line.value_date || line.transaction_date || null,
            description: line.description || null,
            reference_number: line.reference_number || null,
            money_in: line.money_in || "0",
            money_out: line.money_out || "0",
            running_balance: line.running_balance || null,
            notes: line.notes || null,
          })),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Unable to import bank statement lines."
        );
      }

      router.push(
        `/portal/organisations/${organisationId}/banking/${bankAccountId}`
      );
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to import bank statement lines."
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
        <label className="block md:col-span-2">
          <span className="text-sm font-semibold text-slate-700">
            Statement name / file name
          </span>
          <input
            value={fileName}
            onChange={(event) => setFileName(event.target.value)}
            placeholder="Example: GTBank July 2026 Statement"
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Statement start date
          </span>
          <input
            type="date"
            value={statementStartDate}
            onChange={(event) => setStatementStartDate(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Statement end date
          </span>
          <input
            type="date"
            value={statementEndDate}
            onChange={(event) => setStatementEndDate(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Opening balance
          </span>
          <input
            type="number"
            step="0.01"
            value={openingBalance}
            onChange={(event) => setOpeningBalance(event.target.value)}
            placeholder="0.00"
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Closing balance
          </span>
          <input
            type="number"
            step="0.01"
            value={closingBalance}
            onChange={(event) => setClosingBalance(event.target.value)}
            placeholder="0.00"
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          />
        </label>
      </div>

      <div className="mt-8 rounded-[1.5rem] border border-[#D9E3F4] bg-[#F8FAFC] p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              Bank statement lines
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Enter bank statement movements manually. Later, this will be
              populated from uploaded bank statement extraction.
            </p>
          </div>

          <button
            type="button"
            onClick={addLine}
            className="rounded-full bg-[#073D7F] px-5 py-2.5 text-sm font-semibold text-white"
          >
            Add line
          </button>
        </div>

        <div className="mt-5 space-y-4">
          {lines.map((line, index) => (
            <div
              key={index}
              className="rounded-[1.25rem] border border-[#D9E3F4] bg-white p-5"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="text-sm font-semibold text-slate-950">
                  Line {index + 1}
                </div>

                <button
                  type="button"
                  onClick={() => removeLine(index)}
                  disabled={lines.length <= 1}
                  className="rounded-full border border-[#D9E3F4] px-4 py-2 text-xs font-semibold text-slate-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Remove
                </button>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">
                    Transaction date
                  </span>
                  <input
                    type="date"
                    value={line.transaction_date}
                    onChange={(event) =>
                      updateLine(index, "transaction_date", event.target.value)
                    }
                    required
                    className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">
                    Value date optional
                  </span>
                  <input
                    type="date"
                    value={line.value_date}
                    onChange={(event) =>
                      updateLine(index, "value_date", event.target.value)
                    }
                    className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
                  />
                </label>

                <label className="block lg:col-span-2">
                  <span className="text-sm font-semibold text-slate-700">
                    Description
                  </span>
                  <input
                    value={line.description}
                    onChange={(event) =>
                      updateLine(index, "description", event.target.value)
                    }
                    placeholder="Narration from bank statement"
                    required
                    className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">
                    Reference number
                  </span>
                  <input
                    value={line.reference_number}
                    onChange={(event) =>
                      updateLine(index, "reference_number", event.target.value)
                    }
                    placeholder="Transaction reference"
                    className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">
                    Running balance optional
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    value={line.running_balance}
                    onChange={(event) =>
                      updateLine(index, "running_balance", event.target.value)
                    }
                    placeholder="0.00"
                    className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">
                    Money in
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    value={line.money_in}
                    onChange={(event) =>
                      updateLine(index, "money_in", event.target.value)
                    }
                    placeholder="0.00"
                    className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">
                    Money out
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    value={line.money_out}
                    onChange={(event) =>
                      updateLine(index, "money_out", event.target.value)
                    }
                    placeholder="0.00"
                    className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
                  />
                </label>

                <label className="block lg:col-span-2">
                  <span className="text-sm font-semibold text-slate-700">
                    Notes optional
                  </span>
                  <input
                    value={line.notes}
                    onChange={(event) =>
                      updateLine(index, "notes", event.target.value)
                    }
                    placeholder="Internal note"
                    className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
                  />
                </label>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-[1.5rem] bg-[#073D7F] p-6 text-white">
          <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#6491DE]">
            Statement Movement
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div>
              <div className="text-sm text-blue-100">Total Money In</div>
              <div className="mt-1 text-2xl font-semibold">
                {currencyCode || "—"} {formatMoney(totals.totalMoneyIn)}
              </div>
            </div>

            <div>
              <div className="text-sm text-blue-100">Total Money Out</div>
              <div className="mt-1 text-2xl font-semibold">
                {currencyCode || "—"} {formatMoney(totals.totalMoneyOut)}
              </div>
            </div>

            <div>
              <div className="text-sm text-blue-100">Net Movement</div>
              <div className="mt-1 text-2xl font-semibold">
                {currencyCode || "—"} {formatMoney(totals.netMovement)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-[#073D7F] px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Importing lines..." : "Import Bank Statement Lines"}
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