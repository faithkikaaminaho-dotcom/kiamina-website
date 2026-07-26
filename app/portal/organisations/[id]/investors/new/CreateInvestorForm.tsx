"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CurrencySelect from "@/app/portal/components/CurrencySelect";

type AccountOption = {
  id: string;
  account_code: string | null;
  account_name: string | null;
  account_type: string | null;
};

const investorTypes = [
  ["EQUITY_PROVIDER", "Equity Provider"],
  ["DEBT_PROVIDER", "Debt Provider"],
  ["BANK_LENDER", "Bank Lender"],
  ["PRIVATE_LENDER", "Private Lender"],
  ["SHAREHOLDER", "Shareholder"],
  ["DIRECTOR", "Director"],
  ["VENTURE_INVESTOR", "Venture Investor"],
  ["GRANT_FUNDER", "Grant Funder"],
  ["DONOR", "Donor"],
  ["RELATED_PARTY", "Related Party"],
  ["OTHER", "Other"],
];

const fundingTypes = [
  ["EQUITY", "Equity"],
  ["DEBT", "Debt"],
  ["GRANT", "Grant"],
  ["DONATION", "Donation"],
  ["MIXED", "Mixed"],
  ["OTHER", "Other"],
];

export default function CreateInvestorForm({
  organisationId,
  defaultCurrency,
  equityAccounts,
  liabilityAccounts,
  interestExpenseAccounts,
}: {
  organisationId: string;
  defaultCurrency?: string | null;
  equityAccounts: AccountOption[];
  liabilityAccounts: AccountOption[];
  interestExpenseAccounts: AccountOption[];
}) {
  const router = useRouter();

  const [investorName, setInvestorName] = useState("");
  const [investorType, setInvestorType] = useState("EQUITY_PROVIDER");
  const [fundingType, setFundingType] = useState("EQUITY");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [taxIdentificationNumber, setTaxIdentificationNumber] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [currencyCode, setCurrencyCode] = useState(defaultCurrency || "");
  const [committedAmount, setCommittedAmount] = useState("");
  const [contributedAmount, setContributedAmount] = useState("");
  const [outstandingAmount, setOutstandingAmount] = useState("");
  const [ownershipPercentage, setOwnershipPercentage] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [repaymentTerms, setRepaymentTerms] = useState("");
  const [maturityDate, setMaturityDate] = useState("");
  const [equityAccountId, setEquityAccountId] = useState("");
  const [liabilityAccountId, setLiabilityAccountId] = useState("");
  const [interestExpenseAccountId, setInterestExpenseAccountId] = useState("");
  const [notes, setNotes] = useState("");
  const [isRelatedParty, setIsRelatedParty] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/investors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organisation_id: organisationId,
          investor_name: investorName,
          investor_type: investorType,
          funding_type: fundingType,
          contact_name: contactName || null,
          email: email || null,
          phone: phone || null,
          address: address || null,
          tax_identification_number: taxIdentificationNumber || null,
          registration_number: registrationNumber || null,
          currency_code: currencyCode || null,
          committed_amount: committedAmount || null,
          contributed_amount: contributedAmount || null,
          outstanding_amount: outstandingAmount || null,
          ownership_percentage: ownershipPercentage || null,
          interest_rate: interestRate || null,
          repayment_terms: repaymentTerms || null,
          maturity_date: maturityDate || null,
          equity_account_id: equityAccountId || null,
          liability_account_id: liabilityAccountId || null,
          interest_expense_account_id: interestExpenseAccountId || null,
          notes: notes || null,
          is_related_party: isRelatedParty,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Unable to create investor or funding provider."
        );
      }

      router.push(`/portal/organisations/${organisationId}`);
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to create investor or funding provider."
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
            Investor / funding provider name
          </span>
          <input
            value={investorName}
            onChange={(event) => setInvestorName(event.target.value)}
            placeholder="ABC Capital Limited"
            required
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Investor type
          </span>
          <select
            value={investorType}
            onChange={(event) => setInvestorType(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          >
            {investorTypes.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Funding type
          </span>
          <select
            value={fundingType}
            onChange={(event) => setFundingType(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          >
            {fundingTypes.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Contact person
          </span>
          <input
            value={contactName}
            onChange={(event) => setContactName(event.target.value)}
            placeholder="Contact name"
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="investor@example.com"
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

        <CurrencySelect
  label="Currency"
  value={currencyCode}
  onChange={setCurrencyCode}
/>

        <label className="block md:col-span-2">
          <span className="text-sm font-semibold text-slate-700">
            Address
          </span>
          <textarea
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            rows={3}
            placeholder="Investor, lender, or funder address"
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
            Committed amount
          </span>
          <input
            type="number"
            step="0.01"
            value={committedAmount}
            onChange={(event) => setCommittedAmount(event.target.value)}
            placeholder="50000000"
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Contributed / disbursed amount
          </span>
          <input
            type="number"
            step="0.01"
            value={contributedAmount}
            onChange={(event) => setContributedAmount(event.target.value)}
            placeholder="30000000"
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Outstanding amount
          </span>
          <input
            type="number"
            step="0.01"
            value={outstandingAmount}
            onChange={(event) => setOutstandingAmount(event.target.value)}
            placeholder="20000000"
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Ownership percentage
          </span>
          <input
            type="number"
            step="0.0001"
            value={ownershipPercentage}
            onChange={(event) => setOwnershipPercentage(event.target.value)}
            placeholder="40"
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Interest rate %
          </span>
          <input
            type="number"
            step="0.0001"
            value={interestRate}
            onChange={(event) => setInterestRate(event.target.value)}
            placeholder="24"
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Maturity date
          </span>
          <input
            type="date"
            value={maturityDate}
            onChange={(event) => setMaturityDate(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          />
        </label>

        <label className="block md:col-span-2">
          <span className="text-sm font-semibold text-slate-700">
            Repayment terms
          </span>
          <textarea
            value={repaymentTerms}
            onChange={(event) => setRepaymentTerms(event.target.value)}
            rows={3}
            placeholder="Repayment schedule, interest terms, covenant notes, or lender conditions."
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm leading-7 outline-none focus:border-[#073D7F]"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Equity account
          </span>
          <select
            value={equityAccountId}
            onChange={(event) => setEquityAccountId(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          >
            <option value="">Select equity account</option>
            {equityAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.account_code} - {account.account_name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Liability account
          </span>
          <select
            value={liabilityAccountId}
            onChange={(event) => setLiabilityAccountId(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          >
            <option value="">Select liability account</option>
            {liabilityAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.account_code} - {account.account_name}
              </option>
            ))}
          </select>
        </label>

        <label className="block md:col-span-2">
          <span className="text-sm font-semibold text-slate-700">
            Interest expense account
          </span>
          <select
            value={interestExpenseAccountId}
            onChange={(event) =>
              setInterestExpenseAccountId(event.target.value)
            }
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          >
            <option value="">Select interest expense account</option>
            {interestExpenseAccounts.map((account) => (
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
            placeholder="Governance, covenant, FX risk, investor reporting, or related-party notes."
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm leading-7 outline-none focus:border-[#073D7F]"
          />
        </label>
      </div>

      <div className="mt-6">
        <label className="flex items-start gap-3 rounded-2xl border border-[#D9E3F4] bg-[#F8FAFC] p-4 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={isRelatedParty}
            onChange={(event) => setIsRelatedParty(event.target.checked)}
            className="mt-1"
          />
          <span>
            <span className="font-semibold text-slate-950">
              Related-party funding
            </span>
            <span className="mt-1 block text-slate-500">
              Mark if this is a director, shareholder, group company, founder,
              or other related-party funding source.
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
          {submitting
            ? "Creating funding record..."
            : "Create Investor / Funding Provider"}
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