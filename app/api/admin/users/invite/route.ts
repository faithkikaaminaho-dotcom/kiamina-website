export const runtime = "nodejs";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

const allowedRoles = ["SUPER_ADMIN", "ADMIN", "STAFF", "CLIENT"];

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Not authenticated." }, { status: 401 });
    }

    const { data: requesterProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (requesterProfile?.role !== "SUPER_ADMIN") {
      return Response.json({ error: "Access denied." }, { status: 403 });
    }

    const body = await request.json();

    const {
      email,
      full_name,
      role,
      job_title,
      team,
      office,
      phone,
    }: {
      email?: string;
      full_name?: string;
      role?: string;
      job_title?: string;
      team?: string;
      office?: string;
      phone?: string;
    } = body;

    if (!email || !full_name || !role) {
      return Response.json(
        { error: "Email, full name, and role are required." },
        { status: 400 }
      );
    }

    if (!allowedRoles.includes(role)) {
      return Response.json({ error: "Invalid role." }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();

    const { data: inviteData, error: inviteError } =
      await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        data: {
          full_name,
          role,
        },
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/signin`,
      });

    if (inviteError) {
      return Response.json({ error: inviteError.message }, { status: 400 });
    }

    const invitedUserId = inviteData.user?.id;

    if (!invitedUserId) {
      return Response.json(
        { error: "Invite was sent but user ID was not returned." },
        { status: 500 }
      );
    }

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: invitedUserId,
        email,
        full_name,
        role,
        job_title: job_title || null,
        team: team || null,
        office: office || null,
        phone: phone || null,
        status: "active",
      });

    if (profileError) {
      return Response.json(
        { error: "Invite sent, but profile creation failed: " + profileError.message },
        { status: 500 }
      );
    }

    await supabaseAdmin.from("audit_logs").insert({
      user_id: user.id,
      action: "USER_INVITED",
      details: {
        invited_user_id: invitedUserId,
        email,
        full_name,
        role,
        job_title,
        team,
        office,
      },
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to invite user.",
      },
      { status: 500 }
    );
  }
}