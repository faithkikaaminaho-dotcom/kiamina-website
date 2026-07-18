"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type AccountOption = {
  id: string;
  account_code: string | null;
  account_name: string | null;
  account_type: string | null;
};

const supplierTypes = [
  ["BUSINESS", "Business"],
  ["INDIVIDUAL", "Individual"],
  ["GOVERNMENT", "Government"],
  ["NONPROFIT", "Nonprofit"],
  ["RELATED_PARTY", "Related Party"],
];

export default function CreateSupplierForm({
  organisationId,
  defaultCurrency,
  payableAccounts,
}: {
  organisationId: string;
  defaultCurrency?: string | null;
  payableAccounts: AccountOption[];
}) {
  const router = useRouter();

  const [supplierName, setSupplierName] = useState("");
  const [supplierType, setSupplierType] = useState("BUSINESS");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [taxIdentificationNumber, setTaxIdentificationNumber] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [currencyCode, setCurrencyCode] = useState(defaultCurrency || "");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [payableAccountId, setPayableAccountId] = useState("");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/suppliers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organisation_id: organisationId,
          supplier_name: supplierName,
          supplier_type: supplierType,
          email: email || null,
          phone: phone || null,
          address: address || null,
          tax_identification_number: taxIdentificationNumber || null,
          registration_number: registrationNumber || null,
          currency_code: currencyCode || null,
          payment_terms: paymentTerms || null,
          payable_account_id: payableAccountId || null,
          notes: notes || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to create supplier.");
      }

      router.push(`/portal/organisations/${organisationId}`);
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to create supplier."
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
            Supplier name
          </span>
          <input
            value={supplierName}
            onChange={(event) => setSupplierName(event.target.value)}
            placeholder="XYZ Logistics Limited"
            required
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Supplier type
          </span>
          <select
            value={supplierType}
            onChange={(event) => setSupplierType(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          >
            {supplierTypes.map(([value, label]) => (
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
            placeholder="accounts@supplier.com"
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
            Address
          </span>
          <textarea
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            rows={3}
            placeholder="Supplier address"
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
          <span className="text-sm font-semibold text-slate-700">Notes</span>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={4}
            placeholder="Any useful payment, compliance, or relationship notes."
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
          {submitting ? "Creating supplier..." : "Create Supplier"}
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