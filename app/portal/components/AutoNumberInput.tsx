"use client";

import { useEffect, useState } from "react";

type DocumentType =
  | "SALES_INVOICE"
  | "PURCHASE_BILL"
  | "CUSTOMER_RECEIPT"
  | "SUPPLIER_PAYMENT"
  | "CAPITAL_CALL"
  | "FUNDING_TRANSACTION"
  | "JOURNAL_ENTRY";

export default function AutoNumberInput({
  label,
  value,
  onChange,
  organisationId,
  documentType,
  placeholder,
  required = true,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  organisationId: string;
  documentType: DocumentType;
  placeholder: string;
  required?: boolean;
}) {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadNumber() {
      if (value) return;

      setLoading(true);

      try {
        const params = new URLSearchParams({
          organisation_id: organisationId,
          document_type: documentType,
        });

        const response = await fetch(`/api/numbering/next?${params.toString()}`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Unable to generate number.");
        }

        if (!cancelled && result.next_number) {
          onChange(result.next_number);
        }
      } catch {
        // Keep the field editable even if number generation fails.
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadNumber();

    return () => {
      cancelled = true;
    };
  }, [documentType, organisationId, onChange, value]);

  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={loading ? "Generating number..." : placeholder}
        required={required}
        className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
      />
      <p className="mt-2 text-xs leading-5 text-slate-500">
        This number is generated automatically, but you can edit it before
        saving.
      </p>
    </label>
  );
}