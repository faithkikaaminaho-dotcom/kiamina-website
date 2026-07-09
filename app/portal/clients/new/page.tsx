"use client";

import {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { CheckCircle } from "lucide-react";

type Jurisdiction = {
  code: string;
  name: string;
  reporting_framework_code: string;
  currency_code: string;
};

type Industry = {
  id: string;
  name: string;
};

export default function NewClientPage() {
  const [jurisdictions, setJurisdictions] = useState<Jurisdiction[]>([]);
  const [industries, setIndustries] = useState<Industry[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    jurisdiction_code: "",
    city: "",
    industry_id: "",
    business_type: "",
  });

  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadMasterData = async () => {
      try {
        const response = await fetch("/api/master-data/client-form", {
          cache: "no-store",
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Unable to load master data.");
        }

        setJurisdictions(result.jurisdictions || []);
        setIndustries(result.industries || []);
      } catch (error) {
        setStatus("error");
        setMessage(
          error instanceof Error
            ? error.message
            : "Unable to load master data."
        );
      }
    };

    loadMasterData();
  }, []);

  const selectedJurisdiction = jurisdictions.find(
    (item) => item.code === formData.jurisdiction_code
  );

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.name || !formData.jurisdiction_code) {
      setStatus("error");
      setMessage("Client name and jurisdiction are required.");
      return;
    }

    try {
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
        throw new Error(result.error || "Unable to create client.");
      }

      setStatus("success");
      setMessage("Client workspace created successfully.");

      setFormData({
        name: "",
        jurisdiction_code: "",
        city: "",
        industry_id: "",
        business_type: "",
      });
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error ? error.message : "Unable to create client."
      );
    }
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
          Add a new client organisation to Kiamina Platform. The selected
          jurisdiction automatically determines the reporting framework and base
          currency.
        </p>

        <div className="mt-10 rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-medium text-slate-700">
                Client / Organisation Name *
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
                  Jurisdiction *
                </label>
                <select
                  name="jurisdiction_code"
                  value={formData.jurisdiction_code}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
                >
                  <option value="">Select jurisdiction</option>
                  {jurisdictions.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.name}
                    </option>
                  ))}
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

            {selectedJurisdiction ? (
              <div className="rounded-2xl bg-[#F1F1F1] p-5 text-sm text-slate-600">
                <div className="font-semibold text-[#073D7F]">
                  Auto-configured from jurisdiction
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    Reporting Framework:{" "}
                    <span className="font-semibold text-slate-950">
                      {selectedJurisdiction.reporting_framework_code ===
                      "US_GAAP"
                        ? "US GAAP"
                        : selectedJurisdiction.reporting_framework_code}
                    </span>
                  </div>
                  <div>
                    Base Currency:{" "}
                    <span className="font-semibold text-slate-950">
                      {selectedJurisdiction.currency_code}
                    </span>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Industry
                </label>
                <select
                  name="industry_id"
                  value={formData.industry_id}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
                >
                  <option value="">Select industry</option>
                  {industries.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
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