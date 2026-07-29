"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SendToBack } from "lucide-react";

type PostToGeneralLedgerButtonProps = {
  journalId: string;
};

export default function PostToGeneralLedgerButton({
  journalId,
}: PostToGeneralLedgerButtonProps) {
  const router = useRouter();
  const [isPosting, setIsPosting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handlePost() {
    const confirmed = window.confirm(
      "Are you sure you want to post this journal to the General Ledger? This will create General Ledger records and mark the journal as posted."
    );

    if (!confirmed) return;

    setIsPosting(true);
    setErrorMessage(null);

    try {
      const response = await fetch(
        `/api/journal-entries/${journalId}/post-to-general-ledger`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        setErrorMessage(
          result?.error || "Unable to post journal to General Ledger."
        );
        return;
      }

      router.refresh();
    } catch (error) {
      setErrorMessage("Unexpected error while posting to General Ledger.");
    } finally {
      setIsPosting(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-3">
      <button
        type="button"
        onClick={handlePost}
        disabled={isPosting}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-[#073D7F] px-6 py-3 text-sm font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
      >
        <SendToBack className="h-4 w-4" />
        {isPosting ? "Posting..." : "Post to General Ledger"}
      </button>

      {errorMessage ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {errorMessage}
        </div>
      ) : null}
    </div>
  );
}