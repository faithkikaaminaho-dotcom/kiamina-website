"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AutoNumberInput from "@/app/portal/components/AutoNumberInput";
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

type PeriodOption = {
  id: string;
  name: string | null;
};

type EngagementOption = {
  id: string;
  name: string | null;
};

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function toNumber(value: string, fallback = 0) {
  if (!value) return fallback;

  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : fallback;
}

export default function CreateCustomerReceiptForm({
  organisationId,
  defaultCurrency,
  customers,
  invoices,
  bankAccounts,
  receivableAccounts,
  incomeAccounts,
  accountingPeriods,
  engagements,
}: {
  organisationId: string;
  defaultCurrency?: string | null;
  customers: CustomerOption[];
  invoices: InvoiceOption[];
  bankAccounts: AccountOption[];
  receivableAccounts: AccountOption[];
  incomeAccounts: AccountOption[];
  accountingPeriods: PeriodOption[];
  engagements: EngagementOption[];
}) {
  const router = useRouter();

  const [customerId, setCustomerId] = useState("");
  const [salesInvoiceId, setSalesInvoiceId] = useState("");
  const [accountingPeriodId, setAccountingPeriodId] = useState("");
  const [engagementId, setEngagementId] = useState("");
  const [receiptNumber, setReceiptNumber] = useState("");
  const [receiptDate, setReceiptDate] = useState(todayDate());
  const [currencyCode, setCurrencyCode] = useState(defaultCurrency || "");
  const [exchangeRate, setExchangeRate] = useState("1");
  const [exchangeRateDate, setExchangeRateDate] = useState("");
const [exchangeRateSource, setExchangeRateSource] = useState("");
const [exchangeRateIsLocked, setExchangeRateIsLocked] = useState(false);
  const [amountReceived, setAmountReceived] = useState("");
  const [bankCharges, setBankCharges] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [bankAccountId, setBankAccountId] = useState("");
  const [receivableAccountId, setReceivableAccountId] = useState("");
  const [incomeAccountId, setIncomeAccountId] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [narration, setNarration] = useState("");
  const [internalNotes, setInternalNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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

    const selectedInvoice = invoices.find((invoice) => invoice.id === invoiceId);

    if (selectedInvoice) {
      if (selectedInvoice.customer_id) {
        setCustomerId(selectedInvoice.customer_id);
      }

      if (selectedInvoice.currency_code) {
        setCurrencyCode(selectedInvoice.currency_code);
      }

      if (selectedInvoice.receivable_account_id) {
  setReceivableAccountId(selectedInvoice.receivable_account_id);
}

setIncomeAccountId("");

      if (
        selectedInvoice.balance_due !== null &&
        selectedInvoice.balance_due !== undefined
      ) {
        setAmountReceived(String(selectedInvoice.balance_due));
      }
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/customer-receipts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organisation_id: organisationId,
          customer_id: customerId,
          sales_invoice_id: salesInvoiceId || null,
          accounting_period_id: accountingPeriodId || null,
          engagement_id: engagementId || null,
          receipt_number: receiptNumber,
          receipt_date: receiptDate,
          currency_code: currencyCode || null,
          exchange_rate: exchangeRate || "1",
          exchange_rate_date: exchangeRateDate || null,
exchange_rate_source: exchangeRateSource || null,
exchange_rate_is_locked: exchangeRateIsLocked,
          amount_received: amountReceived,
          bank_charges: bankCharges || "0",
          payment_method: paymentMethod || null,
          bank_account_id: bankAccountId || null,
          receivable_account_id: receivableAccountId || null,
          income_account_id: salesInvoiceId ? null : incomeAccountId || null,
          reference_number: referenceNumber || null,
          narration: narration || null,
          internal_notes: internalNotes || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to create customer receipt.");
      }

      router.push(`/portal/organisations/${organisationId}`);
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to create customer receipt."
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

        <AutoNumberInput
  label="Receipt number"
  value={receiptNumber}
  onChange={setReceiptNumber}
  organisationId={organisationId}
  documentType="CUSTOMER_RECEIPT"
  placeholder="RCPT-0001"
/>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Receipt date
          </span>
          <input
            type="date"
            value={receiptDate}
            onChange={(event) => setReceiptDate(event.target.value)}
            required
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

        {salesInvoiceId ? (
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
      This is pulled from the selected invoice. It will be used later when the
      receipt is posted against receivables.
    </p>
  </label>
) : (
  <label className="block">
    <span className="text-sm font-semibold text-slate-700">
      Income / Revenue account
    </span>
    <select
      value={incomeAccountId}
      onChange={(event) => setIncomeAccountId(event.target.value)}
      required={!salesInvoiceId}
      className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
    >
      <option value="">Select income account</option>
      {incomeAccounts.map((account) => (
        <option key={account.id} value={account.id}>
          {account.account_code} - {account.account_name}
        </option>
      ))}
    </select>
    <p className="mt-2 text-xs leading-5 text-slate-500">
      Use this only for direct receipts not linked to an invoice.
    </p>
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
            Draft Receipt Summary
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
            This receipt will be saved as draft only. It will not affect the
            ledger, receivables, or bank balance until posting is added and
            approved.
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-[#073D7F] px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Creating draft receipt..." : "Create Draft Receipt"}
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