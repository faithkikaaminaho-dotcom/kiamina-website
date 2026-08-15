import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";

const internalRoles = [
  "SUPER_ADMIN",
  "ADMIN",
  "STAFF",
  "IT_ADMIN",
  "ACCOUNTANT_ADMIN",
  "ACCOUNTANT_USER",
  "COMPLIANCE_ADMIN",
  "OPERATIONS_ADMIN",
];

const settingsManagerRoles = [
  "SUPER_ADMIN",
  "ADMIN",
  "IT_ADMIN",
  "ACCOUNTANT_ADMIN",
  "OPERATIONS_ADMIN",
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

  const { data: account } = await query.maybeSingle();

  if (!account) {
    throw new Error(
      `${label} is not a valid active account for this organisation.`
    );
  }
}

async function getAuthenticatedContext() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      supabase,
      user: null,
      profile: null,
      error: "Not authenticated.",
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .single();

  if (
    !profile ||
    !internalRoles.includes(String(profile.role))
  ) {
    return {
      supabase,
      user,
      profile: null,
      error: "Access denied.",
    };
  }

  return {
    supabase,
    user,
    profile,
    error: null,
  };
}

export async function GET(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const { id: organisationId } = await params;

    const {
      supabase,
      error,
    } = await getAuthenticatedContext();

    if (error) {
      return Response.json(
        { error },
        {
          status:
            error === "Not authenticated."
              ? 401
              : 403,
        }
      );
    }

    const { data: organisation } = await supabase
      .from("organisations")
      .select("id")
      .eq("id", organisationId)
      .single();

    if (!organisation) {
      return Response.json(
        { error: "Organisation not found." },
        { status: 404 }
      );
    }

    const { data: settings, error: settingsError } =
      await supabase
        .from("organisation_inventory_settings")
        .select("*")
        .eq("organisation_id", organisationId)
        .maybeSingle();

    if (settingsError) {
      return Response.json(
        { error: settingsError.message },
        { status: 400 }
      );
    }

    return Response.json({
      settings:
        settings || {
          organisation_id: organisationId,
          inventory_tracking_enabled: false,
          inventory_valuation_method:
            "WEIGHTED_AVERAGE",
          default_inventory_asset_account_id:
            null,
          default_cost_of_sales_account_id:
            null,
          inventory_adjustment_account_id:
            null,
          inventory_write_off_account_id:
            null,
          allow_negative_inventory: false,
          require_inventory_count_approval:
            true,
          is_active: true,
        },
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load inventory settings.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const { id: organisationId } = await params;

    const {
      supabase,
      user,
      profile,
      error,
    } = await getAuthenticatedContext();

    if (error || !user || !profile) {
      return Response.json(
        {
          error: error || "Access denied.",
        },
        {
          status:
            error === "Not authenticated."
              ? 401
              : 403,
        }
      );
    }

    if (
      !settingsManagerRoles.includes(
        String(profile.role)
      )
    ) {
      return Response.json(
        {
          error:
            "You do not have permission to change inventory settings.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const inventoryTrackingEnabled =
      body.inventory_tracking_enabled === true;

    const inventoryValuationMethod = String(
      body.inventory_valuation_method ||
        "WEIGHTED_AVERAGE"
    )
      .trim()
      .toUpperCase();

    const defaultInventoryAssetAccountId =
      cleanText(
        body.default_inventory_asset_account_id
      );

    const defaultCostOfSalesAccountId =
      cleanText(
        body.default_cost_of_sales_account_id
      );

    const inventoryAdjustmentAccountId =
      cleanText(
        body.inventory_adjustment_account_id
      );

    const inventoryWriteOffAccountId =
      cleanText(
        body.inventory_write_off_account_id
      );

    const allowNegativeInventory =
      body.allow_negative_inventory === true;

    const requireInventoryCountApproval =
      body.require_inventory_count_approval !==
      false;

    if (
      !allowedValuationMethods.includes(
        inventoryValuationMethod
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

    const { data: organisation } = await supabase
      .from("organisations")
      .select("id")
      .eq("id", organisationId)
      .single();

    if (!organisation) {
      return Response.json(
        { error: "Organisation not found." },
        { status: 404 }
      );
    }

    if (inventoryTrackingEnabled) {
      if (!defaultInventoryAssetAccountId) {
        return Response.json(
          {
            error:
              "Default inventory asset account is required when inventory tracking is enabled.",
          },
          { status: 400 }
        );
      }

      if (!defaultCostOfSalesAccountId) {
        return Response.json(
          {
            error:
              "Default cost of sales account is required when inventory tracking is enabled.",
          },
          { status: 400 }
        );
      }

      if (!inventoryAdjustmentAccountId) {
        return Response.json(
          {
            error:
              "Inventory adjustment account is required when inventory tracking is enabled.",
          },
          { status: 400 }
        );
      }

      if (!inventoryWriteOffAccountId) {
        return Response.json(
          {
            error:
              "Inventory write-off account is required when inventory tracking is enabled.",
          },
          { status: 400 }
        );
      }
    }

    try {
      await validateAccount({
        supabase,
        organisationId,
        accountId:
          defaultInventoryAssetAccountId,
        expectedType: "ASSET",
        label:
          "Default inventory asset account",
      });

      await validateAccount({
        supabase,
        organisationId,
        accountId:
          defaultCostOfSalesAccountId,
        expectedType: "EXPENSE",
        label:
          "Default cost of sales account",
      });

      await validateAccount({
        supabase,
        organisationId,
        accountId:
          inventoryAdjustmentAccountId,
        expectedType: "EXPENSE",
        label:
          "Inventory adjustment account",
      });

      await validateAccount({
        supabase,
        organisationId,
        accountId:
          inventoryWriteOffAccountId,
        expectedType: "EXPENSE",
        label:
          "Inventory write-off account",
      });
    } catch (validationError) {
      return Response.json(
        {
          error:
            validationError instanceof Error
              ? validationError.message
              : "Invalid inventory account selection.",
        },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    const { data: existingSettings } =
      await supabase
        .from(
          "organisation_inventory_settings"
        )
        .select("id")
        .eq("organisation_id", organisationId)
        .maybeSingle();

    let savedSettings;

    if (existingSettings) {
      const {
        data,
        error: updateError,
      } = await supabase
        .from(
          "organisation_inventory_settings"
        )
        .update({
          inventory_tracking_enabled:
            inventoryTrackingEnabled,

          inventory_valuation_method:
            inventoryValuationMethod,

          default_inventory_asset_account_id:
            defaultInventoryAssetAccountId,

          default_cost_of_sales_account_id:
            defaultCostOfSalesAccountId,

          inventory_adjustment_account_id:
            inventoryAdjustmentAccountId,

          inventory_write_off_account_id:
            inventoryWriteOffAccountId,

          allow_negative_inventory:
            allowNegativeInventory,

          require_inventory_count_approval:
            requireInventoryCountApproval,

          is_active: true,
          updated_at: now,
          updated_by: user.id,
        })
        .eq("id", existingSettings.id)
        .eq("organisation_id", organisationId)
        .select("*")
        .single();

      if (updateError || !data) {
        return Response.json(
          {
            error:
              updateError?.message ||
              "Unable to update inventory settings.",
          },
          { status: 400 }
        );
      }

      savedSettings = data;
    } else {
      const {
        data,
        error: insertError,
      } = await supabase
        .from(
          "organisation_inventory_settings"
        )
        .insert({
          organisation_id: organisationId,

          inventory_tracking_enabled:
            inventoryTrackingEnabled,

          inventory_valuation_method:
            inventoryValuationMethod,

          default_inventory_asset_account_id:
            defaultInventoryAssetAccountId,

          default_cost_of_sales_account_id:
            defaultCostOfSalesAccountId,

          inventory_adjustment_account_id:
            inventoryAdjustmentAccountId,

          inventory_write_off_account_id:
            inventoryWriteOffAccountId,

          allow_negative_inventory:
            allowNegativeInventory,

          require_inventory_count_approval:
            requireInventoryCountApproval,

          is_active: true,
          created_at: now,
          updated_at: now,
          created_by: user.id,
          updated_by: user.id,
        })
        .select("*")
        .single();

      if (insertError || !data) {
        return Response.json(
          {
            error:
              insertError?.message ||
              "Unable to create inventory settings.",
          },
          { status: 400 }
        );
      }

      savedSettings = data;
    }

    try {
      await supabase
        .from("audit_logs")
        .insert({
          user_id: user.id,
          organisation_id: organisationId,
          action:
            "ORGANISATION_INVENTORY_SETTINGS_UPDATED",
          details: {
            inventory_tracking_enabled:
              inventoryTrackingEnabled,

            inventory_valuation_method:
              inventoryValuationMethod,

            default_inventory_asset_account_id:
              defaultInventoryAssetAccountId,

            default_cost_of_sales_account_id:
              defaultCostOfSalesAccountId,

            inventory_adjustment_account_id:
              inventoryAdjustmentAccountId,

            inventory_write_off_account_id:
              inventoryWriteOffAccountId,

            allow_negative_inventory:
              allowNegativeInventory,

            require_inventory_count_approval:
              requireInventoryCountApproval,
          },
        });
    } catch {
      // Audit logging must not block the settings update.
    }

    return Response.json({
      success: true,
      settings: savedSettings,
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to save inventory settings.",
      },
      { status: 500 }
    );
  }
}