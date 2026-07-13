"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

type Jurisdiction = {
  code: string;
  flagCode: string;
  country: string;
  framework: string;
  currency: string;
  taxAuthority?: string;
};

const STORAGE_KEY = "kiamina_jurisdiction";
const SOURCE_KEY = "kiamina_jurisdiction_source";

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

function normalizeCode(value: string | null | undefined) {
  if (!value) return null;

  const code = value.trim().toUpperCase();

  if (!code || code === "XX" || code === "UNKNOWN") {
    return null;
  }

  if (code === "UK") {
    return "GB";
  }

  return code;
}

function isSupportedCode(items: Jurisdiction[], code: string | null) {
  if (!code) return false;
  return items.some((item) => item.code === code);
}

function getJurisdiction(items: Jurisdiction[], code: string) {
  return items.find((item) => item.code === code) || items[0];
}

async function getRegionFromServer(items: Jurisdiction[]) {
  try {
    const response = await fetch("/api/public/geo", {
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    const serverCode = normalizeCode(result.countryCode);

    if (isSupportedCode(items, serverCode)) {
      return serverCode;
    }
  } catch {
    return null;
  }

  return null;
}

function getRegionFromTimezone(items: Jurisdiction[]) {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  if (!timezone) return null;

  const timezoneMap: Record<string, string> = {
    "Africa/Lagos": "NG",

    "Europe/London": "GB",
    "Europe/Dublin": "IE",

    "America/Toronto": "CA",
    "America/Vancouver": "CA",
    "America/Edmonton": "CA",
    "America/Winnipeg": "CA",
    "America/Halifax": "CA",
    "America/St_Johns": "CA",
    "America/Regina": "CA",
    "America/Whitehorse": "CA",
    "America/Iqaluit": "CA",
    "America/Moncton": "CA",
    "America/Yellowknife": "CA",
    "America/Inuvik": "CA",
    "America/Rankin_Inlet": "CA",
    "America/Resolute": "CA",
    "America/Cambridge_Bay": "CA",
    "America/Dawson": "CA",
    "America/Dawson_Creek": "CA",
    "America/Fort_Nelson": "CA",
    "America/Goose_Bay": "CA",
    "America/Glace_Bay": "CA",
    "America/Atikokan": "CA",
    "America/Blanc-Sablon": "CA",
    "America/Creston": "CA",
    "America/Nipigon": "CA",
    "America/Pangnirtung": "CA",
    "America/Rainy_River": "CA",
    "America/Swift_Current": "CA",
    "America/Thunder_Bay": "CA",

    "America/New_York": "US",
    "America/Chicago": "US",
    "America/Denver": "US",
    "America/Los_Angeles": "US",
    "America/Phoenix": "US",
    "America/Anchorage": "US",
    "America/Adak": "US",
    "Pacific/Honolulu": "US",
    "America/Detroit": "US",
    "America/Boise": "US",
    "America/Juneau": "US",
    "America/Nome": "US",
    "America/Sitka": "US",
    "America/Yakutat": "US",
    "America/Metlakatla": "US",
    "America/Indiana/Indianapolis": "US",
    "America/Indiana/Knox": "US",
    "America/Indiana/Marengo": "US",
    "America/Indiana/Petersburg": "US",
    "America/Indiana/Tell_City": "US",
    "America/Indiana/Vevay": "US",
    "America/Indiana/Vincennes": "US",
    "America/Indiana/Winamac": "US",
    "America/Kentucky/Louisville": "US",
    "America/Kentucky/Monticello": "US",
    "America/North_Dakota/Beulah": "US",
    "America/North_Dakota/Center": "US",
    "America/North_Dakota/New_Salem": "US",
  };

  let detectedCode = timezoneMap[timezone] || null;

  if (!detectedCode && timezone.startsWith("Australia/")) {
    detectedCode = "AU";
  }

  detectedCode = normalizeCode(detectedCode);

  if (isSupportedCode(items, detectedCode)) {
    return detectedCode;
  }

  return null;
}

function getRegionFromBrowserLanguage(items: Jurisdiction[]) {
  const languages = [
    navigator.language,
    ...(navigator.languages || []),
  ].filter(Boolean);

  for (const language of languages) {
    const match = language.match(/[-_]([A-Za-z]{2})\b/);
    const regionCode = normalizeCode(match?.[1]);

    if (isSupportedCode(items, regionCode)) {
      return regionCode;
    }
  }

  return null;
}

async function detectBestJurisdiction(items: Jurisdiction[]) {
  const serverCode = await getRegionFromServer(items);

  if (serverCode) {
    return serverCode;
  }

  const timezoneCode = getRegionFromTimezone(items);

  if (timezoneCode) {
    return timezoneCode;
  }

  const browserCode = getRegionFromBrowserLanguage(items);

  if (browserCode) {
    return browserCode;
  }

  return "NG";
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
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const applySelection = useCallback(
    (code: string, source: "manual" | "auto") => {
      const normalizedCode = normalizeCode(code) || "NG";

      setSelectedCode(normalizedCode);
      localStorage.setItem(STORAGE_KEY, normalizedCode);
      localStorage.setItem(SOURCE_KEY, source);

      window.dispatchEvent(
        new CustomEvent("kiamina-jurisdiction-change", {
          detail: {
            code: normalizedCode,
            source,
          },
        })
      );
    },
    []
  );

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
    let cancelled = false;

    const initialiseJurisdiction = async () => {
      const savedCode = normalizeCode(localStorage.getItem(STORAGE_KEY));
      const savedSource = localStorage.getItem(SOURCE_KEY);

      if (
        savedCode &&
        savedSource === "manual" &&
        isSupportedCode(fallbackJurisdictions, savedCode)
      ) {
        applySelection(savedCode, "manual");
        return;
      }

      const detectedCode = await detectBestJurisdiction(fallbackJurisdictions);

      if (cancelled) return;

      if (detectedCode && isSupportedCode(fallbackJurisdictions, detectedCode)) {
        applySelection(detectedCode, "auto");
        return;
      }

      applySelection("NG", "auto");
    };

    initialiseJurisdiction();

    return () => {
      cancelled = true;
    };
  }, [applySelection]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const selected = useMemo(
    () => getJurisdiction(jurisdictions, selectedCode),
    [jurisdictions, selectedCode]
  );

  const handleSelect = (code: string) => {
    applySelection(code, "manual");
    setOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-11 max-w-[220px] items-center gap-2 rounded-full border border-[#D9E3F4] bg-white px-3 text-sm font-semibold text-[#073D7F] shadow-sm transition hover:bg-[#F1F1F1]"
        aria-label="Select jurisdiction"
      >
        <FlagImage flagCode={selected.flagCode} country={selected.country} />
        <span className="truncate">{selected.country}</span>
        <ChevronDown className="h-4 w-4 shrink-0" />
      </button>

      {open && (
        <div className="absolute right-0 z-[9999] mt-3 w-80 overflow-hidden rounded-2xl border border-[#D9E3F4] bg-white shadow-xl">
          <div className="border-b border-[#D9E3F4] px-5 py-4">
            <div className="text-sm font-semibold text-slate-950">
              Select jurisdiction
            </div>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Pricing and reporting context will update based on your selected
              location.
            </p>
          </div>

          {jurisdictions.map((item) => {
            const active = item.code === selectedCode;

            return (
              <button
                key={item.code}
                type="button"
                onClick={() => handleSelect(item.code)}
                className={`flex w-full items-start justify-between gap-3 px-5 py-4 text-left transition ${
                  active ? "bg-[#F1F6FF]" : "hover:bg-[#F1F1F1]"
                }`}
              >
                <span className="flex items-start gap-3">
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
                </span>

                {active ? (
                  <span className="rounded-full bg-[#073D7F] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                    Active
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}