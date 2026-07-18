import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";

const internalRoles = [
  "SUPER_ADMIN",
  "ADMIN",
  "STAFF",
  "IT_ADMIN",
  "ACCOUNTANT_ADMIN",
  "ACCOUNTANT_USER",
  "CUSTOMER_SUPPORT",
  "COMPLIANCE_ADMIN",
  "OPERATIONS_ADMIN",
];

const allowedInvestorTypes = [
  "EQUITY_PROVIDER",
  "DEBT_PROVIDER",
  "BANK_LENDER",
  "PRIVATE_LENDER",
  "SHAREHOLDER",
  "DIRECTOR",
  "VENTURE_INVESTOR",
  "GRANT_FUNDER",
  "DONOR",
  "RELATED_PARTY",
  "OTHER",
];

const allowedFundingTypes = ["EQUITY", "DEBT", "GRANT", "DONATION", "MIXED", "OTHER"];

function getMissingColumnName(errorMessage: string) {
  const match = errorMessage.match(/Could not find the '([^']+)' column/i);
  return match?.[1] || null;
}

async function insertWithSchemaRetry({
  supabase,
  table,
  payload,
  selectColumns = "id",
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  table: string;
  payload: Record<string, unknown>;
  selectColumns?: string;
}) {
  let safePayload = { ...payload };
  const removedColumns: string[] = [];

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const { data, error } = await supabase
      .from(table)
      .insert(safePayload)
      .select(selectColumns)
      .single();

    if (!error && data) {
      return { data, removedColumns };
    }

    const missingColumn = getMissingColumnName(error?.message || "");

    if (missingColumn && missingColumn in safePayload) {
      delete safePayload[missingColumn];
      removedColumns.push(missingColumn);
      continue;
    }

    throw new Error(error?.message || `Unable to insert into ${table}.`);
  }

  throw new Error(`Unable to insert into ${table} after schema retry.`);
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Not authenticated." }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile || !internalRoles.includes(profile.role)) {
      return Response.json({ error: "Access denied." }, { status: 403 });
    }

    const body = await request.json();

    const organisationId = String(body.organisation_id || "").trim();
    const investorName = String(body.investor_name || "").trim();
    const investorType = String(body.investor_type || "EQUITY_PROVIDER").trim();
    const fundingType = String(body.funding_type || "EQUITY").trim();

    const contactName = body.contact_name ? String(body.contact_name).trim() : null;
    const email = body.email ? String(body.email).trim() : null;
    const phone = body.phone ? String(body.phone).trim() : null;
    const address = body.address ? String(body.address).trim() : null;

    const taxIdentificationNumber = body.tax_identification_number
      ? String(body.tax_identification_number).trim()
      : null;

    const registrationNumber = body.registration_number
      ? String(body.registration_number).trim()
      : null;

    const currencyCode = body.currency_code
      ? String(body.currency_code).trim().toUpperCase()
      : null;

    const committedAmount =
      body.committed_amount !== null &&
      body.committed_amount !== undefined &&
      String(body.committed_amount).trim() !== ""
        ? Number(body.committed_amount)
        : null;

    const contributedAmount =
      body.contributed_amount !== null &&
      body.contributed_amount !== undefined &&
      String(body.contributed_amount).trim() !== ""
        ? Number(body.contributed_amount)
        : null;

    const outstandingAmount =
      body.outstanding_amount !== null &&
      body.outstanding_amount !== undefined &&
      String(body.outstanding_amount).trim() !== ""
        ? Number(body.outstanding_amount)
        : null;

    const ownershipPercentage =
      body.ownership_percentage !== null &&
      body.ownership_percentage !== undefined &&
      String(body.ownership_percentage).trim() !== ""
        ? Number(body.ownership_percentage)
        : null;

    const interestRate =
      body.interest_rate !== null &&
      body.interest_rate !== undefined &&
      String(body.interest_rate).trim() !== ""
        ? Number(body.interest_rate)
        : null;

    const repaymentTerms = body.repayment_terms
      ? String(body.repayment_terms).trim()
      : null;

    const maturityDate = body.maturity_date ? String(body.maturity_date).trim() : null;

    const equityAccountId = body.equity_account_id
      ? String(body.equity_account_id).trim()
      : null;

    const liabilityAccountId = body.liability_account_id
      ? String(body.liability_account_id).trim()
      : null;

    const interestExpenseAccountId = body.interest_expense_account_id
      ? String(body.interest_expense_account_id).trim()
      : null;

    const notes = body.notes ? String(body.notes).trim() : null;
    const isRelatedParty = body.is_related_party === true;

    if (!organisationId) {
      return Response.json(
        { error: "Organisation is required." },
        { status: 400 }
      );
    }

    if (!investorName) {
      return Response.json(
        { error: "Investor or funding provider name is required." },
        { status: 400 }
      );
    }

    if (!allowedInvestorTypes.includes(investorType)) {
      return Response.json(
        { error: "Invalid investor type." },
        { status: 400 }
      );
    }

    if (!allowedFundingTypes.includes(fundingType)) {
      return Response.json(
        { error: "Invalid funding type." },
        { status: 400 }
      );
    }

    const { data: organisation, error: organisationError } = await supabase
      .from("organisations")
      .select("id, legal_name, trading_name")
      .eq("id", organisationId)
      .single();

    if (organisationError || !organisation) {
      return Response.json(
        { error: "Organisation not found." },
        { status: 404 }
      );
    }

    const investorResult = await insertWithSchemaRetry({
      supabase,
      table: "investors",
      payload: {
        organisation_id: organisationId,
        investor_name: investorName,
        investor_type: investorType,
        contact_name: contactName,
        email,
        phone,
        address,
        tax_identification_number: taxIdentificationNumber,
        registration_number: registrationNumber,
        funding_type: fundingType,
        funding_status: "ACTIVE",
        currency_code: currencyCode,
        committed_amount: committedAmount,
        contributed_amount: contributedAmount,
        outstanding_amount: outstandingAmount,
        ownership_percentage: ownershipPercentage,
        interest_rate: interestRate,
        repayment_terms: repaymentTerms,
        maturity_date: maturityDate,
        equity_account_id: equityAccountId,
        liability_account_id: liabilityAccountId,
        interest_expense_account_id: interestExpenseAccountId,
        notes,
        is_related_party: isRelatedParty,
        is_active: true,
        created_by: user.id,
        updated_by: user.id,
      },
      selectColumns: "id",
    });

    const investor = investorResult.data as unknown as { id: string };

    try {
      await supabase.from("audit_logs").insert({
        user_id: user.id,
        organisation_id: organisationId,
        action: "INVESTOR_CREATED",
        details: {
          investor_id: investor.id,
          investor_name: investorName,
          investor_type: investorType,
          funding_type: fundingType,
          removed_investor_columns: investorResult.removedColumns,
        },
      });
    } catch {
      // Audit logging should not block investor creation.
    }

    return Response.json({
      success: true,
      investorId: investor.id,
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to create investor.",
      },
      { status: 500 }
    );
  }
}