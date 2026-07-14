import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const allowedStatuses = ["NEW", "IN_REVIEW", "CONVERTED", "CLOSED"];

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

export async function PATCH(request: Request, context: RouteContext) {
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

    if (
      profileError ||
      !profile ||
      !internalRoles.includes(profile.role)
    ) {
      return Response.json({ error: "Access denied." }, { status: 403 });
    }

    const body = await request.json();
    const status = String(body.status || "").trim().toUpperCase();

    if (!allowedStatuses.includes(status)) {
      return Response.json(
        { error: "Invalid inquiry status." },
        { status: 400 }
      );
    }

    const updatePayload: {
      status: string;
      reviewed_by?: string;
      reviewed_at?: string;
    } = {
      status,
    };

    if (status === "IN_REVIEW" || status === "CONVERTED" || status === "CLOSED") {
      updatePayload.reviewed_by = user.id;
      updatePayload.reviewed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from("service_inquiries")
      .update(updatePayload)
      .eq("id", id)
      .select("id, status")
      .single();

    if (error || !data) {
      return Response.json(
        { error: error?.message || "Unable to update inquiry status." },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      inquiry: data,
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update inquiry status.",
      },
      { status: 500 }
    );
  }
}