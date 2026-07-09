"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";

type Jurisdiction = {
  code: string;
  flagCode: string;
  country: string;
  framework: string;
  currency: string;
  taxAuthority?: string;
};

const fallbackJurisdictions: Jurisdiction[] = [
  {
    code: "NG",
    flagCode: "ng",
    country: "Nigeria",
    framework: "IFRS",
    currency: "NGN",
    taxAuthority: "Nigeria Revenue Service (NRS)",
  },
  {
    code: "CA",
    flagCode: "ca",
    country: "Canada",
    framework: "IFRS",
    currency: "CAD",
    taxAuthority: "Canada Revenue Agency (CRA)",
  },
  {
    code: "US",
    flagCode: "us",
    country: "United States",
    framework: "US GAAP",
    currency: "USD",
    taxAuthority: "Internal Revenue Service (IRS)",
  },
  {
    code: "GB",
    flagCode: "gb",
    country: "United Kingdom",
    framework: "IFRS",
    currency: "GBP",
    taxAuthority: "HM Revenue & Customs (HMRC)",
  },
  {
    code: "AU",
    flagCode: "au",
    country: "Australia",
    framework: "IFRS",
    currency: "AUD",
    taxAuthority: "Australian Taxation Office (ATO)",
  },
  {
    code: "IE",
    flagCode: "ie",
    country: "Ireland",
    framework: "IFRS",
    currency: "EUR",
    taxAuthority: "Revenue Commissioners",
  },
];

function getJurisdiction(items: Jurisdiction[], code: string) {
  return items.find((item) => item.code === code) || items[0];
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
      className="h-5 w-7 shrink-0 rounded-[0.25rem] object-cover shadow-sm ring-1 ring-slate-200"
    />
  );
}

export default function JurisdictionSelector() {
  const [jurisdictions, setJurisdictions] =
    useState<Jurisdiction[]>(fallbackJurisdictions);
  const [selectedCode, setSelectedCode] = useState("NG");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const loadJurisdictions = async () => {
      try {
        const response = await fetch("/api/public/jurisdictions", {
          cache: "no-store",
        });

        const result = await response.json();

        if (response.ok && result.jurisdictions?.length) {
          setJurisdictions(result.jurisdictions);
        }
      } catch {
        setJurisdictions(fallbackJurisdictions);
      }
    };

    loadJurisdictions();
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("kiamina_jurisdiction");

    if (saved) {
      setSelectedCode(saved);
      return;
    }

    const detectedCode = (navigator.language || "").split("-")[1];

    if (
      detectedCode &&
      fallbackJurisdictions.some((item) => item.code === detectedCode)
    ) {
      setSelectedCode(detectedCode);
      localStorage.setItem("kiamina_jurisdiction", detectedCode);
    }
  }, []);

  const selected = useMemo(
    () => getJurisdiction(jurisdictions, selectedCode),
    [jurisdictions, selectedCode]
  );

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
        className="inline-flex h-11 max-w-[220px] items-center gap-2 rounded-full border border-[#D9E3F4] bg-white px-3 text-sm font-semibold text-[#073D7F] shadow-sm transition hover:bg-[#F1F1F1]"
      >
        <FlagImage flagCode={selected.flagCode} country={selected.country} />
        <span className="truncate">{selected.country}</span>
        <ChevronDown className="h-4 w-4 shrink-0" />
      </button>

      {open && (
        <div className="absolute right-0 z-[9999] mt-3 w-80 overflow-hidden rounded-2xl border border-[#D9E3F4] bg-white shadow-xl">
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
                {item.taxAuthority ? (
                  <span className="mt-1 block text-xs text-slate-400">
                    {item.taxAuthority}
                  </span>
                ) : null}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}