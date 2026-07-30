"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type PeriodStatusActionsProps = {
  periodId: string;
  currentStatus: string | null;
};

const statusOptions = [
  {
    value: "OPEN",
    label: "Open",
  },
  {
    value: "UNDER_REVIEW",
    label: "Under Review",
  },
  {
    value: "LOCKED",
    label: "Lock",
  },
  {
    value: "CLOSED",
    label: "Close",
  },
];

export default function PeriodStatusActions({
  periodId,
  currentStatus,
}: PeriodStatusActionsProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);

  async function updateStatus(nextStatus: string) {
    const confirmed = window.confirm(
      `Change this accounting period status to ${nextStatus.replaceAll(
        "_",
        " "
      )}?`
    );

    if (!confirmed) return;

    setIsUpdating(true);

    try {
      const response = await fetch(
        `/api/accounting-periods/${periodId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: nextStatus,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        alert(result.error || "Unable to update accounting period status.");
        return;
      }

      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Unable to update accounting period status.");
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {statusOptions.map((option) => {
        const isCurrent = option.value === currentStatus;

        return (
          <button
            key={option.value}
            type="button"
            disabled={isUpdating || isCurrent}
            onClick={() => updateStatus(option.value)}
            className={`rounded-full px-3 py-2 text-xs font-semibold ${
              isCurrent
                ? "bg-[#073D7F] text-white"
                : "border border-[#D9E3F4] bg-white text-[#073D7F] hover:border-[#073D7F]"
            } disabled:cursor-not-allowed disabled:opacity-60`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}