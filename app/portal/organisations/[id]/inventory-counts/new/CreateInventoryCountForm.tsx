"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardCheck } from "lucide-react";

export type CountLocationOption = {
  id: string;
  option_code: string | null;
  option_name: string;
};

function localDateValue() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function CreateInventoryCountForm({
  organisationId,
  locations,
}: {
  organisationId: string;
  locations: CountLocationOption[];
}) {
  const router = useRouter();
  const [countReference, setCountReference] = useState("");
  const [countDate, setCountDate] = useState(localDateValue);
  const [locationId, setLocationId] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/inventory-counts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organisation_id: organisationId,
          count_reference: countReference,
          count_date: countDate,
          location_id: locationId,
          notes,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to create inventory count.");
      }

      const createdReference = result.countReference || "created";
      router.push(
        `/portal/organisations/${organisationId}/inventory-counts?created=${encodeURIComponent(
          createdReference
        )}`
      );
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to create inventory count."
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
      {errorMessage ? (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      {locations.length === 0 ? (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-7 text-amber-800">
          No manageable inventory location is available. Create a Location or
          grant this user inventory-management access first.
        </div>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Count reference
          </span>
          <input
            value={countReference}
            onChange={(event) => setCountReference(event.target.value)}
            placeholder="Leave blank to generate automatically"
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Count date <span className="text-red-600">*</span>
          </span>
          <input
            type="date"
            value={countDate}
            onChange={(event) => setCountDate(event.target.value)}
            required
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          />
        </label>

        <label className="block md:col-span-2">
          <span className="text-sm font-semibold text-slate-700">
            Inventory location <span className="text-red-600">*</span>
          </span>
          <select
            value={locationId}
            onChange={(event) => setLocationId(event.target.value)}
            required
            disabled={locations.length === 0}
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F] disabled:bg-slate-100"
          >
            <option value="">Select location</option>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.option_name}
                {location.option_code ? ` (${location.option_code})` : ""}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            Creating the count freezes the current posted quantity for every
            active inventory product at this location.
          </p>
        </label>

        <label className="block md:col-span-2">
          <span className="text-sm font-semibold text-slate-700">Notes</span>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={4}
            placeholder="Optional count instructions, scope, or period-end reference"
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm leading-7 outline-none focus:border-[#073D7F]"
          />
        </label>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          disabled={submitting || locations.length === 0}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#073D7F] px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ClipboardCheck className="h-4 w-4" />
          {submitting ? "Creating count..." : "Create Draft Count"}
        </button>

        <button
          type="button"
          onClick={() =>
            router.push(`/portal/organisations/${organisationId}/inventory-counts`)
          }
          className="rounded-full border border-[#D9E3F4] bg-white px-6 py-3 text-sm font-semibold text-[#073D7F]"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}