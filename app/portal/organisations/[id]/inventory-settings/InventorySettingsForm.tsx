"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type AccountOption = {
  id: string;
  account_code: string | null;
  account_name: string | null;
};

type InventorySettings = {
  inventory_tracking_enabled: boolean | null;
  inventory_valuation_method: string | null;

  default_inventory_asset_account_id:
    | string
    | null;

  default_cost_of_sales_account_id:
    | string
    | null;

  inventory_adjustment_account_id:
    | string
    | null;

  inventory_write_off_account_id:
    | string
    | null;

  allow_negative_inventory: boolean | null;

  require_inventory_count_approval:
    | boolean
    | null;
};

const valuationMethods = [
  {
    value: "WEIGHTED_AVERAGE",
    label: "Weighted Average",
    description:
      "Inventory issues use the current weighted-average cost.",
  },
  {
    value: "FIFO",
    label: "First In, First Out",
    description:
      "The earliest inventory costs are issued first.",
  },
  {
    value: "SPECIFIC_IDENTIFICATION",
    label: "Specific Identification",
    description:
      "Each inventory unit or batch retains its specifically identified cost.",
  },
];

function accountLabel(account: AccountOption) {
  return `${account.account_code || "No code"} - ${
    account.account_name || "Unnamed account"
  }`;
}

export default function InventorySettingsForm({
  organisationId,
  settings,
  inventoryAssetAccounts,
  costOfSalesAccounts,
  adjustmentAccounts,
  writeOffAccounts,
}: {
  organisationId: string;
  settings: InventorySettings;
  inventoryAssetAccounts: AccountOption[];
  costOfSalesAccounts: AccountOption[];
  adjustmentAccounts: AccountOption[];
  writeOffAccounts: AccountOption[];
}) {
  const router = useRouter();

  const [
    inventoryTrackingEnabled,
    setInventoryTrackingEnabled,
  ] = useState(
    settings.inventory_tracking_enabled === true
  );

  const [
    inventoryValuationMethod,
    setInventoryValuationMethod,
  ] = useState(
    settings.inventory_valuation_method ||
      "WEIGHTED_AVERAGE"
  );

  const [
    defaultInventoryAssetAccountId,
    setDefaultInventoryAssetAccountId,
  ] = useState(
    settings.default_inventory_asset_account_id ||
      ""
  );

  const [
    defaultCostOfSalesAccountId,
    setDefaultCostOfSalesAccountId,
  ] = useState(
    settings.default_cost_of_sales_account_id ||
      ""
  );

  const [
    inventoryAdjustmentAccountId,
    setInventoryAdjustmentAccountId,
  ] = useState(
    settings.inventory_adjustment_account_id ||
      ""
  );

  const [
    inventoryWriteOffAccountId,
    setInventoryWriteOffAccountId,
  ] = useState(
    settings.inventory_write_off_account_id ||
      ""
  );

  const [
    allowNegativeInventory,
    setAllowNegativeInventory,
  ] = useState(
    settings.allow_negative_inventory === true
  );

  const [
    requireInventoryCountApproval,
    setRequireInventoryCountApproval,
  ] = useState(
    settings.require_inventory_count_approval !==
      false
  );

  const [submitting, setSubmitting] =
    useState(false);

  const [successMessage, setSuccessMessage] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSubmitting(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const response = await fetch(
        `/api/organisations/${organisationId}/inventory-settings`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inventory_tracking_enabled:
              inventoryTrackingEnabled,

            inventory_valuation_method:
              inventoryValuationMethod,

            default_inventory_asset_account_id:
              defaultInventoryAssetAccountId ||
              null,

            default_cost_of_sales_account_id:
              defaultCostOfSalesAccountId ||
              null,

            inventory_adjustment_account_id:
              inventoryAdjustmentAccountId ||
              null,

            inventory_write_off_account_id:
              inventoryWriteOffAccountId ||
              null,

            allow_negative_inventory:
              allowNegativeInventory,

            require_inventory_count_approval:
              requireInventoryCountApproval,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Unable to save inventory settings."
        );
      }

      setSuccessMessage(
        "Inventory settings saved successfully."
      );

      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to save inventory settings."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-8"
    >
      {successMessage ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-700">
          {successMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <section className="rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm">
        <div>
          <div className="text-sm font-semibold uppercase tracking-[0.2em] text-[#6491DE]">
            Organisation Policy
          </div>

          <h2 className="mt-3 text-2xl font-semibold text-slate-950">
            Inventory tracking
          </h2>

          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            Enable inventory accounting for this
            organisation. Individual products may
            then be marked as inventory-tracked and
            assigned to one or more locations.
          </p>
        </div>

        <label className="mt-6 flex items-start gap-4 rounded-2xl border border-[#D9E3F4] bg-[#F8FAFC] p-5">
          <input
            type="checkbox"
            checked={inventoryTrackingEnabled}
            onChange={(event) =>
              setInventoryTrackingEnabled(
                event.target.checked
              )
            }
            className="mt-1 h-5 w-5 rounded border-slate-300"
          />

          <span>
            <span className="block text-sm font-semibold text-slate-950">
              Enable inventory tracking
            </span>

            <span className="mt-1 block text-sm leading-6 text-slate-500">
              Activates inventory products,
              multi-location quantities, inventory
              movements and period-end physical
              counts.
            </span>
          </span>
        </label>

        {!inventoryTrackingEnabled ? (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-7 text-amber-800">
            Inventory is currently disabled.
            Existing inventory records remain
            preserved, but new inventory activity
            should not be created.
          </div>
        ) : null}
      </section>

      <section
        className={`rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm ${
          inventoryTrackingEnabled
            ? ""
            : "opacity-60"
        }`}
      >
        <div>
          <div className="text-sm font-semibold uppercase tracking-[0.2em] text-[#6491DE]">
            Costing Policy
          </div>

          <h2 className="mt-3 text-2xl font-semibold text-slate-950">
            Inventory valuation method
          </h2>

          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            This organisation-wide policy applies
            consistently to inventory products and
            locations.
          </p>
        </div>

        <div className="mt-6 grid gap-4">
          {valuationMethods.map((method) => (
            <label
              key={method.value}
              className={`flex cursor-pointer items-start gap-4 rounded-2xl border p-5 ${
                inventoryValuationMethod ===
                method.value
                  ? "border-[#073D7F] bg-blue-50"
                  : "border-[#D9E3F4] bg-[#F8FAFC]"
              }`}
            >
              <input
                type="radio"
                name="inventoryValuationMethod"
                value={method.value}
                checked={
                  inventoryValuationMethod ===
                  method.value
                }
                onChange={(event) =>
                  setInventoryValuationMethod(
                    event.target.value
                  )
                }
                disabled={!inventoryTrackingEnabled}
                className="mt-1 h-4 w-4"
              />

              <span>
                <span className="block text-sm font-semibold text-slate-950">
                  {method.label}
                </span>

                <span className="mt-1 block text-sm leading-6 text-slate-500">
                  {method.description}
                </span>
              </span>
            </label>
          ))}
        </div>
      </section>

      <section
        className={`rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm ${
          inventoryTrackingEnabled
            ? ""
            : "opacity-60"
        }`}
      >
        <div>
          <div className="text-sm font-semibold uppercase tracking-[0.2em] text-[#6491DE]">
            Default Posting Accounts
          </div>

          <h2 className="mt-3 text-2xl font-semibold text-slate-950">
            Inventory GL mappings
          </h2>

          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            These organisation defaults are inherited
            by inventory products and inventory
            posting workflows.
          </p>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Default inventory asset account
            </span>

            <select
              value={
                defaultInventoryAssetAccountId
              }
              onChange={(event) =>
                setDefaultInventoryAssetAccountId(
                  event.target.value
                )
              }
              required={inventoryTrackingEnabled}
              disabled={!inventoryTrackingEnabled}
              className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm disabled:cursor-not-allowed disabled:bg-slate-100"
            >
              <option value="">
                Select inventory asset account
              </option>

              {inventoryAssetAccounts.map(
                (account) => (
                  <option
                    key={account.id}
                    value={account.id}
                  >
                    {accountLabel(account)}
                  </option>
                )
              )}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Default cost of sales account
            </span>

            <select
              value={
                defaultCostOfSalesAccountId
              }
              onChange={(event) =>
                setDefaultCostOfSalesAccountId(
                  event.target.value
                )
              }
              required={inventoryTrackingEnabled}
              disabled={!inventoryTrackingEnabled}
              className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm disabled:cursor-not-allowed disabled:bg-slate-100"
            >
              <option value="">
                Select cost of sales account
              </option>

              {costOfSalesAccounts.map(
                (account) => (
                  <option
                    key={account.id}
                    value={account.id}
                  >
                    {accountLabel(account)}
                  </option>
                )
              )}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Inventory adjustment account
            </span>

            <select
              value={
                inventoryAdjustmentAccountId
              }
              onChange={(event) =>
                setInventoryAdjustmentAccountId(
                  event.target.value
                )
              }
              required={inventoryTrackingEnabled}
              disabled={!inventoryTrackingEnabled}
              className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm disabled:cursor-not-allowed disabled:bg-slate-100"
            >
              <option value="">
                Select adjustment account
              </option>

              {adjustmentAccounts.map(
                (account) => (
                  <option
                    key={account.id}
                    value={account.id}
                  >
                    {accountLabel(account)}
                  </option>
                )
              )}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Inventory write-off account
            </span>

            <select
              value={
                inventoryWriteOffAccountId
              }
              onChange={(event) =>
                setInventoryWriteOffAccountId(
                  event.target.value
                )
              }
              required={inventoryTrackingEnabled}
              disabled={!inventoryTrackingEnabled}
              className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm disabled:cursor-not-allowed disabled:bg-slate-100"
            >
              <option value="">
                Select write-off account
              </option>

              {writeOffAccounts.map(
                (account) => (
                  <option
                    key={account.id}
                    value={account.id}
                  >
                    {accountLabel(account)}
                  </option>
                )
              )}
            </select>
          </label>
        </div>
      </section>

      <section
        className={`rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm ${
          inventoryTrackingEnabled
            ? ""
            : "opacity-60"
        }`}
      >
        <div>
          <div className="text-sm font-semibold uppercase tracking-[0.2em] text-[#6491DE]">
            Inventory Controls
          </div>

          <h2 className="mt-3 text-2xl font-semibold text-slate-950">
            Operational controls
          </h2>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="flex items-start gap-3 rounded-2xl border border-[#D9E3F4] bg-[#F8FAFC] p-5">
            <input
              type="checkbox"
              checked={allowNegativeInventory}
              onChange={(event) =>
                setAllowNegativeInventory(
                  event.target.checked
                )
              }
              disabled={!inventoryTrackingEnabled}
              className="mt-1 h-4 w-4"
            />

            <span>
              <span className="block text-sm font-semibold text-slate-950">
                Allow negative inventory
              </span>

              <span className="mt-1 block text-sm leading-6 text-slate-500">
                Permit posted quantity-out movements
                to exceed available stock at a
                location.
              </span>
            </span>
          </label>

          <label className="flex items-start gap-3 rounded-2xl border border-[#D9E3F4] bg-[#F8FAFC] p-5">
            <input
              type="checkbox"
              checked={
                requireInventoryCountApproval
              }
              onChange={(event) =>
                setRequireInventoryCountApproval(
                  event.target.checked
                )
              }
              disabled={!inventoryTrackingEnabled}
              className="mt-1 h-4 w-4"
            />

            <span>
              <span className="block text-sm font-semibold text-slate-950">
                Require inventory-count approval
              </span>

              <span className="mt-1 block text-sm leading-6 text-slate-500">
                Physical-count adjustments must be
                reviewed and approved before posting.
              </span>
            </span>
          </label>
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-[#073D7F] px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting
            ? "Saving inventory settings..."
            : "Save Inventory Settings"}
        </button>

        <a
          href={`/portal/organisations/${organisationId}`}
          className="rounded-full border border-[#D9E3F4] bg-white px-6 py-3 text-center text-sm font-semibold text-[#073D7F]"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}