"use client";

import { useState } from "react";
import { ArrowLeft, CheckCircle, UserPlus } from "lucide-react";

export default function InvitePersonPage() {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    role: "STAFF",
    job_title: "",
    team: "",
    office: "",
    phone: "",
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

    if (!formData.full_name || !formData.email || !formData.role) {
      setStatus("error");
      setMessage("Full name, email, and access role are required.");
      return;
    }

    try {
      setStatus("loading");
      setMessage("Sending invitation...");

      const response = await fetch("/api/admin/users/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to invite person.");
      }

      setStatus("success");
      setMessage("Invitation sent successfully.");

      setFormData({
        full_name: "",
        email: "",
        role: "STAFF",
        job_title: "",
        team: "",
        office: "",
        phone: "",
      });
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error ? error.message : "Unable to invite person."
      );
    }
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <section className="border-b border-[#D9E3F4] bg-white">
        <div className="mx-auto max-w-4xl px-6 py-8 lg:px-8">
          <a
            href="/portal/people"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#073D7F]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to People
          </a>

          <div className="mt-8">
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
              People
            </div>

            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
              Invite person
            </h1>

            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
              Invite internal staff or client users to Kiamina Platform. The
              invited person will receive an email to activate their account.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-12 lg:px-8">
        <div className="rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F1F1F1] text-[#073D7F]">
            <UserPlus className="h-5 w-5" />
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Full Name *
                </label>
                <input
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
                  placeholder="Full name"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
                  placeholder="email@example.com"
                />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Access Role *
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
                >
                  <option value="SUPER_ADMIN">Platform Owner</option>
                  <option value="ADMIN">Administrator</option>
                  <option value="STAFF">Team Member</option>
                  <option value="CLIENT">Client User</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Job Title
                </label>
                <input
                  name="job_title"
                  value={formData.job_title}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
                  placeholder="Senior Accountant"
                />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-3">
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Team
                </label>
                <select
                  name="team"
                  value={formData.team}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
                >
                  <option value="">Select team</option>
                  <option value="Accounting">Accounting</option>
                  <option value="Tax">Tax</option>
                  <option value="Payroll">Payroll</option>
                  <option value="Compliance">Compliance</option>
                  <option value="Advisory">Advisory</option>
                  <option value="Administration">Administration</option>
                  <option value="IT">IT</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Office
                </label>
                <select
                  name="office"
                  value={formData.office}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
                >
                  <option value="">Select office</option>
                  <option value="Port Harcourt">Port Harcourt</option>
                  <option value="Lagos">Lagos</option>
                  <option value="Abuja">Abuja</option>
                  <option value="Remote">Remote</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Phone
                </label>
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
                  placeholder="+234..."
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={status === "loading"}
              className="rounded-full bg-[#073D7F] px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
            >
              {status === "loading" ? "Sending..." : "Send Invitation"}
            </button>

            {message ? (
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
                    <span>{message}</span>
                  </div>
                ) : (
                  message
                )}
              </div>
            ) : null}
          </form>
        </div>
      </section>
    </main>
  );
}