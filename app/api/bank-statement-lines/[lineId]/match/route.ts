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

const allowedSourceModules = [
  "CUSTOMER_RECEIPT",
  "SUPPLIER_PAYMENT",
  "FUNDING_TRANSACTION",
  "CAPITAL_CALL",
  "JOURNAL_ENTRY",
  "SALES_INVOICE",
  "PURCHASE_BILL",
  "GENERAL_LEDGER_ENTRY",
];

function toNumber(value: unknown, fallback = 0) {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function roundMoney(value: number) {
  return Number(value.toFixed(2));
}

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

function getSourceTable(sourceModule: string) {
  const tables: Record<string, string> = {
    CUSTOMER_RECEIPT: "customer_receipts",
    SUPPLIER_PAYMENT: "supplier_payments",
    FUNDING_TRANSACTION: "funding_transactions",
    CAPITAL_CALL: "capital_calls",
    JOURNAL_ENTRY: "journal_entries",
    SALES_INVOICE: "sales_invoices",
    PURCHASE_BILL: "purchase_bills",
    GENERAL_LEDGER_ENTRY: "general_ledger_entries",
  };

  return tables[sourceModule];
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

    const body = await request.json();

    const sourceModule = String(body.source_module || "").trim().toUpperCase();
    const sourceRecordId = String(body.source_record_id || "").trim();
    const matchNote = body.match_note ? String(body.match_note).trim() : null;
    const matchedAmount = roundMoney(toNumber(body.matched_amount, 0));

    if (!lineId) {
      return NextResponse.json(
        { error: "Bank statement line is required." },
        { status: 400 }
      );
    }

    if (!allowedSourceModules.includes(sourceModule)) {
      return NextResponse.json(
        { error: "Invalid source transaction type." },
        { status: 400 }
      );
    }

    if (!sourceRecordId) {
      return NextResponse.json(
        { error: "Source transaction is required." },
        { status: 400 }
      );
    }

    if (matchedAmount <= 0) {
      return NextResponse.json(
        { error: "Matched amount must be greater than zero." },
        { status: 400 }
      );
    }

    const { data: bankLine } = await supabase
      .from("bank_statement_lines")
      .select(
        "id, organisation_id, bank_account_id, money_in, money_out, reconciliation_status"
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
      bankLine.reconciliation_status &&
      ["MATCHED", "RECONCILED", "ADDED_TO_BOOKS"].includes(
        bankLine.reconciliation_status
      )
    ) {
      return NextResponse.json(
        {
          error:
            "This bank statement line has already been matched, reconciled, or added to the books.",
        },
        { status: 409 }
      );
    }

    const bankLineAmount =
      Number(bankLine.money_in || 0) > 0
        ? Number(bankLine.money_in || 0)
        : Number(bankLine.money_out || 0);

    if (matchedAmount > roundMoney(bankLineAmount)) {
      return NextResponse.json(
        {
          error:
            "Matched amount cannot be greater than the bank statement line amount.",
        },
        { status: 400 }
      );
    }

    const sourceTable = getSourceTable(sourceModule);

    if (!sourceTable) {
      return NextResponse.json(
        { error: "Unable to determine source transaction table." },
        { status: 400 }
      );
    }

    const { data: sourceRecord } = await supabase
      .from(sourceTable)
      .select("id, organisation_id")
      .eq("id", sourceRecordId)
      .eq("organisation_id", bankLine.organisation_id)
      .single();

    if (!sourceRecord) {
      return NextResponse.json(
        {
          error:
            "Selected source transaction was not found for this organisation.",
        },
        { status: 404 }
      );
    }

    const { data: existingMatch } = await supabase
      .from("bank_statement_matches")
      .select("id")
      .eq("bank_statement_line_id", lineId)
      .maybeSingle();

    if (existingMatch) {
      return NextResponse.json(
        {
          error:
            "This bank statement line already has a match record. Refresh the page and review the reconciliation status.",
        },
        { status: 409 }
      );
    }

    const { error: matchError } = await supabase
      .from("bank_statement_matches")
      .insert({
        organisation_id: bankLine.organisation_id,
        bank_statement_line_id: lineId,
        source_module: sourceModule,
        source_record_id: sourceRecordId,
        matched_amount: matchedAmount,
        match_status: "MATCHED",
        match_note: matchNote,
        matched_by: user?.id,
      });

    if (matchError) {
      return NextResponse.json(
        {
          error: "Unable to create bank statement match.",
          details: matchError.message,
        },
        { status: 500 }
      );
    }

    const { error: updateError } = await supabase
      .from("bank_statement_lines")
      .update({
        reconciliation_status: "MATCHED",
        matched_source_module: sourceModule,
        matched_source_record_id: sourceRecordId,
        matched_amount: matchedAmount,
        updated_by: user?.id,
      })
      .eq("id", lineId);

    if (updateError) {
      await supabase
        .from("bank_statement_matches")
        .delete()
        .eq("bank_statement_line_id", lineId);

      return NextResponse.json(
        {
          error: "Unable to update bank statement line.",
          details: updateError.message,
        },
        { status: 500 }
      );
    }

    try {
      await supabase.from("audit_logs").insert({
        user_id: user?.id,
        organisation_id: bankLine.organisation_id,
        action: "BANK_STATEMENT_LINE_MATCHED",
        details: {
          bank_statement_line_id: lineId,
          bank_account_id: bankLine.bank_account_id,
          source_module: sourceModule,
          source_record_id: sourceRecordId,
          matched_amount: matchedAmount,
        },
      });
    } catch {
      // Audit logging should not block matching.
    }

    return NextResponse.json({
      success: true,
      lineId,
      sourceModule,
      sourceRecordId,
      matchedAmount,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to match bank statement line.",
      },
      { status: 500 }
    );
  }
}