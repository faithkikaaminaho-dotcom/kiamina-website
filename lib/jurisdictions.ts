export const jurisdictions = [
  {
    code: "NG",
    flag: "🇳🇬",
    country: "Nigeria",
    framework: "IFRS",
    currency: "NGN",
    taxAuthority: "Nigeria Revenue Service (NRS)",
  },
  {
    code: "CA",
    flag: "🇨🇦",
    country: "Canada",
    framework: "IFRS",
    currency: "CAD",
    taxAuthority: "Canada Revenue Agency (CRA)",
  },
  {
    code: "US",
    flag: "🇺🇸",
    country: "United States",
    framework: "US GAAP",
    currency: "USD",
    taxAuthority: "Internal Revenue Service (IRS)",
  },
  {
    code: "GB",
    flag: "🇬🇧",
    country: "United Kingdom",
    framework: "IFRS",
    currency: "GBP",
    taxAuthority: "HM Revenue & Customs (HMRC)",
  },
  {
    code: "AU",
    flag: "🇦🇺",
    country: "Australia",
    framework: "IFRS",
    currency: "AUD",
    taxAuthority: "Australian Taxation Office (ATO)",
  },
  {
    code: "IE",
    flag: "🇮🇪",
    country: "Ireland",
    framework: "IFRS",
    currency: "EUR",
    taxAuthority: "Revenue Commissioners",
  },
];

export function getJurisdiction(code: string) {
  return jurisdictions.find((item) => item.code === code) || jurisdictions[0];
}