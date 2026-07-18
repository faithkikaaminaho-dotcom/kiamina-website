"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type AccountOption = {
  id: string;
  account_code: string | null;
  account_name: string | null;
  account_type: string | null;
};

const itemTypes = [
  ["SERVICE", "Service"],
  ["PRODUCT", "Product"],
  ["BUNDLE", "Bundle"],
  ["OTHER", "Other"],
];

export default function CreateProductServiceForm({
  organisationId,
  defaultCurrency,
  incomeAccounts,
  expenseAccounts,
  taxAccounts,
}: {
  organisationId: string;
  defaultCurrency?: string | null;
  incomeAccounts: AccountOption[];
  expenseAccounts: AccountOption[];
  taxAccounts: AccountOption[];
}) {
  const router = useRouter();

  const [itemName, setItemName] = useState("");
  const [itemType, setItemType] = useState("SERVICE");
  const [sku, setSku] = useState("");
  const [description, setDescription] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [currencyCode, setCurrencyCode] = useState(defaultCurrency || "");
  const [incomeAccountId, setIncomeAccountId] = useState("");
  const [expenseAccountId, setExpenseAccountId] = useState("");
  const [taxAccountId, setTaxAccountId] = useState("");
  const [taxRelevant, setTaxRelevant] = useState(false);
  const [taxable, setTaxable] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/products-services", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organisation_id: organisationId,
          item_name: itemName,
          item_type: itemType,
          sku: sku || null,
          description: description || null,
          unit_price: unitPrice || null,
          currency_code: currencyCode || null,
          income_account_id: incomeAccountId || null,
          expense_account_id: expenseAccountId || null,
          tax_account_id: taxAccountId || null,
          tax_relevant: taxRelevant,
          taxable,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Unable to create product or service."
        );
      }

      router.push(`/portal/organisations/${organisationId}`);
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to create product or service."
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
            Product / Service name
          </span>
          <input
            value={itemName}
            onChange={(event) => setItemName(event.target.value)}
            placeholder="Monthly bookkeeping service"
            required
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Item type
          </span>
          <select
            value={itemType}
            onChange={(event) => setItemType(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          >
            {itemTypes.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            SKU / Code
          </span>
          <input
            value={sku}
            onChange={(event) => setSku(event.target.value)}
            placeholder="BK-001"
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Unit price
          </span>
          <input
            type="number"
            step="0.01"
            value={unitPrice}
            onChange={(event) => setUnitPrice(event.target.value)}
            placeholder="50000"
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Currency
          </span>
          <input
            value={currencyCode}
            onChange={(event) =>
              setCurrencyCode(event.target.value.toUpperCase())
            }
            placeholder="NGN"
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm uppercase outline-none focus:border-[#073D7F]"
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
            placeholder="Describe the product or service and how it should be used on invoices or bills."
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm leading-7 outline-none focus:border-[#073D7F]"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Income account
          </span>
          <select
            value={incomeAccountId}
            onChange={(event) => setIncomeAccountId(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          >
            <option value="">Select income account</option>
            {incomeAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.account_code} - {account.account_name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Expense account
          </span>
          <select
            value={expenseAccountId}
            onChange={(event) => setExpenseAccountId(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          >
            <option value="">Select expense account</option>
            {expenseAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.account_code} - {account.account_name}
              </option>
            ))}
          </select>
        </label>

        <label className="block md:col-span-2">
          <span className="text-sm font-semibold text-slate-700">
            Tax account
          </span>
          <select
            value={taxAccountId}
            onChange={(event) => setTaxAccountId(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          >
            <option value="">Select tax account</option>
            {taxAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.account_code} - {account.account_name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
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
              Use this item for VAT, WHT, sales tax, or other tax reporting.
            </span>
          </span>
        </label>

        <label className="flex items-start gap-3 rounded-2xl border border-[#D9E3F4] bg-[#F8FAFC] p-4 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={taxable}
            onChange={(event) => setTaxable(event.target.checked)}
            className="mt-1"
          />
          <span>
            <span className="font-semibold text-slate-950">Taxable</span>
            <span className="mt-1 block text-slate-500">
              Mark if tax should normally apply to this product or service.
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
          {submitting ? "Creating item..." : "Create Product / Service"}
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