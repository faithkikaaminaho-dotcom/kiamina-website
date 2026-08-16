import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  ArrowRightLeft,
  CirclePlus,
  MapPin,
} from "lucide-react";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

const internalRoles = [
  "SUPER_ADMIN",
  "ADMIN",
  "STAFF",
  "IT_ADMIN",
  "ACCOUNTANT_ADMIN",
  "ACCOUNTANT_USER",
  "CUSTOMER_SUPPORT",
  "COMPLIANCE_ADMIN",
  "OPERATIONS_ADMIN",
];

type TransferRow = {
  id: string;
  transfer_reference: string;
  transfer_date: string;
  from_location_id: string;
  to_location_id: string;
  status: string;
  notes: string | null;
  created_at: string;
};

type LocationRow = {
  id: string;
  option_code: string | null;
  option_name: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function statusClass(status: string) {
  if (status === "POSTED") return "bg-emerald-50 text-emerald-700";
  if (status === "APPROVED") return "bg-blue-50 text-blue-700";
  if (status === "VOID") return "bg-red-50 text-red-700";
  if (status === "DRAFT") return "bg-slate-100 text-slate-700";
  return "bg-amber-50 text-amber-700";
}

export default async function InventoryTransfersPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const { id } = await params;
  const { created } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/signin");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !internalRoles.includes(String(profile.role))) {
    redirect("/portal");
  }

  const { data: organisation } = await supabase
    .from("organisations")
    .select("id, legal_name, trading_name")
    .eq("id", id)
    .single();

  if (!organisation) redirect("/portal/organisations");

  const { data: transfers, error: transfersError } = await supabase
    .from("inventory_transfers")
    .select(
      "id, transfer_reference, transfer_date, from_location_id, to_location_id, status, notes, created_at"
    )
    .eq("organisation_id", id)
    .order("transfer_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (transfersError) throw new Error(transfersError.message);

  const transferRows = (transfers || []) as TransferRow[];
  const locationIds = Array.from(
    new Set(
      transferRows.flatMap((transfer) => [
        transfer.from_location_id,
        transfer.to_location_id,
      ])
    )
  );

  let locations: LocationRow[] = [];
  if (locationIds.length > 0) {
    const { data, error } = await supabase
      .from("tracking_options")
      .select("id, option_code, option_name")
      .eq("organisation_id", id)
      .in("id", locationIds);

    if (error) throw new Error(error.message);
    locations = (data || []) as LocationRow[];
  }

  const locationMap = new Map(
    locations.map((location) => [location.id, location])
  );

  let lineCounts = new Map<string, number>();
  if (transferRows.length > 0) {
    const { data: lines, error: linesError } = await supabase
      .from("inventory_transfer_lines")
      .select("inventory_transfer_id")
      .eq("organisation_id", id)
      .in(
        "inventory_transfer_id",
        transferRows.map((transfer) => transfer.id)
      );

    if (linesError) throw new Error(linesError.message);

    lineCounts = new Map();
    for (const line of lines || []) {
      const transferId = String(line.inventory_transfer_id);
      lineCounts.set(transferId, (lineCounts.get(transferId) || 0) + 1);
    }
  }

  const organisationName =
    organisation.trading_name || organisation.legal_name || "Organisation";

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <section className="border-b border-[#D9E3F4] bg-white">
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          <Link
            href={`/portal/organisations/${id}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#073D7F]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to organisation workspace
          </Link>

          <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-start gap-5">
              <div className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#F1F1F1] text-[#073D7F]">
                <ArrowRightLeft className="h-6 w-6" />
              </div>
              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                  Multi-location Inventory
                </div>
                <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
                  Location Transfers
                </h1>
                <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                  Move inventory between permitted locations for {organisationName}
                  while preserving linked source and destination movements.
                </p>
              </div>
            </div>

            <Link
              href={`/portal/organisations/${id}/inventory-transfers/new`}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#073D7F] px-5 py-3 text-sm font-semibold text-white hover:bg-[#052f63]"
            >
              <CirclePlus className="h-4 w-4" />
              Create transfer
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        {created ? (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-700">
            Inventory transfer {created} was created as a draft.
          </div>
        ) : null}

        <div className="grid gap-5 md:grid-cols-3">
          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">Total transfers</div>
            <div className="mt-3 text-3xl font-semibold text-slate-950">
              {transferRows.length}
            </div>
          </div>
          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">Draft / review</div>
            <div className="mt-3 text-3xl font-semibold text-amber-700">
              {
                transferRows.filter((transfer) =>
                  ["DRAFT", "READY_FOR_REVIEW", "UNDER_REVIEW"].includes(
                    transfer.status
                  )
                ).length
              }
            </div>
          </div>
          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">Posted</div>
            <div className="mt-3 text-3xl font-semibold text-emerald-700">
              {transferRows.filter((transfer) => transfer.status === "POSTED").length}
            </div>
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-[1.75rem] border border-[#D9E3F4] bg-white shadow-sm">
          <div className="border-b border-[#D9E3F4] px-6 py-5">
            <h2 className="text-lg font-semibold text-slate-950">
              Transfer register
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Only transfers involving locations you are permitted to view are shown.
            </p>
          </div>

          {transferRows.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <ArrowRightLeft className="mx-auto h-9 w-9 text-slate-300" />
              <h3 className="mt-4 text-base font-semibold text-slate-900">
                No location transfers yet
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Create the first draft transfer between two permitted locations.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#D9E3F4] text-sm">
                <thead className="bg-[#F8FAFC]">
                  <tr className="text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    <th className="px-6 py-4">Reference</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">From</th>
                    <th className="px-6 py-4">To</th>
                    <th className="px-6 py-4 text-right">Products</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8EEF8]">
                  {transferRows.map((transfer) => {
                    const fromLocation = locationMap.get(transfer.from_location_id);
                    const toLocation = locationMap.get(transfer.to_location_id);

                    return (
                      <tr key={transfer.id} className="hover:bg-slate-50">
                        <td className="px-6 py-5">
                          <Link
                            href={`/portal/organisations/${id}/inventory-transfers/${transfer.id}`}
                            className="font-semibold text-[#073D7F] hover:underline"
                          >
                            {transfer.transfer_reference}
                          </Link>
                          {transfer.notes ? (
                            <div className="mt-1 max-w-xs truncate text-xs text-slate-500">
                              {transfer.notes}
                            </div>
                          ) : null}
                        </td>
                        <td className="whitespace-nowrap px-6 py-5 text-slate-700">
                          {formatDate(transfer.transfer_date)}
                        </td>
                        <td className="min-w-44 px-6 py-5">
                          <div className="flex items-center gap-2 font-medium text-slate-800">
                            <MapPin className="h-4 w-4 text-[#073D7F]" />
                            {fromLocation?.option_name || "Restricted location"}
                          </div>
                          {fromLocation?.option_code ? (
                            <div className="ml-6 mt-1 text-xs text-slate-500">
                              {fromLocation.option_code}
                            </div>
                          ) : null}
                        </td>
                        <td className="min-w-44 px-6 py-5">
                          <div className="flex items-center gap-2 font-medium text-slate-800">
                            <MapPin className="h-4 w-4 text-[#6491DE]" />
                            {toLocation?.option_name || "Restricted location"}
                          </div>
                          {toLocation?.option_code ? (
                            <div className="ml-6 mt-1 text-xs text-slate-500">
                              {toLocation.option_code}
                            </div>
                          ) : null}
                        </td>
                        <td className="whitespace-nowrap px-6 py-5 text-right font-semibold text-slate-900">
                          {lineCounts.get(transfer.id) || 0}
                        </td>
                        <td className="whitespace-nowrap px-6 py-5">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
                              transfer.status
                            )}`}
                          >
                            {transfer.status.replaceAll("_", " ")}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-5 text-right">
                          <Link
                            href={`/portal/organisations/${id}/inventory-transfers/${transfer.id}`}
                            className="inline-flex items-center justify-center rounded-full border border-[#BCD2F3] bg-white px-4 py-2 text-sm font-semibold text-[#073D7F] hover:bg-[#F1F6FF]"
                          >
                            Open transfer →
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
