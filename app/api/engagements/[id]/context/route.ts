export const runtime = "nodejs";

import { createClient } from "@/utils/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    if (!profile || !["SUPER_ADMIN", "ADMIN", "STAFF", "CLIENT"].includes(profile.role)) {
      return Response.json({ error: "Access denied." }, { status: 403 });
    }

    const { data: engagement, error } = await supabase
      .from("engagements")
      .select(
        `
        id,
        name,
        organisation_id,
        organisations (
          id,
          legal_name,
          legacy_client_id
        )
      `
      )
      .eq("id", id)
      .single();

    if (error || !engagement) {
      return Response.json({ error: "Engagement not found." }, { status: 404 });
    }

    const organisation = Array.isArray(engagement.organisations)
      ? engagement.organisations[0]
      : engagement.organisations;

    return Response.json({
      engagement: {
        id: engagement.id,
        name: engagement.name,
        organisation_id: engagement.organisation_id,
        organisation_name: organisation?.legal_name || "—",
        legacy_client_id: organisation?.legacy_client_id || null,
      },
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load engagement context.",
      },
      { status: 500 }
    );
  }
}