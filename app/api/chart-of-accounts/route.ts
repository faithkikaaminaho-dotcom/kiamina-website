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

const validAccountTypes = ["ASSET", "LIABILITY", "INCOME", "EXPENSE", "EQUITY"];

const validSubtypesByType: Record<string, string[]> = {
  ASSET: ["CURRENT_ASSET", "NON_CURRENT_ASSET"],
  LIABILITY: ["CURRENT_LIABILITY", "NON_CURRENT_LIABILITY"],
  INCOME: [
    "OPERATING_INCOME",
    "INVESTING_INCOME",
    "FINANCING_INCOME",
    "DISCONTINUED_OPERATIONS",
    "OTHER_COMPREHENSIVE_INCOME",
  ],
  EXPENSE: [
    "COST_OF_SALES",
    "OTHER_OPERATING_EXPENSE",
    "INVESTING_EXPENSE",
    "FINANCING_EXPENSE",
    "INCOME_TAX",
    "DISCONTINUED_OPERATIONS",
  ],
  EQUITY: ["EQUITY"],
};

function normalBalanceForType(accountType: string) {
  if (["ASSET", "EXPENSE"].includes(accountType)) {
    return "DEBIT";
  }

  return "CREDIT";
}

function fsSectionForSubtype(accountSubtype: string) {
  if (
    [
      "CURRENT_ASSET",
      "NON_CURRENT_ASSET",
      "CURRENT_LIABILITY",
      "NON_CURRENT_LIABILITY",
      "EQUITY",
    ].includes(accountSubtype)
  ) {
    return "Statement of Financial Position";
  }

  if (
    ["OPERATING_INCOME", "COST_OF_SALES", "OTHER_OPERATING_EXPENSE"].includes(
      accountSubtype
    )
  ) {
    return "Statement of Profit or Loss and Other Comprehensive Income - Operating Activities";
  }

  if (["INVESTING_INCOME", "INVESTING_EXPENSE"].includes(accountSubtype)) {
    return "Statement of Profit or Loss and Other Comprehensive Income - Investing Activities";
  }

  if (["FINANCING_INCOME", "FINANCING_EXPENSE"].includes(accountSubtype)) {
    return "Statement of Profit or Loss and Other Comprehensive Income - Financing Activities";
  }

  if (accountSubtype === "INCOME_TAX") {
    return "Statement of Profit or Loss and Other Comprehensive Income - Income Tax";
  }

  if (accountSubtype === "OTHER_COMPREHENSIVE_INCOME") {
    return "Statement of Profit or Loss and Other Comprehensive Income - Other Comprehensive Income";
  }

  if (accountSubtype === "DISCONTINUED_OPERATIONS") {
    return "Statement of Profit or Loss and Other Comprehensive Income - Discontinued Operations";
  }

  return "";
}

function cashFlowCategoryForSubtype(accountSubtype: string) {
  if (
    [
      "CURRENT_ASSET",
      "CURRENT_LIABILITY",
      "OPERATING_INCOME",
      "COST_OF_SALES",
      "OTHER_OPERATING_EXPENSE",
      "INCOME_TAX",
    ].includes(accountSubtype)
  ) {
    return "Operating Activities";
  }

  if (
    ["NON_CURRENT_ASSET", "INVESTING_INCOME", "INVESTING_EXPENSE"].includes(
      accountSubtype
    )
  ) {
    return "Investing Activities";
  }

  if (
    [
      "NON_CURRENT_LIABILITY",
      "EQUITY",
      "FINANCING_INCOME",
      "FINANCING_EXPENSE",
    ].includes(accountSubtype)
  ) {
    return "Financing Activities";
  }

  if (
    accountSubtype === "OTHER_COMPREHENSIVE_INCOME" ||
    accountSubtype === "DISCONTINUED_OPERATIONS"
  ) {
    return "Non-cash / Other";
  }

  return "";
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

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !internalRoles.includes(profile.role)) {
      return Response.json({ error: "Access denied." }, { status: 403 });
    }

    const body = await request.json();

    const organisationId = String(body.organisation_id || "").trim();
    const accountCode = String(body.account_code || "").trim();
    const accountName = String(body.account_name || "").trim();
    const accountType = String(body.account_type || "").trim().toUpperCase();
    const accountSubtype = String(body.account_subtype || "")
      .trim()
      .toUpperCase();

    const fsLineItem = String(body.fs_line_item || "").trim();
    const managementReportCategory = String(
      body.management_report_category || ""
    ).trim();

    const description = body.description
      ? String(body.description).trim()
      : null;

    const taxRelevant = Boolean(body.tax_relevant);
    const isControlAccount = Boolean(body.is_control_account);
    const isBankAccount = Boolean(body.is_bank_account);

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

    if (!validAccountTypes.includes(accountType)) {
      return Response.json(
        { error: "Valid account type is required." },
        { status: 400 }
      );
    }

    if (!validSubtypesByType[accountType]?.includes(accountSubtype)) {
      return Response.json(
        { error: "Valid account subtype is required for the selected account type." },
        { status: 400 }
      );
    }

    if (!fsLineItem) {
      return Response.json(
        { error: "Financial statement line item is required." },
        { status: 400 }
      );
    }

    if (!managementReportCategory) {
      return Response.json(
        { error: "Management report category is required." },
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

    const normalBalance = normalBalanceForType(accountType);
    const fsSection = fsSectionForSubtype(accountSubtype);
    const cashFlowCategory = cashFlowCategoryForSubtype(accountSubtype);

    const { data: account, error: accountError } = await supabase
      .from("chart_of_accounts")
      .insert({
        organisation_id: organisationId,
        account_code: accountCode,
        account_name: accountName,
        account_type: accountType,
        account_subtype: accountSubtype,
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
      })
      .select("id")
      .single();

    if (accountError || !account) {
      return Response.json(
        {
          error:
            accountError?.message || "Unable to create chart of account.",
        },
        { status: 500 }
      );
    }

    try {
      await supabase.from("audit_logs").insert({
        user_id: user.id,
        organisation_id: organisationId,
        action: "CHART_OF_ACCOUNT_CREATED",
        details: {
          chart_of_account_id: account.id,
          account_code: accountCode,
          account_name: accountName,
          account_type: accountType,
          account_subtype: accountSubtype,
          normal_balance: normalBalance,
          fs_section: fsSection,
          fs_line_item: fsLineItem,
          cash_flow_category: cashFlowCategory,
          management_report_category: managementReportCategory,
        },
      });
    } catch {
      // Audit logging should not block account creation.
    }

    return Response.json({
      success: true,
      chartAccountId: account.id,
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create chart of account.",
      },
      { status: 500 }
    );
  }
}