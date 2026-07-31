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

function getSourceConfig(sourceModule: string) {
  const configs: Record<
    string,
    {
      table: string;
      select: string;
      amountFields: string[];
    }
  > = {
    CUSTOMER_RECEIPT: {
      table: "customer_receipts",
      select: "id, organisation_id, amount_received, net_amount",
      amountFields: ["net_amount", "amount_received"],
    },
    SUPPLIER_PAYMENT: {
      table: "supplier_payments",
      select: "id, organisation_id, amount_paid, total_cash_outflow",
      amountFields: ["total_cash_outflow", "amount_paid"],
    },
    FUNDING_TRANSACTION: {
      table: "funding_transactions",
      select: "id, organisation_id, amount, net_amount",
      amountFields: ["net_amount", "amount"],
    },
    CAPITAL_CALL: {
      table: "capital_calls",
      select: "id, organisation_id, called_amount",
      amountFields: ["called_amount"],
    },
    JOURNAL_ENTRY: {
      table: "journal_entries",
      select: "id, organisation_id, total_debits, total_credits",
      amountFields: ["total_debits", "total_credits"],
    },
    SALES_INVOICE: {
      table: "sales_invoices",
      select: "id, organisation_id, total_amount, balance_due",
      amountFields: ["balance_due", "total_amount"],
    },
    PURCHASE_BILL: {
      table: "purchase_bills",
      select: "id, organisation_id, total_amount, balance_due",
      amountFields: ["balance_due", "total_amount"],
    },
    GENERAL_LEDGER_ENTRY: {
      table: "general_ledger_entries",
      select: "id, organisation_id, total_debits, total_credits",
      amountFields: ["total_debits", "total_credits"],
    },
  };

  return configs[sourceModule];
}

function getSourceAmount(sourceRecord: Record<string, unknown>, amountFields: string[]) {
  for (const field of amountFields) {
    const amount = toNumber(sourceRecord[field], 0);

    if (amount > 0) {
      return roundMoney(amount);
    }
  }

  return 0;
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
    const allocationDescription = body.match_note
      ? String(body.match_note).trim()
      : "Matched from bank feed.";
    const allocationAmount = roundMoney(toNumber(body.matched_amount, 0));

    const bankChargeTreatment = body.bank_charge_treatment
      ? String(body.bank_charge_treatment).trim().toUpperCase()
      : "NONE";
    const bankChargeAmount = roundMoney(toNumber(body.bank_charge_amount, 0));
    const bankChargeGlAccountId = body.bank_charge_gl_account_id
      ? String(body.bank_charge_gl_account_id).trim()
      : null;

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

    if (allocationAmount <= 0) {
      return NextResponse.json(
        { error: "Matched amount must be greater than zero." },
        { status: 400 }
      );
    }

    if (bankChargeAmount > 0 && !bankChargeGlAccountId) {
      return NextResponse.json(
        {
          error:
            "Bank charge GL account is required when a bank charge amount is entered.",
        },
        { status: 400 }
      );
    }

    const { data: bankLine } = await supabase
      .from("bank_statement_lines")
      .select(
        "id, organisation_id, bank_account_id, money_in, money_out, allocated_amount, unallocated_amount, reconciliation_status"
      )
      .eq("id", lineId)
      .single();

    if (!bankLine) {
      return NextResponse.json(
        { error: "Bank statement line not found." },
        { status: 404 }
      );
    }

    if (["EXCLUDED", "IGNORED"].includes(bankLine.reconciliation_status || "")) {
      return NextResponse.json(
        {
          error:
            "This bank statement line has been excluded and cannot be matched.",
        },
        { status: 409 }
      );
    }

    const bankLineAmount =
      Number(bankLine.money_in || 0) > 0
        ? roundMoney(Number(bankLine.money_in || 0))
        : roundMoney(Number(bankLine.money_out || 0));

    const alreadyAllocated = roundMoney(toNumber(bankLine.allocated_amount, 0));
    const currentUnallocated =
      bankLine.unallocated_amount === null ||
      bankLine.unallocated_amount === undefined
        ? roundMoney(bankLineAmount - alreadyAllocated)
        : roundMoney(toNumber(bankLine.unallocated_amount, bankLineAmount));

    if (allocationAmount > currentUnallocated) {
      return NextResponse.json(
        {
          error: `Matched amount cannot exceed the unallocated bank line amount of ${currentUnallocated.toLocaleString(
            "en-US",
            {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }
          )}.`,
        },
        { status: 400 }
      );
    }

    const sourceConfig = getSourceConfig(sourceModule);

    if (!sourceConfig) {
      return NextResponse.json(
        { error: "Unable to determine source transaction table." },
        { status: 400 }
      );
    }

    const { data: sourceRecord } = await supabase
      .from(sourceConfig.table)
      .select(sourceConfig.select)
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

    const sourceAmount = getSourceAmount(
  sourceRecord as unknown as Record<string, unknown>,
  sourceConfig.amountFields
);

    const { data: sourceStatus } = await supabase
      .from("source_transaction_reconciliation_status")
      .select(
        "id, source_amount, allocated_bank_amount, unallocated_source_amount, reconciliation_status"
      )
      .eq("organisation_id", bankLine.organisation_id)
      .eq("source_module", sourceModule)
      .eq("source_record_id", sourceRecordId)
      .maybeSingle();

    const sourceAlreadyAllocated = roundMoney(
      toNumber(sourceStatus?.allocated_bank_amount, 0)
    );

    const sourceUnallocated =
      sourceStatus?.unallocated_source_amount === null ||
      sourceStatus?.unallocated_source_amount === undefined
        ? roundMoney(sourceAmount - sourceAlreadyAllocated)
        : roundMoney(toNumber(sourceStatus.unallocated_source_amount, sourceAmount));

    if (sourceAmount > 0 && allocationAmount > sourceUnallocated) {
      return NextResponse.json(
        {
          error: `Matched amount cannot exceed the unallocated source transaction amount of ${sourceUnallocated.toLocaleString(
            "en-US",
            {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }
          )}.`,
        },
        { status: 400 }
      );
    }

    const { data: allocation, error: allocationError } = await supabase
      .from("bank_reconciliation_allocations")
      .insert({
        organisation_id: bankLine.organisation_id,
        bank_account_id: bankLine.bank_account_id,
        bank_statement_line_id: lineId,

        allocation_type: "MATCH_EXISTING",
        source_module: sourceModule,
        source_record_id: sourceRecordId,

        allocation_description: allocationDescription,
        allocation_amount: allocationAmount,

        bank_charge_treatment: bankChargeTreatment,
        bank_charge_amount: bankChargeAmount,
        bank_charge_gl_account_id: bankChargeGlAccountId,

        status: "ALLOCATED",

        created_by: user?.id,
        updated_by: user?.id,
      })
      .select("id")
      .single();

    if (allocationError || !allocation) {
      return NextResponse.json(
        {
          error: "Unable to create reconciliation allocation.",
          details: allocationError?.message,
        },
        { status: 500 }
      );
    }

    const newSourceAllocated = roundMoney(sourceAlreadyAllocated + allocationAmount);
    const newSourceUnallocated = roundMoney(Math.max(sourceAmount - newSourceAllocated, 0));

    let newSourceStatus = "UNRECONCILED";

    if (newSourceAllocated <= 0) {
      newSourceStatus = "UNRECONCILED";
    } else if (sourceAmount > 0 && newSourceAllocated < sourceAmount) {
      newSourceStatus = "PARTIALLY_RECONCILED";
    } else if (sourceAmount > 0 && newSourceAllocated === sourceAmount) {
      newSourceStatus = "RECONCILED";
    } else if (sourceAmount > 0 && newSourceAllocated > sourceAmount) {
      newSourceStatus = "OVER_RECONCILED";
    } else {
      newSourceStatus = "RECONCILED";
    }

    const { error: sourceStatusError } = await supabase
      .from("source_transaction_reconciliation_status")
      .upsert(
        {
          organisation_id: bankLine.organisation_id,
          source_module: sourceModule,
          source_record_id: sourceRecordId,
          source_amount: sourceAmount,
          allocated_bank_amount: newSourceAllocated,
          unallocated_source_amount: newSourceUnallocated,
          reconciliation_status: newSourceStatus,
          last_bank_statement_line_id: lineId,
          last_allocation_id: allocation.id,
        },
        {
          onConflict: "organisation_id,source_module,source_record_id",
        }
      );

    if (sourceStatusError) {
      return NextResponse.json(
        {
          error:
            "Allocation was created, but source transaction reconciliation summary could not be updated.",
          details: sourceStatusError.message,
        },
        { status: 500 }
      );
    }

    const { error: recalcError } = await supabase.rpc(
      "recalculate_bank_statement_line_reconciliation",
      {
        p_bank_statement_line_id: lineId,
      }
    );

    if (recalcError) {
      return NextResponse.json(
        {
          error:
            "Allocation was created, but bank line reconciliation status could not be recalculated.",
          details: recalcError.message,
        },
        { status: 500 }
      );
    }

    try {
      await supabase.from("audit_logs").insert({
        user_id: user?.id,
        organisation_id: bankLine.organisation_id,
        action: "BANK_STATEMENT_LINE_ALLOCATED_TO_SOURCE_TRANSACTION",
        details: {
          bank_statement_line_id: lineId,
          bank_account_id: bankLine.bank_account_id,
          allocation_id: allocation.id,
          source_module: sourceModule,
          source_record_id: sourceRecordId,
          allocation_amount: allocationAmount,
          bank_charge_treatment: bankChargeTreatment,
          bank_charge_amount: bankChargeAmount,
          bank_charge_gl_account_id: bankChargeGlAccountId,
        },
      });
    } catch {
      // Audit logging should not block matching.
    }

    return NextResponse.json({
      success: true,
      lineId,
      allocationId: allocation.id,
      sourceModule,
      sourceRecordId,
      allocationAmount,
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