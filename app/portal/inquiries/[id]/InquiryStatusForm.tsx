"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Save } from "lucide-react";

const statuses = [
  {
    value: "NEW",
    label: "New",
  },
  {
    value: "IN_REVIEW",
    label: "In Review",
  },
  {
    value: "CONVERTED",
    label: "Converted",
  },
  {
    value: "CLOSED",
    label: "Closed",
  },
];

export default function InquiryStatusForm({
  inquiryId,
  currentStatus,
}: {
  inquiryId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSaving(true);
    setMessage("");

    try {
      const response = await fetch(
        `/api/service-inquiries/${inquiryId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to update status.");
      }

      setMessage("Status updated successfully.");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to update status."
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
          Inquiry status
        </span>

        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="mt-3 h-12 w-full rounded-2xl border border-[#D9E3F4] bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#073D7F]"
        >
          {statuses.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </label>

      {message ? (
        <div
          className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
            message.toLowerCase().includes("success")
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {message}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isSaving || status === currentStatus}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#073D7F] px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSaving ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Updating...
          </>
        ) : (
          <>
            <Save className="h-4 w-4" />
            Update Status
          </>
        )}
      </button>
    </form>
  );
}