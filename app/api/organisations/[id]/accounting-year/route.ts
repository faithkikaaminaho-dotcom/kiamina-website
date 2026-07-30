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

function isValidMonth(value: number) {
  return Number.isInteger(value) && value >= 1 && value <= 12;
}

function isValidDay(value: number) {
  return Number.isInteger(value) && value >= 1 && value <= 31;
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

    const accountingYearStartMonth = Number(
      body.accounting_year_start_month
    );
    const accountingYearStartDay = Number(body.accounting_year_start_day);
    const accountingYearEndMonth = Number(body.accounting_year_end_month);
    const accountingYearEndDay = Number(body.accounting_year_end_day);

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

    const { error: updateError } = await supabase
      .from("organisations")
      .update({
        accounting_year_start_month: accountingYearStartMonth,
        accounting_year_start_day: accountingYearStartDay,
        accounting_year_end_month: accountingYearEndMonth,
        accounting_year_end_day: accountingYearEndDay,
      })
      .eq("id", organisationId);

    if (updateError) {
      return NextResponse.json(
        {
          error: "Unable to save accounting year settings.",
          details: updateError.message,
        },
        { status: 500 }
      );
    }

    try {
      await supabase.from("audit_logs").insert({
        user_id: user.id,
        organisation_id: organisationId,
        action: "ORGANISATION_ACCOUNTING_YEAR_UPDATED",
        details: {
          accounting_year_start_month: accountingYearStartMonth,
          accounting_year_start_day: accountingYearStartDay,
          accounting_year_end_month: accountingYearEndMonth,
          accounting_year_end_day: accountingYearEndDay,
        },
      });
    } catch {
      // Audit logging should not block saving.
    }

    return NextResponse.json({
      success: true,
      message: "Accounting year settings saved successfully.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to save accounting year settings.",
      },
      { status: 500 }
    );
  }
}