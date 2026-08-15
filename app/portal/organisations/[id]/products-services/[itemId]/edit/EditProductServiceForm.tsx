"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CurrencySelect from "@/app/portal/components/CurrencySelect";

type ProductServiceRecord = {
  id: string;
  item_name: string | null;
  item_type: string | null;
  sku: string | null;
  description: string | null;
  unit_price: number | null;
  currency_code: string | null;
  income_account_id: string | null;
  expense_account_id: string | null;
  tax_account_id: string | null;
  tax_relevant: boolean | null;
  taxable: boolean | null;
  is_active: boolean | null;

  track_inventory: boolean | null;
  unit_of_measure: string | null;
  inventory_asset_account_id: string | null;
  cost_of_sales_account_id: string | null;
  default_purchase_cost: number | null;
  inventory_valuation_method: string | null;
};

type AccountOption = {
  id: string;
  account_code: string | null;
  account_name: string | null;
};

type LocationOption = {
  id: string;
  option_code: string | null;
  option_name: string | null;
};

const itemTypes = [
  ["SERVICE", "Service"],
  ["PRODUCT", "Product"],
  ["BUNDLE", "Bundle"],
  ["OTHER", "Other"],
];

const valuationMethods = [
  [
    "WEIGHTED_AVERAGE",
    "Weighted Average",
  ],
  ["FIFO", "First In, First Out"],
  [
    "SPECIFIC_IDENTIFICATION",
    "Specific Identification",
  ],
];

const unitsOfMeasure = [
  "Each",
  "Unit",
  "Piece",
  "Pack",
  "Box",
  "Carton",
  "Bag",
  "Bottle",
  "Kilogram",
  "Gram",
  "Litre",
  "Metre",
  "Square Metre",
  "Cubic Metre",
  "Hour",
  "Day",
  "Other",
];

export default function EditProductServiceForm({
  organisationId,
  item,
  defaultCurrency,
  incomeAccounts,
  expenseAccounts,
  taxAccounts,
  inventoryAssetAccounts,
  costOfSalesAccounts,
  locationOptions,
  selectedLocationIds,
  existingReorderLevel,
}: {
  organisationId: string;
  item: ProductServiceRecord;
  defaultCurrency?: string | null;
  incomeAccounts: AccountOption[];
  expenseAccounts: AccountOption[];
  taxAccounts: AccountOption[];
  inventoryAssetAccounts: AccountOption[];
  costOfSalesAccounts: AccountOption[];
  locationOptions: LocationOption[];
  selectedLocationIds: string[];
  existingReorderLevel: number | null;
}) {
  const router = useRouter();

  const [itemName, setItemName] = useState(
    item.item_name || ""
  );

  const [itemType, setItemType] = useState(
    item.item_type || "SERVICE"
  );

  const [sku, setSku] = useState(
    item.sku || ""
  );

  const [description, setDescription] =
    useState(item.description || "");

  const [unitPrice, setUnitPrice] = useState(
    item.unit_price === null
      ? ""
      : String(item.unit_price)
  );

  const [currencyCode, setCurrencyCode] =
    useState(
      item.currency_code ||
        defaultCurrency ||
        ""
    );

  const [incomeAccountId, setIncomeAccountId] =
    useState(
      item.income_account_id || ""
    );

  const [
    expenseAccountId,
    setExpenseAccountId,
  ] = useState(
    item.expense_account_id || ""
  );

  const [taxAccountId, setTaxAccountId] =
    useState(item.tax_account_id || "");

  const [taxRelevant, setTaxRelevant] =
    useState(item.tax_relevant === true);

  const [taxable, setTaxable] = useState(
    item.taxable === true
  );

  const [isActive, setIsActive] = useState(
    item.is_active !== false
  );

  const [trackInventory, setTrackInventory] =
    useState(
      item.item_type === "PRODUCT" &&
        item.track_inventory === true
    );

  const [unitOfMeasure, setUnitOfMeasure] =
    useState(item.unit_of_measure || "");

  const [
    inventoryAssetAccountId,
    setInventoryAssetAccountId,
  ] = useState(
    item.inventory_asset_account_id || ""
  );

  const [
    costOfSalesAccountId,
    setCostOfSalesAccountId,
  ] = useState(
    item.cost_of_sales_account_id || ""
  );

  const [
    defaultPurchaseCost,
    setDefaultPurchaseCost,
  ] = useState(
    item.default_purchase_cost === null
      ? ""
      : String(item.default_purchase_cost)
  );

  const [
    inventoryValuationMethod,
    setInventoryValuationMethod,
  ] = useState(
    item.inventory_valuation_method ||
      "WEIGHTED_AVERAGE"
  );

  const [
    inventoryLocationIds,
    setInventoryLocationIds,
  ] = useState<string[]>(
    selectedLocationIds
  );

  const [reorderLevel, setReorderLevel] =
    useState(
      existingReorderLevel === null
        ? ""
        : String(existingReorderLevel)
    );

  const [submitting, setSubmitting] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const isProduct = itemType === "PRODUCT";

  function handleItemTypeChange(
    nextItemType: string
  ) {
    setItemType(nextItemType);

    if (nextItemType !== "PRODUCT") {
      setTrackInventory(false);
    }
  }

  function handleTaxRelevantChange(
    checked: boolean
  ) {
    setTaxRelevant(checked);

    if (!checked) {
      setTaxable(false);
      setTaxAccountId("");
    }
  }

  function handleTaxableChange(
    checked: boolean
  ) {
    setTaxable(checked);

    if (checked) {
      setTaxRelevant(true);
    }
  }

  function toggleLocation(
    locationId: string
  ) {
    setInventoryLocationIds(
      (currentLocationIds) =>
        currentLocationIds.includes(locationId)
          ? currentLocationIds.filter(
              (id) => id !== locationId
            )
          : [
              ...currentLocationIds,
              locationId,
            ]
    );
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch(
        `/api/products-services/${item.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            organisation_id: organisationId,
            item_name: itemName,
            item_type: itemType,
            sku: sku || null,
            description:
              description || null,
            unit_price:
              unitPrice || null,
            currency_code:
              currencyCode || null,
            income_account_id:
              incomeAccountId || null,
            expense_account_id:
              expenseAccountId || null,
            tax_account_id:
              taxAccountId || null,
            tax_relevant: taxRelevant,
            taxable,
            is_active: isActive,

            track_inventory:
              isProduct &&
              trackInventory,

            unit_of_measure:
              isProduct &&
              trackInventory
                ? unitOfMeasure || null
                : null,

            inventory_asset_account_id:
              isProduct &&
              trackInventory
                ? inventoryAssetAccountId ||
                  null
                : null,

            cost_of_sales_account_id:
              isProduct &&
              trackInventory
                ? costOfSalesAccountId ||
                  null
                : null,

            default_purchase_cost:
              isProduct &&
              trackInventory
                ? defaultPurchaseCost ||
                  null
                : null,

            inventory_valuation_method:
              isProduct &&
              trackInventory
                ? inventoryValuationMethod
                : null,

            location_ids:
              isProduct &&
              trackInventory
                ? inventoryLocationIds
                : [],

            reorder_level:
              isProduct &&
              trackInventory
                ? reorderLevel || null
                : null,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Unable to update product or service."
        );
      }

      router.push(
        `/portal/organisations/${organisationId}/products-services/${item.id}`
      );

      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to update product or service."
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
      {errorMessage ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <section className="rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-950">
          Product / Service information
        </h2>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <label className="block md:col-span-2">
            <span className="text-sm font-semibold text-slate-700">
              Product / Service name
            </span>

            <input
              value={itemName}
              onChange={(event) =>
                setItemName(
                  event.target.value
                )
              }
              required
              className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Item type
            </span>

            <select
              value={itemType}
              onChange={(event) =>
                handleItemTypeChange(
                  event.target.value
                )
              }
              className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
            >
              {itemTypes.map(
                ([value, label]) => (
                  <option
                    key={value}
                    value={value}
                  >
                    {label}
                  </option>
                )
              )}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              SKU / Code
            </span>

            <input
              value={sku}
              onChange={(event) =>
                setSku(event.target.value)
              }
              placeholder="ITEM-001"
              className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Default selling price
            </span>

            <input
              type="number"
              min="0"
              step="0.01"
              value={unitPrice}
              onChange={(event) =>
                setUnitPrice(
                  event.target.value
                )
              }
              className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
            />
          </label>

          <CurrencySelect
            label="Currency"
            value={currencyCode}
            onChange={setCurrencyCode}
          />

          <label className="block md:col-span-2">
            <span className="text-sm font-semibold text-slate-700">
              Description
            </span>

            <textarea
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value
                )
              }
              rows={4}
              className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm leading-7 outline-none focus:border-[#073D7F]"
            />
          </label>
        </div>
      </section>

      <section className="rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-950">
          Default accounting mappings
        </h2>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Income account
            </span>

            <select
              value={incomeAccountId}
              onChange={(event) =>
                setIncomeAccountId(
                  event.target.value
                )
              }
              className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm"
            >
              <option value="">
                Select income account
              </option>

              {incomeAccounts.map(
                (account) => (
                  <option
                    key={account.id}
                    value={account.id}
                  >
                    {account.account_code ||
                      "No code"}{" "}
                    -{" "}
                    {account.account_name ||
                      "Unnamed account"}
                  </option>
                )
              )}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Expense account
            </span>

            <select
              value={expenseAccountId}
              onChange={(event) =>
                setExpenseAccountId(
                  event.target.value
                )
              }
              className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm"
            >
              <option value="">
                Select expense account
              </option>

              {expenseAccounts.map(
                (account) => (
                  <option
                    key={account.id}
                    value={account.id}
                  >
                    {account.account_code ||
                      "No code"}{" "}
                    -{" "}
                    {account.account_name ||
                      "Unnamed account"}
                  </option>
                )
              )}
            </select>
          </label>

          <label className="block md:col-span-2">
            <span className="text-sm font-semibold text-slate-700">
              Tax account
            </span>

            <select
              value={taxAccountId}
              onChange={(event) =>
                setTaxAccountId(
                  event.target.value
                )
              }
              disabled={!taxRelevant}
              className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm disabled:cursor-not-allowed disabled:bg-slate-100"
            >
              <option value="">
                Select tax account
              </option>

              {taxAccounts.map(
                (account) => (
                  <option
                    key={account.id}
                    value={account.id}
                  >
                    {account.account_code ||
                      "No code"}{" "}
                    -{" "}
                    {account.account_name ||
                      "Unnamed account"}
                  </option>
                )
              )}
            </select>
          </label>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="flex items-start gap-3 rounded-2xl border border-[#D9E3F4] bg-[#F8FAFC] p-5">
            <input
              type="checkbox"
              checked={taxRelevant}
              onChange={(event) =>
                handleTaxRelevantChange(
                  event.target.checked
                )
              }
              className="mt-1 h-4 w-4"
            />

            <span>
              <span className="block text-sm font-semibold text-slate-950">
                Tax relevant
              </span>
              <span className="mt-1 block text-sm text-slate-500">
                Include this item in tax
                reporting and controls.
              </span>
            </span>
          </label>

          <label className="flex items-start gap-3 rounded-2xl border border-[#D9E3F4] bg-[#F8FAFC] p-5">
            <input
              type="checkbox"
              checked={taxable}
              onChange={(event) =>
                handleTaxableChange(
                  event.target.checked
                )
              }
              className="mt-1 h-4 w-4"
            />

            <span>
              <span className="block text-sm font-semibold text-slate-950">
                Taxable
              </span>
              <span className="mt-1 block text-sm text-slate-500">
                Tax normally applies when
                this item is selected.
              </span>
            </span>
          </label>
        </div>
      </section>

      {isProduct ? (
        <section className="rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-950">
            Inventory tracking
          </h2>

          <label className="mt-6 flex items-start gap-3 rounded-2xl border border-[#D9E3F4] bg-[#F8FAFC] p-5">
            <input
              type="checkbox"
              checked={trackInventory}
              onChange={(event) =>
                setTrackInventory(
                  event.target.checked
                )
              }
              className="mt-1 h-4 w-4"
            />

            <span>
              <span className="block text-sm font-semibold text-slate-950">
                Track inventory quantities
              </span>

              <span className="mt-1 block text-sm leading-6 text-slate-500">
                Track quantities, costs and
                period-end counts by location.
              </span>
            </span>
          </label>

          {trackInventory ? (
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Unit of measure
                </span>

                <select
                  value={unitOfMeasure}
                  onChange={(event) =>
                    setUnitOfMeasure(
                      event.target.value
                    )
                  }
                  required
                  className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm"
                >
                  <option value="">
                    Select unit
                  </option>

                  {unitsOfMeasure.map(
                    (unit) => (
                      <option
                        key={unit}
                        value={unit}
                      >
                        {unit}
                      </option>
                    )
                  )}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Default purchase cost
                </span>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={defaultPurchaseCost}
                  onChange={(event) =>
                    setDefaultPurchaseCost(
                      event.target.value
                    )
                  }
                  className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Inventory asset account
                </span>

                <select
                  value={
                    inventoryAssetAccountId
                  }
                  onChange={(event) =>
                    setInventoryAssetAccountId(
                      event.target.value
                    )
                  }
                  required
                  className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm"
                >
                  <option value="">
                    Select inventory account
                  </option>

                  {inventoryAssetAccounts.map(
                    (account) => (
                      <option
                        key={account.id}
                        value={account.id}
                      >
                        {account.account_code ||
                          "No code"}{" "}
                        -{" "}
                        {account.account_name ||
                          "Unnamed account"}
                      </option>
                    )
                  )}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Cost of sales account
                </span>

                <select
                  value={
                    costOfSalesAccountId
                  }
                  onChange={(event) =>
                    setCostOfSalesAccountId(
                      event.target.value
                    )
                  }
                  required
                  className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm"
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
                        {account.account_code ||
                          "No code"}{" "}
                        -{" "}
                        {account.account_name ||
                          "Unnamed account"}
                      </option>
                    )
                  )}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Valuation method
                </span>

                <select
                  value={
                    inventoryValuationMethod
                  }
                  onChange={(event) =>
                    setInventoryValuationMethod(
                      event.target.value
                    )
                  }
                  className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm"
                >
                  {valuationMethods.map(
                    ([value, label]) => (
                      <option
                        key={value}
                        value={value}
                      >
                        {label}
                      </option>
                    )
                  )}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Reorder level
                </span>

                <input
                  type="number"
                  min="0"
                  step="0.0001"
                  value={reorderLevel}
                  onChange={(event) =>
                    setReorderLevel(
                      event.target.value
                    )
                  }
                  className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm"
                />
              </label>

              <div className="md:col-span-2">
                <div className="text-sm font-semibold text-slate-700">
                  Inventory locations
                </div>

                {locationOptions.length ===
                0 ? (
                  <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
                    No active Location options
                    exist. Add locations under
                    Tracking Dimensions before
                    enabling inventory tracking.
                  </div>
                ) : (
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    {locationOptions.map(
                      (location) => (
                        <label
                          key={location.id}
                          className="flex items-start gap-3 rounded-2xl border border-[#D9E3F4] bg-[#F8FAFC] p-4"
                        >
                          <input
                            type="checkbox"
                            checked={inventoryLocationIds.includes(
                              location.id
                            )}
                            onChange={() =>
                              toggleLocation(
                                location.id
                              )
                            }
                            className="mt-1 h-4 w-4"
                          />

                          <span>
                            <span className="block text-sm font-semibold text-slate-950">
                              {location.option_name ||
                                "Unnamed location"}
                            </span>

                            {location.option_code ? (
                              <span className="mt-1 block text-xs text-slate-500">
                                {
                                  location.option_code
                                }
                              </span>
                            ) : null}
                          </span>
                        </label>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(event) =>
              setIsActive(
                event.target.checked
              )
            }
            className="mt-1 h-4 w-4"
          />

          <span>
            <span className="block text-sm font-semibold text-slate-950">
              Active product or service
            </span>

            <span className="mt-1 block text-sm leading-6 text-slate-500">
              Inactive items retain their
              transaction and inventory history
              but cannot be selected for new
              transactions.
            </span>
          </span>
        </label>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-[#073D7F] px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting
            ? "Saving item..."
            : "Save Changes"}
        </button>

        <a
          href={`/portal/organisations/${organisationId}/products-services/${item.id}`}
          className="rounded-full border border-[#D9E3F4] bg-white px-6 py-3 text-center text-sm font-semibold text-[#073D7F]"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}