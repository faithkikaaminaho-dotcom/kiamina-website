"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Organisation = {
  id: string;
  legal_name: string | null;
  trading_name: string | null;
  logo_url: string | null;
  logo_storage_path: string | null;
  country_code: string | null;
  country_name: string | null;
  primary_email: string | null;
  primary_phone: string | null;
  primary_contact_name: string | null;
  primary_contact_email: string | null;
  primary_contact_phone: string | null;
  risk_rating: string | null;
  onboarding_status: string | null;
  base_currency_code: string | null;
  reporting_framework_code: string | null;
  accounting_year_start_month: number | null;
  accounting_year_start_day: number | null;
  accounting_year_end_month: number | null;
  accounting_year_end_day: number | null;
};

const months = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

const days = Array.from({ length: 31 }, (_, index) => index + 1);

const countries = [
  { code: "NG", name: "Nigeria" },
  { code: "GB", name: "United Kingdom" },
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "IE", name: "Ireland" },
  { code: "ZA", name: "South Africa" },
  { code: "GH", name: "Ghana" },
  { code: "KE", name: "Kenya" },
  { code: "AU", name: "Australia" },
  { code: "OTHER", name: "Other" },
];

const currencies = [
  "NGN",
  "USD",
  "GBP",
  "EUR",
  "CAD",
  "AUD",
  "ZAR",
  "GHS",
  "KES",
];

const reportingFrameworks = [
  { value: "IFRS", label: "IFRS" },
  { value: "IFRS_SME", label: "IFRS for SMEs" },
  { value: "US_GAAP", label: "US GAAP" },
];

const onboardingStatuses = [
  { value: "ONBOARDING", label: "Onboarding" },
  { value: "ACTIVE", label: "Active" },
  { value: "PAUSED", label: "Paused" },
  { value: "CLOSED", label: "Closed" },
  { value: "ARCHIVED", label: "Archived" },
];

const riskRatings = [
  { value: "NOT_ASSESSED", label: "Not Assessed" },
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "CRITICAL", label: "Critical" },
];

function getCountryName(countryCode: string) {
  return countries.find((country) => country.code === countryCode)?.name || "";
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Unable to read logo file."));
      }
    };

    reader.onerror = () => {
      reject(new Error("Unable to read logo file."));
    };

    reader.readAsDataURL(file);
  });
}

export default function AccountingYearSettingsForm({
  organisation,
}: {
  organisation: Organisation;
}) {
  const router = useRouter();

  const [legalName, setLegalName] = useState(organisation.legal_name || "");
  const [tradingName, setTradingName] = useState(
    organisation.trading_name || ""
  );
  const [logoUrl, setLogoUrl] = useState(organisation.logo_url || "");

  const [countryCode, setCountryCode] = useState(
    organisation.country_code || "NG"
  );
  const [countryName, setCountryName] = useState(
    organisation.country_name || getCountryName(organisation.country_code || "NG")
  );

  const [baseCurrencyCode, setBaseCurrencyCode] = useState(
    organisation.base_currency_code || "NGN"
  );
  const [reportingFrameworkCode, setReportingFrameworkCode] = useState(
    organisation.reporting_framework_code || "IFRS"
  );

  const [onboardingStatus, setOnboardingStatus] = useState(
    organisation.onboarding_status || "ONBOARDING"
  );
  const [riskRating, setRiskRating] = useState(
    organisation.risk_rating || "NOT_ASSESSED"
  );

  const [primaryEmail, setPrimaryEmail] = useState(
    organisation.primary_email || ""
  );
  const [primaryPhone, setPrimaryPhone] = useState(
    organisation.primary_phone || ""
  );
  const [primaryContactName, setPrimaryContactName] = useState(
    organisation.primary_contact_name || ""
  );
  const [primaryContactEmail, setPrimaryContactEmail] = useState(
    organisation.primary_contact_email || ""
  );
  const [primaryContactPhone, setPrimaryContactPhone] = useState(
    organisation.primary_contact_phone || ""
  );

  const [accountingYearStartMonth, setAccountingYearStartMonth] = useState(
    organisation.accounting_year_start_month || 1
  );
  const [accountingYearStartDay, setAccountingYearStartDay] = useState(
    organisation.accounting_year_start_day || 1
  );
  const [accountingYearEndMonth, setAccountingYearEndMonth] = useState(
    organisation.accounting_year_end_month || 12
  );
  const [accountingYearEndDay, setAccountingYearEndDay] = useState(
    organisation.accounting_year_end_day || 31
  );

  const [submitting, setSubmitting] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  function handleCountryChange(nextCountryCode: string) {
    setCountryCode(nextCountryCode);
    setCountryName(getCountryName(nextCountryCode));
  }

  async function handleLogoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setSuccessMessage("");
    setErrorMessage("");

    const allowedTypes = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

    if (!allowedTypes.includes(file.type)) {
      setErrorMessage("Logo must be a PNG, JPG, WEBP, or SVG file.");
      event.target.value = "";
      return;
    }

    const maxSizeInBytes = 500 * 1024;

    if (file.size > maxSizeInBytes) {
      setErrorMessage("Logo file is too large. Please upload a file under 500KB.");
      event.target.value = "";
      return;
    }

    setUploadingLogo(true);

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setLogoUrl(dataUrl);
      setSuccessMessage("Logo selected. Click Save Organisation Settings to keep it.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to upload logo."
      );
    } finally {
      setUploadingLogo(false);
      event.target.value = "";
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitting(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const response = await fetch(
        `/api/organisations/${organisation.id}/accounting-year`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            legal_name: legalName,
            trading_name: tradingName || null,
            logo_url: logoUrl || null,
            country_code: countryCode || null,
            country_name: countryName || null,
            primary_email: primaryEmail || null,
            primary_phone: primaryPhone || null,
            primary_contact_name: primaryContactName || null,
            primary_contact_email: primaryContactEmail || null,
            primary_contact_phone: primaryContactPhone || null,
            risk_rating: riskRating,
            onboarding_status: onboardingStatus,
            base_currency_code: baseCurrencyCode,
            reporting_framework_code: reportingFrameworkCode,
            accounting_year_start_month: accountingYearStartMonth,
            accounting_year_start_day: accountingYearStartDay,
            accounting_year_end_month: accountingYearEndMonth,
            accounting_year_end_day: accountingYearEndDay,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Unable to save organisation settings."
        );
      }

      setSuccessMessage("Organisation settings saved successfully.");
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to save organisation settings."
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
      <div>
        <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
          Core Organisation Profile
        </div>

        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
          Organisation setup
        </h2>

        <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-600">
          Maintain the client’s core identity, reporting framework, primary
          contact details, risk status, onboarding status, logo, and accounting
          year. These settings support the wider accounting and reporting
          workflow.
        </p>
      </div>

      {successMessage ? (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
          {successMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <section className="mt-8 rounded-[1.5rem] border border-[#D9E3F4] bg-[#F8FAFC] p-6">
        <h3 className="text-base font-semibold text-slate-950">Identity</h3>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Legal name
            </span>
            <input
              value={legalName}
              onChange={(event) => setLegalName(event.target.value)}
              required
              className="mt-2 w-full rounded-2xl border border-[#D9E3F4] bg-white px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Trading name
            </span>
            <input
              value={tradingName}
              onChange={(event) => setTradingName(event.target.value)}
              placeholder="Optional trading or brand name"
              className="mt-2 w-full rounded-2xl border border-[#D9E3F4] bg-white px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
            />
          </label>

          <div className="md:col-span-2">
            <span className="text-sm font-semibold text-slate-700">
              Logo
            </span>

            <div className="mt-3 grid gap-5 lg:grid-cols-[auto_1fr] lg:items-start">
              <div className="flex h-28 w-28 items-center justify-center rounded-3xl border border-[#D9E3F4] bg-white p-3">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Organisation logo preview"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <div className="text-center text-xs font-semibold text-slate-400">
                    No logo
                  </div>
                )}
              </div>

              <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-5">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">
                    Upload logo file
                  </span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={handleLogoUpload}
                    disabled={uploadingLogo}
                    className="mt-2 w-full rounded-2xl border border-[#D9E3F4] bg-white px-4 py-3 text-sm file:mr-4 file:rounded-full file:border-0 file:bg-[#073D7F] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </label>

                <p className="mt-3 text-xs leading-6 text-slate-500">
                  Accepted formats: PNG, JPG, WEBP, SVG. Maximum file size:
                  500KB. After choosing a file, click Save Organisation Settings.
                </p>

                <label className="mt-5 block">
                  <span className="text-sm font-semibold text-slate-700">
                    Or paste logo URL
                  </span>
                  <input
                    value={logoUrl}
                    onChange={(event) => setLogoUrl(event.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="mt-2 w-full rounded-2xl border border-[#D9E3F4] bg-white px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
                  />
                </label>

                {logoUrl ? (
                  <button
                    type="button"
                    onClick={() => setLogoUrl("")}
                    className="mt-4 rounded-full border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-700"
                  >
                    Remove Logo
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-[1.5rem] border border-[#D9E3F4] bg-[#F8FAFC] p-6">
        <h3 className="text-base font-semibold text-slate-950">
          Jurisdiction & Reporting
        </h3>

        <div className="mt-5 grid gap-5 md:grid-cols-3">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Country
            </span>
            <select
              value={countryCode}
              onChange={(event) => handleCountryChange(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-[#D9E3F4] bg-white px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
            >
              {countries.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Primary currency
            </span>
            <select
              value={baseCurrencyCode}
              onChange={(event) => setBaseCurrencyCode(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-[#D9E3F4] bg-white px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
            >
              {currencies.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Reporting framework
            </span>
            <select
              value={reportingFrameworkCode}
              onChange={(event) =>
                setReportingFrameworkCode(event.target.value)
              }
              className="mt-2 w-full rounded-2xl border border-[#D9E3F4] bg-white px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
            >
              {reportingFrameworks.map((framework) => (
                <option key={framework.value} value={framework.value}>
                  {framework.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="mt-6 rounded-[1.5rem] border border-[#D9E3F4] bg-[#F8FAFC] p-6">
        <h3 className="text-base font-semibold text-slate-950">Client Status</h3>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Onboarding status
            </span>
            <select
              value={onboardingStatus}
              onChange={(event) => setOnboardingStatus(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-[#D9E3F4] bg-white px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
            >
              {onboardingStatuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Risk rating
            </span>
            <select
              value={riskRating}
              onChange={(event) => setRiskRating(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-[#D9E3F4] bg-white px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
            >
              {riskRatings.map((risk) => (
                <option key={risk.value} value={risk.value}>
                  {risk.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="mt-6 rounded-[1.5rem] border border-[#D9E3F4] bg-[#F8FAFC] p-6">
        <h3 className="text-base font-semibold text-slate-950">
          Contact Information
        </h3>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              General email address
            </span>
            <input
              type="email"
              value={primaryEmail}
              onChange={(event) => setPrimaryEmail(event.target.value)}
              placeholder="client@example.com"
              className="mt-2 w-full rounded-2xl border border-[#D9E3F4] bg-white px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              General phone number
            </span>
            <input
              value={primaryPhone}
              onChange={(event) => setPrimaryPhone(event.target.value)}
              placeholder="+234..."
              className="mt-2 w-full rounded-2xl border border-[#D9E3F4] bg-white px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Primary contact person name
            </span>
            <input
              value={primaryContactName}
              onChange={(event) => setPrimaryContactName(event.target.value)}
              placeholder="Contact person name"
              className="mt-2 w-full rounded-2xl border border-[#D9E3F4] bg-white px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Primary contact person email
            </span>
            <input
              type="email"
              value={primaryContactEmail}
              onChange={(event) => setPrimaryContactEmail(event.target.value)}
              placeholder="contact@example.com"
              className="mt-2 w-full rounded-2xl border border-[#D9E3F4] bg-white px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
            />
          </label>

          <label className="block md:col-span-2">
            <span className="text-sm font-semibold text-slate-700">
              Primary contact person phone
            </span>
            <input
              value={primaryContactPhone}
              onChange={(event) => setPrimaryContactPhone(event.target.value)}
              placeholder="+234..."
              className="mt-2 w-full rounded-2xl border border-[#D9E3F4] bg-white px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
            />
          </label>
        </div>
      </section>

      <section className="mt-6 rounded-[1.5rem] border border-[#D9E3F4] bg-[#F8FAFC] p-6">
        <h3 className="text-base font-semibold text-slate-950">
          Accounting Year
        </h3>

        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
          Set the organisation’s accounting year start and end date. This
          supports reporting defaults, year-end close, period locks, and future
          automated financial statement period generation.
        </p>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6">
            <h4 className="text-base font-semibold text-slate-950">
              Accounting year start
            </h4>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Start month
                </span>
                <select
                  value={accountingYearStartMonth}
                  onChange={(event) =>
                    setAccountingYearStartMonth(Number(event.target.value))
                  }
                  className="mt-2 w-full rounded-2xl border border-[#D9E3F4] bg-white px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
                >
                  {months.map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Start day
                </span>
                <select
                  value={accountingYearStartDay}
                  onChange={(event) =>
                    setAccountingYearStartDay(Number(event.target.value))
                  }
                  className="mt-2 w-full rounded-2xl border border-[#D9E3F4] bg-white px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
                >
                  {days.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6">
            <h4 className="text-base font-semibold text-slate-950">
              Accounting year end
            </h4>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  End month
                </span>
                <select
                  value={accountingYearEndMonth}
                  onChange={(event) =>
                    setAccountingYearEndMonth(Number(event.target.value))
                  }
                  className="mt-2 w-full rounded-2xl border border-[#D9E3F4] bg-white px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
                >
                  {months.map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  End day
                </span>
                <select
                  value={accountingYearEndDay}
                  onChange={(event) =>
                    setAccountingYearEndDay(Number(event.target.value))
                  }
                  className="mt-2 w-full rounded-2xl border border-[#D9E3F4] bg-white px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
                >
                  {days.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-[1.5rem] border border-[#D9E3F4] bg-white p-5">
          <p className="text-sm leading-7 text-slate-600">
            <span className="font-semibold text-slate-950">Example:</span> If
            the accounting year runs from 1 January to 31 December, select
            January 1 as the start and December 31 as the end. If it runs from 1
            April to 31 March, select April 1 as the start and March 31 as the
            end.
          </p>
        </div>
      </section>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-[#073D7F] px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Saving..." : "Save Organisation Settings"}
        </button>

        <a
          href={`/portal/organisations/${organisation.id}`}
          className="rounded-full border border-[#D9E3F4] bg-white px-6 py-3 text-center text-sm font-semibold text-[#073D7F]"
        >
          Back to Workspace
        </a>
      </div>
    </form>
  );
}