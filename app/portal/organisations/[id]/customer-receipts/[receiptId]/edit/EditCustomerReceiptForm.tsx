"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import CurrencySelect from "@/app/portal/components/CurrencySelect";
import ExchangeRateFields from "@/app/portal/components/ExchangeRateFields";

type CustomerOption = {
  id: string;
  customer_name: string | null;
};

type InvoiceOption = {
  id: string;
  invoice_number: string | null;
  customer_id: string | null;
  currency_code: string | null;
  total_amount: number | null;
  balance_due: number | null;
  status: string | null;
  receivable_account_id: string | null;
};

type AccountOption = {
  id: string;
  account_code: string | null;
  account_name: string | null;
  account_type: string | null;
};

type ReceiptRecord = {
  id: string;
  organisation_id: string;
  customer_id: string | null;
  sales_invoice_id: string | null;
  receipt_number: string | null;
  receipt_date: string | null;
  currency_code: string | null;
  exchange_rate: number | null;
  exchange_rate_date: string | null;
  exchange_rate_source: string | null;
  exchange_rate_is_locked: boolean | null;
  amount_received: number | null;
  bank_charges: number | null;
  payment_method: string | null;
  bank_account_id: string | null;
  receivable_account_id: string | null;
  income_account_id: string | null;
  reference_number: string | null;
  narration: string | null;
  internal_notes: string | null;
  status: string | null;
};

function toNumber(value: string, fallback = 0) {
  if (!value) return fallback;

  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function toInputNumber(value?: number | null) {
  if (value === null || value === undefined) return "";
  return String(value);
}

export default function EditCustomerReceiptForm({
  organisationId,
  receipt,
  defaultCurrency,
  customers,
  invoices,
  bankAccounts,
  receivableAccounts,
  incomeAccounts,
}: {
  organisationId: string;
  receipt: ReceiptRecord;
  defaultCurrency?: string | null;
  customers: CustomerOption[];
  invoices: InvoiceOption[];
  bankAccounts: AccountOption[];
  receivableAccounts: AccountOption[];
  incomeAccounts: AccountOption[];
}) {
  const router = useRouter();

  const [customerId, setCustomerId] = useState(receipt.customer_id || "");
  const [salesInvoiceId, setSalesInvoiceId] = useState(
    receipt.sales_invoice_id || ""
  );
  const [receiptDate, setReceiptDate] = useState(receipt.receipt_date || "");
  const [currencyCode, setCurrencyCode] = useState(
    receipt.currency_code || defaultCurrency || ""
  );
  const [exchangeRate, setExchangeRate] = useState(
    String(receipt.exchange_rate || 1)
  );
  const [exchangeRateDate, setExchangeRateDate] = useState(
    receipt.exchange_rate_date || receipt.receipt_date || ""
  );
  const [exchangeRateSource, setExchangeRateSource] = useState(
    receipt.exchange_rate_source || ""
  );
  const [exchangeRateIsLocked, setExchangeRateIsLocked] = useState(
    Boolean(receipt.exchange_rate_is_locked)
  );
  const [amountReceived, setAmountReceived] = useState(
    toInputNumber(receipt.amount_received)
  );
  const [bankCharges, setBankCharges] = useState(
    toInputNumber(receipt.bank_charges)
  );
  const [paymentMethod, setPaymentMethod] = useState(
    receipt.payment_method || ""
  );
  const [bankAccountId, setBankAccountId] = useState(
    receipt.bank_account_id || ""
  );
  const [receivableAccountId, setReceivableAccountId] = useState(
    receipt.receivable_account_id || ""
  );
  const [incomeAccountId, setIncomeAccountId] = useState(
    receipt.income_account_id || ""
  );
  const [referenceNumber, setReferenceNumber] = useState(
    receipt.reference_number || ""
  );
  const [narration, setNarration] = useState(receipt.narration || "");
  const [internalNotes, setInternalNotes] = useState(
    receipt.internal_notes || ""
  );

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const hasLinkedSalesInvoice = salesInvoiceId.trim().length > 0;

  const filteredInvoices = useMemo(() => {
    if (!customerId) return invoices;

    return invoices.filter((invoice) => invoice.customer_id === customerId);
  }, [customerId, invoices]);

  const netAmount = useMemo(() => {
    const amount = toNumber(amountReceived, 0);
    const charges = toNumber(bankCharges, 0);

    return Number(Math.max(amount - charges, 0).toFixed(2));
  }, [amountReceived, bankCharges]);

  function handleInvoiceSelect(invoiceId: string) {
    setSalesInvoiceId(invoiceId);

    if (!invoiceId) {
      setReceivableAccountId("");
      return;
    }

    const selectedInvoice = invoices.find((invoice) => invoice.id === invoiceId);

    if (!selectedInvoice) {
      setReceivableAccountId("");
      return;
    }

    if (selectedInvoice.customer_id) {
      setCustomerId(selectedInvoice.customer_id);
    }

    if (selectedInvoice.currency_code) {
      setCurrencyCode(selectedInvoice.currency_code);
    }

    if (selectedInvoice.receivable_account_id) {
      setReceivableAccountId(selectedInvoice.receivable_account_id);
    } else {
      setReceivableAccountId("");
    }

    setIncomeAccountId("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch(`/api/customer-receipts/${receipt.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organisation_id: organisationId,
          customer_id: customerId,
          sales_invoice_id: hasLinkedSalesInvoice ? salesInvoiceId : null,
          receipt_date: receiptDate,
          currency_code: currencyCode || null,
          exchange_rate: exchangeRate || "1",
          exchange_rate_date: exchangeRateDate || receiptDate || null,
          exchange_rate_source: exchangeRateSource || null,
          exchange_rate_is_locked: exchangeRateIsLocked,
          amount_received: amountReceived,
          bank_charges: bankCharges || "0",
          payment_method: paymentMethod || null,
          bank_account_id: bankAccountId || null,
          receivable_account_id: hasLinkedSalesInvoice
            ? receivableAccountId || null
            : null,
          income_account_id: hasLinkedSalesInvoice
            ? null
            : incomeAccountId || null,
          reference_number: referenceNumber || null,
          narration: narration || null,
          internal_notes: internalNotes || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to update customer receipt.");
      }

      router.push(
        `/portal/organisations/${organisationId}/customer-receipts/${receipt.id}`
      );
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to update customer receipt."
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

      <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-7 text-amber-800">
        You are editing a draft customer receipt. Changes may affect the linked
        bank-line coverage. Review the Banking Reconciliation Context before
        posting linked drafts to GL.
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Customer</span>
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

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Sales invoice optional
          </span>
          <select
            value={salesInvoiceId}
            onChange={(event) => handleInvoiceSelect(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          >
            <option value="">No invoice linked</option>
            {filteredInvoices.map((invoice) => (
              <option key={invoice.id} value={invoice.id}>
                {invoice.invoice_number} - {invoice.currency_code || ""}{" "}
                {Number(invoice.balance_due || 0).toLocaleString()}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Receipt number
          </span>
          <input
            value={receipt.receipt_number || ""}
            disabled
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] bg-[#F8FAFC] px-4 py-3 text-sm text-slate-500 outline-none"
          />
          <p className="mt-2 text-xs leading-5 text-slate-500">
            Receipt number is locked during editing.
          </p>
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Receipt date
          </span>
          <input
            type="date"
            value={receiptDate}
            onChange={(event) => {
              const nextDate = event.target.value;
              setReceiptDate(nextDate);

              if (!exchangeRateDate) {
                setExchangeRateDate(nextDate);
              }
            }}
            required
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
            Amount received
          </span>
          <input
            type="number"
            step="0.01"
            value={amountReceived}
            onChange={(event) => setAmountReceived(event.target.value)}
            required
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Bank charges
          </span>
          <input
            type="number"
            step="0.01"
            value={bankCharges}
            onChange={(event) => setBankCharges(event.target.value)}
            placeholder="0"
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Payment method
          </span>
          <select
            value={paymentMethod}
            onChange={(event) => setPaymentMethod(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          >
            <option value="">Select payment method</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
            <option value="CASH">Cash</option>
            <option value="CARD">Card</option>
            <option value="CHEQUE">Cheque</option>
            <option value="ONLINE_PAYMENT">Online Payment</option>
            <option value="OTHER">Other</option>
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Bank account
          </span>
          <select
            value={bankAccountId}
            onChange={(event) => setBankAccountId(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          >
            <option value="">Select bank account</option>
            {bankAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.account_code} - {account.account_name}
              </option>
            ))}
          </select>
        </label>

        {hasLinkedSalesInvoice ? (
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Receivable account from linked invoice
            </span>
            <select
              value={receivableAccountId}
              onChange={(event) => setReceivableAccountId(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-[#D9E3F4] bg-[#F8FAFC] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
            >
              <option value="">No receivable account on invoice</option>
              {receivableAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.account_code} - {account.account_name}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              This account is used when the receipt settles a linked sales
              invoice.
            </p>
          </label>
        ) : (
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Income / Revenue GL account
            </span>
            <select
              value={incomeAccountId}
              onChange={(event) => setIncomeAccountId(event.target.value)}
              required
              className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
            >
              <option value="">Select income / revenue GL account</option>
              {incomeAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.account_code} - {account.account_name}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Required when the receipt is not linked to a sales invoice. This
              account will be credited when the linked draft group is posted to
              GL.
            </p>

            {incomeAccounts.length === 0 ? (
              <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-700">
                No active income accounts were found for this organisation. Add
                an Income account in Chart of Accounts before posting this
                direct receipt.
              </p>
            ) : null}
          </label>
        )}

        <label className="block md:col-span-2">
          <span className="text-sm font-semibold text-slate-700">
            Reference number
          </span>
          <input
            value={referenceNumber}
            onChange={(event) => setReferenceNumber(event.target.value)}
            placeholder="Bank reference / payment reference"
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          />
        </label>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_0.45fr]">
        <div className="space-y-5">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Narration
            </span>
            <textarea
              value={narration}
              onChange={(event) => setNarration(event.target.value)}
              rows={4}
              placeholder="Receipt description or customer payment note."
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
            Updated Receipt Summary
          </div>

          <div className="mt-5 space-y-3 text-sm text-blue-100">
            <div className="flex justify-between gap-4">
              <span>Amount received</span>
              <span>
                {currencyCode || "—"}{" "}
                {toNumber(amountReceived, 0).toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span>Bank charges</span>
              <span>
                {currencyCode || "—"} {toNumber(bankCharges, 0).toLocaleString()}
              </span>
            </div>

            <div className="border-t border-white/20 pt-4">
              <div className="flex justify-between gap-4 text-lg font-semibold text-white">
                <span>Net amount</span>
                <span>
                  {currencyCode || "—"} {netAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-white/10 p-4 text-sm leading-7 text-blue-100">
            Saving this update will not post to the ledger. The linked bank-line
            group still needs group posting to GL.
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-[#073D7F] px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Saving changes..." : "Save Draft Changes"}
        </button>

        <a
          href={`/portal/organisations/${organisationId}/customer-receipts/${receipt.id}`}
          className="rounded-full border border-[#D9E3F4] bg-white px-6 py-3 text-center text-sm font-semibold text-[#073D7F]"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}