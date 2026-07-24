"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type AccountType = "ASSET" | "LIABILITY" | "INCOME" | "EXPENSE" | "EQUITY";

const accountTypes = [
  { value: "ASSET", label: "Asset" },
  { value: "LIABILITY", label: "Liability" },
  { value: "INCOME", label: "Income" },
  { value: "EXPENSE", label: "Expense" },
  { value: "EQUITY", label: "Equity" },
];

const subtypesByType: Record<AccountType, { value: string; label: string }[]> = {
  ASSET: [
    { value: "CURRENT_ASSET", label: "Current Asset" },
    { value: "NON_CURRENT_ASSET", label: "Non-Current Asset" },
  ],
  LIABILITY: [
    { value: "CURRENT_LIABILITY", label: "Current Liability" },
    { value: "NON_CURRENT_LIABILITY", label: "Non-Current Liability" },
  ],
  INCOME: [
    { value: "OPERATING_INCOME", label: "Operating Income" },
    { value: "INVESTING_INCOME", label: "Investing Income" },
    { value: "FINANCING_INCOME", label: "Financing Income" },
     { value: "DISCONTINUED_OPERATIONS", label: "Discontinued Operations" },
    {
      value: "OTHER_COMPREHENSIVE_INCOME",
      label: "Other Comprehensive Income",
    },
  ],
  EXPENSE: [
    { value: "COST_OF_SALES", label: "Cost of Sales" },
    { value: "OTHER_OPERATING_EXPENSE", label: "Other Operating Expense" },
    { value: "INVESTING_EXPENSE", label: "Investing Expense" },
    { value: "FINANCING_EXPENSE", label: "Financing Expense" },
    { value: "INCOME_TAX", label: "Income Tax" },
    { value: "DISCONTINUED_OPERATIONS", label: "Discontinued Operations" },
  ],
  EQUITY: [{ value: "EQUITY", label: "Equity" }],
};

const fsLineItemsBySubtype: Record<string, string[]> = {
  CURRENT_ASSET: [
    "Cash and Cash Equivalents",
    "Bank Balances",
    "Trade Receivables",
    "Other Receivables",
    "Contract Assets",
    "Prepayments",
    "Short-term Investments",
    "Other Current Assets",
  ],
  NON_CURRENT_ASSET: [
    "Property, Plant and Equipment",
    "Right-of-use Assets",
    "Intangible Assets",
    "Investment Property",
    "Long-term Investments",
    "Deferred Tax Assets",
    "Other Non-current Assets",
  ],
  CURRENT_LIABILITY: [
    "Trade Payables",
    "Other Payables",
    "Contract Liabilities",
    "Accrued Expenses",
    "Tax Payables",
    "Short-term Borrowings",
    "Current Lease Liabilities",
    "Other Current Liabilities",
  ],
  NON_CURRENT_LIABILITY: [
    "Long-term Borrowings",
    "Non-current Lease Liabilities",
    "Deferred Tax Liabilities",
    "Long-term Provisions",
    "Other Non-current Liabilities",
  ],
  OPERATING_INCOME: [
    "Revenue from Contracts with Customers",
    "Service Revenue",
    "Management Fee Income",
    "Consulting Income",
    "Other Operating Income",
  ],
  COST_OF_SALES: [
    "Direct Service Costs",
    "Project Direct Costs",
    "Subcontractor Costs",
    "Cost of Sales",
  ],
  OTHER_OPERATING_EXPENSE: [
    "Payroll Costs",
    "Professional Fees",
    "Administrative Expenses",
    "Rent and Utilities",
    "Technology Costs",
    "Marketing Expenses",
    "Compliance Costs",
    "Other Operating Expenses",
  ],
  INVESTING_INCOME: [
    "Investment Income",
    "Gain on Disposal of Assets",
    "Fair Value Gain on Investments",
  ],
  INVESTING_EXPENSE: [
    "Investment Expense",
    "Loss on Disposal of Assets",
    "Fair Value Loss on Investments",
  ],
  FINANCING_INCOME: ["Finance Income", "Interest Income"],
  FINANCING_EXPENSE: ["Finance Costs", "Interest Expense", "Bank Charges"],
  INCOME_TAX: ["Income Tax Expense", "Deferred Tax Expense"],
  OTHER_COMPREHENSIVE_INCOME: [
    "Other Comprehensive Income",
    "Fair Value Reserve Movement",
    "Foreign Currency Translation Reserve",
  ],
  DISCONTINUED_OPERATIONS: [
  "Profit or Loss from Discontinued Operations",
  "Revenue from Discontinued Operations",
  "Expenses from Discontinued Operations",
  "Gain on Disposal of Discontinued Operations",
  "Loss on Disposal of Discontinued Operations",
  "Tax on Discontinued Operations",
],
  EQUITY: [
    "Share Capital",
    "Retained Earnings",
    "Capital Contribution",
    "Share Premium",
    "Revaluation Reserve",
    "Other Reserves",
  ],
};

const managementCategorySuggestions = [
  "Revenue",
  "Direct Cost",
  "Payroll Cost",
  "Administrative Expense",
  "Compliance Cost",
  "Project Cost",
  "Technology Cost",
  "Finance Cost",
  "Tax",
  "Funding Activity",
  "Capital",
  "Receivables",
  "Payables",
  "Cash and Bank",
  "Other",
];

function normalBalanceForType(accountType: string) {
  if (accountType === "ASSET" || accountType === "EXPENSE") {
    return "DEBIT";
  }

  if (
    accountType === "LIABILITY" ||
    accountType === "INCOME" ||
    accountType === "EQUITY"
  ) {
    return "CREDIT";
  }

  return "";
}

function fsSectionForSubtype(accountSubtype: string) {
  if (
    [
      "CURRENT_ASSET",
      "NON_CURRENT_ASSET",
      "CURRENT_LIABILITY",
      "NON_CURRENT_LIABILITY",
      "EQUITY",
    ].includes(accountSubtype)
  ) {
    return "Statement of Financial Position";
  }

  if (
    ["OPERATING_INCOME", "COST_OF_SALES", "OTHER_OPERATING_EXPENSE"].includes(
      accountSubtype
    )
  ) {
    return "Statement of Profit or Loss and Other Comprehensive Income - Operating Activities";
  }

  if (["INVESTING_INCOME", "INVESTING_EXPENSE"].includes(accountSubtype)) {
    return "Statement of Profit or Loss and Other Comprehensive Income - Investing Activities";
  }

  if (["FINANCING_INCOME", "FINANCING_EXPENSE"].includes(accountSubtype)) {
    return "Statement of Profit or Loss and Other Comprehensive Income - Financing Activities";
  }

  if (accountSubtype === "INCOME_TAX") {
    return "Statement of Profit or Loss and Other Comprehensive Income - Income Tax";
  }

  if (accountSubtype === "OTHER_COMPREHENSIVE_INCOME") {
    return "Statement of Profit or Loss and Other Comprehensive Income - Other Comprehensive Income";
  }

  if (accountSubtype === "DISCONTINUED_OPERATIONS") {
    return "Statement of Profit or Loss and Other Comprehensive Income - Discontinued Operations";
  }

  return "";
}

function cashFlowCategoryForSubtype(accountSubtype: string) {
  if (
    [
      "CURRENT_ASSET",
      "CURRENT_LIABILITY",
      "OPERATING_INCOME",
      "COST_OF_SALES",
      "OTHER_OPERATING_EXPENSE",
      "INCOME_TAX",
    ].includes(accountSubtype)
  ) {
    return "Operating Activities";
  }

  if (
    ["NON_CURRENT_ASSET", "INVESTING_INCOME", "INVESTING_EXPENSE"].includes(
      accountSubtype
    )
  ) {
    return "Investing Activities";
  }

  if (
    [
      "NON_CURRENT_LIABILITY",
      "EQUITY",
      "FINANCING_INCOME",
      "FINANCING_EXPENSE",
    ].includes(accountSubtype)
  ) {
    return "Financing Activities";
  }

  if (
    accountSubtype === "OTHER_COMPREHENSIVE_INCOME" ||
    accountSubtype === "DISCONTINUED_OPERATIONS"
  ) {
    return "Non-cash / Other";
  }

  return "";
}

function RequiredLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-sm font-semibold text-slate-700">
      {children} <span className="text-red-600">*</span>
    </span>
  );
}

export default function CreateChartAccountForm({
  organisationId,
}: {
  organisationId: string;
}) {
  const router = useRouter();

  const [accountCode, setAccountCode] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountType, setAccountType] = useState("");
  const [accountSubtype, setAccountSubtype] = useState("");
  const [fsLineItem, setFsLineItem] = useState("");
  const [managementReportCategory, setManagementReportCategory] = useState("");
  const [description, setDescription] = useState("");
  const [taxRelevant, setTaxRelevant] = useState(false);
  const [isControlAccount, setIsControlAccount] = useState(false);
  const [isBankAccount, setIsBankAccount] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const availableSubtypes = useMemo(() => {
    if (!accountType) return [];

    return subtypesByType[accountType as AccountType] || [];
  }, [accountType]);

  const normalBalance = useMemo(
    () => normalBalanceForType(accountType),
    [accountType]
  );

  const fsSection = useMemo(
    () => fsSectionForSubtype(accountSubtype),
    [accountSubtype]
  );

  const cashFlowCategory = useMemo(
    () => cashFlowCategoryForSubtype(accountSubtype),
    [accountSubtype]
  );

  const fsLineItems = useMemo(() => {
    if (!accountSubtype) return [];

    return fsLineItemsBySubtype[accountSubtype] || [];
  }, [accountSubtype]);

  function handleAccountTypeChange(value: string) {
    setAccountType(value);
    setAccountSubtype("");
    setFsLineItem("");
  }

  function handleSubtypeChange(value: string) {
    setAccountSubtype(value);
    setFsLineItem("");
  }

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
          account_subtype: accountSubtype,
          normal_balance: normalBalance,
          fs_section: fsSection,
          fs_line_item: fsLineItem,
          management_report_category: managementReportCategory,
          cash_flow_category: cashFlowCategory,
          description: description || null,
          tax_relevant: taxRelevant,
          is_control_account: isControlAccount,
          is_bank_account: isBankAccount,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to create account.");
      }

      router.push(`/portal/organisations/${organisationId}`);
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to create account."
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
          <RequiredLabel>Account code</RequiredLabel>
          <input
            value={accountCode}
            onChange={(event) => setAccountCode(event.target.value)}
            placeholder="1000"
            required
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          />
        </label>

        <label className="block">
          <RequiredLabel>Account name</RequiredLabel>
          <input
            value={accountName}
            onChange={(event) => setAccountName(event.target.value)}
            placeholder="Cash and Bank"
            required
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          />
        </label>

        <label className="block">
          <RequiredLabel>Account type</RequiredLabel>
          <select
            value={accountType}
            onChange={(event) => handleAccountTypeChange(event.target.value)}
            required
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          >
            <option value="">Select account type</option>
            {accountTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <RequiredLabel>Account subtype</RequiredLabel>
          <select
            value={accountSubtype}
            onChange={(event) => handleSubtypeChange(event.target.value)}
            required
            disabled={!accountType}
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F] disabled:bg-slate-100"
          >
            <option value="">
              {accountType
                ? "Select account subtype"
                : "Select account type first"}
            </option>
            {availableSubtypes.map((subtype) => (
              <option key={subtype.value} value={subtype.value}>
                {subtype.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <RequiredLabel>Normal balance</RequiredLabel>
          <input
            value={normalBalance}
            readOnly
            required
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] bg-[#F8FAFC] px-4 py-3 text-sm outline-none"
          />
          <p className="mt-2 text-xs text-slate-500">
            Automatically selected from account type.
          </p>
        </label>

        <label className="block">
          <RequiredLabel>Financial statement section</RequiredLabel>
          <input
            value={fsSection}
            readOnly
            required
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] bg-[#F8FAFC] px-4 py-3 text-sm outline-none"
          />
          <p className="mt-2 text-xs text-slate-500">
            Automatically selected from account subtype.
          </p>
        </label>

        <label className="block">
          <RequiredLabel>Financial statement line item</RequiredLabel>
          <select
            value={fsLineItem}
            onChange={(event) => setFsLineItem(event.target.value)}
            required
            disabled={!accountSubtype}
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F] disabled:bg-slate-100"
          >
            <option value="">
              {accountSubtype
                ? "Select FS line item"
                : "Select account subtype first"}
            </option>
            {fsLineItems.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <RequiredLabel>Cash flow category</RequiredLabel>
          <input
            value={cashFlowCategory}
            readOnly
            required
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] bg-[#F8FAFC] px-4 py-3 text-sm outline-none"
          />
          <p className="mt-2 text-xs text-slate-500">
            Automatically selected from account subtype.
          </p>
        </label>

        <label className="block md:col-span-2">
          <RequiredLabel>Management report category</RequiredLabel>
          <input
            value={managementReportCategory}
            onChange={(event) => setManagementReportCategory(event.target.value)}
            list="management-report-category-options"
            placeholder="Example: Revenue, Direct Cost, Payroll Cost, Project Cost"
            required
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          />

          <datalist id="management-report-category-options">
            {managementCategorySuggestions.map((category) => (
              <option key={category} value={category} />
            ))}
          </datalist>

          <p className="mt-2 text-xs leading-5 text-slate-500">
            You can select a suggested category or type a new one. This keeps
            management reporting flexible for each organisation.
          </p>
        </label>

        <label className="block md:col-span-2">
          <span className="text-sm font-semibold text-slate-700">
            Description
          </span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={4}
            placeholder="Optional description of how this account should be used."
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm leading-7 outline-none focus:border-[#073D7F]"
          />
        </label>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <label className="flex items-start gap-3 rounded-2xl border border-[#D9E3F4] bg-[#F8FAFC] p-5">
          <input
            type="checkbox"
            checked={taxRelevant}
            onChange={(event) => setTaxRelevant(event.target.checked)}
            className="mt-1"
          />
          <span>
            <span className="block text-sm font-semibold text-slate-950">
              Tax relevant
            </span>
            <span className="mt-1 block text-xs leading-5 text-slate-500">
              Mark this if the account is relevant for tax analysis.
            </span>
          </span>
        </label>

        <label className="flex items-start gap-3 rounded-2xl border border-[#D9E3F4] bg-[#F8FAFC] p-5">
          <input
            type="checkbox"
            checked={isControlAccount}
            onChange={(event) => setIsControlAccount(event.target.checked)}
            className="mt-1"
          />
          <span>
            <span className="block text-sm font-semibold text-slate-950">
              Control account
            </span>
            <span className="mt-1 block text-xs leading-5 text-slate-500">
              Useful for receivables, payables, payroll, tax, or bank control.
            </span>
          </span>
        </label>

        <label className="flex items-start gap-3 rounded-2xl border border-[#D9E3F4] bg-[#F8FAFC] p-5">
          <input
            type="checkbox"
            checked={isBankAccount}
            onChange={(event) => setIsBankAccount(event.target.checked)}
            className="mt-1"
          />
          <span>
            <span className="block text-sm font-semibold text-slate-950">
              Bank account
            </span>
            <span className="mt-1 block text-xs leading-5 text-slate-500">
              Mark this for bank, cash, and wallet accounts.
            </span>
          </span>
        </label>
      </div>

      <div className="mt-8 rounded-2xl border border-[#D9E3F4] bg-[#F8FAFC] p-5 text-sm leading-7 text-slate-600">
        Required fields are marked with <span className="text-red-600">*</span>.
        The system automatically determines normal balance, financial statement
        section, and cash flow category from the selected account type and
        subtype.
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