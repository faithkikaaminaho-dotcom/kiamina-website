"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type AccountOption = {
  id: string;
  account_code: string | null;
  account_name: string | null;
  account_type: string | null;
};

const customerTypes = [
  ["BUSINESS", "Business"],
  ["INDIVIDUAL", "Individual"],
  ["GOVERNMENT", "Government"],
  ["NONPROFIT", "Nonprofit"],
  ["RELATED_PARTY", "Related Party"],
];

export default function CreateCustomerForm({
  organisationId,
  defaultCurrency,
  receivableAccounts,
}: {
  organisationId: string;
  defaultCurrency?: string | null;
  receivableAccounts: AccountOption[];
}) {
  const router = useRouter();

  const [customerName, setCustomerName] = useState("");
  const [customerType, setCustomerType] = useState("BUSINESS");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [taxIdentificationNumber, setTaxIdentificationNumber] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [currencyCode, setCurrencyCode] = useState(defaultCurrency || "");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [creditLimit, setCreditLimit] = useState("");
  const [receivableAccountId, setReceivableAccountId] = useState("");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/customers", {
        method: "POST",
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
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to create customer.");
      }

      router.push(`/portal/organisations/${organisationId}`);
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to create customer."
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
            placeholder="ABC Properties Limited"
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

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="accounts@customer.com"
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Phone</span>
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="+234..."
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
            placeholder="Customer billing address"
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm leading-7 outline-none focus:border-[#073D7F]"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Tax identification number
          </span>
          <input
            value={taxIdentificationNumber}
            onChange={(event) => setTaxIdentificationNumber(event.target.value)}
            placeholder="TIN / VAT number"
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
            placeholder="RC / Company number"
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
            step="0.01"
            value={creditLimit}
            onChange={(event) => setCreditLimit(event.target.value)}
            placeholder="5000000"
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          />
        </label>

        <label className="block md:col-span-2">
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
          <span className="text-sm font-semibold text-slate-700">Notes</span>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={4}
            placeholder="Any useful billing, collection, or relationship notes."
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm leading-7 outline-none focus:border-[#073D7F]"
          />
        </label>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-[#073D7F] px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Creating customer..." : "Create Customer"}
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