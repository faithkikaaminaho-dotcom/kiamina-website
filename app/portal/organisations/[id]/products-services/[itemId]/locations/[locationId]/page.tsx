import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  Boxes,
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

type InventoryMovement = {
  id: string;
  movement_date: string;
  movement_type: string;
  quantity_in: number | string | null;
  quantity_out: number | string | null;
  unit_cost: number | string | null;
  total_cost: number | string | null;
  source_module: string | null;
  source_reference: string | null;
  narration: string | null;
  status: string;
  created_at: string;
};

type MovementWithBalance = InventoryMovement & {
  runningQuantity: number;
  runningValue: number;
};

const movementLabels: Record<string, string> = {
  OPENING_BALANCE: "Opening Balance",
  PURCHASE_RECEIPT: "Purchase Receipt",
  SALE: "Sale",
  CUSTOMER_RETURN: "Customer Return",
  SUPPLIER_RETURN: "Supplier Return",
  LOCATION_TRANSFER_IN: "Transfer In",
  LOCATION_TRANSFER_OUT: "Transfer Out",
  COUNT_ADJUSTMENT: "Count Adjustment",
  WRITE_OFF: "Write-off",
  OTHER_ADJUSTMENT: "Other Adjustment",
};

function numberValue(value: number | string | null | undefined) {
  const converted = Number(value || 0);
  return Number.isFinite(converted) ? converted : 0;
}

function formatNumber(value: number, maximumFractionDigits = 2) {
  return new Intl.NumberFormat("en-NG", {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  }).format(value);
}

function formatMoney(value: number, currencyCode: string) {
  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currencyCode} ${formatNumber(value, 2)}`;
  }
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
  return "bg-amber-50 text-amber-700";
}

export default async function InventoryLocationPage({
  params,
}: {
  params: Promise<{
    id: string;
    itemId: string;
    locationId: string;
  }>;
}) {
  const { id, itemId, locationId } = await params;
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

  const [organisationResult, productResult, locationResult, movementsResult] =
    await Promise.all([
      supabase
        .from("organisations")
        .select("id, legal_name, trading_name, base_currency_code")
        .eq("id", id)
        .single(),
      supabase
        .from("products_services")
        .select(
          "id, organisation_id, item_name, sku, item_type, track_inventory, unit_of_measure, currency_code"
        )
        .eq("id", itemId)
        .eq("organisation_id", id)
        .single(),
      supabase
        .from("tracking_options")
        .select("id, organisation_id, option_code, option_name, is_active")
        .eq("id", locationId)
        .eq("organisation_id", id)
        .single(),
      supabase
        .from("inventory_movements")
        .select(
          "id, movement_date, movement_type, quantity_in, quantity_out, unit_cost, total_cost, source_module, source_reference, narration, status, created_at"
        )
        .eq("organisation_id", id)
        .eq("product_service_id", itemId)
        .eq("location_id", locationId)
        .order("movement_date", { ascending: true })
        .order("created_at", { ascending: true }),
    ]);

  if (!organisationResult.data) redirect("/portal/organisations");

  const product = productResult.data;
  const location = locationResult.data;

  if (!product || !location) {
    redirect(`/portal/organisations/${id}/products-services`);
  }

  if (movementsResult.error) {
    throw new Error(movementsResult.error.message);
  }

  const organisation = organisationResult.data;
  const currencyCode =
    product.currency_code || organisation.base_currency_code || "NGN";
  const movements = (movementsResult.data || []) as InventoryMovement[];

  let runningQuantity = 0;
  let runningValue = 0;

  const movementsWithBalance: MovementWithBalance[] = movements.map(
    (movement) => {
      const quantityIn = numberValue(movement.quantity_in);
      const quantityOut = numberValue(movement.quantity_out);
      const totalCost = Math.abs(numberValue(movement.total_cost));

      if (movement.status === "POSTED") {
        runningQuantity += quantityIn - quantityOut;
        runningValue += quantityIn > 0 ? totalCost : -totalCost;
      }

      return {
        ...movement,
        runningQuantity,
        runningValue,
      };
    }
  );

  const displayedMovements = [...movementsWithBalance].reverse();
  const organisationName =
    organisation.trading_name || organisation.legal_name || "Organisation";

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <section className="border-b border-[#D9E3F4] bg-white">
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          <Link
            href={`/portal/organisations/${id}/products-services/${itemId}/locations`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#073D7F]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Manage locations
          </Link>

          <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-start gap-5">
              <div className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#F1F1F1] text-[#073D7F]">
                <Boxes className="h-6 w-6" />
              </div>

              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                  Inventory Movement Register
                </div>
                <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
                  {product.item_name}
                </h1>
                <p className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                  <MapPin className="h-4 w-4 text-[#073D7F]" />
                  {location.option_name}
                  {location.option_code ? ` · ${location.option_code}` : ""}
                  {product.sku ? ` · ${product.sku}` : ""}
                </p>
                <p className="mt-3 text-sm text-slate-500">
                  {organisationName}
                </p>
              </div>
            </div>

            <Link
              href={`/portal/organisations/${id}/products-services/${itemId}/locations/${locationId}/opening-balance`}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#073D7F] px-5 py-3 text-sm font-semibold text-white hover:bg-[#052f63]"
            >
              <CirclePlus className="h-4 w-4" />
              Record opening balance
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="grid gap-5 md:grid-cols-3">
          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">
              Quantity on hand
            </div>
            <div className="mt-3 text-3xl font-semibold text-slate-950">
              {formatNumber(runningQuantity, 4)}
            </div>
            <div className="mt-2 text-xs text-slate-500">
              {product.unit_of_measure || "Units"}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">
              Inventory value
            </div>
            <div className="mt-3 text-3xl font-semibold text-slate-950">
              {formatMoney(runningValue, currencyCode)}
            </div>
            <div className="mt-2 text-xs text-slate-500">
              Posted movements only
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">
              Total movements
            </div>
            <div className="mt-3 text-3xl font-semibold text-slate-950">
              {movements.length}
            </div>
            <div className="mt-2 text-xs text-slate-500">
              All workflow statuses
            </div>
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-[1.75rem] border border-[#D9E3F4] bg-white shadow-sm">
          <div className="border-b border-[#D9E3F4] px-6 py-5">
            <h2 className="text-lg font-semibold text-slate-950">
              Movement history
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Running balances change only when a movement is posted.
            </p>
          </div>

          {displayedMovements.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <Boxes className="mx-auto h-9 w-9 text-slate-300" />
              <h3 className="mt-4 text-base font-semibold text-slate-900">
                No inventory movements yet
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Record an opening balance to begin this location ledger.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#D9E3F4] text-sm">
                <thead className="bg-[#F8FAFC]">
                  <tr className="text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    <th className="px-6 py-4">Date / Movement</th>
                    <th className="px-6 py-4">Reference</th>
                    <th className="px-6 py-4 text-right">Quantity in</th>
                    <th className="px-6 py-4 text-right">Quantity out</th>
                    <th className="px-6 py-4 text-right">Unit cost</th>
                    <th className="px-6 py-4 text-right">Total cost</th>
                    <th className="px-6 py-4 text-right">Running quantity</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8EEF8]">
                  {displayedMovements.map((movement) => {
                    const quantityIn = numberValue(movement.quantity_in);
                    const quantityOut = numberValue(movement.quantity_out);

                    return (
                      <tr key={movement.id} className="align-top hover:bg-slate-50">
                        <td className="whitespace-nowrap px-6 py-5">
                          <div className="font-semibold text-slate-900">
                            {formatDate(movement.movement_date)}
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            {movementLabels[movement.movement_type] ||
                              movement.movement_type.replaceAll("_", " ")}
                          </div>
                        </td>
                        <td className="min-w-56 px-6 py-5">
                          <div className="font-medium text-slate-800">
                            {movement.source_reference || "—"}
                          </div>
                          <div className="mt-1 text-xs leading-5 text-slate-500">
                            {movement.narration || movement.source_module || "—"}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-5 text-right">
                          {quantityIn > 0 ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                              <ArrowDownLeft className="h-3.5 w-3.5" />
                              {formatNumber(quantityIn, 4)}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="whitespace-nowrap px-6 py-5 text-right">
                          {quantityOut > 0 ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-red-700">
                              <ArrowUpRight className="h-3.5 w-3.5" />
                              {formatNumber(quantityOut, 4)}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="whitespace-nowrap px-6 py-5 text-right text-slate-700">
                          {formatMoney(numberValue(movement.unit_cost), currencyCode)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-5 text-right font-medium text-slate-800">
                          {formatMoney(numberValue(movement.total_cost), currencyCode)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-5 text-right font-semibold text-slate-950">
                          {formatNumber(movement.runningQuantity, 4)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-5">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
                              movement.status
                            )}`}
                          >
                            {movement.status.replaceAll("_", " ")}
                          </span>
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
