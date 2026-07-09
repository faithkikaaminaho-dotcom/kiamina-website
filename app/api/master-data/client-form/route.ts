export const runtime = "nodejs";

import { createClient } from "@/utils/supabase/server";

export async function GET() {
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

    if (!profile || profile.role !== "SUPER_ADMIN") {
      return Response.json({ error: "Access denied." }, { status: 403 });
    }

    const [jurisdictionsResult, industriesResult] = await Promise.all([
      supabase
        .from("jurisdictions")
        .select("code, name, reporting_framework_code, currency_code")
        .eq("is_active", true)
        .order("name"),

      supabase
        .from("industries")
        .select("id, name")
        .eq("is_active", true)
        .order("name"),
    ]);

    if (jurisdictionsResult.error) {
      return Response.json(
        { error: jurisdictionsResult.error.message },
        { status: 500 }
      );
    }

    if (industriesResult.error) {
      return Response.json(
        { error: industriesResult.error.message },
        { status: 500 }
      );
    }

    return Response.json({
      jurisdictions: jurisdictionsResult.data || [],
      industries: industriesResult.data || [],
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load master data.",
      },
      { status: 500 }
    );
  }
}