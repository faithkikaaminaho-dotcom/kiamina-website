"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

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

type SplitType =
  | "CUSTOMER_RECEIPT"
  | "SUPPLIER_PAYMENT"
  | "FUNDING_TRANSACTION"
  | "BANK_CHARGE"
  | "OTHER";

type SplitLine = {
  id: string;
  split_type: SplitType;
  amount: string;
  customer_id: string;
  supplier_id: string;
  investor_id: string;
  income_account_id: string;
  expense_account_id: string;
  bank_charge_gl_account_id: string;
  funding_transaction_type: string;
  description: string;
};

const fundingTransactionTypesIn = [
  { value: "CAPITAL_CONTRIBUTION", label: "Capital Contribution" },
  { value: "CAPITAL_CALL_RECEIPT", label: "Capital Call Receipt" },
  { value: "GRANT_RECEIPT", label: "Grant Receipt" },
  { value: "DONATION_RECEIPT", label: "Donation Receipt" },
  { value: "LOAN_DRAWDOWN", label: "Loan Drawdown" },
  { value: "DIRECTOR_LOAN", label: "Director Loan" },
  { value: "SHAREHOLDER_LOAN", label: "Shareholder Loan" },
  { value: "INVESTOR_FUNDING", label: "Investor Funding" },
  { value: "OTHER_FUNDING_RECEIPT", label: "Other Funding Receipt" },
];

const fundingTransactionTypesOut = [
  { value: "LOAN_REPAYMENT", label: "Loan Repayment" },
  { value: "INTEREST_PAYMENT", label: "Interest Payment" },
];

function toNumber(value: unknown) {
  const numericValue = Number(value || 0);

  return Number.isFinite(numericValue) ? numericValue : 0;
}

function roundMoney(value: number) {
  return Number(value.toFixed(2));
}

function formatMoney(currencyCode?: string | null, amount?: number | null) {
  return `${currencyCode || "—"} ${Number(amount || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function getRemainingBankLineAmount({
  bankLineAmount,
  allocatedAmount,
  unallocatedAmount,
}: {
  bankLineAmount: number;
  allocatedAmount: number;
  unallocatedAmount?: number | null;
}) {
  if (unallocatedAmount !== null && unallocatedAmount !== undefined) {
    return roundMoney(toNumber(unallocatedAmount));
  }

  return roundMoney(Math.max(bankLineAmount - allocatedAmount, 0));
}

function newSplitLine({
  isMoneyIn,
  description,
}: {
  isMoneyIn: boolean;
  description: string;
}): SplitLine {
  return {
    id: crypto.randomUUID(),
    split_type: isMoneyIn ? "CUSTOMER_RECEIPT" : "SUPPLIER_PAYMENT",
    amount: "0",
    customer_id: "",
    supplier_id: "",
    investor_id: "",
    income_account_id: "",
    expense_account_id: "",
    bank_charge_gl_account_id: "",
    funding_transaction_type: isMoneyIn ? "GRANT_RECEIPT" : "LOAN_REPAYMENT",
    description,
  };
}

export default function AddBankLineToBooksForm({
  line,
  customers,
  suppliers,
  investors,
  incomeAccounts,
  expenseAccounts,
}: {
  line: BankLine;
  customers: PartyOption[];
  suppliers: PartyOption[];
  investors: PartyOption[];
  incomeAccounts: AccountOption[];
  expenseAccounts: AccountOption[];
}) {
  const router = useRouter();

  const moneyIn = toNumber(line.money_in);
  const moneyOut = toNumber(line.money_out);
  const isMoneyIn = moneyIn > 0;
  const bankLineAmount = isMoneyIn ? moneyIn : moneyOut;
  const allocatedAmount = roundMoney(toNumber(line.allocated_amount));

  const remainingBankLineAmount = getRemainingBankLineAmount({
    bankLineAmount,
    allocatedAmount,
    unallocatedAmount: line.unallocated_amount,
  });

  const defaultDescription = line.description || "";

  const [splitLines, setSplitLines] = useState<SplitLine[]>([
    {
      ...newSplitLine({ isMoneyIn, description: defaultDescription }),
      amount: String(remainingBankLineAmount),
    },
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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

  const availableSplitTypes = useMemo(() => {
    if (isMoneyIn) {
      return [
        { value: "CUSTOMER_RECEIPT", label: "Customer Receipt" },
        { value: "FUNDING_TRANSACTION", label: "Funding Transaction" },
        { value: "BANK_CHARGE", label: "Bank Charge" },
        { value: "OTHER", label: "Other Allocation" },
      ];
    }

    return [
      { value: "SUPPLIER_PAYMENT", label: "Supplier Payment" },
      { value: "FUNDING_TRANSACTION", label: "Funding Transaction" },
      { value: "BANK_CHARGE", label: "Bank Charge" },
      { value: "OTHER", label: "Other Allocation" },
    ];
  }, [isMoneyIn]);

  const availableFundingTransactionTypes = isMoneyIn
    ? fundingTransactionTypesIn
    : fundingTransactionTypesOut;

  const totalSplitAmount = roundMoney(
    splitLines.reduce((sum, split) => sum + toNumber(split.amount), 0)
  );

  const remainingAmount = roundMoney(remainingBankLineAmount - totalSplitAmount);
  const isBalanced = Math.abs(remainingAmount) < 0.01;

  function updateSplitLine(id: string, updates: Partial<SplitLine>) {
    setSplitLines((current) =>
      current.map((split) => {
        if (split.id !== id) return split;

        const nextSplit = {
          ...split,
          ...updates,
        };

        if (updates.split_type) {
          nextSplit.customer_id = "";
          nextSplit.supplier_id = "";
          nextSplit.investor_id = "";
          nextSplit.income_account_id = "";
          nextSplit.expense_account_id = "";
          nextSplit.bank_charge_gl_account_id = "";
          nextSplit.funding_transaction_type = isMoneyIn
            ? "GRANT_RECEIPT"
            : "LOAN_REPAYMENT";
        }

        return nextSplit;
      })
    );
  }

  function addSplitLine() {
    setSplitLines((current) => [
      ...current,
      newSplitLine({
        isMoneyIn,
        description: defaultDescription,
      }),
    ]);
  }

  function removeSplitLine(id: string) {
    setSplitLines((current) => {
      if (current.length === 1) return current;

      return current.filter((split) => split.id !== id);
    });
  }

  function fillRemainingAmount(id: string) {
    const otherTotal = roundMoney(
      splitLines
        .filter((split) => split.id !== id)
        .reduce((sum, split) => sum + toNumber(split.amount), 0)
    );

    const amountToFill = roundMoney(
      Math.max(remainingBankLineAmount - otherTotal, 0)
    );

    updateSplitLine(id, {
      amount: String(amountToFill),
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitting(true);
    setErrorMessage("");

    try {
      if (remainingBankLineAmount <= 0) {
        throw new Error("There is no remaining unallocated amount on this bank line.");
      }

      if (splitLines.length === 0) {
        throw new Error("Add at least one split line.");
      }

      for (const split of splitLines) {
        const amount = roundMoney(toNumber(split.amount));

        if (amount <= 0) {
          throw new Error("Each split line must have an amount greater than zero.");
        }

        if (split.split_type === "CUSTOMER_RECEIPT" && !split.customer_id) {
          throw new Error("Customer is required for customer receipt splits.");
        }

        if (
          split.split_type === "CUSTOMER_RECEIPT" &&
          !split.income_account_id
        ) {
          throw new Error("Income GL account is required for customer receipt splits.");
        }

        if (split.split_type === "SUPPLIER_PAYMENT" && !split.supplier_id) {
          throw new Error("Supplier is required for supplier payment splits.");
        }

        if (
          split.split_type === "SUPPLIER_PAYMENT" &&
          !split.expense_account_id
        ) {
          throw new Error("Expense GL account is required for supplier payment splits.");
        }

        if (
          split.split_type === "FUNDING_TRANSACTION" &&
          isMoneyIn &&
          !split.income_account_id
        ) {
          throw new Error(
            "Select a funding / income GL account before adding a funding transaction from banking."
          );
        }

        if (
          split.split_type === "FUNDING_TRANSACTION" &&
          !isMoneyIn &&
          !split.expense_account_id
        ) {
          throw new Error(
            "Select a funding / expense GL account before adding a funding payment from banking."
          );
        }

        if (
          split.split_type === "BANK_CHARGE" &&
          !split.bank_charge_gl_account_id
        ) {
          throw new Error("Select the Bank Charges GL account for bank charge splits.");
        }

        if (
          split.split_type === "OTHER" &&
          !split.income_account_id &&
          !split.expense_account_id
        ) {
          throw new Error("Select at least one GL account for other allocation splits.");
        }
      }

      if (!isBalanced) {
        throw new Error(
          `Split total must equal the remaining unallocated bank line amount. Difference: ${formatMoney(
            line.currency_code,
            remainingAmount
          )}.`
        );
      }

      const response = await fetch(
        `/api/bank-statement-lines/${line.id}/add-to-books`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            mode: "SPLIT",
            splits: splitLines.map((split) => ({
              split_type: split.split_type,
              amount: roundMoney(toNumber(split.amount)),
              customer_id: split.customer_id || null,
              supplier_id: split.supplier_id || null,
              investor_id: split.investor_id || null,
              income_account_id: split.income_account_id || null,
              expense_account_id: split.expense_account_id || null,
              bank_charge_gl_account_id: split.bank_charge_gl_account_id || null,
              funding_transaction_type: split.funding_transaction_type,
              description: split.description || line.description,
            })),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        const details = result.details ? ` Details: ${result.details}` : "";

        throw new Error(
          `${result.error || "Unable to add bank line to books."}${details}`
        );
      }

      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to add bank line to books."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-3 w-full max-w-[420px] overflow-hidden rounded-2xl border border-[#D9E3F4] bg-[#F8FAFC] p-3 text-left"
    >
      {errorMessage ? (
        <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs leading-5 text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="mb-3 grid min-w-0 gap-2 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-700 sm:grid-cols-2">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.16em] text-slate-400">
            Bank line
          </div>
          <div className="mt-1 truncate">
            {formatMoney(line.currency_code, bankLineAmount)}
          </div>
        </div>

        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.16em] text-slate-400">
            Already allocated
          </div>
          <div className="mt-1 truncate">
            {formatMoney(line.currency_code, allocatedAmount)}
          </div>
        </div>

        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.16em] text-slate-400">
            Remaining to add
          </div>
          <div className="mt-1 truncate">
            {formatMoney(line.currency_code, remainingBankLineAmount)}
          </div>
        </div>

        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.16em] text-slate-400">
            Difference
          </div>
          <div
            className={`mt-1 truncate ${
              isBalanced ? "text-emerald-700" : "text-red-700"
            }`}
          >
            {formatMoney(line.currency_code, remainingAmount)}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {splitLines.map((split, index) => (
          <div
            key={split.id}
            className="min-w-0 overflow-hidden rounded-2xl border border-[#D9E3F4] bg-white p-3"
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-bold text-slate-950">
                Split {index + 1}
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => fillRemainingAmount(split.id)}
                  className="rounded-full border border-[#D9E3F4] px-3 py-1 text-[11px] font-semibold text-[#073D7F]"
                >
                  Fill remaining
                </button>

                <button
                  type="button"
                  onClick={() => removeSplitLine(split.id)}
                  disabled={splitLines.length === 1}
                  className="rounded-full border border-red-200 px-3 py-1 text-[11px] font-semibold text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Remove
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block min-w-0">
                <span className="text-xs font-semibold text-slate-700">
                  Split type
                </span>
                <select
                  value={split.split_type}
                  onChange={(event) =>
                    updateSplitLine(split.id, {
                      split_type: event.target.value as SplitType,
                    })
                  }
                  className="mt-1 w-full min-w-0 rounded-xl border border-[#D9E3F4] px-3 py-2 text-xs outline-none focus:border-[#073D7F]"
                >
                  {availableSplitTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block min-w-0">
                <span className="text-xs font-semibold text-slate-700">
                  Amount
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={split.amount}
                  onChange={(event) =>
                    updateSplitLine(split.id, {
                      amount: event.target.value,
                    })
                  }
                  className="mt-1 w-full min-w-0 rounded-xl border border-[#D9E3F4] px-3 py-2 text-xs outline-none focus:border-[#073D7F]"
                />
              </label>
            </div>

            {split.split_type === "CUSTOMER_RECEIPT" ? (
              <div className="mt-3 space-y-3">
                <label className="block min-w-0">
                  <span className="text-xs font-semibold text-slate-700">
                    Customer
                  </span>
                  <select
                    value={split.customer_id}
                    onChange={(event) =>
                      updateSplitLine(split.id, {
                        customer_id: event.target.value,
                      })
                    }
                    className="mt-1 w-full min-w-0 rounded-xl border border-[#D9E3F4] px-3 py-2 text-xs outline-none focus:border-[#073D7F]"
                  >
                    <option value="">Select customer</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block min-w-0">
                  <span className="text-xs font-semibold text-slate-700">
                    Income GL account required
                  </span>
                  <select
                    value={split.income_account_id}
                    onChange={(event) =>
                      updateSplitLine(split.id, {
                        income_account_id: event.target.value,
                      })
                    }
                    className="mt-1 w-full min-w-0 rounded-xl border border-[#D9E3F4] px-3 py-2 text-xs outline-none focus:border-[#073D7F]"
                  >
                    <option value="">Select income account</option>
                    {incomeAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            ) : null}

            {split.split_type === "SUPPLIER_PAYMENT" ? (
              <div className="mt-3 space-y-3">
                <label className="block min-w-0">
                  <span className="text-xs font-semibold text-slate-700">
                    Supplier
                  </span>
                  <select
                    value={split.supplier_id}
                    onChange={(event) =>
                      updateSplitLine(split.id, {
                        supplier_id: event.target.value,
                      })
                    }
                    className="mt-1 w-full min-w-0 rounded-xl border border-[#D9E3F4] px-3 py-2 text-xs outline-none focus:border-[#073D7F]"
                  >
                    <option value="">Select supplier</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block min-w-0">
                  <span className="text-xs font-semibold text-slate-700">
                    Expense GL account required
                  </span>
                  <select
                    value={split.expense_account_id}
                    onChange={(event) =>
                      updateSplitLine(split.id, {
                        expense_account_id: event.target.value,
                      })
                    }
                    className="mt-1 w-full min-w-0 rounded-xl border border-[#D9E3F4] px-3 py-2 text-xs outline-none focus:border-[#073D7F]"
                  >
                    <option value="">Select expense account</option>
                    {expenseAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            ) : null}

            {split.split_type === "FUNDING_TRANSACTION" ? (
              <div className="mt-3 space-y-3">
                <label className="block min-w-0">
                  <span className="text-xs font-semibold text-slate-700">
                    Funder / investor optional
                  </span>
                  <select
                    value={split.investor_id}
                    onChange={(event) =>
                      updateSplitLine(split.id, {
                        investor_id: event.target.value,
                      })
                    }
                    className="mt-1 w-full min-w-0 rounded-xl border border-[#D9E3F4] px-3 py-2 text-xs outline-none focus:border-[#073D7F]"
                  >
                    <option value="">No funder selected</option>
                    {investors.map((investor) => (
                      <option key={investor.id} value={investor.id}>
                        {investor.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block min-w-0">
                  <span className="text-xs font-semibold text-slate-700">
                    Funding type
                  </span>
                  <select
                    value={split.funding_transaction_type}
                    onChange={(event) =>
                      updateSplitLine(split.id, {
                        funding_transaction_type: event.target.value,
                      })
                    }
                    className="mt-1 w-full min-w-0 rounded-xl border border-[#D9E3F4] px-3 py-2 text-xs outline-none focus:border-[#073D7F]"
                  >
                    {availableFundingTransactionTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block min-w-0">
                  <span className="text-xs font-semibold text-slate-700">
                    {isMoneyIn
                      ? "Funding / income GL account required"
                      : "Funding / expense GL account required"}
                  </span>
                  <select
                    value={
                      isMoneyIn
                        ? split.income_account_id
                        : split.expense_account_id
                    }
                    onChange={(event) =>
                      updateSplitLine(split.id, {
                        income_account_id: isMoneyIn ? event.target.value : "",
                        expense_account_id: isMoneyIn ? "" : event.target.value,
                      })
                    }
                    className="mt-1 w-full min-w-0 rounded-xl border border-[#D9E3F4] px-3 py-2 text-xs outline-none focus:border-[#073D7F]"
                  >
                    <option value="">
                      {isMoneyIn ? "Select income account" : "Select expense account"}
                    </option>
                    {(isMoneyIn ? incomeAccounts : expenseAccounts).map(
                      (account) => (
                        <option key={account.id} value={account.id}>
                          {account.label}
                        </option>
                      )
                    )}
                  </select>
                </label>
              </div>
            ) : null}

            {split.split_type === "BANK_CHARGE" ? (
              <div className="mt-3">
                <label className="block min-w-0">
                  <span className="text-xs font-semibold text-slate-700">
                    Bank Charges GL account required
                  </span>
                  <select
                    value={split.bank_charge_gl_account_id}
                    onChange={(event) =>
                      updateSplitLine(split.id, {
                        bank_charge_gl_account_id: event.target.value,
                      })
                    }
                    className="mt-1 w-full min-w-0 rounded-xl border border-[#D9E3F4] px-3 py-2 text-xs outline-none focus:border-[#073D7F]"
                  >
                    <option value="">Select Bank Charges GL account</option>
                    {bankChargeAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            ) : null}

            {split.split_type === "OTHER" ? (
              <div className="mt-3 space-y-3">
                <label className="block min-w-0">
                  <span className="text-xs font-semibold text-slate-700">
                    Income GL account
                  </span>
                  <select
                    value={split.income_account_id}
                    onChange={(event) =>
                      updateSplitLine(split.id, {
                        income_account_id: event.target.value,
                      })
                    }
                    className="mt-1 w-full min-w-0 rounded-xl border border-[#D9E3F4] px-3 py-2 text-xs outline-none focus:border-[#073D7F]"
                  >
                    <option value="">Select income account</option>
                    {incomeAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block min-w-0">
                  <span className="text-xs font-semibold text-slate-700">
                    Expense GL account
                  </span>
                  <select
                    value={split.expense_account_id}
                    onChange={(event) =>
                      updateSplitLine(split.id, {
                        expense_account_id: event.target.value,
                      })
                    }
                    className="mt-1 w-full min-w-0 rounded-xl border border-[#D9E3F4] px-3 py-2 text-xs outline-none focus:border-[#073D7F]"
                  >
                    <option value="">Select expense account</option>
                    {expenseAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            ) : null}

            <label className="mt-3 block min-w-0">
              <span className="text-xs font-semibold text-slate-700">
                Description
              </span>
              <textarea
                value={split.description}
                onChange={(event) =>
                  updateSplitLine(split.id, {
                    description: event.target.value,
                  })
                }
                rows={2}
                className="mt-1 w-full min-w-0 rounded-xl border border-[#D9E3F4] px-3 py-2 text-xs leading-5 outline-none focus:border-[#073D7F]"
              />
            </label>
          </div>
        ))}

        <div className="grid gap-2">
          <button
            type="button"
            onClick={addSplitLine}
            className="w-full rounded-full border border-[#D9E3F4] bg-white px-4 py-2 text-xs font-semibold text-[#073D7F]"
          >
            Add another split
          </button>

          <button
            type="submit"
            disabled={submitting || !isBalanced || remainingBankLineAmount <= 0}
            className="w-full rounded-full bg-[#073D7F] px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Adding..." : "Add Remaining Split to Books"}
          </button>
        </div>
      </div>
    </form>
  );
}