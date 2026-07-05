"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";

const jurisdictions = [
  { code: "NG", flagCode: "ng", country: "Nigeria", framework: "IFRS", currency: "NGN" },
  { code: "CA", flagCode: "ca", country: "Canada", framework: "IFRS", currency: "CAD" },
  { code: "US", flagCode: "us", country: "United States", framework: "US GAAP", currency: "USD" },
  { code: "GB", flagCode: "gb", country: "United Kingdom", framework: "IFRS", currency: "GBP" },
  { code: "AU", flagCode: "au", country: "Australia", framework: "IFRS", currency: "AUD" },
  { code: "IE", flagCode: "ie", country: "Ireland", framework: "IFRS", currency: "EUR" },
];

function getJurisdiction(code: string) {
  return jurisdictions.find((item) => item.code === code) || jurisdictions[0];
}

function FlagImage({
  flagCode,
  country,
}: {
  flagCode: string;
  country: string;
}) {
  return (
    <img
      src={`https://flagcdn.com/w40/${flagCode}.png`}
      alt={`${country} flag`}
      className="h-5 w-7 rounded-[0.25rem] object-cover shadow-sm ring-1 ring-slate-200"
    />
  );
}

export default function JurisdictionSelector() {
  const [selectedCode, setSelectedCode] = useState("NG");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("kiamina_jurisdiction");

    if (saved) {
      setSelectedCode(saved);
      return;
    }

    const detectedCode = (navigator.language || "").split("-")[1];

    if (detectedCode && jurisdictions.some((item) => item.code === detectedCode)) {
      setSelectedCode(detectedCode);
      localStorage.setItem("kiamina_jurisdiction", detectedCode);
    }
  }, []);

  const selected = getJurisdiction(selectedCode);

  const handleSelect = (code: string) => {
    setSelectedCode(code);
    localStorage.setItem("kiamina_jurisdiction", code);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-11 items-center gap-2 rounded-full border border-[#D9E3F4] bg-white px-3 text-sm font-semibold text-[#073D7F] shadow-sm transition hover:bg-[#F1F1F1]"
      >
        <FlagImage flagCode={selected.flagCode} country={selected.country} />
        <span>{selected.country}</span>
        <ChevronDown className="h-4 w-4 shrink-0" />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-3 w-80 overflow-hidden rounded-2xl border border-[#D9E3F4] bg-white shadow-xl">
          {jurisdictions.map((item) => (
            <button
              key={item.code}
              type="button"
              onClick={() => handleSelect(item.code)}
              className="flex w-full items-start gap-3 px-5 py-4 text-left transition hover:bg-[#F1F1F1]"
            >
              <FlagImage flagCode={item.flagCode} country={item.country} />

              <span>
                <span className="block text-sm font-semibold text-slate-950">
                  {item.country}
                </span>
                <span className="block text-xs text-slate-500">
                  {item.framework} · {item.currency}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}