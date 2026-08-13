import { createClient } from "@/utils/supabase/server";
import { reserveDocumentNumber } from "@/lib/numbering";

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

type JournalLineInput = {
  account_id?: string | null;
  description?: string | null;
  debit_amount?: unknown;
  credit_amount?: unknown;
  customer_id?: string | null;
  supplier_id?: string | null;
  investor_id?: string | null;
  department_id?: string | null;
  location_id?: string | null;
  project_id?: string | null;
  cost_centre_id?: string | null;
  class_id?: string | null;
  fund_grant_id?: string | null;
  service_line_id?: string | null;
};

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Not authenticated." }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !internalRoles.includes(profile.role)) {
      return Response.json({ error: "Access denied." }, { status: 403 });
    }

    const body = await request.json();

    const organisationId = String(body.organisation_id || "").trim();

    const accountingPeriodId = body.accounting_period_id
      ? String(body.accounting_period_id).trim()
      : null;

    const engagementId = body.engagement_id
      ? String(body.engagement_id).trim()
      : null;

    const journalNumber = await reserveDocumentNumber({
      supabase,
      organisationId,
      documentType: "JOURNAL_ENTRY",
      providedNumber: body.journal_number,
    });

    const journalDate = String(body.journal_date || "").trim();

    const journalType = String(body.journal_type || "MANUAL")
      .trim()
      .toUpperCase();

    const description = body.description ? String(body.description).trim() : null;

    const referenceNumber = body.reference_number
      ? String(body.reference_number).trim()
      : null;

    const currencyCode = body.currency_code
      ? String(body.currency_code).trim().toUpperCase()
      : null;

    const exchangeRate = toNumber(body.exchange_rate, 1);

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

    if (!organisationId) {
      return Response.json(
        { error: "Organisation is required." },
        { status: 400 }
      );
    }

    if (!journalNumber) {
      return Response.json(
        { error: "Journal number is required." },
        { status: 400 }
      );
    }

    if (!journalDate) {
      return Response.json(
        { error: "Journal date is required." },
        { status: 400 }
      );
    }

    if (!allowedJournalTypes.includes(journalType)) {
      return Response.json({ error: "Invalid journal type." }, { status: 400 });
    }

    if (lines.length < 2) {
      return Response.json(
        { error: "A journal entry must have at least two lines." },
        { status: 400 }
      );
    }

    const { data: organisation } = await supabase
      .from("organisations")
      .select("id, base_currency_code")
      .eq("id", organisationId)
      .single();

    if (!organisation) {
      return Response.json(
        { error: "Organisation not found." },
        { status: 404 }
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
        department_id: line.department_id
          ? String(line.department_id).trim()
          : null,
        location_id: line.location_id ? String(line.location_id).trim() : null,
        project_id: line.project_id ? String(line.project_id).trim() : null,
        cost_centre_id: line.cost_centre_id
          ? String(line.cost_centre_id).trim()
          : null,
        class_id: line.class_id ? String(line.class_id).trim() : null,
        fund_grant_id: line.fund_grant_id
          ? String(line.fund_grant_id).trim()
          : null,
        service_line_id: line.service_line_id
          ? String(line.service_line_id).trim()
          : null,
      };
    });

    for (const line of cleanLines) {
      if (!line.account_id) {
        return Response.json(
          { error: "Each journal line must have an account." },
          { status: 400 }
        );
      }

      if (line.debit_amount < 0 || line.credit_amount < 0) {
        return Response.json(
          { error: "Debit and credit amounts cannot be negative." },
          { status: 400 }
        );
      }

      if (line.debit_amount > 0 && line.credit_amount > 0) {
        return Response.json(
          {
            error: "A journal line cannot have both debit and credit amounts.",
          },
          { status: 400 }
        );
      }

      if (line.debit_amount === 0 && line.credit_amount === 0) {
        return Response.json(
          {
            error:
              "Each journal line must have either a debit or credit amount.",
          },
          { status: 400 }
        );
      }
    }

    const accountIds = cleanLines.map((line) => line.account_id);

    const { data: accounts } = await supabase
      .from("chart_of_accounts")
      .select("id")
      .eq("organisation_id", organisationId)
      .eq("is_active", true)
      .in("id", accountIds);

    const validAccountIds = new Set((accounts || []).map((account) => account.id));

    const invalidAccount = cleanLines.find(
      (line) => !validAccountIds.has(line.account_id)
    );

    if (invalidAccount) {
      return Response.json(
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
      return Response.json(
        { error: "Journal debits and credits must be greater than zero." },
        { status: 400 }
      );
    }

    if (totalDebits !== totalCredits) {
      return Response.json(
        {
          error: `Journal is not balanced. Debits: ${totalDebits.toFixed(
            2
          )}, Credits: ${totalCredits.toFixed(2)}.`,
        },
        { status: 400 }
      );
    }

    const { data: journalEntry, error: journalEntryError } = await supabase
      .from("journal_entries")
      .insert({
        organisation_id: organisationId,
        accounting_period_id: accountingPeriodId,
        engagement_id: engagementId,
        journal_number: journalNumber,
        journal_date: journalDate,
        journal_type: journalType,
        description,
        reference_number: referenceNumber,
        currency_code: currencyCode || organisation.base_currency_code,
        exchange_rate: exchangeRate,
        exchange_rate_date: exchangeRateDate,
        exchange_rate_source: exchangeRateSource,
        exchange_rate_is_locked: exchangeRateIsLocked,
        total_debits: totalDebits,
        total_credits: totalCredits,
        status: "DRAFT",
        created_by: user.id,
        updated_by: user.id,
      })
      .select("id")
      .single();

    if (journalEntryError || !journalEntry) {
      return Response.json(
        {
          error: journalEntryError?.message || "Unable to create journal entry.",
        },
        { status: 500 }
      );
    }

    const journalLinesPayload = cleanLines.map((line) => ({
      journal_entry_id: journalEntry.id,
      organisation_id: organisationId,
      line_number: line.line_number,
      account_id: line.account_id,
      description: line.description,
      debit_amount: line.debit_amount,
      credit_amount: line.credit_amount,
      customer_id: line.customer_id,
      supplier_id: line.supplier_id,
      investor_id: line.investor_id,
      department_id: line.department_id,
      location_id: line.location_id,
      project_id: line.project_id,
      cost_centre_id: line.cost_centre_id,
      class_id: line.class_id,
      fund_grant_id: line.fund_grant_id,
      service_line_id: line.service_line_id,
    }));

    const { error: journalLinesError } = await supabase
      .from("journal_entry_lines")
      .insert(journalLinesPayload);

    if (journalLinesError) {
      await supabase.from("journal_entries").delete().eq("id", journalEntry.id);

      return Response.json(
        {
          error:
            journalLinesError.message ||
            "Unable to create journal entry lines.",
        },
        { status: 500 }
      );
    }

    try {
      await supabase.from("audit_logs").insert({
        user_id: user.id,
        organisation_id: organisationId,
        engagement_id: engagementId,
        action: "JOURNAL_ENTRY_CREATED_DRAFT",
        details: {
          journal_entry_id: journalEntry.id,
          journal_number: journalNumber,
          journal_date: journalDate,
          journal_type: journalType,
          total_debits: totalDebits,
          total_credits: totalCredits,
          currency_code: currencyCode || organisation.base_currency_code,
          exchange_rate: exchangeRate,
          exchange_rate_date: exchangeRateDate,
          exchange_rate_source: exchangeRateSource,
          exchange_rate_is_locked: exchangeRateIsLocked,
          line_count: cleanLines.length,
          status: "DRAFT",
          tracking_dimensions_enabled: true,
        },
      });
    } catch {
      // Audit logging should not block journal creation.
    }

    return Response.json({
      success: true,
      journalEntryId: journalEntry.id,
      status: "DRAFT",
      journalNumber,
      totalDebits,
      totalCredits,
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create journal entry.",
      },
      { status: 500 }
    );
  }
}