"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AutoNumberInput from "@/app/portal/components/AutoNumberInput";
import CurrencySelect from "@/app/portal/components/CurrencySelect";
import ExchangeRateFields from "@/app/portal/components/ExchangeRateFields";

type AnyRecord = Record<string, any>;

type CustomerOption = {
  id: string;
  customer_name: string | null;
};

type ProductServiceOption = {
  id: string;
  item_name: string | null;
  unit_price: number | null;
  currency_code: string | null;
  income_account_id: string | null;
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

type TrackingCategory = {
  id: string;
  category_code: string | null;
  category_name: string | null;
  is_active?: boolean | null;
};

type TrackingOption = {
  id: string;
  tracking_category_id: string | null;
  option_code: string | null;
  option_name: string | null;
  is_active?: boolean | null;
};

type LinkedDocument = {
  id: string;
  file_name: string | null;
  document_type?: string | null;
  status?: string | null;
  created_at?: string | null;
  file_path?: string | null;
  storage_path?: string | null;
  mime_type?: string | null;
  content_type?: string | null;
};

type InvoiceLine = {
  product_service_id: string;
  description: string;
  quantity: string;
  unit_price: string;
  discount_amount: string;
  tax_rate: string;
  revenue_account_id: string;
  tax_account_id: string;
  department_id: string;
  location_id: string;
  project_id: string;
  cost_centre_id: string;
  class_id: string;
  fund_grant_id: string;
  service_line_id: string;
};

const trackingDimensionFields: {
  key: keyof Pick<
    InvoiceLine,
    | "department_id"
    | "location_id"
    | "project_id"
    | "cost_centre_id"
    | "class_id"
    | "fund_grant_id"
    | "service_line_id"
  >;
  label: string;
  categoryCodes: string[];
}[] = [
  {
    key: "department_id",
    label: "Department",
    categoryCodes: ["DEPARTMENT", "DEPARTMENTS"],
  },
  {
    key: "location_id",
    label: "Location",
    categoryCodes: ["LOCATION", "LOCATIONS"],
  },
  {
    key: "project_id",
    label: "Project",
    categoryCodes: ["PROJECT", "PROJECTS"],
  },
  {
    key: "cost_centre_id",
    label: "Cost Centre",
    categoryCodes: ["COST_CENTRE", "COST_CENTER", "COST_CENTRES", "COST_CENTERS"],
  },
  {
    key: "class_id",
    label: "Class",
    categoryCodes: ["CLASS", "CLASSES"],
  },
  {
    key: "fund_grant_id",
    label: "Fund / Grant",
    categoryCodes: ["FUND_GRANT", "FUND", "GRANT", "FUNDS_GRANTS"],
  },
  {
    key: "service_line_id",
    label: "Service Line",
    categoryCodes: ["SERVICE_LINE", "SERVICE_LINES"],
  },
];

function toNumber(value: string, fallback = 0) {
  if (!value) return fallback;

  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function toInputDate(value?: string | null) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function createEmptyLine(): InvoiceLine {
  return {
    product_service_id: "",
    description: "",
    quantity: "1",
    unit_price: "",
    discount_amount: "",
    tax_rate: "",
    revenue_account_id: "",
    tax_account_id: "",
    department_id: "",
    location_id: "",
    project_id: "",
    cost_centre_id: "",
    class_id: "",
    fund_grant_id: "",
    service_line_id: "",
  };
}

function normaliseText(value?: string | null) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/&/g, "AND")
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatStatus(status?: string | null) {
  if (!status) return "—";

  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function buildTrackingData(line: InvoiceLine) {
  const trackingData: Record<string, string> = {};

  for (const field of trackingDimensionFields) {
    const value = line[field.key];

    if (value) {
      trackingData[field.key] = value;
    }
  }

  return Object.keys(trackingData).length > 0 ? trackingData : null;
}

function lineFromRecord(record: AnyRecord): InvoiceLine {
  return {
    product_service_id: record.product_service_id || "",
    description: record.description || "",
    quantity:
      record.quantity !== null && record.quantity !== undefined
        ? String(record.quantity)
        : "1",
    unit_price:
      record.unit_price !== null && record.unit_price !== undefined
        ? String(record.unit_price)
        : "",
    discount_amount:
      record.discount_amount !== null && record.discount_amount !== undefined
        ? String(record.discount_amount)
        : "",
    tax_rate:
      record.tax_rate !== null && record.tax_rate !== undefined
        ? String(record.tax_rate)
        : "",
    revenue_account_id: record.revenue_account_id || "",
    tax_account_id: record.tax_account_id || "",
    department_id: record.department_id || "",
    location_id: record.location_id || "",
    project_id: record.project_id || "",
    cost_centre_id: record.cost_centre_id || "",
    class_id: record.class_id || "",
    fund_grant_id: record.fund_grant_id || "",
    service_line_id: record.service_line_id || "",
  };
}

export default function EditSalesInvoiceForm({
  organisationId,
  invoice,
  invoiceLines,
  defaultCurrency,
  customers,
  productsServices,
  revenueAccounts,
  receivableAccounts,
  taxAccounts,
  trackingCategories,
  trackingOptions,
  linkedDocuments,
}: {
  organisationId: string;
  invoice: AnyRecord;
  invoiceLines: AnyRecord[];
  defaultCurrency?: string | null;
  customers: CustomerOption[];
  productsServices: ProductServiceOption[];
  revenueAccounts: AccountOption[];
  receivableAccounts: AccountOption[];
  taxAccounts: AccountOption[];
  trackingCategories: TrackingCategory[];
  trackingOptions: TrackingOption[];
  linkedDocuments: LinkedDocument[];
}) {
  const router = useRouter();

  const [customerId, setCustomerId] = useState(invoice.customer_id || "");
  const [invoiceNumber, setInvoiceNumber] = useState(invoice.invoice_number || "");
  const [invoiceDate, setInvoiceDate] = useState(toInputDate(invoice.invoice_date));
  const [dueDate, setDueDate] = useState(toInputDate(invoice.due_date));
  const [currencyCode, setCurrencyCode] = useState(
    invoice.currency_code || defaultCurrency || ""
  );
  const [exchangeRate, setExchangeRate] = useState(
    invoice.exchange_rate !== null && invoice.exchange_rate !== undefined
      ? String(invoice.exchange_rate)
      : "1"
  );
  const [exchangeRateDate, setExchangeRateDate] = useState(
    toInputDate(invoice.exchange_rate_date)
  );
  const [exchangeRateSource, setExchangeRateSource] = useState(
    invoice.exchange_rate_source || ""
  );
  const [exchangeRateIsLocked, setExchangeRateIsLocked] = useState(
    Boolean(invoice.exchange_rate_is_locked)
  );
  const [revenueAccountId, setRevenueAccountId] = useState(
    invoice.revenue_account_id || ""
  );
  const [receivableAccountId, setReceivableAccountId] = useState(
    invoice.receivable_account_id || ""
  );
  const [taxAccountId, setTaxAccountId] = useState(invoice.tax_account_id || "");
  const [notes, setNotes] = useState(invoice.notes || "");
  const [internalNotes, setInternalNotes] = useState(invoice.internal_notes || "");
  const [lines, setLines] = useState<InvoiceLine[]>(
    invoiceLines.length > 0 ? invoiceLines.map(lineFromRecord) : [createEmptyLine()]
  );

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const categoryById = useMemo(() => {
    return new Map(trackingCategories.map((category) => [category.id, category]));
  }, [trackingCategories]);

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

  function getOptionsForCategory(categoryCodes: string[]) {
    const normalisedCodes = categoryCodes.map(normaliseText);

    return trackingOptions.filter((option) => {
      if (option.is_active === false) return false;

      const category = option.tracking_category_id
        ? categoryById.get(option.tracking_category_id)
        : null;

      if (!category || category.is_active === false) return false;

      const categoryCode = normaliseText(category.category_code);
      const categoryName = normaliseText(category.category_name);

      return (
        normalisedCodes.includes(categoryCode) ||
        normalisedCodes.includes(categoryName)
      );
    });
  }

  function updateLine(index: number, field: keyof InvoiceLine, value: string) {
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
          revenue_account_id:
            selectedItem?.income_account_id || line.revenue_account_id,
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
      const response = await fetch(`/api/sales-invoices/${invoice.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organisation_id: organisationId,
          customer_id: customerId,
          invoice_number: invoiceNumber,
          invoice_date: invoiceDate,
          due_date: dueDate || null,
          currency_code: currencyCode || null,
          exchange_rate: exchangeRate || "1",
          exchange_rate_date: exchangeRateDate || invoiceDate || null,
          exchange_rate_source: exchangeRateSource || null,
          exchange_rate_is_locked: exchangeRateIsLocked,
          revenue_account_id: revenueAccountId || null,
          receivable_account_id: receivableAccountId || null,
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
            revenue_account_id:
              line.revenue_account_id || revenueAccountId || null,
            tax_account_id: line.tax_account_id || taxAccountId || null,
            department_id: line.department_id || null,
            location_id: line.location_id || null,
            project_id: line.project_id || null,
            cost_centre_id: line.cost_centre_id || null,
            class_id: line.class_id || null,
            fund_grant_id: line.fund_grant_id || null,
            service_line_id: line.service_line_id || null,
            tracking_data: buildTrackingData(line),
          })),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to update sales invoice.");
      }

      router.push(`/portal/organisations/${organisationId}/sales-invoices/${invoice.id}`);
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to update sales invoice."
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

      <div className="mb-8 rounded-[1.5rem] border border-[#D9E3F4] bg-[#F8FAFC] p-6">
        <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#6491DE]">
          Supporting Documents
        </div>

        <h2 className="mt-3 text-xl font-semibold text-slate-950">
          Documents linked to this sales invoice
        </h2>

        <p className="mt-2 text-sm leading-7 text-slate-600">
          Supporting documents will be linked using{" "}
          <span className="font-semibold text-slate-950">source_module = SALES_INVOICE</span>{" "}
          and this invoice ID. Upload and attach actions will be added in the next
          step.
        </p>

        <div className="mt-5 space-y-3">
          {linkedDocuments.length > 0 ? (
            linkedDocuments.map((document) => (
              <div
                key={document.id}
                className="rounded-2xl border border-[#D9E3F4] bg-white p-4"
              >
                <div className="font-semibold text-[#073D7F]">
                  {document.file_name || "Untitled document"}
                </div>

                <div className="mt-2 text-sm text-slate-600">
                  {document.document_type || "Document"} ·{" "}
                  {formatStatus(document.status)} · Uploaded{" "}
                  {formatDate(document.created_at)}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-[#D9E3F4] bg-white p-5 text-sm text-slate-500">
              No supporting documents are linked to this invoice yet.
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Customer
          </span>
          <select
            value={customerId}
            onChange={(event) => setCustomerId(event.target.value)}
            required
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          >
            <option value="">Select customer</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.customer_name}
              </option>
            ))}
          </select>
        </label>

        <AutoNumberInput
          label="Invoice number"
          value={invoiceNumber}
          onChange={setInvoiceNumber}
          organisationId={organisationId}
          documentType="SALES_INVOICE"
          placeholder="INV-0001"
        />

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Invoice date
          </span>
          <input
            type="date"
            value={invoiceDate}
            onChange={(event) => {
              const nextDate = event.target.value;
              setInvoiceDate(nextDate);

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
            Due date
          </span>
          <input
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          />
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

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Default revenue account
          </span>
          <select
            value={revenueAccountId}
            onChange={(event) => setRevenueAccountId(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          >
            <option value="">Select revenue account</option>
            {revenueAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.account_code} - {account.account_name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Receivable account
          </span>
          <select
            value={receivableAccountId}
            onChange={(event) => setReceivableAccountId(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          >
            <option value="">Select receivable account</option>
            {receivableAccounts.map((account) => (
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
              Invoice lines
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Edit services, products, GL accounts, and sales reporting dimensions.
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
                    placeholder="Monthly bookkeeping service"
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

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">
                    Revenue account
                  </span>
                  <select
                    value={line.revenue_account_id}
                    onChange={(event) =>
                      updateLine(index, "revenue_account_id", event.target.value)
                    }
                    className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
                  >
                    <option value="">Use default revenue account</option>
                    {revenueAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.account_code} - {account.account_name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">
                    Tax account
                  </span>
                  <select
                    value={line.tax_account_id}
                    onChange={(event) =>
                      updateLine(index, "tax_account_id", event.target.value)
                    }
                    className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
                  >
                    <option value="">Use default tax account</option>
                    {taxAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.account_code} - {account.account_name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="mt-6 rounded-[1.25rem] border border-[#D9E3F4] bg-[#F8FAFC] p-5">
                <div className="text-sm font-semibold text-slate-950">
                  Sales reporting dimensions
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {trackingDimensionFields.map((field) => {
                    const options = getOptionsForCategory(field.categoryCodes);

                    return (
                      <label key={field.key} className="block">
                        <span className="text-sm font-semibold text-slate-700">
                          {field.label}
                        </span>
                        <select
                          value={line[field.key]}
                          onChange={(event) =>
                            updateLine(index, field.key, event.target.value)
                          }
                          className="mt-2 w-full rounded-2xl border border-[#D9E3F4] bg-white px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
                        >
                          <option value="">None</option>
                          {options.map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.option_code
                                ? `${option.option_code} - ${option.option_name}`
                                : option.option_name}
                            </option>
                          ))}
                        </select>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_0.45fr]">
        <div className="space-y-5">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Customer notes
            </span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={4}
              placeholder="Notes to appear on the invoice."
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
            Updated Total
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
            This update keeps the invoice as a draft. It will not affect the
            ledger until posting and approval controls are added.
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-[#073D7F] px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Saving draft invoice..." : "Save Draft Invoice"}
        </button>

        <a
          href={`/portal/organisations/${organisationId}/sales-invoices/${invoice.id}`}
          className="rounded-full border border-[#D9E3F4] bg-white px-6 py-3 text-center text-sm font-semibold text-[#073D7F]"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}