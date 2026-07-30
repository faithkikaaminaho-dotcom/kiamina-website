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

const editableStatuses = ["DRAFT", "READY_FOR_REVIEW", "REVIEWED"];

const allowedJournalTypes = [
  "MANUAL",
  "OPENING_BALANCE",
  "PAYROLL",
  "TAX",
  "ACCRUAL",
  "PREPAYMENT",
  "DEPRECIATION",
  "FX_REVALUATION",
  "CORRECTION",
  "YEAR_END_ADJUSTMENT",
  "OTHER",
];

type JournalLineInput = {
  account_id?: string | null;
  description?: string | null;
  debit_amount?: unknown;
  credit_amount?: unknown;
  customer_id?: string | null;
  supplier_id?: string | null;
  investor_id?: string | null;
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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ journalId: string }> }
) {
  try {
    const { journalId } = await params;

    if (!journalId) {
      return NextResponse.json(
        { error: "Journal entry ID is required." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile || !internalRoles.includes(profile.role)) {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }

    const { data: existingJournal, error: existingJournalError } = await supabase
      .from("journal_entries")
      .select("*")
      .eq("id", journalId)
      .single();

    if (existingJournalError || !existingJournal) {
      return NextResponse.json(
        { error: "Journal entry not found." },
        { status: 404 }
      );
    }

    if (!editableStatuses.includes(existingJournal.status)) {
      return NextResponse.json(
        {
          error:
            "This journal can no longer be edited because it has been posted or voided.",
          status: existingJournal.status,
        },
        { status: 409 }
      );
    }

    const { data: existingLedgerEntry } = await supabase
      .from("general_ledger_entries")
      .select("id")
      .eq("organisation_id", existingJournal.organisation_id)
      .eq("source_module", "JOURNAL_ENTRY")
      .eq("source_record_id", existingJournal.id)
      .maybeSingle();

    if (existingLedgerEntry) {
      return NextResponse.json(
        {
          error:
            "This journal already has a General Ledger entry and cannot be edited.",
        },
        { status: 409 }
      );
    }

    const body = await request.json();

    const journalDate = String(
      body.journal_date || existingJournal.journal_date || ""
    ).trim();

    const journalType = String(
      body.journal_type || existingJournal.journal_type || "MANUAL"
    )
      .trim()
      .toUpperCase();

    const description = body.description
      ? String(body.description).trim()
      : null;

    const referenceNumber = body.reference_number
      ? String(body.reference_number).trim()
      : null;

    const currencyCode = body.currency_code
      ? String(body.currency_code).trim().toUpperCase()
      : existingJournal.currency_code;

    const exchangeRate = toNumber(body.exchange_rate, existingJournal.exchange_rate || 1);

    const exchangeRateDate = body.exchange_rate_date
      ? String(body.exchange_rate_date).trim()
      : null;

    const exchangeRateSource = body.exchange_rate_source
      ? String(body.exchange_rate_source).trim()
      : null;

    const exchangeRateIsLocked = Boolean(body.exchange_rate_is_locked);

    const lines = Array.isArray(body.lines)
      ? (body.lines as JournalLineInput[])
      : [];

    if (!journalDate) {
      return NextResponse.json(
        { error: "Journal date is required." },
        { status: 400 }
      );
    }

    if (!allowedJournalTypes.includes(journalType)) {
      return NextResponse.json(
        { error: "Invalid journal type." },
        { status: 400 }
      );
    }

    if (lines.length < 2) {
      return NextResponse.json(
        { error: "A journal entry must have at least two lines." },
        { status: 400 }
      );
    }

    const cleanLines = lines.map((line, index) => {
      const accountId = line.account_id ? String(line.account_id).trim() : "";

      const debitAmount = roundMoney(toNumber(line.debit_amount, 0));
      const creditAmount = roundMoney(toNumber(line.credit_amount, 0));

      return {
        line_number: index + 1,
        account_id: accountId,
        description: line.description ? String(line.description).trim() : null,
        debit_amount: debitAmount,
        credit_amount: creditAmount,
        customer_id: line.customer_id ? String(line.customer_id).trim() : null,
        supplier_id: line.supplier_id ? String(line.supplier_id).trim() : null,
        investor_id: line.investor_id ? String(line.investor_id).trim() : null,
      };
    });

    for (const line of cleanLines) {
      if (!line.account_id) {
        return NextResponse.json(
          { error: "Each journal line must have an account." },
          { status: 400 }
        );
      }

      if (line.debit_amount < 0 || line.credit_amount < 0) {
        return NextResponse.json(
          { error: "Debit and credit amounts cannot be negative." },
          { status: 400 }
        );
      }

      if (line.debit_amount > 0 && line.credit_amount > 0) {
        return NextResponse.json(
          {
            error:
              "A journal line cannot have both debit and credit amounts.",
          },
          { status: 400 }
        );
      }

      if (line.debit_amount === 0 && line.credit_amount === 0) {
        return NextResponse.json(
          {
            error:
              "Each journal line must have either a debit or credit amount.",
          },
          { status: 400 }
        );
      }
    }

    const accountIds = cleanLines.map((line) => line.account_id);

    const { data: accounts, error: accountsError } = await supabase
      .from("chart_of_accounts")
      .select("id")
      .eq("organisation_id", existingJournal.organisation_id)
      .eq("is_active", true)
      .in("id", accountIds);

    if (accountsError) {
      return NextResponse.json(
        { error: "Unable to validate journal accounts." },
        { status: 500 }
      );
    }

    const validAccountIds = new Set((accounts || []).map((account) => account.id));

    const invalidAccount = cleanLines.find(
      (line) => !validAccountIds.has(line.account_id)
    );

    if (invalidAccount) {
      return NextResponse.json(
        {
          error:
            "One or more selected accounts are not active accounts for this organisation.",
        },
        { status: 400 }
      );
    }

    const totalDebits = roundMoney(
      cleanLines.reduce((sum, line) => sum + line.debit_amount, 0)
    );

    const totalCredits = roundMoney(
      cleanLines.reduce((sum, line) => sum + line.credit_amount, 0)
    );

    if (totalDebits <= 0 || totalCredits <= 0) {
      return NextResponse.json(
        { error: "Journal debits and credits must be greater than zero." },
        { status: 400 }
      );
    }

    if (totalDebits !== totalCredits) {
      return NextResponse.json(
        {
          error: `Journal is not balanced. Debits: ${totalDebits.toFixed(
            2
          )}, Credits: ${totalCredits.toFixed(2)}.`,
        },
        { status: 400 }
      );
    }

    const { data: oldLines } = await supabase
      .from("journal_entry_lines")
      .select("id, line_number, account_id, description, debit_amount, credit_amount, customer_id, supplier_id, investor_id")
      .eq("journal_entry_id", existingJournal.id)
      .eq("organisation_id", existingJournal.organisation_id)
      .order("line_number", { ascending: true });

    const { error: journalUpdateError } = await supabase
      .from("journal_entries")
      .update({
        journal_date: journalDate,
        journal_type: journalType,
        description,
        reference_number: referenceNumber,
        currency_code: currencyCode,
        exchange_rate: exchangeRate,
        exchange_rate_date: exchangeRateDate,
        exchange_rate_source: exchangeRateSource,
        exchange_rate_is_locked: exchangeRateIsLocked,
        total_debits: totalDebits,
        total_credits: totalCredits,
        updated_by: user.id,
      })
      .eq("id", existingJournal.id)
      .eq("organisation_id", existingJournal.organisation_id);

    if (journalUpdateError) {
      return NextResponse.json(
        {
          error: "Unable to update journal entry.",
          details: journalUpdateError.message,
        },
        { status: 500 }
      );
    }

    const { error: deleteLinesError } = await supabase
      .from("journal_entry_lines")
      .delete()
      .eq("journal_entry_id", existingJournal.id)
      .eq("organisation_id", existingJournal.organisation_id);

    if (deleteLinesError) {
      return NextResponse.json(
        {
          error: "Journal header was updated, but old lines could not be replaced.",
          details: deleteLinesError.message,
        },
        { status: 500 }
      );
    }

    const journalLinesPayload = cleanLines.map((line) => ({
      journal_entry_id: existingJournal.id,
      organisation_id: existingJournal.organisation_id,
      line_number: line.line_number,
      account_id: line.account_id,
      description: line.description,
      debit_amount: line.debit_amount,
      credit_amount: line.credit_amount,
      customer_id: line.customer_id,
      supplier_id: line.supplier_id,
      investor_id: line.investor_id,
    }));

    const { error: insertLinesError } = await supabase
      .from("journal_entry_lines")
      .insert(journalLinesPayload);

    if (insertLinesError) {
      return NextResponse.json(
        {
          error:
            "Journal header was updated, but replacement lines could not be saved.",
          details: insertLinesError.message,
        },
        { status: 500 }
      );
    }

    try {
      await supabase.from("audit_logs").insert({
        user_id: user.id,
        organisation_id: existingJournal.organisation_id,
        engagement_id: existingJournal.engagement_id,
        action: "JOURNAL_ENTRY_DRAFT_UPDATED",
        details: {
          journal_entry_id: existingJournal.id,
          journal_number: existingJournal.journal_number,
          previous_status: existingJournal.status,
          journal_date: journalDate,
          journal_type: journalType,
          total_debits: totalDebits,
          total_credits: totalCredits,
          currency_code: currencyCode,
          exchange_rate: exchangeRate,
          old_lines: oldLines || [],
          new_lines: cleanLines,
        },
      });
    } catch {
      // Audit logging should not block journal update.
    }

    return NextResponse.json({
      success: true,
      journalEntryId: existingJournal.id,
      journalNumber: existingJournal.journal_number,
      status: existingJournal.status,
      totalDebits,
      totalCredits,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update journal entry.",
      },
      { status: 500 }
    );
  }
}