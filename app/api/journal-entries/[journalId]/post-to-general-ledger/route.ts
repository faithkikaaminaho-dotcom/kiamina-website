import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { reserveDocumentNumber } from "@/lib/numbering";

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

type JournalLine = {
  id: string;
  organisation_id: string;
  journal_entry_id: string;
  line_number: number;
  account_id: string;
  description: string | null;
  debit_amount: number | null;
  credit_amount: number | null;
  customer_id: string | null;
  supplier_id: string | null;
  investor_id: string | null;
  department_id: string | null;
  location_id: string | null;
  project_id: string | null;
  cost_centre_id: string | null;
  class_id: string | null;
  fund_grant_id: string | null;
  service_line_id: string | null;
  tracking_data?: Record<string, unknown> | null;
};

type LockedAccountingPeriod = {
  id: string;
  period_name: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string | null;
};

function toMoney(value: unknown) {
  return Number(Number(value || 0).toFixed(2));
}

function buildTrackingData(line: JournalLine) {
  const trackingData: Record<string, string> = {};

  if (line.department_id) trackingData.department_id = line.department_id;
  if (line.location_id) trackingData.location_id = line.location_id;
  if (line.project_id) trackingData.project_id = line.project_id;
  if (line.cost_centre_id) trackingData.cost_centre_id = line.cost_centre_id;
  if (line.class_id) trackingData.class_id = line.class_id;
  if (line.fund_grant_id) trackingData.fund_grant_id = line.fund_grant_id;
  if (line.service_line_id) trackingData.service_line_id = line.service_line_id;

  return Object.keys(trackingData).length > 0 ? trackingData : null;
}

export async function POST(
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
      return NextResponse.json(
        { error: "You must be signed in to post a journal." },
        { status: 401 }
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile || !internalRoles.includes(profile.role)) {
      return NextResponse.json(
        { error: "You do not have permission to post journals." },
        { status: 403 }
      );
    }

    const { data: journal, error: journalError } = await supabase
      .from("journal_entries")
      .select("*")
      .eq("id", journalId)
      .single();

    if (journalError || !journal) {
      return NextResponse.json(
        { error: "Journal entry not found." },
        { status: 404 }
      );
    }

    if (journal.status === "POSTED" || journal.posted_at) {
      return NextResponse.json(
        { error: "This journal has already been posted." },
        { status: 409 }
      );
    }

    if (journal.status === "VOID") {
      return NextResponse.json(
        { error: "A void journal cannot be posted." },
        { status: 400 }
      );
    }

    const entryDate = journal.journal_date;

    if (!entryDate) {
      return NextResponse.json(
        { error: "Journal date is required before posting." },
        { status: 400 }
      );
    }

    const { data: lockedPeriodRows, error: lockedPeriodError } = await supabase
      .from("accounting_periods")
      .select("id, period_name, start_date, end_date, status")
      .eq("organisation_id", journal.organisation_id)
      .lte("start_date", entryDate)
      .gte("end_date", entryDate)
      .in("status", ["LOCKED", "CLOSED"])
      .limit(1);

    if (lockedPeriodError) {
      return NextResponse.json(
        {
          error: "Unable to validate accounting period lock status.",
          details: lockedPeriodError.message,
        },
        { status: 500 }
      );
    }

    const lockedPeriod = (lockedPeriodRows ||
      [])[0] as LockedAccountingPeriod | undefined;

    if (lockedPeriod) {
      return NextResponse.json(
        {
          error:
            "This accounting period is locked or closed. Posting is not allowed.",
          periodId: lockedPeriod.id,
          periodName: lockedPeriod.period_name,
          periodStatus: lockedPeriod.status,
          entryDate,
        },
        { status: 409 }
      );
    }

    const { data: existingLedgerEntry } = await supabase
      .from("general_ledger_entries")
      .select("id, entry_number, status")
      .eq("organisation_id", journal.organisation_id)
      .eq("source_module", "JOURNAL_ENTRY")
      .eq("source_record_id", journal.id)
      .maybeSingle();

    if (existingLedgerEntry) {
      return NextResponse.json(
        {
          error: "A General Ledger entry already exists for this journal.",
          ledgerEntryId: existingLedgerEntry.id,
          entryNumber: existingLedgerEntry.entry_number,
          status: existingLedgerEntry.status,
        },
        { status: 409 }
      );
    }

    const { data: journalLines, error: linesError } = await supabase
      .from("journal_entry_lines")
      .select(
        "id, organisation_id, journal_entry_id, line_number, account_id, description, debit_amount, credit_amount, customer_id, supplier_id, investor_id, department_id, location_id, project_id, cost_centre_id, class_id, fund_grant_id, service_line_id, tracking_data"
      )
      .eq("journal_entry_id", journal.id)
      .eq("organisation_id", journal.organisation_id)
      .order("line_number", { ascending: true });

    if (linesError) {
      return NextResponse.json(
        { error: "Unable to read journal lines." },
        { status: 500 }
      );
    }

    const lines = (journalLines || []) as JournalLine[];

    if (lines.length < 2) {
      return NextResponse.json(
        { error: "A journal must have at least two lines before posting." },
        { status: 400 }
      );
    }

    const totalDebits = toMoney(
      lines.reduce((sum, line) => sum + Number(line.debit_amount || 0), 0)
    );

    const totalCredits = toMoney(
      lines.reduce((sum, line) => sum + Number(line.credit_amount || 0), 0)
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
          error: "Journal is out of balance and cannot be posted.",
          totalDebits,
          totalCredits,
        },
        { status: 400 }
      );
    }

    for (const line of lines) {
      const debitAmount = Number(line.debit_amount || 0);
      const creditAmount = Number(line.credit_amount || 0);

      if (!line.account_id) {
        return NextResponse.json(
          { error: `Line ${line.line_number} has no account selected.` },
          { status: 400 }
        );
      }

      if (debitAmount < 0 || creditAmount < 0) {
        return NextResponse.json(
          { error: `Line ${line.line_number} contains a negative amount.` },
          { status: 400 }
        );
      }

      if (debitAmount > 0 && creditAmount > 0) {
        return NextResponse.json(
          {
            error: `Line ${line.line_number} cannot have both debit and credit amounts.`,
          },
          { status: 400 }
        );
      }

      if (debitAmount === 0 && creditAmount === 0) {
        return NextResponse.json(
          {
            error: `Line ${line.line_number} must have either a debit or credit amount.`,
          },
          { status: 400 }
        );
      }
    }

    const accountIds = Array.from(new Set(lines.map((line) => line.account_id)));

    const { data: accounts, error: accountsError } = await supabase
      .from("chart_of_accounts")
      .select("id, is_active")
      .eq("organisation_id", journal.organisation_id)
      .in("id", accountIds);

    if (accountsError) {
      return NextResponse.json(
        { error: "Unable to validate journal accounts." },
        { status: 500 }
      );
    }

    const activeAccountIds = new Set(
      (accounts || [])
        .filter((account) => account.is_active)
        .map((account) => account.id)
    );

    const invalidAccountLine = lines.find(
      (line) => !activeAccountIds.has(line.account_id)
    );

    if (invalidAccountLine) {
      return NextResponse.json(
        {
          error: `Line ${invalidAccountLine.line_number} uses an inactive or invalid account.`,
        },
        { status: 400 }
      );
    }

    const entryNumber = await reserveDocumentNumber({
      supabase,
      organisationId: journal.organisation_id,
      documentType: "GL_ENTRY",
    });

    const exchangeRate = Number(journal.exchange_rate || 1);
    const currencyCode = journal.currency_code;
    const sourceReference =
      journal.journal_number || journal.reference_number || journal.id;

    const now = new Date().toISOString();

    const { data: ledgerEntry, error: ledgerEntryError } = await supabase
      .from("general_ledger_entries")
      .insert({
        organisation_id: journal.organisation_id,
        accounting_period_id: journal.accounting_period_id || null,
        engagement_id: journal.engagement_id || null,

        entry_number: entryNumber,
        entry_date: entryDate,

        source_module: "JOURNAL_ENTRY",
        source_record_id: journal.id,
        source_line_id: null,

        source_reference: sourceReference,
        description: journal.description || "Journal entry posting",

        currency_code: currencyCode,
        exchange_rate: exchangeRate,
        exchange_rate_date: journal.exchange_rate_date || entryDate,
        exchange_rate_source: journal.exchange_rate_source || null,
        exchange_rate_is_locked: Boolean(journal.exchange_rate_is_locked),

        total_debits: totalDebits,
        total_credits: totalCredits,

        status: "POSTED",
        posted_at: now,
        posted_by: user.id,

        created_by: user.id,
        updated_by: user.id,
      })
      .select("id, entry_number")
      .single();

    if (ledgerEntryError || !ledgerEntry) {
      return NextResponse.json(
        {
          error: "Unable to create General Ledger entry.",
          details: ledgerEntryError?.message,
        },
        { status: 500 }
      );
    }

    const ledgerLines = lines.map((line) => {
      const debitAmount = toMoney(line.debit_amount);
      const creditAmount = toMoney(line.credit_amount);
      const trackingData = line.tracking_data || buildTrackingData(line);

      return {
        general_ledger_entry_id: ledgerEntry.id,
        organisation_id: journal.organisation_id,

        line_number: line.line_number,
        account_id: line.account_id,

        description:
          line.description || journal.description || "Journal entry posting",

        debit_amount: debitAmount,
        credit_amount: creditAmount,

        base_debit_amount: toMoney(debitAmount * exchangeRate),
        base_credit_amount: toMoney(creditAmount * exchangeRate),

        customer_id: line.customer_id || null,
        supplier_id: line.supplier_id || null,
        investor_id: line.investor_id || null,

        department_id: line.department_id || null,
        location_id: line.location_id || null,
        project_id: line.project_id || null,
        cost_centre_id: line.cost_centre_id || null,
        class_id: line.class_id || null,
        fund_grant_id: line.fund_grant_id || null,
        service_line_id: line.service_line_id || null,
        tracking_data: trackingData,

        source_module: "JOURNAL_ENTRY",
        source_record_id: journal.id,
        source_line_id: line.id,
      };
    });

    const { error: ledgerLinesError } = await supabase
      .from("general_ledger_lines")
      .insert(ledgerLines);

    if (ledgerLinesError) {
      await supabase
        .from("general_ledger_entries")
        .delete()
        .eq("id", ledgerEntry.id);

      return NextResponse.json(
        {
          error: "Unable to create General Ledger lines. Posting was cancelled.",
          details: ledgerLinesError.message,
        },
        { status: 500 }
      );
    }

    const { error: journalUpdateError } = await supabase
      .from("journal_entries")
      .update({
        status: "POSTED",
        posted_at: now,
        posted_by: user.id,
        updated_by: user.id,
      })
      .eq("id", journal.id)
      .eq("organisation_id", journal.organisation_id);

    if (journalUpdateError) {
      return NextResponse.json(
        {
          error:
            "General Ledger entry was created, but the journal status could not be updated.",
          details: journalUpdateError.message,
          ledgerEntryId: ledgerEntry.id,
          entryNumber: ledgerEntry.entry_number,
        },
        { status: 500 }
      );
    }

    await supabase.from("audit_logs").insert({
      organisation_id: journal.organisation_id,
      user_id: user.id,
      action: "JOURNAL_POSTED_TO_GENERAL_LEDGER",
      entity_type: "journal_entries",
      entity_id: journal.id,
      metadata: {
        journal_number: journal.journal_number,
        general_ledger_entry_id: ledgerEntry.id,
        general_ledger_entry_number: ledgerEntry.entry_number,
        total_debits: totalDebits,
        total_credits: totalCredits,
        source_module: "JOURNAL_ENTRY",
        tracking_dimensions_copied: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Journal posted to General Ledger successfully.",
      journalId: journal.id,
      journalNumber: journal.journal_number,
      ledgerEntryId: ledgerEntry.id,
      entryNumber: ledgerEntry.entry_number,
    });
  } catch (error) {
    console.error("Post journal to General Ledger error:", error);

    return NextResponse.json(
      { error: "Unexpected error while posting journal to General Ledger." },
      { status: 500 }
    );
  }
}