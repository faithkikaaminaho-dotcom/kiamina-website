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

type BankLineInput = {
  transaction_date?: string | null;
  value_date?: string | null;
  description?: string | null;
  reference_number?: string | null;
  money_in?: unknown;
  money_out?: unknown;
  running_balance?: unknown;
  notes?: string | null;
};

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

export async function POST(request: Request) {
  try {
    const { supabase, user, error } = await getInternalUser();

    if (error) {
      return error;
    }

    const body = await request.json();

    const organisationId = String(body.organisation_id || "").trim();
    const bankAccountId = String(body.bank_account_id || "").trim();

    const documentId = body.document_id
      ? String(body.document_id).trim()
      : null;

    const fileName = body.file_name ? String(body.file_name).trim() : null;

    const statementStartDate = body.statement_start_date
      ? String(body.statement_start_date).trim()
      : null;

    const statementEndDate = body.statement_end_date
      ? String(body.statement_end_date).trim()
      : null;

    const openingBalance =
      body.opening_balance === "" || body.opening_balance === undefined
        ? null
        : roundMoney(toNumber(body.opening_balance, 0));

    const closingBalance =
      body.closing_balance === "" || body.closing_balance === undefined
        ? null
        : roundMoney(toNumber(body.closing_balance, 0));

    const lines = Array.isArray(body.lines)
      ? (body.lines as BankLineInput[])
      : [];

    if (!organisationId) {
      return NextResponse.json(
        { error: "Organisation is required." },
        { status: 400 }
      );
    }

    if (!bankAccountId) {
      return NextResponse.json(
        { error: "Bank account is required." },
        { status: 400 }
      );
    }

    if (lines.length === 0) {
      return NextResponse.json(
        { error: "At least one bank statement line is required." },
        { status: 400 }
      );
    }

    const { data: bankAccount } = await supabase
      .from("bank_accounts")
      .select("id, organisation_id, currency_code")
      .eq("id", bankAccountId)
      .eq("organisation_id", organisationId)
      .single();

    if (!bankAccount) {
      return NextResponse.json(
        { error: "Bank account not found for this organisation." },
        { status: 404 }
      );
    }

    const cleanLines = lines.map((line) => {
      const transactionDate = line.transaction_date
        ? String(line.transaction_date).trim()
        : "";

      const valueDate = line.value_date
        ? String(line.value_date).trim()
        : transactionDate || null;

      const description = line.description
        ? String(line.description).trim()
        : "";

      const referenceNumber = line.reference_number
        ? String(line.reference_number).trim()
        : null;

      const moneyIn = roundMoney(toNumber(line.money_in, 0));
      const moneyOut = roundMoney(toNumber(line.money_out, 0));

      const runningBalance =
        line.running_balance === "" ||
        line.running_balance === null ||
        line.running_balance === undefined
          ? null
          : roundMoney(toNumber(line.running_balance, 0));

      return {
        transaction_date: transactionDate,
        value_date: valueDate,
        description,
        reference_number: referenceNumber,
        money_in: moneyIn,
        money_out: moneyOut,
        running_balance: runningBalance,
        notes: line.notes ? String(line.notes).trim() : null,
      };
    });

    for (const line of cleanLines) {
      if (!line.transaction_date) {
        return NextResponse.json(
          { error: "Each bank line must have a transaction date." },
          { status: 400 }
        );
      }

      if (!line.description) {
        return NextResponse.json(
          { error: "Each bank line must have a description." },
          { status: 400 }
        );
      }

      if (line.money_in < 0 || line.money_out < 0) {
        return NextResponse.json(
          { error: "Money in and money out cannot be negative." },
          { status: 400 }
        );
      }

      if (line.money_in > 0 && line.money_out > 0) {
        return NextResponse.json(
          {
            error:
              "A bank line cannot have both money in and money out amounts.",
          },
          { status: 400 }
        );
      }

      if (line.money_in === 0 && line.money_out === 0) {
        return NextResponse.json(
          {
            error:
              "Each bank line must have either money in or money out amount.",
          },
          { status: 400 }
        );
      }
    }

    const { data: statementImport, error: importError } = await supabase
      .from("bank_statement_imports")
      .insert({
        organisation_id: organisationId,
        bank_account_id: bankAccountId,
        document_id: documentId,
        file_name: fileName,
        statement_start_date: statementStartDate,
        statement_end_date: statementEndDate,
        opening_balance: openingBalance,
        closing_balance: closingBalance,
        status: "IMPORTED",
        extraction_status: documentId ? "DOCUMENT_LINKED_MANUAL_LINES" : "MANUAL_ENTRY",
        created_by: user?.id,
        updated_by: user?.id,
      })
      .select("id")
      .single();

    if (importError || !statementImport) {
      return NextResponse.json(
        {
          error: "Unable to create bank statement import.",
          details: importError?.message,
        },
        { status: 500 }
      );
    }

    const linePayload = cleanLines.map((line) => ({
      organisation_id: organisationId,
      bank_account_id: bankAccountId,
      statement_import_id: statementImport.id,
      document_id: documentId,
      transaction_date: line.transaction_date,
      value_date: line.value_date,
      description: line.description,
      reference_number: line.reference_number,
      money_in: line.money_in,
      money_out: line.money_out,
      running_balance: line.running_balance,
      currency_code: bankAccount.currency_code,
      reconciliation_status: "UNMATCHED",
      notes: line.notes,
      created_by: user?.id,
      updated_by: user?.id,
    }));

    const { error: linesError } = await supabase
      .from("bank_statement_lines")
      .insert(linePayload);

    if (linesError) {
      await supabase
        .from("bank_statement_imports")
        .delete()
        .eq("id", statementImport.id);

      return NextResponse.json(
        {
          error: "Unable to create bank statement lines.",
          details: linesError.message,
        },
        { status: 500 }
      );
    }

    const latestRunningBalance = [...cleanLines]
      .reverse()
      .find((line) => line.running_balance !== null)?.running_balance;

    if (latestRunningBalance !== undefined && latestRunningBalance !== null) {
      await supabase
        .from("bank_accounts")
        .update({
          current_balance: latestRunningBalance,
          updated_by: user?.id,
        })
        .eq("id", bankAccountId)
        .eq("organisation_id", organisationId);
    } else if (closingBalance !== null) {
      await supabase
        .from("bank_accounts")
        .update({
          current_balance: closingBalance,
          updated_by: user?.id,
        })
        .eq("id", bankAccountId)
        .eq("organisation_id", organisationId);
    }

    try {
      await supabase.from("audit_logs").insert({
        user_id: user?.id,
        organisation_id: organisationId,
        action: "BANK_STATEMENT_LINES_IMPORTED",
        details: {
          bank_account_id: bankAccountId,
          statement_import_id: statementImport.id,
          document_id: documentId,
          line_count: cleanLines.length,
          statement_start_date: statementStartDate,
          statement_end_date: statementEndDate,
        },
      });
    } catch {
      // Audit logging should not block import.
    }

    return NextResponse.json({
      success: true,
      statementImportId: statementImport.id,
      lineCount: cleanLines.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to import bank statement lines.",
      },
      { status: 500 }
    );
  }
}