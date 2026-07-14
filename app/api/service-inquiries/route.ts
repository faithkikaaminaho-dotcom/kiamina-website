import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const requiredFields = [
      "organisation_name",
      "contact_name",
      "contact_email",
      "jurisdiction_code",
      "industry",
    ];

    for (const field of requiredFields) {
      if (!body[field] || String(body[field]).trim() === "") {
        return Response.json(
          { error: `${field.replaceAll("_", " ")} is required.` },
          { status: 400 }
        );
      }
    }

    if (!Array.isArray(body.services_needed) || !body.services_needed.length) {
      return Response.json(
        { error: "Please select at least one service." },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("service_inquiries").insert({
      organisation_name: body.organisation_name,
      contact_name: body.contact_name,
      contact_email: body.contact_email,
      contact_phone: body.contact_phone || null,

      jurisdiction_code: body.jurisdiction_code,
      country: body.country || null,
      currency: body.currency || null,
      reporting_framework: body.reporting_framework || null,

      industry: body.industry,
      services_needed: body.services_needed,

      monthly_transaction_volume: body.monthly_transaction_volume || null,
      payroll_size: body.payroll_size || null,
      reporting_frequency: body.reporting_frequency || null,
      has_backlog: body.has_backlog || null,
      backlog_details: body.backlog_details || null,

      compliance_concerns: body.compliance_concerns || null,
      current_accounting_system: body.current_accounting_system || null,
      documentation_status: body.documentation_status || null,

      message: body.message || null,
      source: "GET_STARTED_PAGE",
      status: "NEW",
      priority: "NORMAL",
    });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({
      success: true,
      message: "Inquiry submitted successfully.",
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to submit inquiry.",
      },
      { status: 500 }
    );
  }
}