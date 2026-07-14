"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";

export default function ConvertInquiryButton({
  inquiryId,
  currentStatus,
}: {
  inquiryId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [isConverting, setIsConverting] = useState(false);
  const [message, setMessage] = useState("");

  async function handleConvert() {
    const confirmed = window.confirm(
      "Convert this inquiry into a client and organisation?"
    );

    if (!confirmed) return;

    setIsConverting(true);
    setMessage("");

    try {
      const response = await fetch(
        `/api/service-inquiries/${inquiryId}/convert`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        console.error("Convert inquiry error:", result);
        throw new Error(result.error || "Unable to convert inquiry.");
      }

      if (result.clientId) {
        router.push(`/portal/clients/${result.clientId}`);
        return;
      }

      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to convert inquiry."
      );
    } finally {
      setIsConverting(false);
    }
  }

  if (currentStatus === "CONVERTED") {
    return (
      <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
        This inquiry has already been converted.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {message ? (
        <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {message}
        </div>
      ) : null}

      <button
        type="button"
        onClick={handleConvert}
        disabled={isConverting}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#073D7F] px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isConverting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Converting...
          </>
        ) : (
          <>
            Convert to Client
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>

      <p className="text-xs leading-6 text-slate-500">
        This will create a client and organisation record from the inquiry
        details, then mark the inquiry as converted.
      </p>
    </div>
  );
}