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

const allowedCustomerTypes = [
  "BUSINESS",
  "INDIVIDUAL",
  "GOVERNMENT",
  "NONPROFIT",
  "RELATED_PARTY",
];

function cleanText(value: unknown) {
  const text = value === null || value === undefined
    ? ""
    : String(value).trim();

  return text || null;
}

function getMissingColumnName(errorMessage: string) {
  const match = errorMessage.match(/Could not find the '([^']+)' column/i);
  return match?.[1] || null;
}

async function updateWithSchemaRetry({
  supabase,
  customerId,
  organisationId,
  payload,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  customerId: string;
  organisationId: string;
  payload: Record<string, unknown>;
}) {
  const safePayload = { ...payload };
  const removedColumns: string[] = [];

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const { data, error } = await supabase
      .from("customers")
      .update(safePayload)
      .eq("id", customerId)
      .eq("organisation_id", organisationId)
      .select("id")
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

    throw new Error(error?.message || "Unable to update customer.");
  }

  throw new Error("Unable to update customer after schema retry.");
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const { customerId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json(
        { error: "Not authenticated." },
        { status: 401 }
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (
      profileError ||
      !profile ||
      !internalRoles.includes(profile.role)
    ) {
      return Response.json(
        { error: "Access denied." },
        { status: 403 }
      );
    }

    const body = await request.json();

    const organisationId = cleanText(body.organisation_id);
    const customerName = cleanText(body.customer_name);
    const customerType = String(
      body.customer_type || "BUSINESS"
    ).trim();

    const email = cleanText(body.email);
    const phone = cleanText(body.phone);
    const billingAddress = cleanText(body.billing_address);
    const taxIdentificationNumber = cleanText(
      body.tax_identification_number
    );
    const registrationNumber = cleanText(body.registration_number);
    const currencyCode = cleanText(body.currency_code)?.toUpperCase() || null;
    const paymentTerms = cleanText(body.payment_terms);
    const receivableAccountId = cleanText(body.receivable_account_id);
    const notes = cleanText(body.notes);
    const isActive = body.is_active !== false;

    const creditLimit =
      body.credit_limit !== null &&
      body.credit_limit !== undefined &&
      String(body.credit_limit).trim() !== ""
        ? Number(body.credit_limit)
        : null;

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

    if (
      creditLimit !== null &&
      (!Number.isFinite(creditLimit) || creditLimit < 0)
    ) {
      return Response.json(
        { error: "Credit limit must be zero or greater." },
        { status: 400 }
      );
    }

    const { data: organisation } = await supabase
      .from("organisations")
      .select("id")
      .eq("id", organisationId)
      .single();

    if (!organisation) {
      return Response.json(
        { error: "Organisation not found." },
        { status: 404 }
      );
    }

    const { data: existingCustomer } = await supabase
      .from("customers")
      .select("id, customer_name, is_active")
      .eq("id", customerId)
      .eq("organisation_id", organisationId)
      .single();

    if (!existingCustomer) {
      return Response.json(
        { error: "Customer not found." },
        { status: 404 }
      );
    }

    if (receivableAccountId) {
      const { data: receivableAccount } = await supabase
        .from("chart_of_accounts")
        .select("id")
        .eq("id", receivableAccountId)
        .eq("organisation_id", organisationId)
        .eq("account_type", "ASSET")
        .single();

      if (!receivableAccount) {
        return Response.json(
          {
            error:
              "The selected receivable account is not valid for this organisation.",
          },
          { status: 400 }
        );
      }
    }

    const updateResult = await updateWithSchemaRetry({
      supabase,
      customerId,
      organisationId,
      payload: {
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
        is_active: isActive,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      },
    });

    try {
      await supabase.from("audit_logs").insert({
        user_id: user.id,
        organisation_id: organisationId,
        action: "CUSTOMER_UPDATED",
        details: {
          customer_id: customerId,
          previous_customer_name: existingCustomer.customer_name,
          customer_name: customerName,
          previous_is_active: existingCustomer.is_active,
          is_active: isActive,
          removed_customer_columns: updateResult.removedColumns,
        },
      });
    } catch {
      // Audit logging should not block the customer update.
    }

    return Response.json({
      success: true,
      customerId,
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update customer.",
      },
      { status: 500 }
    );
  }
}