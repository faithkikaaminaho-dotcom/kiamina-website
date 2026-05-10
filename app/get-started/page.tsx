"use client";

import { useState } from "react";
import {
  CheckCircle,
  ShieldCheck,
  Building2,
  UserRound,
  FileCheck2,
  Lock,
  Globe2,
  UploadCloud,
} from "lucide-react";

export default function GetStartedPage() {
  const [formData, setFormData] = useState({
    clientAdminName: "",
    clientAdminEmail: "",
    phone: "",
    role: "",
    company: "",
    country: "",
    city: "",
    industry: "",
    businessType: "",
    service: "",
    message: "",
  });

  const [status, setStatus] = useState("idle");
  const [statusMessage, setStatusMessage] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.clientAdminName || !formData.clientAdminEmail || !formData.company || !formData.country) {
      setStatus("error");
      setStatusMessage("Please complete the required fields.");
      return;
    }

    try {
      setStatus("loading");
      setStatusMessage("Submitting onboarding request...");

      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.clientAdminName,
          email: formData.clientAdminEmail,
          company: formData.company,
          service: `Client onboarding request - ${formData.service || "Not selected"}`,
          message: `
New client onboarding request

Client Admin:
Name: ${formData.clientAdminName}
Email: ${formData.clientAdminEmail}
Phone: ${formData.phone}
Role: ${formData.role}

Organization:
Company: ${formData.company}
Country: ${formData.country}
City: ${formData.city}
Industry: ${formData.industry}
Business Type: ${formData.businessType}

Service Interest:
${formData.service}

Message:
${formData.message}
          `,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to submit request.");
      }

      setStatus("success");
      setStatusMessage(
        "Your onboarding request has been submitted. Kiamina will review your details and guide you through secure KYC upload and portal setup."
      );

      setFormData({
        clientAdminName: "",
        clientAdminEmail: "",
        phone: "",
        role: "",
        company: "",
        country: "",
        city: "",
        industry: "",
        businessType: "",
        service: "",
        message: "",
      });
    } catch (error) {
      setStatus("error");
      setStatusMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
    }
  };

  const kycByCountry = [
    {
      country: "Nigeria",
      documents: [
        "CAC Certificate or Business Registration",
        "CAC Status Report or equivalent",
        "Tax Identification Number / TIN",
        "Proof of Business Address",
        "Director / Owner Valid ID",
        "Authorization Letter or Board Resolution, if applicable",
      ],
    },
    {
      country: "United Kingdom",
      documents: [
        "Companies House registration details",
        "Company number",
        "VAT registration, if applicable",
        "Proof of Business Address",
        "Director / PSC Valid ID",
        "Authorization Letter, if applicable",
      ],
    },
    {
      country: "United States",
      documents: [
        "EIN confirmation letter",
        "Articles of Incorporation / Organization",
        "State registration document",
        "Proof of Business Address",
        "Owner / Director Valid ID",
        "W-9, if applicable",
      ],
    },
    {
      country: "Canada",
      documents: [
        "Business Number / CRA registration",
        "Certificate of Incorporation or Business Registration",
        "GST/HST registration, if applicable",
        "Proof of Business Address",
        "Director / Owner Valid ID",
      ],
    },
    {
      country: "Australia",
      documents: [
        "ABN / ACN details",
        "ASIC registration or business registration",
        "GST registration, if applicable",
        "Proof of Business Address",
        "Director / Owner Valid ID",
      ],
    },
    {
      country: "Ireland",
      documents: [
        "CRO company registration details",
        "Company number",
        "Tax registration details",
        "VAT registration, if applicable",
        "Proof of Business Address",
        "Director / Beneficial Owner Valid ID",
      ],
    },
  ];

  const onboardingSteps = [
    {
      title: "Submit onboarding request",
      icon: UserRound,
      body: "The prospective Client Admin provides organization details, country, service interest, and primary contact information.",
    },
    {
      title: "Kiamina reviews request",
      icon: ShieldCheck,
      body: "Kiamina reviews the onboarding request and confirms the appropriate service, compliance, and KYC requirements.",
    },
    {
      title: "Secure upload workspace",
      icon: UploadCloud,
      body: "A secure client workspace is prepared for KYC and supporting documents using private Google Cloud Storage infrastructure.",
    },
    {
      title: "Portal access created",
      icon: Lock,
      body: "After review, authorized users are set up with role-based access for document submission, approval, inquiries, and workflow tracking.",
    },
  ];

  return (
    <main>
      <section className="relative overflow-hidden bg-[#073D7F] py-24 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(100,145,222,0.16),transparent_28%),radial-gradient(circle_at_left,rgba(255,255,255,0.06),transparent_20%)]" />

        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="max-w-4xl">
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
              Get Started
            </div>

            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
              Begin client onboarding for accounting, compliance, reporting, and portal access.
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-blue-100">
              Submit your organization details and Client Admin information. Kiamina will review your request, confirm KYC requirements, and guide your team through secure portal setup.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
        <div className="space-y-8">
          <div className="rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F1F1F1] text-[#073D7F]">
              <Building2 className="h-5 w-5" />
            </div>

            <div className="mt-6 text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
              Onboarding Overview
            </div>

            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
              Designed for Client Admin setup and secure KYC preparation.
            </h2>

            <p className="mt-5 text-base leading-8 text-slate-600">
              The Client Admin is the primary contact responsible for onboarding the organization, coordinating KYC documentation, managing client-side users, and working with Kiamina during setup.
            </p>
          </div>

          <div className="grid gap-5">
            {onboardingSteps.map((step, index) => {
              const Icon = step.icon;

              return (
                <div
                  key={step.title}
                  className="rounded-[1.5rem] border border-[#D9E3F4] bg-[#F1F1F1] p-6"
                >
                  <div className="flex gap-4">
                    <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#073D7F]">
                      <Icon className="h-5 w-5" />
                    </div>

                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6491DE]">
                        Step {index + 1}
                      </div>
                      <h3 className="mt-2 text-lg font-semibold text-slate-950">
                        {step.title}
                      </h3>
                      <p className="mt-2 text-sm leading-7 text-slate-600">
                        {step.body}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-xl">
          <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
            Client Admin Request
          </div>

          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
            Submit onboarding details
          </h2>

          <p className="mt-3 text-sm leading-7 text-slate-600">
            This request does not upload KYC files yet. KYC documents will be collected through a secure upload workspace after review.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Client Admin Full Name *
                </label>
                <input
                  type="text"
                  name="clientAdminName"
                  value={formData.clientAdminName}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
                  placeholder="Full name"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Client Admin Email *
                </label>
                <input
                  type="email"
                  name="clientAdminEmail"
                  value={formData.clientAdminEmail}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
                  placeholder="Email address"
                />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Phone Number
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
                  placeholder="Phone number"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Role / Job Title
                </label>
                <input
                  type="text"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
                  placeholder="e.g. Founder, Finance Manager"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Company / Organization *
              </label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                className="mt-2 w-full rounded-xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
                placeholder="Company or organization name"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Country *
                </label>
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
                >
                  <option value="">Select country</option>
                  <option value="Nigeria">Nigeria</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="United States">United States</option>
                  <option value="Canada">Canada</option>
                  <option value="Australia">Australia</option>
                  <option value="Ireland">Ireland</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
                  placeholder="City"
                />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Industry
                </label>
                <select
                  name="industry"
                  value={formData.industry}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
                >
                  <option value="">Select industry</option>
                  <option value="Oil & Gas">Oil & Gas</option>
                  <option value="Real Estate">Real Estate</option>
                  <option value="ICT">ICT</option>
                  <option value="Construction">Construction</option>
                  <option value="Nonprofit">Nonprofit</option>
                  <option value="Professional Services">Professional Services</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Business Type
                </label>
                <select
                  name="businessType"
                  value={formData.businessType}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
                >
                  <option value="">Select type</option>
                  <option value="Limited Company">Limited Company</option>
                  <option value="Sole Proprietor">Sole Proprietor</option>
                  <option value="Partnership">Partnership</option>
                  <option value="Nonprofit / NGO">Nonprofit / NGO</option>
                  <option value="Startup">Startup</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Service of Interest
              </label>
              <select
                name="service"
                value={formData.service}
                onChange={handleChange}
                className="mt-2 w-full rounded-xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
              >
                <option value="">Select a service</option>
                <option value="Bookkeeping">Bookkeeping</option>
                <option value="Payroll Processing">Payroll Processing</option>
                <option value="Financial Reporting">Financial Reporting</option>
                <option value="Management Reporting">Management Reporting</option>
                <option value="Accounts Receivable & Payable">Accounts Receivable & Payable</option>
                <option value="Tax Compliance">Tax Compliance</option>
                <option value="CFO Consulting">CFO Consulting</option>
                <option value="Financial Modelling">Financial Modelling</option>
                <option value="Full Accounting Support">Full Accounting Support</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Message / Notes
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={4}
                className="mt-2 w-full rounded-xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
                placeholder="Tell us about your onboarding needs"
              />
            </div>

            <button
              type="submit"
              className="inline-flex items-center rounded-full bg-[#073D7F] px-6 py-3 text-sm font-semibold text-white transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
              disabled={status === "loading"}
            >
              {status === "loading" ? "Submitting..." : "Submit Onboarding Request"}
            </button>

            {statusMessage ? (
              <div
                className={`rounded-xl px-4 py-3 text-sm leading-7 ${
                  status === "success"
                    ? "bg-emerald-50 text-emerald-700"
                    : status === "error"
                    ? "bg-red-50 text-red-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {status === "success" ? (
                  <div className="flex gap-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{statusMessage}</span>
                  </div>
                ) : (
                  statusMessage
                )}
              </div>
            ) : null}
          </form>
        </div>
      </section>

      <section className="bg-[#F1F1F1]">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="max-w-3xl">
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
              KYC Requirements
            </div>

            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
              KYC documentation depends on the client’s country, structure, and services requested.
            </h2>

            <p className="mt-5 text-base leading-8 text-slate-600">
              Kiamina may request business registration documents, tax records, proof of address, director or owner identification, and authorization documents as part of onboarding and accounting firm compliance.
            </p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            {kycByCountry.map((item) => (
              <div
                key={item.country}
                className="rounded-[1.75rem] border border-[#D9E3F4] bg-white p-7 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F1F1F1] text-[#073D7F]">
                    <Globe2 className="h-5 w-5" />
                  </div>

                  <h3 className="text-xl font-semibold text-slate-950">
                    {item.country}
                  </h3>
                </div>

                <ul className="mt-6 space-y-3 text-sm leading-7 text-slate-600">
                  {item.documents.map((doc) => (
                    <li key={doc} className="flex gap-3">
                      <FileCheck2 className="mt-1 h-4 w-4 shrink-0 text-[#6491DE]" />
                      <span>{doc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-[1.75rem] border border-[#D9E3F4] bg-white p-7">
            <div className="flex gap-4">
              <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F1F1F1] text-[#073D7F]">
                <ShieldCheck className="h-5 w-5" />
              </div>

              <div>
                <h3 className="text-xl font-semibold text-slate-950">
                  Additional KYC may be requested.
                </h3>

                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Additional documents may be required depending on jurisdiction, ownership structure, risk profile, industry, beneficial owners, funding source, and the services requested.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm lg:p-10">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F1F1F1] text-[#073D7F]">
                <Lock className="h-5 w-5" />
              </div>

              <div className="mt-6 text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                Secure Storage Direction
              </div>

              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
                KYC and client documents will be stored in secure private cloud storage.
              </h2>

              <p className="mt-5 text-base leading-8 text-slate-600">
                The portal storage foundation is designed around private Google Cloud Storage, controlled access, audit logging, versioning, soft delete protection, and role-based permissions. Sensitive KYC files should only be uploaded through authenticated secure workflows.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                "Private storage bucket",
                "Role-based access",
                "KYC-restricted folder",
                "Audit logging",
                "Object versioning",
                "Soft delete protection",
                "Signed upload links",
                "Secure download control",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-[#D9E3F4] bg-[#F1F1F1] px-5 py-4 text-sm font-semibold text-[#073D7F]"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}