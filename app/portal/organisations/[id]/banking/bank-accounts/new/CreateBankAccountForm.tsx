"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CurrencySelect from "@/app/portal/components/CurrencySelect";

type AccountOption = {
  id: string;
  account_code: string | null;
  account_name: string | null;
  account_type: string | null;
  account_subtype?: string | null;
};

export default function CreateBankAccountForm({
  organisationId,
  defaultCurrency,
  accounts,
}: {
  organisationId: string;
  defaultCurrency?: string | null;
  accounts: AccountOption[];
}) {
  const router = useRouter();

  const [accountName, setAccountName] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountType, setAccountType] = useState("CURRENT");
  const [currencyCode, setCurrencyCode] = useState(defaultCurrency || "");
  const [glAccountId, setGlAccountId] = useState("");
  const [openingBalance, setOpeningBalance] = useState("0");
  const [currentBalance, setCurrentBalance] = useState("0");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/bank-accounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organisation_id: organisationId,
          account_name: accountName,
          bank_name: bankName || null,
          account_number: accountNumber || null,
          account_type: accountType,
          currency_code: currencyCode || null,
          gl_account_id: glAccountId || null,
          opening_balance: openingBalance || "0",
          current_balance: currentBalance || openingBalance || "0",
          notes: notes || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to create bank account.");
      }

      router.push(`/portal/organisations/${organisationId}/banking`);
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to create bank account."
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
            Account name
          </span>
          <input
            value={accountName}
            onChange={(event) => setAccountName(event.target.value)}
            placeholder="Example: GTBank Main Operating Account"
            required
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Bank name
          </span>
          <input
            value={bankName}
            onChange={(event) => setBankName(event.target.value)}
            placeholder="Example: GTBank, Zenith Bank, Access Bank"
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Account number
          </span>
          <input
            value={accountNumber}
            onChange={(event) => setAccountNumber(event.target.value)}
            placeholder="Bank account number"
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Account type
          </span>
          <select
            value={accountType}
            onChange={(event) => setAccountType(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          >
            <option value="CURRENT">Current</option>
            <option value="SAVINGS">Savings</option>
            <option value="DOMICILIARY">Domiciliary</option>
            <option value="CASH">Cash</option>
            <option value="MOBILE_MONEY">Mobile Money</option>
            <option value="PETTY_CASH">Petty Cash</option>
            <option value="OTHER">Other</option>
          </select>
        </label>

        <CurrencySelect
          label="Currency"
          value={currencyCode}
          onChange={setCurrencyCode}
          required
        />

        <label className="block md:col-span-2">
          <span className="text-sm font-semibold text-slate-700">
            Linked chart of account
          </span>
          <select
            value={glAccountId}
            onChange={(event) => setGlAccountId(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          >
            <option value="">No GL account selected yet</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.account_code} - {account.account_name} (
                {account.account_type})
              </option>
            ))}
          </select>

          <p className="mt-2 text-xs leading-6 text-slate-500">
            Select the cash or bank account in the Chart of Accounts that this
            real bank account should post to.
          </p>
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
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Current balance
          </span>
          <input
            type="number"
            step="0.01"
            value={currentBalance}
            onChange={(event) => setCurrentBalance(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          />
        </label>

        <label className="block md:col-span-2">
          <span className="text-sm font-semibold text-slate-700">Notes</span>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={4}
            placeholder="Optional notes about this bank account."
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm leading-7 outline-none focus:border-[#073D7F]"
          />
        </label>
      </div>

      <div className="mt-8 rounded-[1.5rem] border border-[#D9E3F4] bg-[#F8FAFC] p-5">
        <p className="text-sm leading-7 text-slate-600">
          <span className="font-semibold text-slate-950">Control note:</span>{" "}
          This is the bank account master record. Later, uploaded bank statements
          will be extracted into statement lines under this account for matching,
          reconciliation, and transaction creation.
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-[#073D7F] px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Creating bank account..." : "Create Bank Account"}
        </button>

        <a
          href={`/portal/organisations/${organisationId}/banking`}
          className="rounded-full border border-[#D9E3F4] bg-white px-6 py-3 text-center text-sm font-semibold text-[#073D7F]"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}