"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Building2, Loader2, Plus } from "lucide-react";

type Organisation = {
  id: string;
  legal_name: string | null;
  trading_name: string | null;
  jurisdiction_code: string | null;
};

export default function AssignOrganisationAccessForm({
  personId,
  organisations,
}: {
  personId: string;
  organisations: Organisation[];
}) {
  const router = useRouter();

  const [organisationId, setOrganisationId] = useState("");
  const [accessRole, setAccessRole] = useState("CLIENT_USER");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSubmitting(true);
    setMessage("");

    try {
      const response = await fetch(
        `/api/people/${personId}/organisation-access`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            organisation_id: organisationId,
            access_role: accessRole,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to assign access.");
      }

      setOrganisationId("");
      setAccessRole("CLIENT_USER");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to assign access."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {message ? (
        <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {message}
        </div>
      ) : null}

      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
          Organisation
        </span>

        <select
          value={organisationId}
          onChange={(event) => setOrganisationId(event.target.value)}
          required
          className="mt-3 h-12 w-full rounded-2xl border border-[#D9E3F4] bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#073D7F]"
        >
          <option value="">Select organisation</option>

          {organisations.map((organisation) => (
            <option key={organisation.id} value={organisation.id}>
              {organisation.trading_name ||
                organisation.legal_name ||
                "Unnamed organisation"}{" "}
              {organisation.jurisdiction_code
                ? `(${organisation.jurisdiction_code})`
                : ""}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
          Access Role
        </span>

        <select
          value={accessRole}
          onChange={(event) => setAccessRole(event.target.value)}
          className="mt-3 h-12 w-full rounded-2xl border border-[#D9E3F4] bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#073D7F]"
        >
          <option value="CLIENT_USER">Client User</option>
          <option value="CLIENT_APPROVER">Client Approver</option>
          <option value="CLIENT_ADMIN">Client Admin</option>
          <option value="VIEW_ONLY">View Only</option>
        </select>
      </label>

      <button
        type="submit"
        disabled={isSubmitting || organisations.length === 0}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#073D7F] px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Assigning...
          </>
        ) : (
          <>
            <Plus className="h-4 w-4" />
            Assign Organisation Access
          </>
        )}
      </button>

      {organisations.length === 0 ? (
        <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          No organisations found. Create an organisation first before assigning
          client access.
        </div>
      ) : null}
    </form>
  );
}