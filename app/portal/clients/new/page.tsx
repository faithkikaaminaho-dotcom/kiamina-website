"use client";

import { useState } from "react";
import { CheckCircle } from "lucide-react";

export default function NewClientPage() {
  
  const [formData, setFormData] = useState({
    name: "",
    country: "",
    city: "",
    industry: "",
    business_type: "",
  });

  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.name || !formData.country) {
      setStatus("error");
      setMessage("Client name and country are required.");
      return;
    }

    setStatus("loading");
    setMessage("Creating client workspace...");

    const response = await fetch("/api/clients", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    const result = await response.json();

    if (!response.ok) {
      setStatus("error");
      setMessage(result.error || "Unable to create client.");
      return;
    }

    setStatus("success");
    setMessage("Client workspace created successfully.");

    setFormData({
      name: "",
      country: "",
      city: "",
      industry: "",
      business_type: "",
    });
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
          Super Admin
        </div>

        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
          Create client workspace
        </h1>

        <p className="mt-4 text-base leading-8 text-slate-600">
          Add a new client organization to the Kiamina portal. This creates the
          client workspace record used for onboarding, KYC, documents,
          approvals, and audit workflows.
        </p>

        <div className="mt-10 rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-medium text-slate-700">
                Client / Organization Name *
              </label>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="mt-2 w-full rounded-xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
                placeholder="Example: ABC Limited"
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
                <input
                  name="industry"
                  value={formData.industry}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
                  placeholder="Industry"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Business Type
                </label>
                <input
                  name="business_type"
                  value={formData.business_type}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
                  placeholder="Limited Company, NGO, Startup..."
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={status === "loading"}
              className="rounded-full bg-[#073D7F] px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
            >
              {status === "loading" ? "Creating..." : "Create Client"}
            </button>

            {message ? (
              <div
                className={`rounded-xl px-4 py-3 text-sm ${
                  status === "success"
                    ? "bg-emerald-50 text-emerald-700"
                    : status === "error"
                    ? "bg-red-50 text-red-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {status === "success" ? (
                  <div className="flex gap-2">
                    <CheckCircle className="h-4 w-4" />
                    <span>{message}</span>
                  </div>
                ) : (
                  message
                )}
              </div>
            ) : null}
          </form>
        </div>
      </div>
    </main>
  );
}