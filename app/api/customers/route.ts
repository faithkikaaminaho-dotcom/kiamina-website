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

const allowedCustomerTypes = ["BUSINESS", "INDIVIDUAL", "GOVERNMENT", "NONPROFIT", "RELATED_PARTY"];

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
    const customerName = String(body.customer_name || "").trim();
    const customerType = String(body.customer_type || "BUSINESS").trim();

    const email = body.email ? String(body.email).trim() : null;
    const phone = body.phone ? String(body.phone).trim() : null;
    const billingAddress = body.billing_address
      ? String(body.billing_address).trim()
      : null;

    const taxIdentificationNumber = body.tax_identification_number
      ? String(body.tax_identification_number).trim()
      : null;

    const registrationNumber = body.registration_number
      ? String(body.registration_number).trim()
      : null;

    const currencyCode = body.currency_code
      ? String(body.currency_code).trim().toUpperCase()
      : null;

    const paymentTerms = body.payment_terms
      ? String(body.payment_terms).trim()
      : null;

    const creditLimit =
      body.credit_limit !== null &&
      body.credit_limit !== undefined &&
      String(body.credit_limit).trim() !== ""
        ? Number(body.credit_limit)
        : null;

    const receivableAccountId = body.receivable_account_id
      ? String(body.receivable_account_id).trim()
      : null;

    const notes = body.notes ? String(body.notes).trim() : null;

    if (!organisationId) {
      return Response.json(
        { error: "Organisation is required." },
        { status: 400 }
      );
    }

    if (!customerName) {
      return Response.json(
        { error: "Customer name is required." },
        { status: 400 }
      );
    }

    if (!allowedCustomerTypes.includes(customerType)) {
      return Response.json(
        { error: "Invalid customer type." },
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

    const customerResult = await insertWithSchemaRetry({
      supabase,
      table: "customers",
      payload: {
        organisation_id: organisationId,
        customer_name: customerName,
        customer_type: customerType,
        email,
        phone,
        billing_address: billingAddress,
        tax_identification_number: taxIdentificationNumber,
        registration_number: registrationNumber,
        currency_code: currencyCode,
        payment_terms: paymentTerms,
        credit_limit: creditLimit,
        receivable_account_id: receivableAccountId,
        notes,
        is_active: true,
        created_by: user.id,
        updated_by: user.id,
      },
      selectColumns: "id",
    });

    const customer = customerResult.data as unknown as { id: string };

    try {
      await supabase.from("audit_logs").insert({
        user_id: user.id,
        organisation_id: organisationId,
        action: "CUSTOMER_CREATED",
        details: {
          customer_id: customer.id,
          customer_name: customerName,
          customer_type: customerType,
          removed_customer_columns: customerResult.removedColumns,
        },
      });
    } catch {
      // Audit logging should not block customer creation.
    }

    return Response.json({
      success: true,
      customerId: customer.id,
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to create customer.",
      },
      { status: 500 }
    );
  }
}