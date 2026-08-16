import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  ArrowRightLeft,
  Boxes,
  MapPin,
  ShieldCheck,
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

const globalInventoryManagerRoles = [
  "SUPER_ADMIN",
  "ADMIN",
  "IT_ADMIN",
  "ACCOUNTANT_ADMIN",
  "OPERATIONS_ADMIN",
];

type TransferLine = {
  id: string;
  product_service_id: string;
  quantity: number | string;
  unit_cost: number | string | null;
  total_cost: number | string | null;
  line_note: string | null;
};

type ProductRow = {
  id: string;
  item_name: string;
  sku: string | null;
  unit_of_measure: string | null;
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

function formatNumber(value: number, maximumFractionDigits = 4) {
  return new Intl.NumberFormat("en-NG", {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
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

export default async function InventoryTransferDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; transferId: string }>;
  searchParams: Promise<{ approved?: string; posted?: string }>;
}) {
  const { id, transferId } = await params;
  const { approved, posted } = await searchParams;
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

  const isGlobalInventoryManager = globalInventoryManagerRoles.includes(
    String(profile.role)
  );

  const { data: organisation } = await supabase
    .from("organisations")
    .select("id, legal_name, trading_name, base_currency_code")
    .eq("id", id)
    .single();

  if (!organisation) redirect("/portal/organisations");

  const { data: inventorySettings } = await supabase
    .from("organisation_inventory_settings")
    .select("inventory_valuation_method")
    .eq("organisation_id", id)
    .eq("is_active", true)
    .maybeSingle();

  const valuationMethod =
    inventorySettings?.inventory_valuation_method || "FIFO";
  const valuationMethodLabel =
    valuationMethod === "WEIGHTED_AVERAGE"
      ? "Weighted Average"
      : valuationMethod === "SPECIFIC_IDENTIFICATION"
        ? "Specific Identification"
        : "FIFO";

  const { data: transfer, error: transferError } = await supabase
    .from("inventory_transfers")
    .select(
      "id, organisation_id, transfer_reference, transfer_date, from_location_id, to_location_id, status, notes, prepared_at, reviewed_at, approved_at, posted_at, created_at"
    )
    .eq("id", transferId)
    .eq("organisation_id", id)
    .single();

  if (transferError || !transfer) {
    redirect(`/portal/organisations/${id}/inventory-transfers`);
  }

  const transferFromLocationId = transfer.from_location_id;
  const transferToLocationId = transfer.to_location_id;

  const [locationsResult, linesResult] = await Promise.all([
    supabase
      .from("tracking_options")
      .select("id, option_code, option_name")
      .eq("organisation_id", id)
      .in("id", [transfer.from_location_id, transfer.to_location_id]),
    supabase
      .from("inventory_transfer_lines")
      .select(
        "id, product_service_id, quantity, unit_cost, total_cost, line_note"
      )
      .eq("inventory_transfer_id", transferId)
      .eq("organisation_id", id)
      .order("created_at", { ascending: true }),
  ]);

  if (locationsResult.error) throw new Error(locationsResult.error.message);
  if (linesResult.error) throw new Error(linesResult.error.message);

  const locations = (locationsResult.data || []) as LocationRow[];
  const lines = (linesResult.data || []) as TransferLine[];
  const productIds = lines.map((line) => line.product_service_id);
  let products: ProductRow[] = [];

  if (productIds.length > 0) {
    const { data, error } = await supabase
      .from("products_services")
      .select("id, item_name, sku, unit_of_measure")
      .eq("organisation_id", id)
      .in("id", productIds);

    if (error) throw new Error(error.message);
    products = (data || []) as ProductRow[];
  }

  const locationMap = new Map(
    locations.map((location) => [location.id, location])
  );
  const productMap = new Map(products.map((product) => [product.id, product]));
  const fromLocation = locationMap.get(transfer.from_location_id);
  const toLocation = locationMap.get(transfer.to_location_id);
  const totalQuantity = lines.reduce(
    (sum, line) => sum + numberValue(line.quantity),
    0
  );
  const totalValue = lines.reduce(
    (sum, line) => sum + numberValue(line.total_cost),
    0
  );
  const currencyCode = organisation.base_currency_code || "NGN";
  const organisationName =
    organisation.trading_name || organisation.legal_name || "Organisation";

  async function approveTransfer() {
    "use server";

    const serverSupabase = await createClient();
    const {
      data: { user: actionUser },
    } = await serverSupabase.auth.getUser();

    if (!actionUser) redirect("/signin");

    const { error } = await serverSupabase.rpc(
      "approve_inventory_transfer",
      { requested_transfer_id: transferId }
    );

    if (error) throw new Error(error.message);

    const detailPath =
      `/portal/organisations/${id}/inventory-transfers/${transferId}`;
    revalidatePath(detailPath);
    revalidatePath(`/portal/organisations/${id}/inventory-transfers`);
    redirect(`${detailPath}?approved=1`);
  }

  async function postTransfer() {
    "use server";

    const serverSupabase = await createClient();
    const {
      data: { user: actionUser },
    } = await serverSupabase.auth.getUser();

    if (!actionUser) redirect("/signin");

    const { error } = await serverSupabase.rpc(
      "post_inventory_transfer",
      { requested_transfer_id: transferId }
    );

    if (error) throw new Error(error.message);

    const detailPath =
      `/portal/organisations/${id}/inventory-transfers/${transferId}`;
    revalidatePath(detailPath);
    revalidatePath(`/portal/organisations/${id}/inventory-transfers`);
    for (const line of lines) {
      revalidatePath(
        `/portal/organisations/${id}/products-services/${line.product_service_id}/locations/${transferFromLocationId}`
      );
      revalidatePath(
        `/portal/organisations/${id}/products-services/${line.product_service_id}/locations/${transferToLocationId}`
      );
    }
    redirect(`${detailPath}?posted=1`);
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <section className="border-b border-[#D9E3F4] bg-white">
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          <Link
            href={`/portal/organisations/${id}/inventory-transfers`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#073D7F]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Location Transfers
          </Link>

          <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-start gap-5">
              <div className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#F1F1F1] text-[#073D7F]">
                <ArrowRightLeft className="h-6 w-6" />
              </div>
              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                  Inventory Transfer
                </div>
                <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
                  {transfer.transfer_reference}
                </h1>
                <p className="mt-3 text-sm text-slate-500">
                  {organisationName} · {formatDate(transfer.transfer_date)}
                </p>
              </div>
            </div>

            <span
              className={`inline-flex rounded-full px-4 py-2 text-sm font-semibold ${statusClass(
                transfer.status
              )}`}
            >
              {transfer.status.replaceAll("_", " ")}
            </span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        {approved === "1" ? (
          <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 text-sm font-semibold text-blue-700">
            Inventory transfer approved successfully. Recheck the transfer and
            post it when ready.
          </div>
        ) : null}

        {posted === "1" ? (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-700">
            Inventory transfer posted successfully using {valuationMethodLabel}.
            The linked source and destination movements were created.
          </div>
        ) : null}

        {transfer.status !== "POSTED" ? (
          <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 text-sm leading-7 text-blue-800">
            This transfer has not been posted. It does not affect inventory
            quantities or values.
          </div>
        ) : null}

        {isGlobalInventoryManager && transfer.status === "DRAFT" ? (
          <div className="mb-6 rounded-[1.5rem] border border-amber-200 bg-amber-50 p-6">
            <div className="flex items-start gap-4">
              <ShieldCheck className="mt-1 h-6 w-6 shrink-0 text-amber-700" />
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-amber-950">
                  Approval required
                </h2>
                <p className="mt-2 text-sm leading-7 text-amber-800">
                  Approval rechecks source FIFO availability. It does not move
                  inventory or consume cost layers.
                </p>
                <form action={approveTransfer} className="mt-4">
                  <button
                    type="submit"
                    className="rounded-full bg-[#073D7F] px-6 py-3 text-sm font-semibold text-white"
                  >
                    Approve Transfer
                  </button>
                </form>
              </div>
            </div>
          </div>
        ) : null}

        {isGlobalInventoryManager && transfer.status === "APPROVED" ? (
          <div className="mb-6 rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-6">
            <div className="flex items-start gap-4">
              <ShieldCheck className="mt-1 h-6 w-6 shrink-0 text-emerald-700" />
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-emerald-950">
                  Ready for controlled posting
                </h2>
                <p className="mt-2 text-sm leading-7 text-emerald-800">
                  {valuationMethod === "WEIGHTED_AVERAGE"
                    ? "Posting issues inventory at the locked source average cost and recalculates the destination average cost."
                    : "Posting consumes the oldest source FIFO layers and creates equal linked movements and cost layers at the destination."}
                </p>
                <form action={postTransfer} className="mt-4">
                  <button
                    type="submit"
                    className="rounded-full bg-emerald-700 px-6 py-3 text-sm font-semibold text-white"
                  >
                    Post Transfer
                  </button>
                </form>
              </div>
            </div>
          </div>
        ) : null}

        <div className="grid gap-5 lg:grid-cols-[1fr_auto_1fr] lg:items-stretch">
          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
              <MapPin className="h-4 w-4 text-[#073D7F]" />
              Source location
            </div>
            <div className="mt-3 text-xl font-semibold text-slate-950">
              {fromLocation?.option_name || "Restricted location"}
            </div>
            <div className="mt-2 text-sm text-slate-500">
              {fromLocation?.option_code || "No location code"}
            </div>
          </div>

          <div className="hidden items-center justify-center lg:flex">
            <ArrowRight className="h-7 w-7 text-[#6491DE]" />
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
              <MapPin className="h-4 w-4 text-[#6491DE]" />
              Destination location
            </div>
            <div className="mt-3 text-xl font-semibold text-slate-950">
              {toLocation?.option_name || "Restricted location"}
            </div>
            <div className="mt-2 text-sm text-slate-500">
              {toLocation?.option_code || "No location code"}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-3">
          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">Products</div>
            <div className="mt-3 text-3xl font-semibold text-slate-950">
              {lines.length}
            </div>
          </div>
          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">Total quantity</div>
            <div className="mt-3 text-3xl font-semibold text-slate-950">
              {formatNumber(totalQuantity)}
            </div>
          </div>
          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">Transfer value</div>
            <div className="mt-3 text-3xl font-semibold text-slate-950">
              {transfer.status === "POSTED"
                ? `${currencyCode} ${formatNumber(totalValue, 2)}`
                : "Calculated on posting"}
            </div>
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-[1.75rem] border border-[#D9E3F4] bg-white shadow-sm">
          <div className="border-b border-[#D9E3F4] px-6 py-5">
            <h2 className="text-lg font-semibold text-slate-950">
              Transfer products
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#D9E3F4] text-sm">
              <thead className="bg-[#F8FAFC]">
                <tr className="text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4 text-right">Quantity</th>
                  <th className="px-6 py-4 text-right">Unit cost</th>
                  <th className="px-6 py-4 text-right">Total cost</th>
                  <th className="px-6 py-4">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8EEF8]">
                {lines.map((line) => {
                  const product = productMap.get(line.product_service_id);
                  return (
                    <tr key={line.id} className="hover:bg-slate-50">
                      <td className="px-6 py-5">
                        <div className="font-semibold text-slate-950">
                          {product?.item_name || "Product unavailable"}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {product?.sku || "No SKU"}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-5 text-right font-semibold text-slate-950">
                        {formatNumber(numberValue(line.quantity))}
                        {product?.unit_of_measure
                          ? ` ${product.unit_of_measure}`
                          : ""}
                      </td>
                      <td className="whitespace-nowrap px-6 py-5 text-right text-slate-700">
                        {line.unit_cost === null
                          ? "On posting"
                          : `${currencyCode} ${formatNumber(
                              numberValue(line.unit_cost),
                              2
                            )}`}
                      </td>
                      <td className="whitespace-nowrap px-6 py-5 text-right text-slate-700">
                        {line.total_cost === null
                          ? "On posting"
                          : `${currencyCode} ${formatNumber(
                              numberValue(line.total_cost),
                              2
                            )}`}
                      </td>
                      <td className="min-w-52 px-6 py-5 text-slate-600">
                        {line.line_note || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {transfer.notes ? (
          <div className="mt-6 rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
              <Boxes className="h-4 w-4 text-[#073D7F]" />
              Transfer notes
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
              {transfer.notes}
            </p>
          </div>
        ) : null}
      </section>
    </main>
  );
}