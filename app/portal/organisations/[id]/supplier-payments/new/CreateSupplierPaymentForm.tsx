"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AutoNumberInput from "@/app/portal/components/AutoNumberInput";
import CurrencySelect from "@/app/portal/components/CurrencySelect";

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

export default function CreateSupplierPaymentForm({
  organisationId,
  defaultCurrency,
  suppliers,
  bills,
  bankAccounts,
  payableAccounts,
  expenseAccounts,
  accountingPeriods,
  engagements,
}: {
  organisationId: string;
  defaultCurrency?: string | null;
  suppliers: SupplierOption[];
  bills: BillOption[];
  bankAccounts: AccountOption[];
  payableAccounts: AccountOption[];
  expenseAccounts: AccountOption[];
  accountingPeriods: PeriodOption[];
  engagements: EngagementOption[];
}) {
  const router = useRouter();

  const [supplierId, setSupplierId] = useState("");
  const [purchaseBillId, setPurchaseBillId] = useState("");
  const [accountingPeriodId, setAccountingPeriodId] = useState("");
  const [engagementId, setEngagementId] = useState("");
  const [paymentNumber, setPaymentNumber] = useState("");
  const [paymentDate, setPaymentDate] = useState(todayDate());
  const [currencyCode, setCurrencyCode] = useState(defaultCurrency || "");
  const [exchangeRate, setExchangeRate] = useState("1");
  const [amountPaid, setAmountPaid] = useState("");
  const [bankCharges, setBankCharges] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [bankAccountId, setBankAccountId] = useState("");
  const [payableAccountId, setPayableAccountId] = useState("");
  const [expenseAccountId, setExpenseAccountId] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [narration, setNarration] = useState("");
  const [internalNotes, setInternalNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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

    const selectedBill = bills.find((bill) => bill.id === billId);

    if (selectedBill) {
      if (selectedBill.supplier_id) {
        setSupplierId(selectedBill.supplier_id);
      }

      if (selectedBill.currency_code) {
        setCurrencyCode(selectedBill.currency_code);
      }

      if (selectedBill.payable_account_id) {
        setPayableAccountId(selectedBill.payable_account_id);
      }

      setExpenseAccountId("");

      if (
        selectedBill.balance_due !== null &&
        selectedBill.balance_due !== undefined
      ) {
        setAmountPaid(String(selectedBill.balance_due));
      }
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/supplier-payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organisation_id: organisationId,
          supplier_id: supplierId,
          purchase_bill_id: purchaseBillId || null,
          accounting_period_id: accountingPeriodId || null,
          engagement_id: engagementId || null,
          payment_number: paymentNumber,
          payment_date: paymentDate,
          currency_code: currencyCode || null,
          exchange_rate: exchangeRate || "1",
          amount_paid: amountPaid,
          bank_charges: bankCharges || "0",
          payment_method: paymentMethod || null,
          bank_account_id: bankAccountId || null,
          payable_account_id: payableAccountId || null,
          expense_account_id: purchaseBillId ? null : expenseAccountId || null,
          reference_number: referenceNumber || null,
          narration: narration || null,
          internal_notes: internalNotes || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to create supplier payment.");
      }

      router.push(`/portal/organisations/${organisationId}`);
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to create supplier payment."
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

        <AutoNumberInput
  label="Payment number"
  value={paymentNumber}
  onChange={setPaymentNumber}
  organisationId={organisationId}
  documentType="SUPPLIER_PAYMENT"
  placeholder="PAY-0001"
/>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Payment date
          </span>
          <input
            type="date"
            value={paymentDate}
            onChange={(event) => setPaymentDate(event.target.value)}
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

        {purchaseBillId ? (
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
              This is pulled from the selected purchase bill. It will be used
              later when the payment is posted against payables.
            </p>
          </label>
        ) : (
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Expense account
            </span>
            <select
              value={expenseAccountId}
              onChange={(event) => setExpenseAccountId(event.target.value)}
              required={!purchaseBillId}
              className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
            >
              <option value="">Select expense account</option>
              {expenseAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.account_code} - {account.account_name}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Use this only for direct supplier payments not linked to a bill.
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
            Draft Payment Summary
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
            This payment will be saved as draft only. It will not affect the
            ledger, payables, or bank balance until posting is added and
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
          {submitting ? "Creating draft payment..." : "Create Draft Payment"}
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