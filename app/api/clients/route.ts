import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
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

  if (profile?.role !== "SUPER_ADMIN") {
    return Response.json({ error: "Access denied." }, { status: 403 });
  }

  const body = await request.json();

  const { name, country, city, industry, business_type } = body;

  const { error } = await supabase.from("clients").insert({
    name,
    country,
    city,
    industry,
    business_type,
    status: "ONBOARDING",
    created_by: user.id,
  });

  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  return Response.json({ success: true });
}