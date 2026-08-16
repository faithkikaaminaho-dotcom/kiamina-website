import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  ClipboardCheck,
  MapPin,
  Save,
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

type CountLine = {
  id: string;
  product_service_id: string;
  system_quantity: number | string;
  counted_quantity: number | string | null;
  variance_quantity: number | string;
  unit_cost: number | string;
  variance_value: number | string;
  adjustment_status: string;
  count_note: string | null;
};

type ProductRow = {
  id: string;
  item_name: string;
  sku: string | null;
  unit_of_measure: string | null;
};

function numberValue(value: number | string | null | undefined) {
  const converted = Number(value || 0);
  return Number.isFinite(converted) ? converted : 0;
}

function formatNumber(value: number, digits = 4) {
  return new Intl.NumberFormat("en-NG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
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

export default async function InventoryCountDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; countId: string }>;
  searchParams: Promise<{
    saved?: string;
    approved?: string;
    posted?: string;
  }>;
}) {
  const { id, countId } = await params;
  const { saved, approved, posted } = await searchParams;
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

  const role = String(profile?.role || "");

  if (!profile || !internalRoles.includes(role)) redirect("/portal");

  const { data: organisation } = await supabase
    .from("organisations")
    .select("id, legal_name, trading_name, base_currency_code")
    .eq("id", id)
    .single();

  if (!organisation) redirect("/portal/organisations");

  const { data: inventoryCount, error: countError } = await supabase
    .from("inventory_counts")
    .select(
      "id, organisation_id, count_reference, count_date, location_id, status, notes, prepared_at, reviewed_at, approved_at, posted_at, created_at"
    )
    .eq("id", countId)
    .eq("organisation_id", id)
    .single();

  if (countError || !inventoryCount) {
    redirect(`/portal/organisations/${id}/inventory-counts`);
  }

  const validatedLocationId = inventoryCount.location_id;

  const [locationResult, linesResult] = await Promise.all([
    supabase
      .from("tracking_options")
      .select("id, option_code, option_name")
      .eq("id", validatedLocationId)
      .eq("organisation_id", id)
      .single(),
    supabase
      .from("inventory_count_lines")
      .select(
        "id, product_service_id, system_quantity, counted_quantity, variance_quantity, unit_cost, variance_value, adjustment_status, count_note"
      )
      .eq("inventory_count_id", countId)
      .eq("organisation_id", id)
      .order("created_at", { ascending: true }),
  ]);

  if (locationResult.error || !locationResult.data) {
    throw new Error(locationResult.error?.message || "Location not found.");
  }

  if (linesResult.error) throw new Error(linesResult.error.message);

  const location = locationResult.data;
  const lines = (linesResult.data || []) as CountLine[];
  const productIds = lines.map((line) => line.product_service_id);
  let products: ProductRow[] = [];

  if (productIds.length > 0) {
    const { data, error } = await supabase
      .from("products_services")
      .select("id, item_name, sku, unit_of_measure")
      .eq("organisation_id", id)
      .in("id", productIds)
      .order("item_name", { ascending: true });

    if (error) throw new Error(error.message);
    products = (data || []) as ProductRow[];
  }

  const productMap = new Map(products.map((product) => [product.id, product]));
  const isGlobalInventoryManager = globalInventoryManagerRoles.includes(role);
  let canManageInventory = isGlobalInventoryManager;

  if (!isGlobalInventoryManager) {
    const { data: access } = await supabase
      .from("user_location_access")
      .select("can_manage_inventory")
      .eq("organisation_id", id)
      .eq("user_id", user.id)
      .eq("location_id", validatedLocationId)
      .eq("is_active", true)
      .maybeSingle();

    canManageInventory = access?.can_manage_inventory === true;
  }

  const canEdit =
    canManageInventory &&
    ["DRAFT", "READY_FOR_REVIEW", "UNDER_REVIEW"].includes(
      inventoryCount.status
    );

  const totalSystemQuantity = lines.reduce(
    (sum, line) => sum + numberValue(line.system_quantity),
    0
  );
  const totalCountedQuantity = lines.reduce(
    (sum, line) => sum + numberValue(line.counted_quantity),
    0
  );
  const totalVarianceQuantity = lines.reduce(
    (sum, line) => sum + numberValue(line.variance_quantity),
    0
  );
  const totalVarianceValue = lines.reduce(
    (sum, line) => sum + numberValue(line.variance_value),
    0
  );

  async function savePhysicalCount(formData: FormData) {
    "use server";

    const serverSupabase = await createClient();
    const {
      data: { user: actionUser },
    } = await serverSupabase.auth.getUser();

    if (!actionUser) redirect("/signin");

    const submittedLines = lines.map((line) => ({
      id: line.id,
      counted_quantity: String(
        formData.get(`counted_quantity_${line.id}`) ?? ""
      ).trim(),
      unit_cost: String(formData.get(`unit_cost_${line.id}`) ?? "").trim(),
      count_note:
        String(formData.get(`count_note_${line.id}`) ?? "").trim() || null,
    }));

    const { error } = await serverSupabase.rpc("save_inventory_count_lines", {
      requested_inventory_count_id: countId,
      requested_lines: submittedLines,
    });

    if (error) throw new Error(error.message);

    const detailPath =
      `/portal/organisations/${id}/inventory-counts/${countId}`;
    revalidatePath(detailPath);
    revalidatePath(`/portal/organisations/${id}/inventory-counts`);
    redirect(`${detailPath}?saved=1`);
  }

  async function approveCount() {
    "use server";

    const serverSupabase = await createClient();
    const {
      data: { user: actionUser },
    } = await serverSupabase.auth.getUser();

    if (!actionUser) redirect("/signin");

    const { error } = await serverSupabase.rpc("approve_inventory_count", {
      requested_inventory_count_id: countId,
    });

    if (error) throw new Error(error.message);

    const detailPath =
      `/portal/organisations/${id}/inventory-counts/${countId}`;
    revalidatePath(detailPath);
    revalidatePath(`/portal/organisations/${id}/inventory-counts`);
    redirect(`${detailPath}?approved=1`);
  }

  async function postCount() {
    "use server";

    const serverSupabase = await createClient();
    const {
      data: { user: actionUser },
    } = await serverSupabase.auth.getUser();

    if (!actionUser) redirect("/signin");

    const { error } = await serverSupabase.rpc("post_fifo_inventory_count", {
      requested_inventory_count_id: countId,
    });

    if (error) throw new Error(error.message);

    const detailPath =
      `/portal/organisations/${id}/inventory-counts/${countId}`;
    revalidatePath(detailPath);
    revalidatePath(`/portal/organisations/${id}/inventory-counts`);
    revalidatePath(`/portal/organisations/${id}/general-ledger`);
    revalidatePath(`/portal/organisations/${id}/trial-balance`);

    for (const line of lines) {
      revalidatePath(
        `/portal/organisations/${id}/products-services/${line.product_service_id}/locations/${validatedLocationId}`
      );
    }

    redirect(`${detailPath}?posted=1`);
  }

  const organisationName =
    organisation.trading_name || organisation.legal_name || "Organisation";
  const currencyCode = organisation.base_currency_code || "NGN";

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <section className="border-b border-[#D9E3F4] bg-white">
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          <Link
            href={`/portal/organisations/${id}/inventory-counts`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#073D7F]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Inventory Counts
          </Link>

          <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-start gap-5">
              <div className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#F1F1F1] text-[#073D7F]">
                <ClipboardCheck className="h-6 w-6" />
              </div>
              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                  Inventory Count
                </div>
                <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
                  {inventoryCount.count_reference}
                </h1>
                <p className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                  <MapPin className="h-4 w-4 text-[#073D7F]" />
                  {location.option_name}
                  {location.option_code ? ` · ${location.option_code}` : ""}
                  {` · ${formatDate(inventoryCount.count_date)}`}
                </p>
                <p className="mt-2 text-sm text-slate-500">{organisationName}</p>
              </div>
            </div>

            <span
              className={`inline-flex rounded-full px-4 py-2 text-sm font-semibold ${statusClass(
                inventoryCount.status
              )}`}
            >
              {inventoryCount.status.replaceAll("_", " ")}
            </span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        {saved === "1" ? (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-700">
            Physical count quantities and variances saved successfully.
          </div>
        ) : null}

        {approved === "1" ? (
          <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 text-sm font-semibold text-blue-700">
            Inventory count approved successfully. Recheck the adjustment and
            post it when ready.
          </div>
        ) : null}

        {posted === "1" ? (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-700">
            Inventory count adjustment posted successfully to FIFO inventory
            and the General Ledger.
          </div>
        ) : null}

        {isGlobalInventoryManager && inventoryCount.status === "DRAFT" ? (
          <div className="mb-6 rounded-[1.5rem] border border-amber-200 bg-amber-50 p-6">
            <div className="flex items-start gap-4">
              <ShieldCheck className="mt-1 h-6 w-6 shrink-0 text-amber-700" />
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-amber-950">
                  Approval required
                </h2>
                <p className="mt-2 text-sm leading-7 text-amber-800">
                  Approval confirms every product was counted and rechecks that
                  the frozen system quantities have not changed.
                </p>
                <form action={approveCount} className="mt-4">
                  <button
                    type="submit"
                    className="rounded-full bg-[#073D7F] px-6 py-3 text-sm font-semibold text-white"
                  >
                    Approve Count
                  </button>
                </form>
              </div>
            </div>
          </div>
        ) : null}

        {isGlobalInventoryManager && inventoryCount.status === "APPROVED" ? (
          <div className="mb-6 rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-6">
            <div className="flex items-start gap-4">
              <ShieldCheck className="mt-1 h-6 w-6 shrink-0 text-emerald-700" />
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-emerald-950">
                  Ready for controlled posting
                </h2>
                <p className="mt-2 text-sm leading-7 text-emerald-800">
                  Posting creates the FIFO count adjustment and a balanced
                  General Ledger entry. This action cannot be edited afterward.
                </p>
                <form action={postCount} className="mt-4">
                  <button
                    type="submit"
                    className="rounded-full bg-emerald-700 px-6 py-3 text-sm font-semibold text-white"
                  >
                    Post Count Adjustment
                  </button>
                </form>
              </div>
            </div>
          </div>
        ) : null}

        <div className="grid gap-5 md:grid-cols-4">
          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">Products</div>
            <div className="mt-3 text-3xl font-semibold text-slate-950">
              {lines.length}
            </div>
          </div>
          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">System quantity</div>
            <div className="mt-3 text-3xl font-semibold text-slate-950">
              {formatNumber(totalSystemQuantity)}
            </div>
          </div>
          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">Counted quantity</div>
            <div className="mt-3 text-3xl font-semibold text-slate-950">
              {formatNumber(totalCountedQuantity)}
            </div>
          </div>
          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">Variance value</div>
            <div
              className={`mt-3 text-3xl font-semibold ${
                totalVarianceValue < 0
                  ? "text-red-700"
                  : totalVarianceValue > 0
                    ? "text-emerald-700"
                    : "text-slate-950"
              }`}
            >
              {currencyCode} {formatNumber(totalVarianceValue, 2)}
            </div>
          </div>
        </div>

        <form
          action={savePhysicalCount}
          className="mt-8 overflow-hidden rounded-[1.75rem] border border-[#D9E3F4] bg-white shadow-sm"
        >
          <div className="border-b border-[#D9E3F4] px-6 py-5">
            <h2 className="text-lg font-semibold text-slate-950">
              Physical count sheet
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Enter a physical quantity for every product. Positive variances
              require a supportable unit cost.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#D9E3F4] text-sm">
              <thead className="bg-[#F8FAFC]">
                <tr className="text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4 text-right">System quantity</th>
                  <th className="px-6 py-4">Physical quantity</th>
                  <th className="px-6 py-4 text-right">Variance</th>
                  <th className="px-6 py-4">Unit cost</th>
                  <th className="px-6 py-4 text-right">Variance value</th>
                  <th className="px-6 py-4">Count note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8EEF8]">
                {lines.map((line) => {
                  const product = productMap.get(line.product_service_id);
                  const variance = numberValue(line.variance_quantity);
                  return (
                    <tr key={line.id} className="align-top hover:bg-slate-50">
                      <td className="min-w-56 px-6 py-5">
                        <div className="font-semibold text-slate-950">
                          {product?.item_name || "Product unavailable"}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {product?.sku || "No SKU"}
                          {product?.unit_of_measure
                            ? ` · ${product.unit_of_measure}`
                            : ""}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-5 text-right font-semibold text-slate-950">
                        {formatNumber(numberValue(line.system_quantity))}
                      </td>
                      <td className="min-w-44 px-6 py-5">
                        <input
                          type="number"
                          name={`counted_quantity_${line.id}`}
                          min="0"
                          step="0.0001"
                          required
                          disabled={!canEdit}
                          defaultValue={line.counted_quantity ?? ""}
                          placeholder="Enter count"
                          className="w-full rounded-xl border border-[#D9E3F4] bg-white px-3 py-2.5 text-sm disabled:bg-slate-100"
                        />
                      </td>
                      <td
                        className={`whitespace-nowrap px-6 py-5 text-right font-semibold ${
                          variance < 0
                            ? "text-red-700"
                            : variance > 0
                              ? "text-emerald-700"
                              : "text-slate-700"
                        }`}
                      >
                        {formatNumber(variance)}
                      </td>
                      <td className="min-w-44 px-6 py-5">
                        <input
                          type="number"
                          name={`unit_cost_${line.id}`}
                          min="0"
                          step="0.000001"
                          required
                          disabled={!canEdit}
                          defaultValue={line.unit_cost}
                          className="w-full rounded-xl border border-[#D9E3F4] bg-white px-3 py-2.5 text-sm disabled:bg-slate-100"
                        />
                      </td>
                      <td className="whitespace-nowrap px-6 py-5 text-right font-semibold text-slate-800">
                        {currencyCode} {formatNumber(numberValue(line.variance_value), 2)}
                      </td>
                      <td className="min-w-56 px-6 py-5">
                        <input
                          name={`count_note_${line.id}`}
                          disabled={!canEdit}
                          defaultValue={line.count_note || ""}
                          placeholder="Optional explanation"
                          className="w-full rounded-xl border border-[#D9E3F4] bg-white px-3 py-2.5 text-sm disabled:bg-slate-100"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {canEdit ? (
            <div className="flex flex-col gap-3 border-t border-[#D9E3F4] px-6 py-5 sm:flex-row">
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#073D7F] px-6 py-3 text-sm font-semibold text-white"
              >
                <Save className="h-4 w-4" />
                Save Physical Count
              </button>
              <Link
                href={`/portal/organisations/${id}/inventory-counts`}
                className="rounded-full border border-[#D9E3F4] bg-white px-6 py-3 text-center text-sm font-semibold text-[#073D7F]"
              >
                Back to register
              </Link>
            </div>
          ) : null}
        </form>

        {inventoryCount.notes ? (
          <div className="mt-6 rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">Count notes</div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
              {inventoryCount.notes}
            </p>
          </div>
        ) : null}

        <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 text-sm leading-7 text-blue-800">
          {inventoryCount.status === "POSTED" ? (
            <>
              Total quantity variance: {formatNumber(totalVarianceQuantity)}.
              The FIFO inventory adjustment and balanced General Ledger entry
              have been posted.
            </>
          ) : (
            <>
              Total quantity variance: {formatNumber(totalVarianceQuantity)}.
              Saving the physical count does not post an inventory adjustment.
            </>
          )}
        </div>
      </section>
    </main>
  );
}