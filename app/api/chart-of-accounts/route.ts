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

const validAccountTypes = [
  "ASSET",
  "LIABILITY",
  "INCOME",
  "EXPENSE",
  "EQUITY",
];

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

type MasterLineItem = {
  id: string;
  framework_code: string;
  statement_code: string;
  line_item_code: string;
  line_item_name: string;
  account_type: string | null;
  account_subtype: string | null;
  presentation_category: string | null;
  normal_balance: string | null;
  cash_flow_default_category: string | null;
};

function fallbackNormalBalance(accountType: string) {
  return ["ASSET", "EXPENSE"].includes(accountType)
    ? "DEBIT"
    : "CREDIT";
}

function fsSectionForMasterItem(item: MasterLineItem) {
  if (item.framework_code === "US_GAAP") {
    if (item.statement_code === "SFP") return "Balance Sheet";
    if (item.statement_code === "PL") return "Income Statement";
    if (item.statement_code === "OCI") {
      return "Statement of Comprehensive Income";
    }
    if (item.statement_code === "SOCE") {
      return "Statement of Stockholders' Equity";
    }
    if (item.statement_code === "SCF") return "Statement of Cash Flows";
  }

  if (item.statement_code === "SFP") {
    return "Statement of Financial Position";
  }

  if (item.statement_code === "OCI") {
    return "Statement of Profit or Loss and Other Comprehensive Income - Other Comprehensive Income";
  }

  if (item.statement_code === "PL") {
    if (item.presentation_category === "INVESTING") {
      return "Statement of Profit or Loss and Other Comprehensive Income - Investing Activities";
    }

    if (item.presentation_category === "FINANCING") {
      return "Statement of Profit or Loss and Other Comprehensive Income - Financing Activities";
    }

    if (item.presentation_category === "INCOME_TAX") {
      return "Statement of Profit or Loss and Other Comprehensive Income - Income Tax";
    }

    if (item.presentation_category === "DISCONTINUED_OPERATIONS") {
      return "Statement of Profit or Loss and Other Comprehensive Income - Discontinued Operations";
    }

    return "Statement of Profit or Loss and Other Comprehensive Income - Operating Activities";
  }

  return "";
}

function cashFlowCategoryForMasterItem(item: MasterLineItem) {
  const labels: Record<string, string> = {
    OPERATING: "Operating Activities",
    INVESTING: "Investing Activities",
    FINANCING: "Financing Activities",
    NON_CASH: "Non-cash / Other",
    CONTEXT_DEPENDENT: "Context Dependent",
  };

  if (!item.cash_flow_default_category) {
    return "Context Dependent";
  }

  return (
    labels[item.cash_flow_default_category] ||
    item.cash_flow_default_category
  );
}

export async function POST(request: Request) {
  try {
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

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (
      !profile ||
      !internalRoles.includes(String(profile.role))
    ) {
      return Response.json(
        { error: "Access denied." },
        { status: 403 }
      );
    }

    const body = await request.json();

    const organisationId = String(
      body.organisation_id || ""
    ).trim();
    const accountCode = String(body.account_code || "").trim();
    const accountName = String(body.account_name || "").trim();
    const accountType = String(body.account_type || "")
      .trim()
      .toUpperCase();
    const accountSubtype = String(body.account_subtype || "")
      .trim()
      .toUpperCase();
    const fsLineItemId = String(body.fs_line_item_id || "").trim();
    const managementReportCategory = String(
      body.management_report_category || ""
    ).trim();
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

    if (!validAccountTypes.includes(accountType)) {
      return Response.json(
        { error: "Valid account type is required." },
        { status: 400 }
      );
    }

    if (!validSubtypesByType[accountType]?.includes(accountSubtype)) {
      return Response.json(
        {
          error:
            "Valid account subtype is required for the selected account type.",
        },
        { status: 400 }
      );
    }

    if (!fsLineItemId) {
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
      .select("id, country_code, reporting_framework_code")
      .eq("id", organisationId)
      .single();

    if (!organisation) {
      return Response.json(
        { error: "Organisation not found." },
        { status: 404 }
      );
    }

    const frameworkCode = String(
      organisation.reporting_framework_code || ""
    ).trim();

    if (!frameworkCode) {
      return Response.json(
        {
          error:
            "Set the organisation reporting framework before creating an account.",
        },
        { status: 400 }
      );
    }

    if (
      frameworkCode === "US_GAAP" &&
      organisation.country_code !== "US"
    ) {
      return Response.json(
        {
          error:
            "US GAAP can only be used by a United States organisation.",
        },
        { status: 400 }
      );
    }

    const { data: selectedLineItem, error: lineItemError } =
      await supabase
        .from("financial_statement_line_items")
        .select(
          "id, framework_code, statement_code, line_item_code, line_item_name, account_type, account_subtype, presentation_category, normal_balance, cash_flow_default_category"
        )
        .eq("id", fsLineItemId)
        .eq("framework_code", frameworkCode)
        .eq("is_active", true)
        .eq("is_postable", true)
        .single();

    if (lineItemError || !selectedLineItem) {
      return Response.json(
        {
          error:
            "The selected FS line item is not valid for this reporting framework.",
        },
        { status: 400 }
      );
    }

    const masterItem = selectedLineItem as MasterLineItem;

    if (
      masterItem.account_type !== accountType ||
      masterItem.account_subtype !== accountSubtype
    ) {
      return Response.json(
        {
          error:
            "The selected FS line item does not match the account type and subtype.",
        },
        { status: 400 }
      );
    }

    const normalBalance =
      masterItem.normal_balance || fallbackNormalBalance(accountType);
    const fsSection = fsSectionForMasterItem(masterItem);
    const cashFlowCategory = cashFlowCategoryForMasterItem(masterItem);

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
        fs_line_item_id: masterItem.id,
        fs_line_item: masterItem.line_item_name,
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
            accountError?.message ||
            "Unable to create chart of account.",
        },
        { status: 400 }
      );
    }

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
        fs_line_item_id: masterItem.id,
        fs_line_item: masterItem.line_item_name,
        fs_line_item_code: masterItem.line_item_code,
        reporting_framework_code: frameworkCode,
        cash_flow_category: cashFlowCategory,
        management_report_category: managementReportCategory,
      },
    });

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
