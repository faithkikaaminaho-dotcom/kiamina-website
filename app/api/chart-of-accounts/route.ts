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

const allowedAccountTypes = [
  "ASSET",
  "LIABILITY",
  "EQUITY",
  "REVENUE",
  "COST_OF_SALES",
  "OPERATING_EXPENSE",
  "OTHER_INCOME",
  "FINANCE_COST",
  "TAX",
];

const allowedNormalBalances = ["DEBIT", "CREDIT"];

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
    const accountCode = String(body.account_code || "").trim();
    const accountName = String(body.account_name || "").trim();
    const accountType = String(body.account_type || "").trim();
    const accountSubtype = body.account_subtype
      ? String(body.account_subtype).trim()
      : null;
    const parentAccountId = body.parent_account_id
      ? String(body.parent_account_id).trim()
      : null;
    const normalBalance = String(body.normal_balance || "DEBIT").trim();
    const fsSection = body.fs_section ? String(body.fs_section).trim() : null;
    const fsLineItem = body.fs_line_item
      ? String(body.fs_line_item).trim()
      : null;
    const managementReportCategory = body.management_report_category
      ? String(body.management_report_category).trim()
      : null;
    const cashFlowCategory = body.cash_flow_category
      ? String(body.cash_flow_category).trim()
      : null;
    const description = body.description
      ? String(body.description).trim()
      : null;

    const taxRelevant = body.tax_relevant === true;
    const isControlAccount = body.is_control_account === true;
    const isBankAccount = body.is_bank_account === true;

    if (!organisationId) {
      return Response.json(
        { error: "Organisation is required." },
        { status: 400 }
      );
    }

    if (!accountCode) {
      return Response.json(
        { error: "Account code is required." },
        { status: 400 }
      );
    }

    if (!accountName) {
      return Response.json(
        { error: "Account name is required." },
        { status: 400 }
      );
    }

    if (!allowedAccountTypes.includes(accountType)) {
      return Response.json(
        { error: "Invalid account type." },
        { status: 400 }
      );
    }

    if (!allowedNormalBalances.includes(normalBalance)) {
      return Response.json(
        { error: "Invalid normal balance." },
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

    const accountResult = await insertWithSchemaRetry({
      supabase,
      table: "chart_of_accounts",
      payload: {
        organisation_id: organisationId,
        account_code: accountCode,
        account_name: accountName,
        account_type: accountType,
        account_subtype: accountSubtype,
        parent_account_id: parentAccountId,
        normal_balance: normalBalance,
        fs_section: fsSection,
        fs_line_item: fsLineItem,
        management_report_category: managementReportCategory,
        tax_relevant: taxRelevant,
        cash_flow_category: cashFlowCategory,
        description,
        is_control_account: isControlAccount,
        is_bank_account: isBankAccount,
        is_active: true,
        created_by: user.id,
        updated_by: user.id,
      },
      selectColumns: "id",
    });

    const account = accountResult.data as unknown as { id: string };

    try {
      await supabase.from("audit_logs").insert({
        user_id: user.id,
        organisation_id: organisationId,
        action: "CHART_ACCOUNT_CREATED",
        details: {
          chart_account_id: account.id,
          account_code: accountCode,
          account_name: accountName,
          account_type: accountType,
          fs_section: fsSection,
          fs_line_item: fsLineItem,
          removed_account_columns: accountResult.removedColumns,
        },
      });
    } catch {
      // Audit logging should not block account creation.
    }

    return Response.json({
      success: true,
      accountId: account.id,
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create chart account.",
      },
      { status: 500 }
    );
  }
}