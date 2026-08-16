"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRightLeft, CirclePlus, Trash2 } from "lucide-react";

export type TransferLocationOption = {
  id: string;
  option_code: string | null;
  option_name: string;
};

export type TransferProductOption = {
  id: string;
  item_name: string;
  sku: string | null;
  unit_of_measure: string | null;
};

export type ProductLocationAssignment = {
  product_service_id: string;
  location_id: string;
};

type FormLine = {
  key: string;
  productServiceId: string;
  quantity: string;
  lineNote: string;
};

function localDateValue() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function newLine(key: string): FormLine {
  return {
    key,
    productServiceId: "",
    quantity: "",
    lineNote: "",
  };
}

export default function CreateInventoryTransferForm({
  organisationId,
  locations,
  products,
  assignments,
}: {
  organisationId: string;
  locations: TransferLocationOption[];
  products: TransferProductOption[];
  assignments: ProductLocationAssignment[];
}) {
  const router = useRouter();
  const [transferReference, setTransferReference] = useState("");
  const [transferDate, setTransferDate] = useState(localDateValue);
  const [fromLocationId, setFromLocationId] = useState("");
  const [toLocationId, setToLocationId] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<FormLine[]>([newLine("line-1")]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const locationProductMap = useMemo(() => {
    const map = new Map<string, Set<string>>();

    for (const assignment of assignments) {
      const current = map.get(assignment.location_id) || new Set<string>();
      current.add(assignment.product_service_id);
      map.set(assignment.location_id, current);
    }

    return map;
  }, [assignments]);

  const eligibleProducts = useMemo(() => {
    if (!fromLocationId || !toLocationId) return [];

    const sourceProducts =
      locationProductMap.get(fromLocationId) || new Set<string>();
    const destinationProducts =
      locationProductMap.get(toLocationId) || new Set<string>();

    return products.filter(
      (product) =>
        sourceProducts.has(product.id) && destinationProducts.has(product.id)
    );
  }, [fromLocationId, locationProductMap, products, toLocationId]);

  function resetLines() {
    setLines([newLine(`line-${Date.now()}`)]);
  }

  function updateLine(
    key: string,
    field: "productServiceId" | "quantity" | "lineNote",
    value: string
  ) {
    setLines((current) =>
      current.map((line) =>
        line.key === key ? { ...line, [field]: value } : line
      )
    );
  }

  function addLine() {
    setLines((current) => [
      ...current,
      newLine(`line-${Date.now()}-${current.length}`),
    ]);
  }

  function removeLine(key: string) {
    setLines((current) => {
      if (current.length === 1) return current;
      return current.filter((line) => line.key !== key);
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage("");

    try {
      if (fromLocationId === toLocationId) {
        throw new Error("Source and destination locations must be different.");
      }

      const response = await fetch("/api/inventory-transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organisation_id: organisationId,
          transfer_reference: transferReference,
          transfer_date: transferDate,
          from_location_id: fromLocationId,
          to_location_id: toLocationId,
          notes,
          lines: lines.map((line) => ({
            product_service_id: line.productServiceId,
            quantity: line.quantity,
            line_note: line.lineNote,
          })),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to create transfer.");
      }

      const createdReference = result.transferReference || "created";
      router.push(
        `/portal/organisations/${organisationId}/inventory-transfers?created=${encodeURIComponent(
          createdReference
        )}`
      );
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to create transfer."
      );
    } finally {
      setSubmitting(false);
    }
  }

  const locationsReady = locations.length >= 2;
  const locationsSelected = Boolean(fromLocationId && toLocationId);

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm"
    >
      {errorMessage ? (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      {!locationsReady ? (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-7 text-amber-800">
          You need inventory-management permission for at least two active
          locations before creating a transfer.
        </div>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Transfer reference
          </span>
          <input
            value={transferReference}
            onChange={(event) => setTransferReference(event.target.value)}
            placeholder="Leave blank to generate automatically"
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Transfer date <span className="text-red-600">*</span>
          </span>
          <input
            type="date"
            value={transferDate}
            onChange={(event) => setTransferDate(event.target.value)}
            required
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Source location <span className="text-red-600">*</span>
          </span>
          <select
            value={fromLocationId}
            onChange={(event) => {
              setFromLocationId(event.target.value);
              resetLines();
            }}
            required
            disabled={!locationsReady}
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F] disabled:bg-slate-100"
          >
            <option value="">Select source location</option>
            {locations.map((location) => (
              <option
                key={location.id}
                value={location.id}
                disabled={location.id === toLocationId}
              >
                {location.option_name}
                {location.option_code ? ` (${location.option_code})` : ""}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Destination location <span className="text-red-600">*</span>
          </span>
          <select
            value={toLocationId}
            onChange={(event) => {
              setToLocationId(event.target.value);
              resetLines();
            }}
            required
            disabled={!locationsReady}
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F] disabled:bg-slate-100"
          >
            <option value="">Select destination location</option>
            {locations.map((location) => (
              <option
                key={location.id}
                value={location.id}
                disabled={location.id === fromLocationId}
              >
                {location.option_name}
                {location.option_code ? ` (${location.option_code})` : ""}
              </option>
            ))}
          </select>
        </label>

        <label className="block md:col-span-2">
          <span className="text-sm font-semibold text-slate-700">Notes</span>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
            placeholder="Optional transfer instructions or explanation"
            className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm leading-7 outline-none focus:border-[#073D7F]"
          />
        </label>
      </div>

      <div className="my-8 border-t border-[#D9E3F4]" />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">
            Products to transfer
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Only products active at both selected locations are available.
          </p>
        </div>

        <button
          type="button"
          onClick={addLine}
          disabled={!locationsSelected || eligibleProducts.length === 0}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-[#BCD2F3] bg-white px-5 py-2.5 text-sm font-semibold text-[#073D7F] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <CirclePlus className="h-4 w-4" />
          Add product
        </button>
      </div>

      {locationsSelected && eligibleProducts.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-7 text-amber-800">
          No inventory product is active at both locations. Open the product’s
          Manage locations page and activate it at the destination first.
        </div>
      ) : null}

      <div className="mt-6 space-y-4">
        {lines.map((line, index) => {
          const selectedElsewhere = new Set(
            lines
              .filter((otherLine) => otherLine.key !== line.key)
              .map((otherLine) => otherLine.productServiceId)
              .filter(Boolean)
          );

          return (
            <div
              key={line.key}
              className="grid gap-4 rounded-2xl border border-[#D9E3F4] bg-[#F8FAFC] p-5 lg:grid-cols-[1fr_180px_1fr_auto] lg:items-end"
            >
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Product {index + 1} <span className="text-red-600">*</span>
                </span>
                <select
                  value={line.productServiceId}
                  onChange={(event) =>
                    updateLine(line.key, "productServiceId", event.target.value)
                  }
                  required
                  disabled={!locationsSelected || eligibleProducts.length === 0}
                  className="mt-2 w-full rounded-2xl border border-[#D9E3F4] bg-white px-4 py-3 text-sm outline-none focus:border-[#073D7F] disabled:bg-slate-100"
                >
                  <option value="">
                    {locationsSelected
                      ? "Select product"
                      : "Select both locations first"}
                  </option>
                  {eligibleProducts.map((product) => (
                    <option
                      key={product.id}
                      value={product.id}
                      disabled={selectedElsewhere.has(product.id)}
                    >
                      {product.item_name}
                      {product.sku ? ` (${product.sku})` : ""}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Quantity <span className="text-red-600">*</span>
                </span>
                <input
                  type="number"
                  min="0.0001"
                  step="0.0001"
                  value={line.quantity}
                  onChange={(event) =>
                    updateLine(line.key, "quantity", event.target.value)
                  }
                  required
                  placeholder="0.0000"
                  className="mt-2 w-full rounded-2xl border border-[#D9E3F4] bg-white px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Line note
                </span>
                <input
                  value={line.lineNote}
                  onChange={(event) =>
                    updateLine(line.key, "lineNote", event.target.value)
                  }
                  placeholder="Optional"
                  className="mt-2 w-full rounded-2xl border border-[#D9E3F4] bg-white px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
                />
              </label>

              <button
                type="button"
                onClick={() => removeLine(line.key)}
                disabled={lines.length === 1}
                aria-label={`Remove product line ${index + 1}`}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-red-200 bg-white text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          disabled={
            submitting ||
            !locationsReady ||
            !locationsSelected ||
            eligibleProducts.length === 0
          }
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#073D7F] px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ArrowRightLeft className="h-4 w-4" />
          {submitting ? "Saving transfer..." : "Save Draft Transfer"}
        </button>

        <button
          type="button"
          onClick={() => router.push(`/portal/organisations/${organisationId}/inventory-transfers`)}
          className="rounded-full border border-[#D9E3F4] bg-white px-6 py-3 text-sm font-semibold text-[#073D7F]"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
