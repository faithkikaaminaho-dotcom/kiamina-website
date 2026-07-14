import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

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

function getOrganisationTypeFromIndustry(industry: string) {
  const value = industry.toLowerCase();

  if (value.includes("nonprofit") || value.includes("non-profit")) {
    return "Nonprofit";
  }

  return "Business";
}

function getMissingColumnName(errorMessage: string) {
  const match = errorMessage.match(/Could not find the '([^']+)' column/i);

  if (!match?.[1]) {
    return null;
  }

  return match[1];
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
      return {
        data,
        removedColumns,
      };
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

async function updateWithSchemaRetry({
  supabase,
  table,
  matchColumn,
  matchValue,
  payload,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  table: string;
  matchColumn: string;
  matchValue: string;
  payload: Record<string, unknown>;
}) {
  let safePayload = { ...payload };

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const { error } = await supabase
      .from(table)
      .update(safePayload)
      .eq(matchColumn, matchValue);

    if (!error) {
      return;
    }

    const missingColumn = getMissingColumnName(error.message || "");

    if (missingColumn && missingColumn in safePayload) {
      delete safePayload[missingColumn];
      continue;
    }

    throw new Error(error.message || `Unable to update ${table}.`);
  }
}

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

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

    const { data: inquiry, error: inquiryError } = await supabase
      .from("service_inquiries")
      .select("*")
      .eq("id", id)
      .single();

    if (inquiryError || !inquiry) {
      return Response.json({ error: "Inquiry not found." }, { status: 404 });
    }

    if (inquiry.status === "CONVERTED") {
      return Response.json(
        { error: "This inquiry has already been converted." },
        { status: 400 }
      );
    }

    const organisationType = getOrganisationTypeFromIndustry(
      inquiry.industry || ""
    );

    const { data: existingClient } = await supabase
      .from("clients")
      .select("id, organisation_id")
      .eq("email", inquiry.contact_email)
      .maybeSingle();

    if (existingClient) {
      await supabase
        .from("service_inquiries")
        .update({
          status: "CONVERTED",
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", id);

      return Response.json({
        success: true,
        clientId: existingClient.id,
        organisationId: existingClient.organisation_id || null,
        alreadyExists: true,
      });
    }

    const clientPayload = {
      name: inquiry.organisation_name,
      email: inquiry.contact_email,
      phone: inquiry.contact_phone,

      country: inquiry.country,
      jurisdiction_code: inquiry.jurisdiction_code,
      currency: inquiry.currency,
      reporting_framework: inquiry.reporting_framework,
      industry: inquiry.industry,

      status: "ACTIVE",
      created_by: user.id,

      // These may not exist in your current clients table.
      // The schema-safe insert will remove them automatically if missing.
      contact_name: inquiry.contact_name,
      primary_contact_name: inquiry.contact_name,
      primary_contact_email: inquiry.contact_email,
      primary_contact_phone: inquiry.contact_phone,
      client_type: organisationType,
      organisation_type: organisationType,
    };

    const clientResult = await insertWithSchemaRetry({
      supabase,
      table: "clients",
      payload: clientPayload,
      selectColumns: "id",
    });

    const client = clientResult.data as unknown as { id: string };

    const organisationPayload = {
      legal_name: inquiry.organisation_name,
      trading_name: inquiry.organisation_name,
      name: inquiry.organisation_name,

      organisation_type: organisationType,
      type: organisationType,
      status: "ACTIVE",

      jurisdiction_code: inquiry.jurisdiction_code,
      reporting_framework: inquiry.reporting_framework,
      base_currency: inquiry.currency,
      currency: inquiry.currency,
      industry: inquiry.industry,

      primary_contact_name: inquiry.contact_name,
      primary_contact_email: inquiry.contact_email,
      primary_contact_phone: inquiry.contact_phone,

      contact_name: inquiry.contact_name,
      contact_email: inquiry.contact_email,
      contact_phone: inquiry.contact_phone,

      legacy_client_id: client.id,
      client_id: client.id,
      created_by: user.id,
    };

    const organisationResult = await insertWithSchemaRetry({
      supabase,
      table: "organisations",
      payload: organisationPayload,
      selectColumns: "id",
    });

    const organisation = organisationResult.data as unknown as { id: string };

    try {
      await updateWithSchemaRetry({
        supabase,
        table: "clients",
        matchColumn: "id",
        matchValue: client.id,
        payload: {
          organisation_id: organisation.id,
        },
      });
    } catch {
      // Do not block conversion if the clients table does not support organisation_id.
    }

    await supabase
      .from("service_inquiries")
      .update({
        status: "CONVERTED",
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id);

    try {
      await supabase.from("audit_logs").insert({
        user_id: user.id,
        client_id: client.id,
        organisation_id: organisation.id,
        action: "INQUIRY_CONVERTED_TO_CLIENT",
        details: {
          inquiry_id: inquiry.id,
          organisation_name: inquiry.organisation_name,
          contact_email: inquiry.contact_email,
          industry: inquiry.industry,
          jurisdiction_code: inquiry.jurisdiction_code,
          services_needed: inquiry.services_needed,
          removed_client_columns: clientResult.removedColumns,
          removed_organisation_columns: organisationResult.removedColumns,
        },
      });
    } catch {
      // Audit logging should not block conversion.
    }

    return Response.json({
      success: true,
      clientId: client.id,
      organisationId: organisation.id,
      alreadyExists: false,
      removedClientColumns: clientResult.removedColumns,
      removedOrganisationColumns: organisationResult.removedColumns,
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to convert inquiry.",
      },
      { status: 500 }
    );
  }
}