import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";

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

const allowedItemTypes = [
  "SERVICE",
  "PRODUCT",
  "BUNDLE",
  "OTHER",
];

const allowedValuationMethods = [
  "WEIGHTED_AVERAGE",
  "FIFO",
  "SPECIFIC_IDENTIFICATION",
];

function cleanText(value: unknown) {
  const text =
    value === null || value === undefined
      ? ""
      : String(value).trim();

  return text || null;
}

function cleanIdArray(value: unknown) {
  if (!Array.isArray(value)) return [];

  return Array.from(
    new Set(
      value
        .map((item) => cleanText(item))
        .filter((item): item is string => Boolean(item))
    )
  );
}

function getMissingColumnName(errorMessage: string) {
  const match = errorMessage.match(
    /Could not find the '([^']+)' column/i
  );

  return match?.[1] || null;
}

async function updateWithSchemaRetry({
  supabase,
  itemId,
  organisationId,
  payload,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  itemId: string;
  organisationId: string;
  payload: Record<string, unknown>;
}) {
  const safePayload = { ...payload };
  const removedColumns: string[] = [];

  for (let attempt = 0; attempt < 30; attempt += 1) {
    const { data, error } = await supabase
      .from("products_services")
      .update(safePayload)
      .eq("id", itemId)
      .eq("organisation_id", organisationId)
      .select("id")
      .single();

    if (!error && data) {
      return { data, removedColumns };
    }

    const missingColumn = getMissingColumnName(
      error?.message || ""
    );

    if (
      missingColumn &&
      missingColumn in safePayload
    ) {
      delete safePayload[missingColumn];
      removedColumns.push(missingColumn);
      continue;
    }

    throw new Error(
      error?.message ||
        "Unable to update product or service."
    );
  }

  throw new Error(
    "Unable to update product or service after schema retry."
  );
}

async function validateAccount({
  supabase,
  organisationId,
  accountId,
  expectedType,
  label,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  organisationId: string;
  accountId: string | null;
  expectedType?: string;
  label: string;
}) {
  if (!accountId) return;

  let query = supabase
    .from("chart_of_accounts")
    .select("id")
    .eq("id", accountId)
    .eq("organisation_id", organisationId)
    .eq("is_active", true);

  if (expectedType) {
    query = query.eq("account_type", expectedType);
  }

  const { data: account } = await query.single();

  if (!account) {
    throw new Error(
      `${label} is not valid for this organisation.`
    );
  }
}

async function validateLocations({
  supabase,
  organisationId,
  locationIds,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  organisationId: string;
  locationIds: string[];
}) {
  if (locationIds.length === 0) return;

  const { data: locationCategory } = await supabase
    .from("tracking_categories")
    .select("id")
    .eq("organisation_id", organisationId)
    .eq("category_code", "LOCATION")
    .eq("is_active", true)
    .single();

  if (!locationCategory) {
    throw new Error(
      "The Location tracking category is not configured."
    );
  }

  const { data: locations, error } = await supabase
    .from("tracking_options")
    .select("id")
    .eq("organisation_id", organisationId)
    .eq("tracking_category_id", locationCategory.id)
    .eq("is_active", true)
    .in("id", locationIds);

  if (
    error ||
    !locations ||
    locations.length !== locationIds.length
  ) {
    throw new Error(
      "One or more selected inventory locations are invalid."
    );
  }
}

export async function PATCH(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ itemId: string }>;
  }
) {
  try {
    const { itemId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json(
        { error: "Not authenticated." },
        { status: 401 }
      );
    }

    const { data: profile, error: profileError } =
      await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (
      profileError ||
      !profile ||
      !internalRoles.includes(profile.role)
    ) {
      return Response.json(
        { error: "Access denied." },
        { status: 403 }
      );
    }

    const body = await request.json();

    const organisationId = cleanText(
      body.organisation_id
    );

    const itemName = cleanText(body.item_name);

    const itemType = String(
      body.item_type || "SERVICE"
    )
      .trim()
      .toUpperCase();

    const sku = cleanText(body.sku);
    const description = cleanText(body.description);

    const currencyCode =
      cleanText(body.currency_code)?.toUpperCase() ||
      null;

    const incomeAccountId = cleanText(
      body.income_account_id
    );

    const expenseAccountId = cleanText(
      body.expense_account_id
    );

    const taxAccountId = cleanText(
      body.tax_account_id
    );

    const unitPrice =
      body.unit_price !== null &&
      body.unit_price !== undefined &&
      String(body.unit_price).trim() !== ""
        ? Number(body.unit_price)
        : null;

    const taxRelevant = body.tax_relevant === true;
    const taxable = body.taxable === true;
    const isActive = body.is_active !== false;

    const trackInventory =
      itemType === "PRODUCT" &&
      body.track_inventory === true;

    const unitOfMeasure = trackInventory
      ? cleanText(body.unit_of_measure)
      : null;

    const inventoryAssetAccountId = trackInventory
      ? cleanText(body.inventory_asset_account_id)
      : null;

    const costOfSalesAccountId = trackInventory
      ? cleanText(body.cost_of_sales_account_id)
      : null;

    const defaultPurchaseCost =
      trackInventory &&
      body.default_purchase_cost !== null &&
      body.default_purchase_cost !== undefined &&
      String(body.default_purchase_cost).trim() !== ""
        ? Number(body.default_purchase_cost)
        : null;

    const inventoryValuationMethod = trackInventory
      ? String(
          body.inventory_valuation_method ||
            "WEIGHTED_AVERAGE"
        )
          .trim()
          .toUpperCase()
      : null;

    const locationIds = trackInventory
      ? cleanIdArray(body.location_ids)
      : [];

    const reorderLevel =
      trackInventory &&
      body.reorder_level !== null &&
      body.reorder_level !== undefined &&
      String(body.reorder_level).trim() !== ""
        ? Number(body.reorder_level)
        : null;

    if (!organisationId) {
      return Response.json(
        { error: "Organisation is required." },
        { status: 400 }
      );
    }

    if (!itemName) {
      return Response.json(
        {
          error:
            "Product or service name is required.",
        },
        { status: 400 }
      );
    }

    if (!allowedItemTypes.includes(itemType)) {
      return Response.json(
        {
          error:
            "Invalid product or service type.",
        },
        { status: 400 }
      );
    }

    if (
      unitPrice !== null &&
      (!Number.isFinite(unitPrice) ||
        unitPrice < 0)
    ) {
      return Response.json(
        {
          error:
            "Unit price must be zero or greater.",
        },
        { status: 400 }
      );
    }

    if (
      defaultPurchaseCost !== null &&
      (!Number.isFinite(defaultPurchaseCost) ||
        defaultPurchaseCost < 0)
    ) {
      return Response.json(
        {
          error:
            "Default purchase cost must be zero or greater.",
        },
        { status: 400 }
      );
    }

    if (
      reorderLevel !== null &&
      (!Number.isFinite(reorderLevel) ||
        reorderLevel < 0)
    ) {
      return Response.json(
        {
          error:
            "Reorder level must be zero or greater.",
        },
        { status: 400 }
      );
    }

    if (taxable && !taxRelevant) {
      return Response.json(
        {
          error:
            "A taxable item must also be marked as tax relevant.",
        },
        { status: 400 }
      );
    }

    if (
      trackInventory &&
      !unitOfMeasure
    ) {
      return Response.json(
        {
          error:
            "Unit of measure is required when inventory tracking is enabled.",
        },
        { status: 400 }
      );
    }

    if (
      trackInventory &&
      !inventoryAssetAccountId
    ) {
      return Response.json(
        {
          error:
            "Inventory asset account is required when inventory tracking is enabled.",
        },
        { status: 400 }
      );
    }

    if (
      trackInventory &&
      !costOfSalesAccountId
    ) {
      return Response.json(
        {
          error:
            "Cost of sales account is required when inventory tracking is enabled.",
        },
        { status: 400 }
      );
    }

    if (
      trackInventory &&
      !allowedValuationMethods.includes(
        inventoryValuationMethod || ""
      )
    ) {
      return Response.json(
        {
          error:
            "Invalid inventory valuation method.",
        },
        { status: 400 }
      );
    }

    if (
      trackInventory &&
      locationIds.length === 0
    ) {
      return Response.json(
        {
          error:
            "At least one inventory location is required.",
        },
        { status: 400 }
      );
    }

    const { data: existingItem } = await supabase
      .from("products_services")
      .select("id, item_name, item_type, is_active")
      .eq("id", itemId)
      .eq("organisation_id", organisationId)
      .single();

    if (!existingItem) {
      return Response.json(
        {
          error:
            "Product or service not found.",
        },
        { status: 404 }
      );
    }

    try {
      await validateAccount({
        supabase,
        organisationId,
        accountId: incomeAccountId,
        expectedType: "INCOME",
        label: "Income account",
      });

      await validateAccount({
        supabase,
        organisationId,
        accountId: expenseAccountId,
        expectedType: "EXPENSE",
        label: "Expense account",
      });

      await validateAccount({
        supabase,
        organisationId,
        accountId: taxAccountId,
        label: "Tax account",
      });

      await validateAccount({
        supabase,
        organisationId,
        accountId: inventoryAssetAccountId,
        expectedType: "ASSET",
        label: "Inventory asset account",
      });

      await validateAccount({
        supabase,
        organisationId,
        accountId: costOfSalesAccountId,
        expectedType: "EXPENSE",
        label: "Cost of sales account",
      });

      await validateLocations({
        supabase,
        organisationId,
        locationIds,
      });
    } catch (error) {
      return Response.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Invalid account or location selection.",
        },
        { status: 400 }
      );
    }

    const updateResult =
      await updateWithSchemaRetry({
        supabase,
        itemId,
        organisationId,
        payload: {
          item_name: itemName,
          item_type: itemType,
          sku,
          description,
          unit_price: unitPrice,
          currency_code: currencyCode,
          income_account_id: incomeAccountId,
          expense_account_id: expenseAccountId,
          tax_account_id: taxAccountId,
          tax_relevant: taxRelevant,
          taxable,
          is_active: isActive,

          track_inventory: trackInventory,
          unit_of_measure: unitOfMeasure,
          inventory_asset_account_id:
            inventoryAssetAccountId,
          cost_of_sales_account_id:
            costOfSalesAccountId,
          default_purchase_cost:
            defaultPurchaseCost,
          inventory_valuation_method:
            inventoryValuationMethod,

          updated_by: user.id,
          updated_at: new Date().toISOString(),
        },
      });

    const { error: deleteLocationsError } =
      await supabase
        .from("product_inventory_locations")
        .delete()
        .eq("organisation_id", organisationId)
        .eq("product_service_id", itemId);

    if (deleteLocationsError) {
      return Response.json(
        {
          error:
            deleteLocationsError.message ||
            "Unable to replace inventory locations.",
        },
        { status: 400 }
      );
    }

    if (
      trackInventory &&
      locationIds.length > 0
    ) {
      const { error: insertLocationsError } =
        await supabase
          .from("product_inventory_locations")
          .insert(
            locationIds.map((locationId) => ({
              organisation_id: organisationId,
              product_service_id: itemId,
              location_id: locationId,
              reorder_level: reorderLevel,
              is_active: true,
              created_by: user.id,
              updated_by: user.id,
            }))
          );

      if (insertLocationsError) {
        return Response.json(
          {
            error:
              insertLocationsError.message ||
              "Unable to save inventory locations.",
          },
          { status: 400 }
        );
      }
    }

    try {
      await supabase
        .from("audit_logs")
        .insert({
          user_id: user.id,
          organisation_id: organisationId,
          action: "PRODUCT_SERVICE_UPDATED",
          details: {
            item_id: itemId,
            previous_item_name:
              existingItem.item_name,
            item_name: itemName,
            previous_item_type:
              existingItem.item_type,
            item_type: itemType,
            previous_is_active:
              existingItem.is_active,
            is_active: isActive,
            track_inventory: trackInventory,
            inventory_location_ids:
              locationIds,
            inventory_valuation_method:
              inventoryValuationMethod,
            removed_item_columns:
              updateResult.removedColumns,
          },
        });
    } catch {
      // Audit logging must not block the update.
    }

    return Response.json({
      success: true,
      itemId,
      trackInventory,
      locationCount: locationIds.length,
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update product or service.",
      },
      { status: 500 }
    );
  }
}