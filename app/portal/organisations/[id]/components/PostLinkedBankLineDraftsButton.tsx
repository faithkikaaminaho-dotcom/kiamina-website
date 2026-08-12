"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle } from "lucide-react";

export default function PostLinkedBankLineDraftsButton({
  bankLineId,
  disabled = false,
}: {
  bankLineId: string;
  disabled?: boolean;
}) {
  const router = useRouter();

  const [posting, setPosting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handlePost() {
    const confirmed = window.confirm(
      "Post all unposted linked drafts for this bank line to the General Ledger? Already posted matched records will be skipped."
    );

    if (!confirmed) return;

    setPosting(true);
    setErrorMessage("");

    try {
      const response = await fetch(
        `/api/bank-statement-lines/${bankLineId}/post-linked-drafts-to-gl`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to post linked drafts to GL.");
      }

      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to post linked drafts to GL."
      );
    } finally {
      setPosting(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        disabled={disabled || posting}
        onClick={handlePost}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-[#073D7F] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        <CheckCircle className="h-4 w-4" />
        {posting ? "Posting linked drafts..." : "Post Linked Drafts to GL"}
      </button>

      {errorMessage ? (
        <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
          {errorMessage}
        </div>
      ) : null}
    </div>
  );
}