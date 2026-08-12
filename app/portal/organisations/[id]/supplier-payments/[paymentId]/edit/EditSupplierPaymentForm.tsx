"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import CurrencySelect from "@/app/portal/components/CurrencySelect";
import ExchangeRateFields from "@/app/portal/components/ExchangeRateFields";

type SupplierOption = {
  id: string;
  supplier_name: string | null;
};

type BillOption = {
  id: string;
  bill_number: string | null;
  supplier_id: string | null;
  currency_code: string | null;
  total_amount: number | null;
  balance_due: number | null;
  status: string | null;
  payable_account_id: string | null;
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

type PaymentRecord = {
  id: string;
  organisation_id: string;
  supplier_id: string | null;
  purchase_bill_id: string | null;
  payment_number: string | null;
  payment_date: string | null;
  currency_code: string | null;
  exchange_rate: number | null;
  exchange_rate_date: string | null;
  exchange_rate_source: string | null;
  exchange_rate_is_locked: boolean | null;
  amount_paid: number | null;
  bank_charges: number | null;
  total_cash_outflow: number | null;
  payment_method: string | null;
  bank_account_id: string | null;
  payable_account_id: string | null;
  expense_account_id: string | null;
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

export default function EditSupplierPaymentForm({
  organisationId,
  payment,
  defaultCurrency,
  suppliers,
  bills,
  bankAccounts,
  payableAccounts,
  expenseAccounts,
}: {
  organisationId: string;
  payment: PaymentRecord;
  defaultCurrency?: string | null;
  suppliers: SupplierOption[];
  bills: BillOption[];
  bankAccounts: AccountOption[];
  payableAccounts: AccountOption[];
  expenseAccounts: AccountOption[];
}) {
  const router = useRouter();

  const [supplierId, setSupplierId] = useState(payment.supplier_id || "");
  const [purchaseBillId, setPurchaseBillId] = useState(
    payment.purchase_bill_id || ""
  );
  const [paymentDate, setPaymentDate] = useState(payment.payment_date || "");
  const [currencyCode, setCurrencyCode] = useState(
    payment.currency_code || defaultCurrency || ""
  );
  const [exchangeRate, setExchangeRate] = useState(
    String(payment.exchange_rate || 1)
  );
  const [exchangeRateDate, setExchangeRateDate] = useState(
    payment.exchange_rate_date || payment.payment_date || ""
  );
  const [exchangeRateSource, setExchangeRateSource] = useState(
    payment.exchange_rate_source || ""
  );
  const [exchangeRateIsLocked, setExchangeRateIsLocked] = useState(
    Boolean(payment.exchange_rate_is_locked)
  );
  const [amountPaid, setAmountPaid] = useState(
    toInputNumber(payment.amount_paid)
  );
  const [bankCharges, setBankCharges] = useState(
    toInputNumber(payment.bank_charges)
  );
  const [paymentMethod, setPaymentMethod] = useState(
    payment.payment_method || ""
  );
  const [bankAccountId, setBankAccountId] = useState(
    payment.bank_account_id || ""
  );
  const [payableAccountId, setPayableAccountId] = useState(
    payment.payable_account_id || ""
  );
  const [expenseAccountId, setExpenseAccountId] = useState(
    payment.expense_account_id || ""
  );
  const [referenceNumber, setReferenceNumber] = useState(
    payment.reference_number || ""
  );
  const [narration, setNarration] = useState(payment.narration || "");
  const [internalNotes, setInternalNotes] = useState(
    payment.internal_notes || ""
  );

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const hasLinkedPurchaseBill = purchaseBillId.trim().length > 0;

  const filteredBills = useMemo(() => {
    if (!supplierId) return bills;

    return bills.filter((bill) => bill.supplier_id === supplierId);
  }, [supplierId, bills]);

  const totalCashOutflow = useMemo(() => {
    const amount = toNumber(amountPaid, 0);
    const charges = toNumber(bankCharges, 0);

    return Number((amount + charges).toFixed(2));
  }, [amountPaid, bankCharges]);

  function handleBillSelect(billId: string) {
    setPurchaseBillId(billId);

    if (!billId) {
      setPayableAccountId("");
      return;
    }

    const selectedBill = bills.find((bill) => bill.id === billId);

    if (!selectedBill) {
      setPayableAccountId("");
      return;
    }

    if (selectedBill.supplier_id) {
      setSupplierId(selectedBill.supplier_id);
    }

    if (selectedBill.currency_code) {
      setCurrencyCode(selectedBill.currency_code);
    }

    if (selectedBill.payable_account_id) {
      setPayableAccountId(selectedBill.payable_account_id);
    } else {
      setPayableAccountId("");
    }

    setExpenseAccountId("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch(`/api/supplier-payments/${payment.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organisation_id: organisationId,
          supplier_id: supplierId,
          purchase_bill_id: hasLinkedPurchaseBill ? purchaseBillId : null,
          payment_date: paymentDate,
          currency_code: currencyCode || null,
          exchange_rate: exchangeRate || "1",
          exchange_rate_date: exchangeRateDate || paymentDate || null,
          exchange_rate_source: exchangeRateSource || null,
          exchange_rate_is_locked: exchangeRateIsLocked,
          amount_paid: amountPaid,
          bank_charges: bankCharges || "0",
          payment_method: paymentMethod || null,
          bank_account_id: bankAccountId || null,
          payable_account_id: hasLinkedPurchaseBill
            ? payableAccountId || null
            : null,
          expense_account_id: hasLinkedPurchaseBill
            ? null
            : expenseAccountId || null,
          reference_number: referenceNumber || null,
          narration: narration || null,
          internal_notes: internalNotes || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to update supplier payment.");
      }

      router.push(
        `/portal/organisations/${organisationId}/supplier-payments/${payment.id}`
      );
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to update supplier payment."
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
        You are editing a draft supplier payment. Changes may affect the linked
        bank-line coverage. Review the Banking Reconciliation Context before
        posting linked drafts to GL.
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Supplier</span>
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

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Purchase bill optional
          </span>
          <select
            value={purchaseBillId}
            onChange={(event) => handleBillSelect(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          >
            <option value="">No bill linked</option>
            {filteredBills.map((bill) => (
              <option key={bill.id} value={bill.id}>
                {bill.bill_number} - {bill.currency_code || ""}{" "}
                {Number(bill.balance_due || 0).toLocaleString()}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Payment number
          </span>
          <input
            value={payment.payment_number || ""}
            disabled
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] bg-[#F8FAFC] px-4 py-3 text-sm text-slate-500 outline-none"
          />
          <p className="mt-2 text-xs leading-5 text-slate-500">
            Payment number is locked during editing.
          </p>
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Payment date
          </span>
          <input
            type="date"
            value={paymentDate}
            onChange={(event) => {
              const nextDate = event.target.value;
              setPaymentDate(nextDate);

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
            Amount paid
          </span>
          <input
            type="number"
            step="0.01"
            value={amountPaid}
            onChange={(event) => setAmountPaid(event.target.value)}
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

        {hasLinkedPurchaseBill ? (
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Payable account from linked bill
            </span>
            <select
              value={payableAccountId}
              onChange={(event) => setPayableAccountId(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-[#D9E3F4] bg-[#F8FAFC] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
            >
              <option value="">No payable account on bill</option>
              {payableAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.account_code} - {account.account_name}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              This account is used when the payment settles a linked purchase
              bill.
            </p>
          </label>
        ) : (
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Expense GL account
            </span>
            <select
              value={expenseAccountId}
              onChange={(event) => setExpenseAccountId(event.target.value)}
              required
              className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
            >
              <option value="">Select expense GL account</option>
              {expenseAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.account_code} - {account.account_name}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Required when the payment is not linked to a purchase bill. This
              account will be debited when the linked draft group is posted to
              GL.
            </p>

            {expenseAccounts.length === 0 ? (
              <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-700">
                No active expense accounts were found for this organisation. Add
                an Expense account in Chart of Accounts before posting this
                direct payment.
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
              placeholder="Payment description or supplier payment note."
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
            Updated Payment Summary
          </div>

          <div className="mt-5 space-y-3 text-sm text-blue-100">
            <div className="flex justify-between gap-4">
              <span>Amount paid</span>
              <span>
                {currencyCode || "—"} {toNumber(amountPaid, 0).toLocaleString()}
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
                <span>Total cash outflow</span>
                <span>
                  {currencyCode || "—"} {totalCashOutflow.toLocaleString()}
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
          href={`/portal/organisations/${organisationId}/supplier-payments/${payment.id}`}
          className="rounded-full border border-[#D9E3F4] bg-white px-6 py-3 text-center text-sm font-semibold text-[#073D7F]"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}