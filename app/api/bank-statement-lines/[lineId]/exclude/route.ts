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

async function getInternalUser() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      supabase,
      user: null,
      error: NextResponse.json({ error: "Not authenticated." }, { status: 401 }),
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !internalRoles.includes(profile.role)) {
    return {
      supabase,
      user,
      error: NextResponse.json({ error: "Access denied." }, { status: 403 }),
    };
  }

  return {
    supabase,
    user,
    error: null,
  };
}

export async function POST(
  request: Request,
  context: { params: Promise<{ lineId: string }> }
) {
  try {
    const { lineId } = await context.params;

    const { supabase, user, error } = await getInternalUser();

    if (error) {
      return error;
    }

    const body = await request.json().catch(() => ({}));
    const excludeNote = body.exclude_note
      ? String(body.exclude_note).trim()
      : null;

    if (!lineId) {
      return NextResponse.json(
        { error: "Bank statement line is required." },
        { status: 400 }
      );
    }

    const { data: bankLine } = await supabase
      .from("bank_statement_lines")
      .select(
        "id, organisation_id, bank_account_id, reconciliation_status, matched_source_module, added_transaction_module"
      )
      .eq("id", lineId)
      .single();

    if (!bankLine) {
      return NextResponse.json(
        { error: "Bank statement line not found." },
        { status: 404 }
      );
    }

    if (
      ["MATCHED", "RECONCILED", "ADDED_TO_BOOKS"].includes(
        bankLine.reconciliation_status || ""
      )
    ) {
      return NextResponse.json(
        {
          error:
            "This bank line is already matched, reconciled, or added to the books. It cannot be excluded.",
        },
        { status: 409 }
      );
    }

    const { error: updateError } = await supabase
      .from("bank_statement_lines")
      .update({
        reconciliation_status: "EXCLUDED",
        notes: excludeNote,
        updated_by: user?.id,
      })
      .eq("id", lineId);

    if (updateError) {
      return NextResponse.json(
        {
          error: "Unable to exclude bank statement line.",
          details: updateError.message,
        },
        { status: 500 }
      );
    }

    try {
      await supabase.from("audit_logs").insert({
        user_id: user?.id,
        organisation_id: bankLine.organisation_id,
        action: "BANK_STATEMENT_LINE_EXCLUDED",
        details: {
          bank_statement_line_id: lineId,
          bank_account_id: bankLine.bank_account_id,
          exclude_note: excludeNote,
        },
      });
    } catch {
      // Audit logging should not block exclusion.
    }

    return NextResponse.json({
      success: true,
      lineId,
      status: "EXCLUDED",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to exclude bank statement line.",
      },
      { status: 500 }
    );
  }
}