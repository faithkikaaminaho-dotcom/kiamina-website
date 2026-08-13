import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

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

const allowedRiskRatings = [
  "NOT_ASSESSED",
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
];

const allowedOnboardingStatuses = [
  "ONBOARDING",
  "ACTIVE",
  "PAUSED",
  "CLOSED",
  "ARCHIVED",
];

const allowedReportingFrameworks = ["IFRS", "IFRS_SME", "US_GAAP"];

function isValidMonth(value: number) {
  return Number.isInteger(value) && value >= 1 && value <= 12;
}

function isValidDay(value: number) {
  return Number.isInteger(value) && value >= 1 && value <= 31;
}

function cleanText(value: unknown) {
  if (value === null || value === undefined) return null;

  const text = String(value).trim();

  return text.length > 0 ? text : null;
}

function cleanUpper(value: unknown) {
  const text = cleanText(value);

  return text ? text.toUpperCase() : null;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const organisationId = id;

    if (!organisationId) {
      return NextResponse.json(
        { error: "Organisation ID is required." },
        { status: 400 }
      );
    }

    const body = await request.json();

    const legalName = cleanText(body.legal_name);
    const tradingName = cleanText(body.trading_name);
    const logoUrl = cleanText(body.logo_url);

    const countryCode = cleanUpper(body.country_code);
    const countryName = cleanText(body.country_name);

    const primaryEmail = cleanText(body.primary_email);
    const primaryPhone = cleanText(body.primary_phone);

    const primaryContactName = cleanText(body.primary_contact_name);
    const primaryContactEmail = cleanText(body.primary_contact_email);
    const primaryContactPhone = cleanText(body.primary_contact_phone);

    const riskRating = cleanUpper(body.risk_rating) || "NOT_ASSESSED";
    const onboardingStatus = cleanUpper(body.onboarding_status) || "ONBOARDING";

    const baseCurrencyCode = cleanUpper(body.base_currency_code);
    const reportingFrameworkCode = cleanUpper(body.reporting_framework_code);

    const accountingYearStartMonth = Number(
      body.accounting_year_start_month
    );
    const accountingYearStartDay = Number(body.accounting_year_start_day);
    const accountingYearEndMonth = Number(body.accounting_year_end_month);
    const accountingYearEndDay = Number(body.accounting_year_end_day);

    if (!legalName) {
      return NextResponse.json(
        { error: "Legal name is required." },
        { status: 400 }
      );
    }

    if (!baseCurrencyCode) {
      return NextResponse.json(
        { error: "Primary currency is required." },
        { status: 400 }
      );
    }

    if (!reportingFrameworkCode) {
      return NextResponse.json(
        { error: "Reporting framework is required." },
        { status: 400 }
      );
    }

    if (!allowedReportingFrameworks.includes(reportingFrameworkCode)) {
      return NextResponse.json(
        { error: "Invalid reporting framework." },
        { status: 400 }
      );
    }

    if (!allowedRiskRatings.includes(riskRating)) {
      return NextResponse.json(
        { error: "Invalid risk rating." },
        { status: 400 }
      );
    }

    if (!allowedOnboardingStatuses.includes(onboardingStatus)) {
      return NextResponse.json(
        { error: "Invalid onboarding status." },
        { status: 400 }
      );
    }

    if (
      !isValidMonth(accountingYearStartMonth) ||
      !isValidDay(accountingYearStartDay) ||
      !isValidMonth(accountingYearEndMonth) ||
      !isValidDay(accountingYearEndDay)
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid accounting year setup. Month must be 1-12 and day must be 1-31.",
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated." },
        { status: 401 }
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile || !internalRoles.includes(profile.role)) {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }

    const { data: organisation, error: organisationError } = await supabase
      .from("organisations")
      .select("id, legal_name, trading_name")
      .eq("id", organisationId)
      .single();

    if (organisationError || !organisation) {
      return NextResponse.json(
        { error: "Organisation not found." },
        { status: 404 }
      );
    }

    const updatePayload = {
      legal_name: legalName,
      trading_name: tradingName,
      logo_url: logoUrl,
      country_code: countryCode,
      country_name: countryName,
      primary_email: primaryEmail,
      primary_phone: primaryPhone,
      primary_contact_name: primaryContactName,
      primary_contact_email: primaryContactEmail,
      primary_contact_phone: primaryContactPhone,
      risk_rating: riskRating,
      onboarding_status: onboardingStatus,
      base_currency_code: baseCurrencyCode,
      reporting_framework_code: reportingFrameworkCode,
      accounting_year_start_month: accountingYearStartMonth,
      accounting_year_start_day: accountingYearStartDay,
      accounting_year_end_month: accountingYearEndMonth,
      accounting_year_end_day: accountingYearEndDay,
    };

    const { error: updateError } = await supabase
      .from("organisations")
      .update(updatePayload)
      .eq("id", organisationId);

    if (updateError) {
      return NextResponse.json(
        {
          error: "Unable to save organisation settings.",
          details: updateError.message,
        },
        { status: 500 }
      );
    }

    try {
      await supabase.from("audit_logs").insert({
        user_id: user.id,
        organisation_id: organisationId,
        action: "ORGANISATION_CORE_PROFILE_UPDATED",
        details: updatePayload,
      });
    } catch {
      // Audit logging should not block saving.
    }

    return NextResponse.json({
      success: true,
      message: "Organisation settings saved successfully.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to save organisation settings.",
      },
      { status: 500 }
    );
  }
}