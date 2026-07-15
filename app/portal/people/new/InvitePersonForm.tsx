"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowRight,
  Building2,
  Loader2,
  ShieldCheck,
  UserPlus,
} from "lucide-react";

const roleOptions = [
  {
    label: "Platform Owner",
    value: "SUPER_ADMIN",
    type: "internal",
  },
  {
    label: "Administrator",
    value: "ADMIN",
    type: "internal",
  },
  {
    label: "Team Member",
    value: "STAFF",
    type: "internal",
  },
  {
    label: "Accounting Admin",
    value: "ACCOUNTANT_ADMIN",
    type: "internal",
  },
  {
    label: "Accounting User",
    value: "ACCOUNTANT_USER",
    type: "internal",
  },
  {
    label: "Customer Support",
    value: "CUSTOMER_SUPPORT",
    type: "internal",
  },
  {
    label: "Compliance Admin",
    value: "COMPLIANCE_ADMIN",
    type: "internal",
  },
  {
    label: "Operations Admin",
    value: "OPERATIONS_ADMIN",
    type: "internal",
  },
  {
    label: "IT Administrator",
    value: "IT_ADMIN",
    type: "internal",
  },
  {
    label: "Client User",
    value: "CLIENT",
    type: "client",
  },
];

const teamOptions = [
  "Accounting",
  "Advisory",
  "Compliance",
  "Operations",
  "Client Support",
  "IT / Systems",
  "Leadership",
];

const officeOptions = [
  "Port Harcourt",
  "Lagos",
  "Abuja",
  "Remote",
  "Canada",
  "United States",
  "United Kingdom",
  "Australia",
  "Ireland",
];

function isClientRole(role: string) {
  return role === "CLIENT";
}

export default function InvitePersonForm() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("STAFF");
  const [jobTitle, setJobTitle] = useState("");
  const [team, setTeam] = useState("");
  const [office, setOffice] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const clientUserSelected = isClientRole(role);

  function handleRoleChange(nextRole: string) {
    setRole(nextRole);

    if (nextRole === "CLIENT") {
      setJobTitle("");
      setTeam("");
      setOffice("");
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSubmitting(true);
    setMessage("");

    try {
      const payload = {
        full_name: fullName,
        email,
        role,
        phone,
        job_title: clientUserSelected ? null : jobTitle,
        team: clientUserSelected ? null : team,
        office: clientUserSelected ? null : office,
        status: "active",
      };

      const response = await fetch("/api/admin/users/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to invite person.");
      }

      router.push("/portal/people");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to invite person."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {message ? (
        <div className="rounded-2xl bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
          {message}
        </div>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Full Name
          </span>

          <input
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            required
            className="mt-3 h-12 w-full rounded-2xl border border-[#D9E3F4] px-4 text-sm outline-none transition focus:border-[#073D7F]"
            placeholder="Example: Faith Aminaho"
          />
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Email Address
          </span>

          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="mt-3 h-12 w-full rounded-2xl border border-[#D9E3F4] px-4 text-sm outline-none transition focus:border-[#073D7F]"
            placeholder="name@company.com"
          />
        </label>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Access Role
          </span>

          <select
            value={role}
            onChange={(event) => handleRoleChange(event.target.value)}
            className="mt-3 h-12 w-full rounded-2xl border border-[#D9E3F4] bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#073D7F]"
          >
            <optgroup label="Internal Kiamina Users">
              {roleOptions
                .filter((option) => option.type === "internal")
                .map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
            </optgroup>

            <optgroup label="Client Users">
              {roleOptions
                .filter((option) => option.type === "client")
                .map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
            </optgroup>
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Phone Number
          </span>

          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="mt-3 h-12 w-full rounded-2xl border border-[#D9E3F4] px-4 text-sm outline-none transition focus:border-[#073D7F]"
            placeholder="Optional"
          />
        </label>
      </div>

      {clientUserSelected ? (
        <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-[#F8FAFC] p-6">
          <div className="flex items-start gap-4">
            <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#073D7F]">
              <Building2 className="h-5 w-5" />
            </div>

            <div>
              <h3 className="text-base font-semibold text-slate-950">
                Client user selected
              </h3>

              <p className="mt-2 text-sm leading-7 text-slate-600">
                Internal Kiamina fields such as Job Title, Team, and Office are
                hidden because client users should be linked to an organisation
                or client workspace instead of an internal team.
              </p>

              <p className="mt-3 text-sm font-semibold text-[#073D7F]">
                Organisation access will be configured separately after the user
                record is created.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-[#073D7F]" />
            <h3 className="text-base font-semibold text-slate-950">
              Internal Kiamina user details
            </h3>
          </div>

          <p className="mt-3 text-sm leading-7 text-slate-600">
            These fields apply to internal staff, administrators, accounting,
            compliance, operations, support, and system users.
          </p>

          <div className="mt-6 grid gap-5 md:grid-cols-3">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Job Title
              </span>

              <input
                value={jobTitle}
                onChange={(event) => setJobTitle(event.target.value)}
                className="mt-3 h-12 w-full rounded-2xl border border-[#D9E3F4] px-4 text-sm outline-none transition focus:border-[#073D7F]"
                placeholder="Example: Accountant"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Team
              </span>

              <select
                value={team}
                onChange={(event) => setTeam(event.target.value)}
                className="mt-3 h-12 w-full rounded-2xl border border-[#D9E3F4] bg-white px-4 text-sm outline-none transition focus:border-[#073D7F]"
              >
                <option value="">Select team</option>
                {teamOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Office
              </span>

              <select
                value={office}
                onChange={(event) => setOffice(event.target.value)}
                className="mt-3 h-12 w-full rounded-2xl border border-[#D9E3F4] bg-white px-4 text-sm outline-none transition focus:border-[#073D7F]"
              >
                <option value="">Select office</option>
                {officeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <a
          href="/portal/people"
          className="rounded-full border border-[#D9E3F4] bg-white px-6 py-3 text-center text-sm font-semibold text-[#073D7F]"
        >
          Cancel
        </a>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#073D7F] px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending Invite...
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4" />
              Invite Person
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}