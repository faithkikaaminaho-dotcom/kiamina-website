"use client";

import { useState } from "react";

type AllocationHistoryItem = {
  id: string;
  bank_statement_line_id: string;
  allocation_type: string | null;
  source_module: string | null;
  source_record_id: string | null;
  allocation_description: string | null;
  allocation_amount: number | null;
  bank_charge_treatment: string | null;
  bank_charge_amount: number | null;
  status: string | null;
  created_at: string | null;
};

function formatStatus(status?: string | null) {
  if (!status) return "—";

  return status
    .split("_")
    .join(" ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatMoney(amount?: number | null) {
  return Number(amount || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default function BankLineAllocationHistory({
  allocations,
}: {
  allocations: AllocationHistoryItem[];
}) {
  const [isOpen, setIsOpen] = useState(false);

  if (!allocations || allocations.length === 0) {
    return null;
  }

  const totalAllocated = allocations.reduce(
    (sum, allocation) => sum + Number(allocation.allocation_amount || 0),
    0
  );

  const totalBankCharges = allocations.reduce(
    (sum, allocation) => sum + Number(allocation.bank_charge_amount || 0),
    0
  );

  return (
    <div className="mt-3 rounded-2xl border border-[#D9E3F4] bg-white text-left">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left"
      >
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6491DE]">
            Allocation History
          </div>

          <div className="mt-1 text-[11px] leading-5 text-slate-500">
            {allocations.length} allocation{allocations.length === 1 ? "" : "s"} ·
            Total {formatMoney(totalAllocated)}
            {totalBankCharges > 0
              ? ` · Bank charges ${formatMoney(totalBankCharges)}`
              : ""}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-[#F1F1F1] px-3 py-1 text-[10px] font-semibold text-[#073D7F]">
            {isOpen ? "Hide" : "View"}
          </span>

          <span className="text-xs font-semibold text-[#073D7F]">
            {isOpen ? "▲" : "▼"}
          </span>
        </div>
      </button>

      {isOpen ? (
        <div className="border-t border-[#D9E3F4] px-3 pb-3 pt-3">
          <div className="space-y-2">
            {allocations.map((allocation) => (
              <div
                key={allocation.id}
                className="rounded-xl border border-[#D9E3F4] bg-[#F8FAFC] p-3"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="text-xs font-semibold text-slate-950">
                      {allocation.source_module
                        ? formatStatus(allocation.source_module)
                        : formatStatus(allocation.allocation_type)}
                    </div>

                    <div className="mt-1 text-xs leading-5 text-slate-500">
                      {allocation.allocation_description ||
                        "Allocated from bank reconciliation."}
                    </div>

                    <div className="mt-1 text-[11px] text-slate-400">
                      {formatDate(allocation.created_at)} ·{" "}
                      {formatStatus(allocation.status)}
                    </div>
                  </div>

                  <div className="text-right text-xs font-semibold text-slate-950">
                    {formatMoney(allocation.allocation_amount)}
                  </div>
                </div>

                {Number(allocation.bank_charge_amount || 0) > 0 ? (
                  <div className="mt-2 rounded-lg bg-white px-3 py-2 text-[11px] leading-5 text-slate-600">
                    Bank charge:{" "}
                    <span className="font-semibold">
                      {formatMoney(allocation.bank_charge_amount)}
                    </span>{" "}
                    · {formatStatus(allocation.bank_charge_treatment)}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}