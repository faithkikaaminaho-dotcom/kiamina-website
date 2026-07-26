"use client";

import { worldCurrencies } from "@/lib/currencies";

export default function CurrencySelect({
  label = "Currency",
  value,
  onChange,
  required = false,
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  const normalizedValue = value?.toUpperCase() || "";

  const hasCurrentValue =
    normalizedValue &&
    !worldCurrencies.some((currency) => currency.code === normalizedValue);

  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>

      <select
        value={normalizedValue}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
      >
        <option value="">Select currency</option>

        {hasCurrentValue ? (
          <option value={normalizedValue}>{normalizedValue}</option>
        ) : null}

        {worldCurrencies.map((currency) => (
          <option key={currency.code} value={currency.code}>
            {currency.code} - {currency.name}
          </option>
        ))}
      </select>
    </label>
  );
}