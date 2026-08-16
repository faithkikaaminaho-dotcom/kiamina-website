import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  ClipboardCheck,
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

type CountRow = {
  id: string;
  count_reference: string;
  count_date: string;
  location_id: string;
  status: string;
  notes: string | null;
  created_at: string;
};

type CountLine = {
  inventory_count_id: string;
  variance_quantity: number | string;
  variance_value: number | string;
  adjustment_status: string;
};

type LocationRow = {
  id: string;
  option_code: string | null;
  option_name: string;
};

function numberValue(value: number | string | null | undefined) {
  const converted = Number(value || 0);
  return Number.isFinite(converted) ? converted : 0;
}

function formatNumber(value: number, digits = 2) {
  return new Intl.NumberFormat("en-NG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  }).format(value);
}

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

export default async function InventoryCountsPage({
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
    .select("id, legal_name, trading_name, base_currency_code")
    .eq("id", id)
    .single();

  if (!organisation) redirect("/portal/organisations");

  const { data: counts, error: countsError } = await supabase
    .from("inventory_counts")
    .select(
      "id, count_reference, count_date, location_id, status, notes, created_at"
    )
    .eq("organisation_id", id)
    .order("count_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (countsError) throw new Error(countsError.message);

  const countRows = (counts || []) as CountRow[];
  const countIds = countRows.map((count) => count.id);
  const locationIds = Array.from(
    new Set(countRows.map((count) => count.location_id))
  );

  let lines: CountLine[] = [];
  let locations: LocationRow[] = [];

  if (countIds.length > 0) {
    const { data, error } = await supabase
      .from("inventory_count_lines")
      .select(
        "inventory_count_id, variance_quantity, variance_value, adjustment_status"
      )
      .eq("organisation_id", id)
      .in("inventory_count_id", countIds);

    if (error) throw new Error(error.message);
    lines = (data || []) as CountLine[];
  }

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

  const summaryMap = new Map<
    string,
    { lineCount: number; varianceQuantity: number; varianceValue: number }
  >();

  for (const line of lines) {
    const current = summaryMap.get(line.inventory_count_id) || {
      lineCount: 0,
      varianceQuantity: 0,
      varianceValue: 0,
    };
    current.lineCount += 1;
    current.varianceQuantity += numberValue(line.variance_quantity);
    current.varianceValue += numberValue(line.variance_value);
    summaryMap.set(line.inventory_count_id, current);
  }

  const organisationName =
    organisation.trading_name || organisation.legal_name || "Organisation";
  const currencyCode = organisation.base_currency_code || "NGN";

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
                <ClipboardCheck className="h-6 w-6" />
              </div>
              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                  Period-end Inventory Control
                </div>
                <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
                  Inventory Counts
                </h1>
                <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                  Compare physical inventory with system quantities by location
                  for {organisationName} and control resulting FIFO adjustments.
                </p>
              </div>
            </div>

            <Link
              href={`/portal/organisations/${id}/inventory-counts/new`}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#073D7F] px-5 py-3 text-sm font-semibold text-white hover:bg-[#052f63]"
            >
              <CirclePlus className="h-4 w-4" />
              Create inventory count
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        {created ? (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-700">
            Inventory count {created} was created successfully.
          </div>
        ) : null}

        <div className="grid gap-5 md:grid-cols-3">
          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">Total counts</div>
            <div className="mt-3 text-3xl font-semibold text-slate-950">
              {countRows.length}
            </div>
          </div>
          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">Open workflow</div>
            <div className="mt-3 text-3xl font-semibold text-amber-700">
              {
                countRows.filter((count) =>
                  ["DRAFT", "READY_FOR_REVIEW", "UNDER_REVIEW", "APPROVED"].includes(
                    count.status
                  )
                ).length
              }
            </div>
          </div>
          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">Posted counts</div>
            <div className="mt-3 text-3xl font-semibold text-emerald-700">
              {countRows.filter((count) => count.status === "POSTED").length}
            </div>
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-[1.75rem] border border-[#D9E3F4] bg-white shadow-sm">
          <div className="border-b border-[#D9E3F4] px-6 py-5">
            <h2 className="text-lg font-semibold text-slate-950">Count register</h2>
            <p className="mt-1 text-sm text-slate-500">
              Only counts for locations you are permitted to view are shown.
            </p>
          </div>

          {countRows.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <ClipboardCheck className="mx-auto h-9 w-9 text-slate-300" />
              <h3 className="mt-4 text-base font-semibold text-slate-900">
                No inventory counts yet
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Create a count to capture physical quantities at a location.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#D9E3F4] text-sm">
                <thead className="bg-[#F8FAFC]">
                  <tr className="text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    <th className="px-6 py-4">Reference</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Location</th>
                    <th className="px-6 py-4 text-right">Products</th>
                    <th className="px-6 py-4 text-right">Quantity variance</th>
                    <th className="px-6 py-4 text-right">Value variance</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8EEF8]">
                  {countRows.map((count) => {
                    const location = locationMap.get(count.location_id);
                    const summary = summaryMap.get(count.id) || {
                      lineCount: 0,
                      varianceQuantity: 0,
                      varianceValue: 0,
                    };

                    return (
                      <tr key={count.id} className="hover:bg-slate-50">
                        <td className="px-6 py-5">
                          <Link
                            href={`/portal/organisations/${id}/inventory-counts/${count.id}`}
                            className="font-semibold text-[#073D7F] hover:underline"
                          >
                            {count.count_reference}
                          </Link>
                          {count.notes ? (
                            <div className="mt-1 max-w-xs truncate text-xs text-slate-500">
                              {count.notes}
                            </div>
                          ) : null}
                        </td>
                        <td className="whitespace-nowrap px-6 py-5 text-slate-700">
                          {formatDate(count.count_date)}
                        </td>
                        <td className="min-w-44 px-6 py-5">
                          <div className="flex items-center gap-2 font-medium text-slate-800">
                            <MapPin className="h-4 w-4 text-[#073D7F]" />
                            {location?.option_name || "Restricted location"}
                          </div>
                          {location?.option_code ? (
                            <div className="ml-6 mt-1 text-xs text-slate-500">
                              {location.option_code}
                            </div>
                          ) : null}
                        </td>
                        <td className="whitespace-nowrap px-6 py-5 text-right font-semibold text-slate-900">
                          {summary.lineCount}
                        </td>
                        <td className="whitespace-nowrap px-6 py-5 text-right font-semibold text-slate-900">
                          {formatNumber(summary.varianceQuantity, 4)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-5 text-right font-semibold text-slate-900">
                          {currencyCode} {formatNumber(summary.varianceValue, 2)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-5">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
                              count.status
                            )}`}
                          >
                            {count.status.replaceAll("_", " ")}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-5 text-right">
                          <Link
                            href={`/portal/organisations/${id}/inventory-counts/${count.id}`}
                            className="inline-flex items-center justify-center rounded-full border border-[#BCD2F3] bg-white px-4 py-2 text-sm font-semibold text-[#073D7F] hover:bg-[#F1F6FF]"
                          >
                            Open count →
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