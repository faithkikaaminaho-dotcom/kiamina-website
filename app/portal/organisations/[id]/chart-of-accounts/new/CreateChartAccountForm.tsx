"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type AccountOption = {
  id: string;
  account_code: string | null;
  account_name: string | null;
  account_type: string | null;
};

const accountTypes = [
  ["ASSET", "Asset"],
  ["LIABILITY", "Liability"],
  ["EQUITY", "Equity / Net Assets"],
  ["REVENUE", "Revenue"],
  ["COST_OF_SALES", "Cost of Sales"],
  ["OPERATING_EXPENSE", "Operating Expense"],
  ["OTHER_INCOME", "Other Income"],
  ["FINANCE_COST", "Finance Cost"],
  ["TAX", "Tax"],
];

const fsSections = [
  "Statement of Financial Position",
  "Statement of Profit or Loss - Operating",
  "Statement of Profit or Loss - Investing",
  "Statement of Profit or Loss - Financing",
  "Statement of Profit or Loss - Income Taxes",
  "Statement of Cash Flows",
  "Statement of Changes in Equity",
  "Notes to the Financial Statements",
];

const cashFlowCategories = [
  "Operating Activities",
  "Investing Activities",
  "Financing Activities",
  "Non-cash",
  "Not Applicable",
];

export default function CreateChartAccountForm({
  organisationId,
  parentAccounts,
}: {
  organisationId: string;
  parentAccounts: AccountOption[];
}) {
  const router = useRouter();

  const [accountCode, setAccountCode] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountType, setAccountType] = useState("ASSET");
  const [accountSubtype, setAccountSubtype] = useState("");
  const [parentAccountId, setParentAccountId] = useState("");
  const [normalBalance, setNormalBalance] = useState("DEBIT");
  const [fsSection, setFsSection] = useState("");
  const [fsLineItem, setFsLineItem] = useState("");
  const [managementReportCategory, setManagementReportCategory] = useState("");
  const [cashFlowCategory, setCashFlowCategory] = useState("");
  const [description, setDescription] = useState("");
  const [taxRelevant, setTaxRelevant] = useState(false);
  const [isControlAccount, setIsControlAccount] = useState(false);
  const [isBankAccount, setIsBankAccount] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/chart-of-accounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organisation_id: organisationId,
          account_code: accountCode,
          account_name: accountName,
          account_type: accountType,
          account_subtype: accountSubtype || null,
          parent_account_id: parentAccountId || null,
          normal_balance: normalBalance,
          fs_section: fsSection || null,
          fs_line_item: fsLineItem || null,
          management_report_category: managementReportCategory || null,
          cash_flow_category: cashFlowCategory || null,
          description: description || null,
          tax_relevant: taxRelevant,
          is_control_account: isControlAccount,
          is_bank_account: isBankAccount,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to create chart account.");
      }

      router.push(`/portal/organisations/${organisationId}`);
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to create chart account."
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
            Account code
          </span>
          <input
            value={accountCode}
            onChange={(event) => setAccountCode(event.target.value)}
            placeholder="1000"
            required
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Account name
          </span>
          <input
            value={accountName}
            onChange={(event) => setAccountName(event.target.value)}
            placeholder="Cash and Bank"
            required
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
            {accountTypes.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Account subtype
          </span>
          <input
            value={accountSubtype}
            onChange={(event) => setAccountSubtype(event.target.value)}
            placeholder="Current Asset / Trade Payable / Admin Expense"
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Parent account
          </span>
          <select
            value={parentAccountId}
            onChange={(event) => setParentAccountId(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          >
            <option value="">No parent account</option>
            {parentAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.account_code} - {account.account_name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Normal balance
          </span>
          <select
            value={normalBalance}
            onChange={(event) => setNormalBalance(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          >
            <option value="DEBIT">Debit</option>
            <option value="CREDIT">Credit</option>
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            IFRS 18-ready FS section
          </span>
          <select
            value={fsSection}
            onChange={(event) => setFsSection(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          >
            <option value="">Select FS section</option>
            {fsSections.map((section) => (
              <option key={section} value={section}>
                {section}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            FS line item
          </span>
          <input
            value={fsLineItem}
            onChange={(event) => setFsLineItem(event.target.value)}
            placeholder="Cash and cash equivalents"
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Management report category
          </span>
          <input
            value={managementReportCategory}
            onChange={(event) => setManagementReportCategory(event.target.value)}
            placeholder="Cash Flow / Revenue / Payroll / Operating Expenses"
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Cash flow category
          </span>
          <select
            value={cashFlowCategory}
            onChange={(event) => setCashFlowCategory(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          >
            <option value="">Select cash flow category</option>
            {cashFlowCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <label className="block md:col-span-2">
          <span className="text-sm font-semibold text-slate-700">
            Description
          </span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={4}
            placeholder="Describe when this account should be used."
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm leading-7 outline-none focus:border-[#073D7F]"
          />
        </label>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <label className="flex items-start gap-3 rounded-2xl border border-[#D9E3F4] bg-[#F8FAFC] p-4 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={taxRelevant}
            onChange={(event) => setTaxRelevant(event.target.checked)}
            className="mt-1"
          />
          <span>
            <span className="font-semibold text-slate-950">Tax relevant</span>
            <span className="mt-1 block text-slate-500">
              Use for VAT, WHT, income tax, or other tax reporting.
            </span>
          </span>
        </label>

        <label className="flex items-start gap-3 rounded-2xl border border-[#D9E3F4] bg-[#F8FAFC] p-4 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={isControlAccount}
            onChange={(event) => setIsControlAccount(event.target.checked)}
            className="mt-1"
          />
          <span>
            <span className="font-semibold text-slate-950">
              Control account
            </span>
            <span className="mt-1 block text-slate-500">
              Use for receivables, payables, payroll, tax, or other controls.
            </span>
          </span>
        </label>

        <label className="flex items-start gap-3 rounded-2xl border border-[#D9E3F4] bg-[#F8FAFC] p-4 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={isBankAccount}
            onChange={(event) => setIsBankAccount(event.target.checked)}
            className="mt-1"
          />
          <span>
            <span className="font-semibold text-slate-950">Bank account</span>
            <span className="mt-1 block text-slate-500">
              Use for cash, bank, POS wallet, or payment collection accounts.
            </span>
          </span>
        </label>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-[#073D7F] px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Creating account..." : "Create Account"}
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