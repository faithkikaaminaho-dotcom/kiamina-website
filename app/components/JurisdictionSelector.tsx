"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";

const jurisdictions = [
  { code: "NG", country: "Nigeria", framework: "IFRS", currency: "NGN", colors: ["#008751", "#ffffff", "#008751"] },
  { code: "CA", country: "Canada", framework: "IFRS", currency: "CAD", colors: ["#ff0000", "#ffffff", "#ff0000"] },
  { code: "US", country: "United States", framework: "US GAAP", currency: "USD", colors: ["#b22234", "#ffffff", "#3c3b6e"] },
  { code: "GB", country: "United Kingdom", framework: "IFRS", currency: "GBP", colors: ["#012169", "#ffffff", "#c8102e"] },
  { code: "AU", country: "Australia", framework: "IFRS", currency: "AUD", colors: ["#012169", "#ffffff", "#e4002b"] },
  { code: "IE", country: "Ireland", framework: "IFRS", currency: "EUR", colors: ["#169b62", "#ffffff", "#ff883e"] },
];

function getJurisdiction(code: string) {
  return jurisdictions.find((item) => item.code === code) || jurisdictions[0];
}

function FlagMark({ colors }: { colors: string[] }) {
  return (
    <span className="flex h-5 w-7 overflow-hidden rounded-[0.35rem] border border-slate-200 shadow-sm">
      {colors.map((color, index) => (
        <span
          key={`${color}-${index}`}
          className="h-full flex-1"
          style={{ backgroundColor: color }}
        />
      ))}
    </span>
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
        <FlagMark colors={selected.colors} />
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
              <FlagMark colors={item.colors} />

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