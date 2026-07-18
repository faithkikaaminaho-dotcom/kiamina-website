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

const allowedItemTypes = ["SERVICE", "PRODUCT", "BUNDLE", "OTHER"];

function getMissingColumnName(errorMessage: string) {
  const match = errorMessage.match(/Could not find the '([^']+)' column/i);
  return match?.[1] || null;
}

async function insertWithSchemaRetry({
  supabase,
  table,
  payload,
  selectColumns = "id",
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  table: string;
  payload: Record<string, unknown>;
  selectColumns?: string;
}) {
  let safePayload = { ...payload };
  const removedColumns: string[] = [];

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const { data, error } = await supabase
      .from(table)
      .insert(safePayload)
      .select(selectColumns)
      .single();

    if (!error && data) {
      return { data, removedColumns };
    }

    const missingColumn = getMissingColumnName(error?.message || "");

    if (missingColumn && missingColumn in safePayload) {
      delete safePayload[missingColumn];
      removedColumns.push(missingColumn);
      continue;
    }

    throw new Error(error?.message || `Unable to insert into ${table}.`);
  }

  throw new Error(`Unable to insert into ${table} after schema retry.`);
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Not authenticated." }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile || !internalRoles.includes(profile.role)) {
      return Response.json({ error: "Access denied." }, { status: 403 });
    }

    const body = await request.json();

    const organisationId = String(body.organisation_id || "").trim();
    const itemName = String(body.item_name || "").trim();
    const itemType = String(body.item_type || "SERVICE").trim();

    const sku = body.sku ? String(body.sku).trim() : null;
    const description = body.description ? String(body.description).trim() : null;

    const unitPrice =
      body.unit_price !== null &&
      body.unit_price !== undefined &&
      String(body.unit_price).trim() !== ""
        ? Number(body.unit_price)
        : null;

    const currencyCode = body.currency_code
      ? String(body.currency_code).trim().toUpperCase()
      : null;

    const incomeAccountId = body.income_account_id
      ? String(body.income_account_id).trim()
      : null;

    const expenseAccountId = body.expense_account_id
      ? String(body.expense_account_id).trim()
      : null;

    const taxAccountId = body.tax_account_id
      ? String(body.tax_account_id).trim()
      : null;

    const taxRelevant = body.tax_relevant === true;
    const taxable = body.taxable === true;

    if (!organisationId) {
      return Response.json(
        { error: "Organisation is required." },
        { status: 400 }
      );
    }

    if (!itemName) {
      return Response.json(
        { error: "Product or service name is required." },
        { status: 400 }
      );
    }

    if (!allowedItemTypes.includes(itemType)) {
      return Response.json(
        { error: "Invalid product/service type." },
        { status: 400 }
      );
    }

    const { data: organisation, error: organisationError } = await supabase
      .from("organisations")
      .select("id, legal_name, trading_name")
      .eq("id", organisationId)
      .single();

    if (organisationError || !organisation) {
      return Response.json(
        { error: "Organisation not found." },
        { status: 404 }
      );
    }

    const itemResult = await insertWithSchemaRetry({
      supabase,
      table: "products_services",
      payload: {
        organisation_id: organisationId,
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
        is_active: true,
        created_by: user.id,
        updated_by: user.id,
      },
      selectColumns: "id",
    });

    const item = itemResult.data as unknown as { id: string };

    try {
      await supabase.from("audit_logs").insert({
        user_id: user.id,
        organisation_id: organisationId,
        action: "PRODUCT_SERVICE_CREATED",
        details: {
          item_id: item.id,
          item_name: itemName,
          item_type: itemType,
          removed_item_columns: itemResult.removedColumns,
        },
      });
    } catch {
      // Audit logging should not block item creation.
    }

    return Response.json({
      success: true,
      itemId: item.id,
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create product or service.",
      },
      { status: 500 }
    );
  }
}