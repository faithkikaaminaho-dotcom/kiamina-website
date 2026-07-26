"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AutoNumberInput from "@/app/portal/components/AutoNumberInput";
import CurrencySelect from "@/app/portal/components/CurrencySelect";

type SupplierOption = {
  id: string;
  supplier_name: string | null;
};

type ProductServiceOption = {
  id: string;
  item_name: string | null;
  unit_price: number | null;
  currency_code: string | null;
  expense_account_id: string | null;
  tax_account_id: string | null;
};

type AccountOption = {
  id: string;
  account_code: string | null;
  account_name: string | null;
  account_type: string | null;
  account_subtype?: string | null;
  fs_line_item?: string | null;
  management_report_category?: string | null;
  is_control_account?: boolean | null;
  tax_relevant?: boolean | null;
};

type PeriodOption = {
  id: string;
  name: string | null;
  start_date: string | null;
  end_date: string | null;
};

type EngagementOption = {
  id: string;
  name: string | null;
  engagement_type: string | null;
};

type BillLine = {
  product_service_id: string;
  description: string;
  quantity: string;
  unit_price: string;
  discount_amount: string;
  tax_rate: string;
  expense_account_id: string;
  tax_account_id: string;
};

function toNumber(value: string, fallback = 0) {
  if (!value) return fallback;

  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function createEmptyLine(): BillLine {
  return {
    product_service_id: "",
    description: "",
    quantity: "1",
    unit_price: "",
    discount_amount: "",
    tax_rate: "",
    expense_account_id: "",
    tax_account_id: "",
  };
}

export default function CreatePurchaseBillForm({
  organisationId,
  defaultCurrency,
  suppliers,
  productsServices,
  expenseAccounts,
  payableAccounts,
  taxAccounts,
  accountingPeriods,
  engagements,
}: {
  organisationId: string;
  defaultCurrency?: string | null;
  suppliers: SupplierOption[];
  productsServices: ProductServiceOption[];
  expenseAccounts: AccountOption[];
  payableAccounts: AccountOption[];
  taxAccounts: AccountOption[];
  accountingPeriods: PeriodOption[];
  engagements: EngagementOption[];
}) {
  const router = useRouter();

  const [supplierId, setSupplierId] = useState("");
  const [accountingPeriodId, setAccountingPeriodId] = useState("");
  const [engagementId, setEngagementId] = useState("");
  const [billNumber, setBillNumber] = useState("");
  const [supplierInvoiceNumber, setSupplierInvoiceNumber] = useState("");
  const [billDate, setBillDate] = useState(todayDate());
  const [dueDate, setDueDate] = useState(addDays(30));
  const [currencyCode, setCurrencyCode] = useState(defaultCurrency || "");
  const [exchangeRate, setExchangeRate] = useState("1");
  const [expenseAccountId, setExpenseAccountId] = useState("");
  const [payableAccountId, setPayableAccountId] = useState("");
  const [taxAccountId, setTaxAccountId] = useState("");
  const [notes, setNotes] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [lines, setLines] = useState<BillLine[]>([createEmptyLine()]);

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const totals = useMemo(() => {
    let subtotal = 0;
    let tax = 0;
    let discount = 0;
    let total = 0;

    for (const line of lines) {
      const quantity = toNumber(line.quantity, 1);
      const unitPrice = toNumber(line.unit_price, 0);
      const discountAmount = toNumber(line.discount_amount, 0);
      const taxRate = toNumber(line.tax_rate, 0);

      const netAmount = Math.max(quantity * unitPrice - discountAmount, 0);
      const taxAmount = Number(((netAmount * taxRate) / 100).toFixed(2));
      const lineTotal = Number((netAmount + taxAmount).toFixed(2));

      subtotal += netAmount;
      tax += taxAmount;
      discount += discountAmount;
      total += lineTotal;
    }

    return {
      subtotal: Number(subtotal.toFixed(2)),
      tax: Number(tax.toFixed(2)),
      discount: Number(discount.toFixed(2)),
      total: Number(total.toFixed(2)),
    };
  }, [lines]);

  function updateLine(index: number, field: keyof BillLine, value: string) {
    setLines((currentLines) =>
      currentLines.map((line, lineIndex) =>
        lineIndex === index ? { ...line, [field]: value } : line
      )
    );
  }

  function handleProductSelect(index: number, productServiceId: string) {
    const selectedItem = productsServices.find(
      (item) => item.id === productServiceId
    );

    setLines((currentLines) =>
      currentLines.map((line, lineIndex) => {
        if (lineIndex !== index) return line;

        return {
          ...line,
          product_service_id: productServiceId,
          description: selectedItem?.item_name || line.description,
          unit_price:
            selectedItem?.unit_price !== null &&
            selectedItem?.unit_price !== undefined
              ? String(selectedItem.unit_price)
              : line.unit_price,
          expense_account_id:
            selectedItem?.expense_account_id || line.expense_account_id,
          tax_account_id: selectedItem?.tax_account_id || line.tax_account_id,
        };
      })
    );
  }

  function addLine() {
    setLines((currentLines) => [...currentLines, createEmptyLine()]);
  }

  function removeLine(index: number) {
    setLines((currentLines) =>
      currentLines.length === 1
        ? currentLines
        : currentLines.filter((_, lineIndex) => lineIndex !== index)
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/purchase-bills", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organisation_id: organisationId,
          supplier_id: supplierId,
          accounting_period_id: accountingPeriodId || null,
          engagement_id: engagementId || null,
          bill_number: billNumber,
          supplier_invoice_number: supplierInvoiceNumber || null,
          bill_date: billDate,
          due_date: dueDate || null,
          currency_code: currencyCode || null,
          exchange_rate: exchangeRate || "1",
          expense_account_id: expenseAccountId || null,
          payable_account_id: payableAccountId || null,
          tax_account_id: taxAccountId || null,
          notes: notes || null,
          internal_notes: internalNotes || null,
          lines: lines.map((line) => ({
            product_service_id: line.product_service_id || null,
            description: line.description,
            quantity: line.quantity || "1",
            unit_price: line.unit_price || "0",
            discount_amount: line.discount_amount || "0",
            tax_rate: line.tax_rate || "0",
            expense_account_id: line.expense_account_id || expenseAccountId || null,
            tax_account_id: line.tax_account_id || taxAccountId || null,
          })),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to create purchase bill.");
      }

      router.push(`/portal/organisations/${organisationId}`);
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to create purchase bill."
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
            Supplier
          </span>
          <select
            value={supplierId}
            onChange={(event) => setSupplierId(event.target.value)}
            required
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          >
            <option value="">Select supplier</option>
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.supplier_name}
              </option>
            ))}
          </select>
        </label>

        <AutoNumberInput
  label="Bill number"
  value={billNumber}
  onChange={setBillNumber}
  organisationId={organisationId}
  documentType="PURCHASE_BILL"
  placeholder="BILL-0001"
/>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Supplier invoice number
          </span>
          <input
            value={supplierInvoiceNumber}
            onChange={(event) => setSupplierInvoiceNumber(event.target.value)}
            placeholder="Vendor invoice reference"
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Bill date
          </span>
          <input
            type="date"
            value={billDate}
            onChange={(event) => setBillDate(event.target.value)}
            required
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Due date
          </span>
          <input
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Accounting period
          </span>
          <select
            value={accountingPeriodId}
            onChange={(event) => setAccountingPeriodId(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          >
            <option value="">No accounting period selected</option>
            {accountingPeriods.map((period) => (
              <option key={period.id} value={period.id}>
                {period.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Engagement
          </span>
          <select
            value={engagementId}
            onChange={(event) => setEngagementId(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          >
            <option value="">No engagement selected</option>
            {engagements.map((engagement) => (
              <option key={engagement.id} value={engagement.id}>
                {engagement.name}
              </option>
            ))}
          </select>
        </label>

        <CurrencySelect
  label="Currency"
  value={currencyCode}
  onChange={setCurrencyCode}
  required
/>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Exchange rate
          </span>
          <input
            type="number"
            step="0.000001"
            value={exchangeRate}
            onChange={(event) => setExchangeRate(event.target.value)}
            placeholder="1"
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Default expense account
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

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Payable account
          </span>
          <select
            value={payableAccountId}
            onChange={(event) => setPayableAccountId(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          >
            <option value="">Select payable account</option>
            {payableAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.account_code} - {account.account_name}
              </option>
            ))}
          </select>
        </label>

        <label className="block md:col-span-2">
          <span className="text-sm font-semibold text-slate-700">
            Default tax account
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

      <div className="mt-8 rounded-[1.5rem] border border-[#D9E3F4] bg-[#F8FAFC] p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              Bill lines
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Add the services, expenses, or products being billed.
            </p>
          </div>

          <button
            type="button"
            onClick={addLine}
            className="rounded-full bg-[#073D7F] px-5 py-3 text-sm font-semibold text-white"
          >
            Add Line
          </button>
        </div>

        <div className="mt-6 space-y-5">
          {lines.map((line, index) => (
            <div
              key={index}
              className="rounded-[1.25rem] border border-[#D9E3F4] bg-white p-5"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="font-semibold text-slate-950">
                  Line {index + 1}
                </div>

                <button
                  type="button"
                  onClick={() => removeLine(index)}
                  className="text-sm font-semibold text-red-600"
                >
                  Remove
                </button>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">
                    Product / Service
                  </span>
                  <select
                    value={line.product_service_id}
                    onChange={(event) =>
                      handleProductSelect(index, event.target.value)
                    }
                    className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
                  >
                    <option value="">Manual line</option>
                    {productsServices.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.item_name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">
                    Description
                  </span>
                  <input
                    value={line.description}
                    onChange={(event) =>
                      updateLine(index, "description", event.target.value)
                    }
                    placeholder="Fuel, rent, software subscription, repairs..."
                    required
                    className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">
                    Quantity
                  </span>
                  <input
                    type="number"
                    step="0.0001"
                    value={line.quantity}
                    onChange={(event) =>
                      updateLine(index, "quantity", event.target.value)
                    }
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
                    value={line.unit_price}
                    onChange={(event) =>
                      updateLine(index, "unit_price", event.target.value)
                    }
                    className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">
                    Discount
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    value={line.discount_amount}
                    onChange={(event) =>
                      updateLine(index, "discount_amount", event.target.value)
                    }
                    className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">
                    Tax rate %
                  </span>
                  <input
                    type="number"
                    step="0.0001"
                    value={line.tax_rate}
                    onChange={(event) =>
                      updateLine(index, "tax_rate", event.target.value)
                    }
                    className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_0.45fr]">
        <div className="space-y-5">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Supplier notes
            </span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={4}
              placeholder="Notes relating to this bill."
              className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm leading-7 outline-none focus:border-[#073D7F]"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Internal notes
            </span>
            <textarea
              value={internalNotes}
              onChange={(event) => setInternalNotes(event.target.value)}
              rows={4}
              placeholder="Internal review notes. Not for client use."
              className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm leading-7 outline-none focus:border-[#073D7F]"
            />
          </label>
        </div>

        <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-[#073D7F] p-6 text-white">
          <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#6491DE]">
            Draft Total
          </div>

          <div className="mt-5 space-y-3 text-sm text-blue-100">
            <div className="flex justify-between gap-4">
              <span>Subtotal</span>
              <span>
                {currencyCode || "—"} {totals.subtotal.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span>Discount</span>
              <span>
                {currencyCode || "—"} {totals.discount.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span>Tax</span>
              <span>
                {currencyCode || "—"} {totals.tax.toLocaleString()}
              </span>
            </div>

            <div className="border-t border-white/20 pt-4">
              <div className="flex justify-between gap-4 text-lg font-semibold text-white">
                <span>Total</span>
                <span>
                  {currencyCode || "—"} {totals.total.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-white/10 p-4 text-sm leading-7 text-blue-100">
            This bill will be saved as draft only. It will not affect the ledger
            until a posting workflow is added and approved.
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-[#073D7F] px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Creating draft bill..." : "Create Draft Bill"}
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