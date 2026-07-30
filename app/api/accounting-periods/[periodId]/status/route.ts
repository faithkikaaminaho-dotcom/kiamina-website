import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

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

const allowedStatuses = ["OPEN", "UNDER_REVIEW", "LOCKED", "CLOSED"];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ periodId: string }> }
) {
  try {
    const { periodId } = await params;
    const body = await request.json();

    const nextStatus = String(body.status || "").toUpperCase();

    if (!allowedStatuses.includes(nextStatus)) {
      return NextResponse.json(
        { error: "Invalid accounting period status." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !internalRoles.includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { data: period } = await supabase
      .from("accounting_periods")
      .select("id, organisation_id, status")
      .eq("id", periodId)
      .single();

    if (!period) {
      return NextResponse.json(
        { error: "Accounting period not found." },
        { status: 404 }
      );
    }

    const { error: updateError } = await supabase
      .from("accounting_periods")
      .update({
        status: nextStatus,
      })
      .eq("id", periodId);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    await supabase.from("audit_logs").insert({
      organisation_id: period.organisation_id,
      actor_id: user.id,
      action: "ACCOUNTING_PERIOD_STATUS_UPDATED",
      entity_type: "ACCOUNTING_PERIOD",
      entity_id: periodId,
      metadata: {
        previous_status: period.status,
        new_status: nextStatus,
      },
    });

    return NextResponse.json({
      success: true,
      status: nextStatus,
    });
  } catch (error) {
    console.error("Update accounting period status error:", error);

    return NextResponse.json(
      { error: "Unable to update accounting period status." },
      { status: 500 }
    );
  }
}