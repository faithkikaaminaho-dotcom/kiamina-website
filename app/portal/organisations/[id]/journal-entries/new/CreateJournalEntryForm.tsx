"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AutoNumberInput from "@/app/portal/components/AutoNumberInput";
import CurrencySelect from "@/app/portal/components/CurrencySelect";
import ExchangeRateFields from "@/app/portal/components/ExchangeRateFields";

type AccountOption = {
  id: string;
  account_code: string | null;
  account_name: string | null;
  account_type: string | null;
  account_subtype?: string | null;
};

type CustomerOption = {
  id: string;
  customer_name: string | null;
};

type SupplierOption = {
  id: string;
  supplier_name: string | null;
};

type InvestorOption = {
  id: string;
  investor_name: string | null;
};

type JournalLine = {
  account_id: string;
  description: string;
  debit_amount: string;
  credit_amount: string;
  customer_id: string;
  supplier_id: string;
  investor_id: string;
};

type InitialJournal = {
  id: string;
  journal_number: string | null;
  journal_date: string | null;
  journal_type: string | null;
  description: string | null;
  reference_number: string | null;
  currency_code: string | null;
  exchange_rate: number | string | null;
  exchange_rate_date: string | null;
  exchange_rate_source: string | null;
  exchange_rate_is_locked: boolean | null;
  status: string | null;
};

type InitialJournalLine = {
  account_id: string | null;
  description: string | null;
  debit_amount: number | string | null;
  credit_amount: number | string | null;
  customer_id: string | null;
  supplier_id: string | null;
  investor_id: string | null;
};

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function emptyLine(): JournalLine {
  return {
    account_id: "",
    description: "",
    debit_amount: "",
    credit_amount: "",
    customer_id: "",
    supplier_id: "",
    investor_id: "",
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

function normaliseAmount(value: number | string | null | undefined) {
  const numericValue = Number(value || 0);

  if (!Number.isFinite(numericValue) || numericValue === 0) {
    return "";
  }

  return String(numericValue);
}

function normaliseLine(line: InitialJournalLine): JournalLine {
  return {
    account_id: line.account_id || "",
    description: line.description || "",
    debit_amount: normaliseAmount(line.debit_amount),
    credit_amount: normaliseAmount(line.credit_amount),
    customer_id: line.customer_id || "",
    supplier_id: line.supplier_id || "",
    investor_id: line.investor_id || "",
  };
}

export default function CreateJournalEntryForm({
  organisationId,
  defaultCurrency,
  accounts,
  customers,
  suppliers,
  investors,
  mode = "create",
  initialJournal,
  initialLines,
}: {
  organisationId: string;
  defaultCurrency?: string | null;
  accounts: AccountOption[];
  customers: CustomerOption[];
  suppliers: SupplierOption[];
  investors: InvestorOption[];
  mode?: "create" | "edit";
  initialJournal?: InitialJournal | null;
  initialLines?: InitialJournalLine[];
}) {
  const router = useRouter();

  const isEditMode = mode === "edit" && initialJournal;

  const [journalNumber, setJournalNumber] = useState(
    initialJournal?.journal_number || ""
  );
  const [journalDate, setJournalDate] = useState(
    initialJournal?.journal_date || todayDate()
  );
  const [journalType, setJournalType] = useState(
    initialJournal?.journal_type || "MANUAL"
  );
  const [description, setDescription] = useState(
    initialJournal?.description || ""
  );
  const [referenceNumber, setReferenceNumber] = useState(
    initialJournal?.reference_number || ""
  );
  const [currencyCode, setCurrencyCode] = useState(
    initialJournal?.currency_code || defaultCurrency || ""
  );
  const [exchangeRate, setExchangeRate] = useState(
    String(initialJournal?.exchange_rate || "1")
  );
  const [exchangeRateDate, setExchangeRateDate] = useState(
    initialJournal?.exchange_rate_date || ""
  );
  const [exchangeRateSource, setExchangeRateSource] = useState(
    initialJournal?.exchange_rate_source || ""
  );
  const [exchangeRateIsLocked, setExchangeRateIsLocked] = useState(
    Boolean(initialJournal?.exchange_rate_is_locked)
  );

  const [lines, setLines] = useState<JournalLine[]>(
    initialLines && initialLines.length >= 2
      ? initialLines.map(normaliseLine)
      : [emptyLine(), emptyLine()]
  );

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const totals = useMemo(() => {
    const totalDebits = lines.reduce(
      (sum, line) => sum + toNumber(line.debit_amount, 0),
      0
    );

    const totalCredits = lines.reduce(
      (sum, line) => sum + toNumber(line.credit_amount, 0),
      0
    );

    const difference = Number((totalDebits - totalCredits).toFixed(2));

    return {
      totalDebits: Number(totalDebits.toFixed(2)),
      totalCredits: Number(totalCredits.toFixed(2)),
      difference,
      isBalanced: totalDebits > 0 && totalDebits === totalCredits,
    };
  }, [lines]);

  function updateLine(index: number, field: keyof JournalLine, value: string) {
    setLines((currentLines) =>
      currentLines.map((line, lineIndex) => {
        if (lineIndex !== index) return line;

        if (field === "debit_amount" && value) {
          return {
            ...line,
            debit_amount: value,
            credit_amount: "",
          };
        }

        if (field === "credit_amount" && value) {
          return {
            ...line,
            credit_amount: value,
            debit_amount: "",
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
      if (currentLines.length <= 2) return currentLines;

      return currentLines.filter((_, lineIndex) => lineIndex !== index);
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitting(true);
    setErrorMessage("");

    try {
      const endpoint = isEditMode
        ? `/api/journal-entries/${initialJournal.id}`
        : "/api/journal-entries";

      const method = isEditMode ? "PATCH" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organisation_id: organisationId,
          accounting_period_id: null,
          engagement_id: null,
          journal_number: journalNumber,
          journal_date: journalDate,
          journal_type: journalType,
          description: description || null,
          reference_number: referenceNumber || null,
          currency_code: currencyCode || null,
          exchange_rate: exchangeRate || "1",
          exchange_rate_date: exchangeRateDate || journalDate || null,
          exchange_rate_source: exchangeRateSource || null,
          exchange_rate_is_locked: exchangeRateIsLocked,
          lines: lines.map((line) => ({
            account_id: line.account_id || null,
            description: line.description || null,
            debit_amount: line.debit_amount || "0",
            credit_amount: line.credit_amount || "0",
            customer_id: line.customer_id || null,
            supplier_id: line.supplier_id || null,
            investor_id: line.investor_id || null,
          })),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            (isEditMode
              ? "Unable to update journal entry."
              : "Unable to create journal entry.")
        );
      }

      if (isEditMode) {
        router.push(
          `/portal/organisations/${organisationId}/journal-entries/${initialJournal.id}`
        );
      } else {
        router.push(`/portal/organisations/${organisationId}/journal-entries`);
      }

      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : isEditMode
          ? "Unable to update journal entry."
          : "Unable to create journal entry."
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

      {isEditMode ? (
        <div className="mb-6 rounded-[1.5rem] border border-[#D9E3F4] bg-[#F8FAFC] p-5">
          <div className="text-sm font-semibold uppercase tracking-[0.2em] text-[#6491DE]">
            Review Edit Mode
          </div>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            This journal is still editable because it has not been posted to the
            General Ledger. Once posted or voided, edits will be blocked.
          </p>
        </div>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2">
        {isEditMode ? (
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Journal number
            </span>
            <input
              value={journalNumber}
              disabled
              className="mt-2 w-full rounded-2xl border border-[#D9E3F4] bg-[#F8FAFC] px-4 py-3 text-sm text-slate-500 outline-none"
            />
          </label>
        ) : (
          <AutoNumberInput
            label="Journal number"
            value={journalNumber}
            onChange={setJournalNumber}
            organisationId={organisationId}
            documentType="JOURNAL_ENTRY"
            placeholder="JE-0001"
          />
        )}

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Journal date
          </span>
          <input
            type="date"
            value={journalDate}
            onChange={(event) => {
              const nextDate = event.target.value;
              setJournalDate(nextDate);

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
            Journal type
          </span>
          <select
            value={journalType}
            onChange={(event) => setJournalType(event.target.value)}
            required
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          >
            <option value="MANUAL">Manual Journal</option>
            <option value="OPENING_BALANCE">Opening Balance</option>
            <option value="PAYROLL">Payroll Journal</option>
            <option value="TAX">Tax Journal</option>
            <option value="ACCRUAL">Accrual</option>
            <option value="PREPAYMENT">Prepayment</option>
            <option value="DEPRECIATION">Depreciation</option>
            <option value="FX_REVALUATION">FX Revaluation</option>
            <option value="CORRECTION">Correction Entry</option>
            <option value="YEAR_END_ADJUSTMENT">Year-end Adjustment</option>
            <option value="OTHER">Other</option>
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

        <label className="block md:col-span-2">
          <span className="text-sm font-semibold text-slate-700">
            Reference number
          </span>
          <input
            value={referenceNumber}
            onChange={(event) => setReferenceNumber(event.target.value)}
            placeholder="Supporting reference, voucher number, payroll batch, tax schedule reference, etc."
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          />
        </label>

        <label className="block md:col-span-2">
          <span className="text-sm font-semibold text-slate-700">
            Description
          </span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={4}
            placeholder="Describe the business reason for this journal entry."
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm leading-7 outline-none focus:border-[#073D7F]"
          />
        </label>
      </div>

      <div className="mt-8 rounded-[1.5rem] border border-[#D9E3F4] bg-[#F8FAFC] p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              Journal lines
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Every journal must balance: total debits must equal total credits.
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
                  disabled={lines.length <= 2}
                  className="rounded-full border border-[#D9E3F4] px-4 py-2 text-xs font-semibold text-slate-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Remove
                </button>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <label className="block lg:col-span-2">
                  <span className="text-sm font-semibold text-slate-700">
                    Account
                  </span>
                  <select
                    value={line.account_id}
                    onChange={(event) =>
                      updateLine(index, "account_id", event.target.value)
                    }
                    required
                    className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
                  >
                    <option value="">Select account</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.account_code} - {account.account_name} (
                        {account.account_type})
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block lg:col-span-2">
                  <span className="text-sm font-semibold text-slate-700">
                    Line description
                  </span>
                  <input
                    value={line.description}
                    onChange={(event) =>
                      updateLine(index, "description", event.target.value)
                    }
                    placeholder="Line narration"
                    className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">
                    Debit
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    value={line.debit_amount}
                    onChange={(event) =>
                      updateLine(index, "debit_amount", event.target.value)
                    }
                    placeholder="0.00"
                    className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">
                    Credit
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    value={line.credit_amount}
                    onChange={(event) =>
                      updateLine(index, "credit_amount", event.target.value)
                    }
                    placeholder="0.00"
                    className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">
                    Customer optional
                  </span>
                  <select
                    value={line.customer_id}
                    onChange={(event) =>
                      updateLine(index, "customer_id", event.target.value)
                    }
                    className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
                  >
                    <option value="">No customer</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.customer_name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">
                    Supplier optional
                  </span>
                  <select
                    value={line.supplier_id}
                    onChange={(event) =>
                      updateLine(index, "supplier_id", event.target.value)
                    }
                    className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
                  >
                    <option value="">No supplier</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.supplier_name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block lg:col-span-2">
                  <span className="text-sm font-semibold text-slate-700">
                    Investor / Funder optional
                  </span>
                  <select
                    value={line.investor_id}
                    onChange={(event) =>
                      updateLine(index, "investor_id", event.target.value)
                    }
                    className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
                  >
                    <option value="">No investor / funder</option>
                    {investors.map((investor) => (
                      <option key={investor.id} value={investor.id}>
                        {investor.investor_name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-[1.5rem] bg-[#073D7F] p-6 text-white">
          <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#6491DE]">
            Journal Balance
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div>
              <div className="text-sm text-blue-100">Total Debits</div>
              <div className="mt-1 text-2xl font-semibold">
                {currencyCode || "—"} {formatMoney(totals.totalDebits)}
              </div>
            </div>

            <div>
              <div className="text-sm text-blue-100">Total Credits</div>
              <div className="mt-1 text-2xl font-semibold">
                {currencyCode || "—"} {formatMoney(totals.totalCredits)}
              </div>
            </div>

            <div>
              <div className="text-sm text-blue-100">Difference</div>
              <div className="mt-1 text-2xl font-semibold">
                {currencyCode || "—"} {formatMoney(Math.abs(totals.difference))}
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-white/10 p-4 text-sm leading-7 text-blue-100">
            {totals.isBalanced
              ? "This journal is balanced and can be saved."
              : "This journal is not yet balanced. Total debits must equal total credits before saving."}
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          disabled={submitting || !totals.isBalanced}
          className="rounded-full bg-[#073D7F] px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting
            ? isEditMode
              ? "Saving changes..."
              : "Creating journal entry..."
            : isEditMode
            ? "Save Journal Changes"
            : "Create Draft Journal"}
        </button>

        <a
          href={
            isEditMode && initialJournal
              ? `/portal/organisations/${organisationId}/journal-entries/${initialJournal.id}`
              : `/portal/organisations/${organisationId}`
          }
          className="rounded-full border border-[#D9E3F4] bg-white px-6 py-3 text-center text-sm font-semibold text-[#073D7F]"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}