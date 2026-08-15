"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CurrencySelect from "@/app/portal/components/CurrencySelect";

type CustomerRecord = {
  id: string;
  customer_name: string | null;
  customer_type: string | null;
  email: string | null;
  phone: string | null;
  billing_address: string | null;
  tax_identification_number: string | null;
  registration_number: string | null;
  currency_code: string | null;
  payment_terms: string | null;
  credit_limit: number | null;
  receivable_account_id: string | null;
  notes: string | null;
  is_active: boolean | null;
};

type AccountOption = {
  id: string;
  account_code: string | null;
  account_name: string | null;
};

const customerTypes = [
  ["BUSINESS", "Business"],
  ["INDIVIDUAL", "Individual"],
  ["GOVERNMENT", "Government"],
  ["NONPROFIT", "Nonprofit"],
  ["RELATED_PARTY", "Related Party"],
];

export default function EditCustomerForm({
  organisationId,
  customer,
  defaultCurrency,
  receivableAccounts,
}: {
  organisationId: string;
  customer: CustomerRecord;
  defaultCurrency?: string | null;
  receivableAccounts: AccountOption[];
}) {
  const router = useRouter();

  const [customerName, setCustomerName] = useState(
    customer.customer_name || ""
  );

  const [customerType, setCustomerType] = useState(
    customer.customer_type || "BUSINESS"
  );

  const [email, setEmail] = useState(customer.email || "");
  const [phone, setPhone] = useState(customer.phone || "");

  const [billingAddress, setBillingAddress] = useState(
    customer.billing_address || ""
  );

  const [taxIdentificationNumber, setTaxIdentificationNumber] = useState(
    customer.tax_identification_number || ""
  );

  const [registrationNumber, setRegistrationNumber] = useState(
    customer.registration_number || ""
  );

  const [currencyCode, setCurrencyCode] = useState(
    customer.currency_code || defaultCurrency || ""
  );

  const [paymentTerms, setPaymentTerms] = useState(
    customer.payment_terms || ""
  );

  const [creditLimit, setCreditLimit] = useState(
    customer.credit_limit === null ? "" : String(customer.credit_limit)
  );

  const [receivableAccountId, setReceivableAccountId] = useState(
    customer.receivable_account_id || ""
  );

  const [notes, setNotes] = useState(customer.notes || "");
  const [isActive, setIsActive] = useState(customer.is_active !== false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch(`/api/customers/${customer.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organisation_id: organisationId,
          customer_name: customerName,
          customer_type: customerType,
          email: email || null,
          phone: phone || null,
          billing_address: billingAddress || null,
          tax_identification_number: taxIdentificationNumber || null,
          registration_number: registrationNumber || null,
          currency_code: currencyCode || null,
          payment_terms: paymentTerms || null,
          credit_limit: creditLimit || null,
          receivable_account_id: receivableAccountId || null,
          notes: notes || null,
          is_active: isActive,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to update customer.");
      }

      router.push(
        `/portal/organisations/${organisationId}/customers/${customer.id}`
      );
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to update customer."
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
            Customer name
          </span>
          <input
            value={customerName}
            onChange={(event) => setCustomerName(event.target.value)}
            required
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Customer type
          </span>
          <select
            value={customerType}
            onChange={(event) => setCustomerType(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          >
            {customerTypes.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <CurrencySelect
          label="Currency"
          value={currencyCode}
          onChange={setCurrencyCode}
        />

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Phone</span>
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          />
        </label>

        <label className="block md:col-span-2">
          <span className="text-sm font-semibold text-slate-700">
            Billing address
          </span>
          <textarea
            value={billingAddress}
            onChange={(event) => setBillingAddress(event.target.value)}
            rows={3}
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm leading-7 outline-none focus:border-[#073D7F]"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Tax identification number
          </span>
          <input
            value={taxIdentificationNumber}
            onChange={(event) =>
              setTaxIdentificationNumber(event.target.value)
            }
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Registration number
          </span>
          <input
            value={registrationNumber}
            onChange={(event) => setRegistrationNumber(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Payment terms
          </span>
          <input
            value={paymentTerms}
            onChange={(event) => setPaymentTerms(event.target.value)}
            placeholder="Net 30 / Due on receipt"
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Credit limit
          </span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={creditLimit}
            onChange={(event) => setCreditLimit(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          />
        </label>

        <label className="block md:col-span-2">
          <span className="text-sm font-semibold text-slate-700">
            Receivable account
          </span>
          <select
            value={receivableAccountId}
            onChange={(event) =>
              setReceivableAccountId(event.target.value)
            }
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          >
            <option value="">Select receivable account</option>

            {receivableAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.account_code || "No code"} -{" "}
                {account.account_name || "Unnamed account"}
              </option>
            ))}
          </select>
        </label>

        <label className="block md:col-span-2">
          <span className="text-sm font-semibold text-slate-700">Notes</span>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={4}
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm leading-7 outline-none focus:border-[#073D7F]"
          />
        </label>

        <div className="md:col-span-2 rounded-2xl border border-[#D9E3F4] bg-[#F8FAFC] p-5">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-300"
            />

            <span>
              <span className="block text-sm font-semibold text-slate-950">
                Active customer
              </span>

              <span className="mt-1 block text-sm leading-6 text-slate-500">
                Inactive customers retain their transaction history but should
                not be selected for new sales transactions.
              </span>
            </span>
          </label>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-[#073D7F] px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Saving customer..." : "Save Changes"}
        </button>

        <a
          href={`/portal/organisations/${organisationId}/customers/${customer.id}`}
          className="rounded-full border border-[#D9E3F4] bg-white px-6 py-3 text-center text-sm font-semibold text-[#073D7F]"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}