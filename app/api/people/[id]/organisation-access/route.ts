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

function getMissingColumnName(errorMessage: string) {
  const match = errorMessage.match(/Could not find the '([^']+)' column/i);

  if (!match?.[1]) {
    return null;
  }

  return match[1];
}

async function upsertWithSchemaRetry({
  supabase,
  table,
  payload,
  onConflict,
  selectColumns = "id",
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  table: string;
  payload: Record<string, unknown>;
  onConflict: string;
  selectColumns?: string;
}) {
  let safePayload = { ...payload };
  const removedColumns: string[] = [];

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const { data, error } = await supabase
      .from(table)
      .upsert(safePayload, {
        onConflict,
      })
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

    throw new Error(error?.message || `Unable to save ${table}.`);
  }

  throw new Error(`Unable to save ${table} after schema retry.`);
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id: userId } = await context.params;

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Not authenticated." }, { status: 401 });
    }

    const { data: currentProfile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (
      profileError ||
      !currentProfile ||
      !internalRoles.includes(currentProfile.role)
    ) {
      return Response.json({ error: "Access denied." }, { status: 403 });
    }

    if (currentProfile.role !== "SUPER_ADMIN") {
      return Response.json(
        { error: "Only Super Admin can assign organisation access." },
        { status: 403 }
      );
    }

    const body = await request.json();

    const organisationId = String(body.organisation_id || "").trim();
    const accessRole = String(body.access_role || "CLIENT_USER").trim();

    if (!organisationId) {
      return Response.json(
        { error: "Organisation is required." },
        { status: 400 }
      );
    }

    const { data: targetProfile, error: targetProfileError } = await supabase
      .from("profiles")
      .select("id, role, email, full_name")
      .eq("id", userId)
      .single();

    if (targetProfileError || !targetProfile) {
      return Response.json({ error: "Person not found." }, { status: 404 });
    }

    if (targetProfile.role !== "CLIENT") {
      return Response.json(
        { error: "Organisation access can only be assigned to client users." },
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

    const finalAccessRole = accessRole || "CLIENT_USER";

    const accessPayload = {
      organisation_id: organisation.id,
      user_id: targetProfile.id,

      // Existing enum column. Must be a valid user_role enum value.
      role: "CLIENT",

      // Organisation-level permission.
      access_role: finalAccessRole,

      status: "ACTIVE",
      created_by: user.id,
    };

    const accessResult = await upsertWithSchemaRetry({
      supabase,
      table: "organisation_users",
      payload: accessPayload,
      onConflict: "organisation_id,user_id",
      selectColumns: "id",
    });

    const accessRecord = accessResult.data as unknown as { id: string };

    try {
      await supabase.from("audit_logs").insert({
        user_id: user.id,
        organisation_id: organisation.id,
        action: "ORGANISATION_ACCESS_ASSIGNED",
        details: {
          target_user_id: targetProfile.id,
          target_user_email: targetProfile.email,
          organisation_id: organisation.id,
          organisation_name:
            organisation.trading_name || organisation.legal_name,
          role: "CLIENT",
          access_role: finalAccessRole,
          removed_access_columns: accessResult.removedColumns,
        },
      });
    } catch {
      // Audit logging should not block assignment.
    }

    return Response.json({
      success: true,
      accessId: accessRecord.id,
      removedAccessColumns: accessResult.removedColumns,
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to assign organisation access.",
      },
      { status: 500 }
    );
  }
}