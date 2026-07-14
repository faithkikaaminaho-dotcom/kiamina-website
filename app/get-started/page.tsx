"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ClipboardList,
  FileText,
  Loader2,
  Mail,
  Phone,
  User,
} from "lucide-react";

const jurisdictions = [
  {
    code: "NG",
    country: "Nigeria",
    currency: "NGN",
    framework: "IFRS",
  },
  {
    code: "CA",
    country: "Canada",
    currency: "CAD",
    framework: "IFRS",
  },
  {
    code: "US",
    country: "United States",
    currency: "USD",
    framework: "US GAAP",
  },
  {
    code: "GB",
    country: "United Kingdom",
    currency: "GBP",
    framework: "IFRS",
  },
  {
    code: "AU",
    country: "Australia",
    currency: "AUD",
    framework: "IFRS",
  },
  {
    code: "IE",
    country: "Ireland",
    currency: "EUR",
    framework: "IFRS",
  },
];

const industries = [
  "Oil & Gas Servicing",
  "Real Estate",
  "ICT",
  "Construction",
  "Nonprofits",
  "Other Service Organisations",
];

const services = [
  "Bookkeeping",
  "Payroll Processing",
  "Financial Reporting",
  "Management Reporting",
  "Accounts Receivable and Payable Management",
  "CFO Consulting",
  "Financial Modelling",
  "Tax Compliance",
  "Full Service Finance Support",
];

const transactionVolumes = [
  "Less than 50 transactions per month",
  "50 - 100 transactions per month",
  "101 - 250 transactions per month",
  "251 - 500 transactions per month",
  "More than 500 transactions per month",
  "Not sure",
];

const payrollSizes = [
  "No payroll",
  "1 - 5 employees",
  "6 - 20 employees",
  "21 - 50 employees",
  "More than 50 employees",
  "Not sure",
];

const reportingFrequencies = [
  "Monthly",
  "Quarterly",
  "Annually",
  "Project-based",
  "Board / donor / investor reporting",
  "Not sure",
];

const documentationStatuses = [
  "Well organised",
  "Partially organised",
  "Poorly organised",
  "Mostly unavailable",
  "Not sure",
];

function getJurisdiction(code: string) {
  return (
    jurisdictions.find((jurisdiction) => jurisdiction.code === code) ||
    jurisdictions[0]
  );
}

export default function GetStartedPage() {
  const [selectedJurisdictionCode, setSelectedJurisdictionCode] = useState("NG");
  const [servicesNeeded, setServicesNeeded] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const selectedJurisdiction = useMemo(
    () => getJurisdiction(selectedJurisdictionCode),
    [selectedJurisdictionCode]
  );

  useEffect(() => {
    const savedCode = localStorage.getItem("kiamina_jurisdiction");

    if (savedCode && jurisdictions.some((item) => item.code === savedCode)) {
      setSelectedJurisdictionCode(savedCode);
    }

    const handleJurisdictionChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ code?: string }>;
      const code = customEvent.detail?.code;

      if (code && jurisdictions.some((item) => item.code === code)) {
        setSelectedJurisdictionCode(code);
      }
    };

    window.addEventListener(
      "kiamina-jurisdiction-change",
      handleJurisdictionChange
    );

    return () => {
      window.removeEventListener(
        "kiamina-jurisdiction-change",
        handleJurisdictionChange
      );
    };
  }, []);

  function toggleService(service: string) {
    setServicesNeeded((current) => {
      if (current.includes(service)) {
        return current.filter((item) => item !== service);
      }

      return [...current, service];
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSubmitting(true);
    setErrorMessage("");

    const formData = new FormData(event.currentTarget);

    const payload = {
      organisation_name: formData.get("organisation_name")?.toString() || "",
      contact_name: formData.get("contact_name")?.toString() || "",
      contact_email: formData.get("contact_email")?.toString() || "",
      contact_phone: formData.get("contact_phone")?.toString() || "",

      jurisdiction_code: selectedJurisdiction.code,
      country: selectedJurisdiction.country,
      currency: selectedJurisdiction.currency,
      reporting_framework: selectedJurisdiction.framework,

      industry: formData.get("industry")?.toString() || "",
      services_needed: servicesNeeded,

      monthly_transaction_volume:
        formData.get("monthly_transaction_volume")?.toString() || "",
      payroll_size: formData.get("payroll_size")?.toString() || "",
      reporting_frequency:
        formData.get("reporting_frequency")?.toString() || "",
      has_backlog: formData.get("has_backlog")?.toString() || "",
      backlog_details: formData.get("backlog_details")?.toString() || "",

      compliance_concerns:
        formData.get("compliance_concerns")?.toString() || "",
      current_accounting_system:
        formData.get("current_accounting_system")?.toString() || "",
      documentation_status:
        formData.get("documentation_status")?.toString() || "",

      message: formData.get("message")?.toString() || "",
    };

    if (!payload.organisation_name.trim()) {
      setErrorMessage("Please enter the organisation name.");
      setIsSubmitting(false);
      return;
    }

    if (!payload.contact_name.trim()) {
      setErrorMessage("Please enter the contact person's name.");
      setIsSubmitting(false);
      return;
    }

    if (!payload.contact_email.trim()) {
      setErrorMessage("Please enter the contact email address.");
      setIsSubmitting(false);
      return;
    }

    if (!payload.industry.trim()) {
      setErrorMessage("Please select your industry.");
      setIsSubmitting(false);
      return;
    }

    if (!payload.services_needed.length) {
      setErrorMessage("Please select at least one service.");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/service-inquiries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to submit inquiry.");
      }

      setSubmitted(true);
      setServicesNeeded([]);
      event.currentTarget.reset();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to submit inquiry. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <main className="bg-white">
        <section className="px-6 py-24 lg:px-8">
          <div className="mx-auto max-w-3xl rounded-[2rem] border border-[#D9E3F4] bg-[#F8FAFC] p-10 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#073D7F] text-white">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-slate-950">
              Your inquiry has been received.
            </h1>

            <p className="mt-4 text-base leading-8 text-slate-600">
              Thank you for contacting Kiamina Accounting Services. Our team
              will review your information and respond with the appropriate next
              steps.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-full bg-[#073D7F] px-6 py-3 text-sm font-semibold text-white"
              >
                Return Home
              </Link>

              <Link
                href="/pricing"
                className="inline-flex items-center justify-center rounded-full border border-[#D9E3F4] bg-white px-6 py-3 text-sm font-semibold text-[#073D7F]"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="bg-white">
      <section className="relative overflow-hidden bg-[#073D7F] px-6 py-24 text-white lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(100,145,222,0.35),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.16),transparent_30%)]" />

        <div className="relative mx-auto max-w-7xl">
          <div className="max-w-4xl">
            <div className="text-sm font-semibold uppercase tracking-[0.28em] text-[#A9C7FF]">
              Get Started
            </div>

            <h1 className="mt-6 text-5xl font-semibold tracking-tight sm:text-6xl">
              Tell us about your accounting and finance support needs.
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-9 text-blue-100">
              Complete the form below so we can understand your organisation,
              jurisdiction, service needs, documentation status, reporting
              requirements, and compliance priorities.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[#F8FAFC] px-6 py-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.75fr_1.25fr]">
          <aside className="rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F1F6FF] text-[#073D7F]">
              <ClipboardList className="h-6 w-6" />
            </div>

            <h2 className="mt-6 text-2xl font-semibold text-slate-950">
              What happens after submission?
            </h2>

            <div className="mt-6 space-y-5">
              {[
                {
                  title: "Scope review",
                  text: "We review your service needs, jurisdiction, industry, volume, backlog, and compliance exposure.",
                },
                {
                  title: "Advisory assessment",
                  text: "We assess what level of support is required across bookkeeping, payroll, reporting, tax, CFO advisory, or full service.",
                },
                {
                  title: "Next steps",
                  text: "We contact you with recommended scope, information requirements, and suitable pricing structure.",
                },
              ].map((item) => (
                <div key={item.title} className="border-t border-[#D9E3F4] pt-5">
                  <div className="text-sm font-semibold text-slate-950">
                    {item.title}
                  </div>

                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-2xl bg-[#073D7F] p-6 text-white">
              <div className="text-sm font-semibold uppercase tracking-[0.2em] text-[#A9C7FF]">
                Current jurisdiction
              </div>

              <div className="mt-3 text-2xl font-semibold">
                {selectedJurisdiction.country}
              </div>

              <p className="mt-2 text-sm leading-7 text-blue-100">
                {selectedJurisdiction.framework} · {selectedJurisdiction.currency}
              </p>
            </div>
          </aside>

          <form
            onSubmit={handleSubmit}
            className="rounded-[2rem] border border-[#D9E3F4] bg-white p-6 shadow-sm sm:p-8"
          >
            {errorMessage ? (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
                {errorMessage}
              </div>
            ) : null}

            <div className="grid gap-6 sm:grid-cols-2">
              <label className="block">
                <span className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                  <Building2 className="h-4 w-4 text-[#073D7F]" />
                  Organisation name
                </span>
                <input
                  name="organisation_name"
                  type="text"
                  className="mt-3 h-12 w-full rounded-2xl border border-[#D9E3F4] px-4 text-sm outline-none transition focus:border-[#073D7F]"
                  placeholder="Enter organisation name"
                  required
                />
              </label>

              <label className="block">
                <span className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                  <User className="h-4 w-4 text-[#073D7F]" />
                  Contact name
                </span>
                <input
                  name="contact_name"
                  type="text"
                  className="mt-3 h-12 w-full rounded-2xl border border-[#D9E3F4] px-4 text-sm outline-none transition focus:border-[#073D7F]"
                  placeholder="Enter contact person"
                  required
                />
              </label>

              <label className="block">
                <span className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                  <Mail className="h-4 w-4 text-[#073D7F]" />
                  Email address
                </span>
                <input
                  name="contact_email"
                  type="email"
                  className="mt-3 h-12 w-full rounded-2xl border border-[#D9E3F4] px-4 text-sm outline-none transition focus:border-[#073D7F]"
                  placeholder="name@company.com"
                  required
                />
              </label>

              <label className="block">
                <span className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                  <Phone className="h-4 w-4 text-[#073D7F]" />
                  Phone number
                </span>
                <input
                  name="contact_phone"
                  type="tel"
                  className="mt-3 h-12 w-full rounded-2xl border border-[#D9E3F4] px-4 text-sm outline-none transition focus:border-[#073D7F]"
                  placeholder="Enter phone number"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-950">
                  Jurisdiction
                </span>
                <select
                  value={selectedJurisdictionCode}
                  onChange={(event) => {
                    const code = event.target.value;
                    setSelectedJurisdictionCode(code);
                    localStorage.setItem("kiamina_jurisdiction", code);

                    window.dispatchEvent(
                      new CustomEvent("kiamina-jurisdiction-change", {
                        detail: { code, source: "manual" },
                      })
                    );
                  }}
                  className="mt-3 h-12 w-full rounded-2xl border border-[#D9E3F4] bg-white px-4 text-sm outline-none transition focus:border-[#073D7F]"
                >
                  {jurisdictions.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.country} · {item.currency}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-950">
                  Industry
                </span>
                <select
                  name="industry"
                  className="mt-3 h-12 w-full rounded-2xl border border-[#D9E3F4] bg-white px-4 text-sm outline-none transition focus:border-[#073D7F]"
                  required
                >
                  <option value="">Select industry</option>
                  {industries.map((industry) => (
                    <option key={industry} value={industry}>
                      {industry}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-8">
              <div className="text-sm font-semibold text-slate-950">
                Services needed
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {services.map((service) => {
                  const active = servicesNeeded.includes(service);

                  return (
                    <button
                      key={service}
                      type="button"
                      onClick={() => toggleService(service)}
                      className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                        active
                          ? "border-[#073D7F] bg-[#F1F6FF] text-[#073D7F]"
                          : "border-[#D9E3F4] bg-white text-slate-700 hover:bg-[#F8FAFC]"
                      }`}
                    >
                      {service}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-slate-950">
                  Monthly transaction volume
                </span>
                <select
                  name="monthly_transaction_volume"
                  className="mt-3 h-12 w-full rounded-2xl border border-[#D9E3F4] bg-white px-4 text-sm outline-none transition focus:border-[#073D7F]"
                >
                  <option value="">Select volume</option>
                  {transactionVolumes.map((volume) => (
                    <option key={volume} value={volume}>
                      {volume}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-950">
                  Payroll size
                </span>
                <select
                  name="payroll_size"
                  className="mt-3 h-12 w-full rounded-2xl border border-[#D9E3F4] bg-white px-4 text-sm outline-none transition focus:border-[#073D7F]"
                >
                  <option value="">Select payroll size</option>
                  {payrollSizes.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-950">
                  Reporting frequency
                </span>
                <select
                  name="reporting_frequency"
                  className="mt-3 h-12 w-full rounded-2xl border border-[#D9E3F4] bg-white px-4 text-sm outline-none transition focus:border-[#073D7F]"
                >
                  <option value="">Select frequency</option>
                  {reportingFrequencies.map((frequency) => (
                    <option key={frequency} value={frequency}>
                      {frequency}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-950">
                  Documentation status
                </span>
                <select
                  name="documentation_status"
                  className="mt-3 h-12 w-full rounded-2xl border border-[#D9E3F4] bg-white px-4 text-sm outline-none transition focus:border-[#073D7F]"
                >
                  <option value="">Select status</option>
                  {documentationStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-950">
                  Do you have accounting backlog?
                </span>
                <select
                  name="has_backlog"
                  className="mt-3 h-12 w-full rounded-2xl border border-[#D9E3F4] bg-white px-4 text-sm outline-none transition focus:border-[#073D7F]"
                >
                  <option value="">Select option</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                  <option value="Not sure">Not sure</option>
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-950">
                  Current accounting system
                </span>
                <input
                  name="current_accounting_system"
                  type="text"
                  className="mt-3 h-12 w-full rounded-2xl border border-[#D9E3F4] px-4 text-sm outline-none transition focus:border-[#073D7F]"
                  placeholder="QuickBooks, Xero, Excel, Sage, Zoho, etc."
                />
              </label>
            </div>

            <div className="mt-8 grid gap-6">
              <label className="block">
                <span className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                  <FileText className="h-4 w-4 text-[#073D7F]" />
                  Backlog details
                </span>
                <textarea
                  name="backlog_details"
                  rows={3}
                  className="mt-3 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none transition focus:border-[#073D7F]"
                  placeholder="Tell us about any pending bookkeeping, reporting, tax filing, payroll, or reconciliation backlog."
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-950">
                  Compliance concerns
                </span>
                <textarea
                  name="compliance_concerns"
                  rows={3}
                  className="mt-3 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none transition focus:border-[#073D7F]"
                  placeholder="Tell us about tax, payroll, statutory, audit, donor, lender, or board reporting concerns."
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-950">
                  Additional message
                </span>
                <textarea
                  name="message"
                  rows={4}
                  className="mt-3 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none transition focus:border-[#073D7F]"
                  placeholder="Share any additional context about your organisation and the support required."
                />
              </label>
            </div>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm leading-7 text-slate-500">
                By submitting this form, you agree that Kiamina Accounting
                Services may contact you regarding your inquiry.
              </p>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#073D7F] px-7 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Inquiry
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}