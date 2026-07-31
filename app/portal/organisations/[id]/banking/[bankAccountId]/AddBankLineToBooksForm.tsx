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
};

function toNumber(value: unknown) {
  const numericValue = Number(value || 0);

  return Number.isFinite(numericValue) ? numericValue : 0;
}

function formatMoney(currencyCode?: string | null, amount?: number | null) {
  return `${currencyCode || "—"} ${Number(amount || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
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

  const [transactionType, setTransactionType] = useState(
    isMoneyIn ? "CUSTOMER_RECEIPT" : "SUPPLIER_PAYMENT"
  );
  const [customerId, setCustomerId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [investorId, setInvestorId] = useState("");
  const [incomeAccountId, setIncomeAccountId] = useState("");
  const [expenseAccountId, setExpenseAccountId] = useState("");
  const [fundingTransactionType, setFundingTransactionType] =
    useState("GRANT_RECEIVED");
  const [bankCharges, setBankCharges] = useState("0");
  const [description, setDescription] = useState(line.description || "");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const availableTransactionTypes = useMemo(() => {
    if (isMoneyIn) {
      return [
        {
          value: "CUSTOMER_RECEIPT",
          label: "Customer Receipt",
        },
        {
          value: "FUNDING_TRANSACTION",
          label: "Funding Transaction",
        },
      ];
    }

    return [
      {
        value: "SUPPLIER_PAYMENT",
        label: "Supplier Payment",
      },
    ];
  }, [isMoneyIn]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch(
        `/api/bank-statement-lines/${line.id}/add-to-books`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            transaction_type: transactionType,
            customer_id: customerId || null,
            supplier_id: supplierId || null,
            investor_id: investorId || null,
            income_account_id: incomeAccountId || null,
            expense_account_id: expenseAccountId || null,
            funding_transaction_type: fundingTransactionType,
            bank_charges: bankCharges || "0",
            description: description || line.description,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to add bank line to books.");
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
      className="mt-3 rounded-2xl border border-[#D9E3F4] bg-[#F8FAFC] p-4 text-left"
    >
      {errorMessage ? (
        <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs leading-5 text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="mb-3 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-700">
        Add {formatMoney(line.currency_code, bankLineAmount)} to books
      </div>

      <div className="space-y-3">
        <label className="block">
          <span className="text-xs font-semibold text-slate-700">
            Transaction type
          </span>
          <select
            value={transactionType}
            onChange={(event) => setTransactionType(event.target.value)}
            className="mt-1 w-full rounded-xl border border-[#D9E3F4] px-3 py-2 text-xs outline-none focus:border-[#073D7F]"
          >
            {availableTransactionTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </label>

        {transactionType === "CUSTOMER_RECEIPT" ? (
          <>
            <label className="block">
              <span className="text-xs font-semibold text-slate-700">
                Customer
              </span>
              <select
                value={customerId}
                onChange={(event) => setCustomerId(event.target.value)}
                required
                className="mt-1 w-full rounded-xl border border-[#D9E3F4] px-3 py-2 text-xs outline-none focus:border-[#073D7F]"
              >
                <option value="">Select customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-slate-700">
                Income account optional
              </span>
              <select
                value={incomeAccountId}
                onChange={(event) => setIncomeAccountId(event.target.value)}
                className="mt-1 w-full rounded-xl border border-[#D9E3F4] px-3 py-2 text-xs outline-none focus:border-[#073D7F]"
              >
                <option value="">No account selected</option>
                {incomeAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.label}
                  </option>
                ))}
              </select>
            </label>
          </>
        ) : null}

        {transactionType === "SUPPLIER_PAYMENT" ? (
          <>
            <label className="block">
              <span className="text-xs font-semibold text-slate-700">
                Supplier
              </span>
              <select
                value={supplierId}
                onChange={(event) => setSupplierId(event.target.value)}
                required
                className="mt-1 w-full rounded-xl border border-[#D9E3F4] px-3 py-2 text-xs outline-none focus:border-[#073D7F]"
              >
                <option value="">Select supplier</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-slate-700">
                Expense account optional
              </span>
              <select
                value={expenseAccountId}
                onChange={(event) => setExpenseAccountId(event.target.value)}
                className="mt-1 w-full rounded-xl border border-[#D9E3F4] px-3 py-2 text-xs outline-none focus:border-[#073D7F]"
              >
                <option value="">No account selected</option>
                {expenseAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.label}
                  </option>
                ))}
              </select>
            </label>
          </>
        ) : null}

        {transactionType === "FUNDING_TRANSACTION" ? (
          <>
            <label className="block">
              <span className="text-xs font-semibold text-slate-700">
                Funder / investor optional
              </span>
              <select
                value={investorId}
                onChange={(event) => setInvestorId(event.target.value)}
                className="mt-1 w-full rounded-xl border border-[#D9E3F4] px-3 py-2 text-xs outline-none focus:border-[#073D7F]"
              >
                <option value="">No funder selected</option>
                {investors.map((investor) => (
                  <option key={investor.id} value={investor.id}>
                    {investor.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-slate-700">
                Funding type
              </span>
              <select
                value={fundingTransactionType}
                onChange={(event) =>
                  setFundingTransactionType(event.target.value)
                }
                className="mt-1 w-full rounded-xl border border-[#D9E3F4] px-3 py-2 text-xs outline-none focus:border-[#073D7F]"
              >
                <option value="GRANT_RECEIVED">Grant Received</option>
                <option value="LOAN_RECEIVED">Loan Received</option>
                <option value="CAPITAL_CONTRIBUTION">
                  Capital Contribution
                </option>
                <option value="DONATION_RECEIVED">Donation Received</option>
                <option value="OTHER_FUNDING_RECEIVED">
                  Other Funding Received
                </option>
              </select>
            </label>
          </>
        ) : null}

        <label className="block">
          <span className="text-xs font-semibold text-slate-700">
            Bank charges
          </span>
          <input
            type="number"
            step="0.01"
            value={bankCharges}
            onChange={(event) => setBankCharges(event.target.value)}
            className="mt-1 w-full rounded-xl border border-[#D9E3F4] px-3 py-2 text-xs outline-none focus:border-[#073D7F]"
          />
        </label>

        <label className="block">
          <span className="text-xs font-semibold text-slate-700">
            Description
          </span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            className="mt-1 w-full rounded-xl border border-[#D9E3F4] px-3 py-2 text-xs leading-5 outline-none focus:border-[#073D7F]"
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-[#073D7F] px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Adding..." : "Add to Books"}
        </button>
      </div>
    </form>
  );
}