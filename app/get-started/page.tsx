"use client";

import { useState } from "react";
import { CheckCircle } from "lucide-react";

export default function GetStartedPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    service: "",
    message: "",
  });

  const [status, setStatus] = useState("idle");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.name || !formData.email) {
      setStatus("error");
      return;
    }

    // Simulate submission (replace later with API)
    setStatus("loading");

    setTimeout(() => {
      setStatus("success");
      setFormData({
        name: "",
        email: "",
        company: "",
        service: "",
        message: "",
      });
    }, 1000);
  };

  return (
    <main>
      <section className="bg-[#073D7F] py-24 text-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="max-w-4xl">
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
              Get Started
            </div>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
              Start a structured conversation about your accounting and advisory needs.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-blue-100">
              Tell us about your business or organization, and we will guide you on the best approach to strengthen your financial systems, reporting, and compliance.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-20 lg:px-8">
        <div className="rounded-[2rem] border border-[#D9E3F4] bg-white p-10 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-sm font-medium text-slate-700">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="mt-2 w-full rounded-xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="mt-2 w-full rounded-xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
                placeholder="Your email"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Company / Organization
              </label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                className="mt-2 w-full rounded-xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
                placeholder="Company name"
              />
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
                <option value="bookkeeping">Bookkeeping</option>
                <option value="payroll">Payroll Processing</option>
                <option value="reporting">Financial Reporting</option>
                <option value="tax">Tax Compliance</option>
                <option value="cfo">CFO Consulting</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Message
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={4}
                className="mt-2 w-full rounded-xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
                placeholder="Tell us about your needs"
              />
            </div>

            <button
              type="submit"
              className="inline-flex items-center rounded-full bg-[#073D7F] px-6 py-3 text-sm font-semibold text-white transition hover:shadow-lg"
              disabled={status === "loading"}
            >
              {status === "loading" ? "Submitting..." : "Submit Request"}
            </button>

            {status === "success" && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                Your request has been submitted successfully.
              </div>
            )}

            {status === "error" && (
              <div className="text-sm text-red-600">
                Please fill in required fields.
              </div>
            )}
          </form>
        </div>
      </section>
    </main>
  );
}