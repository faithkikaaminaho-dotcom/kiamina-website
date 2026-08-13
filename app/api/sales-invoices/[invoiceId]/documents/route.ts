import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";

const internalRoles = [
  "SUPER_ADMIN",
  "ADMIN",
  "STAFF",
  "IT_ADMIN",
  "ACCOUNTANT_ADMIN",
  "ACCOUNTANT_USER",
  "COMPLIANCE_ADMIN",
  "OPERATIONS_ADMIN",
];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  try {
    const { invoiceId } = await params;
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
    const documentId = String(body.document_id || "").trim();

    if (!organisationId) {
      return Response.json(
        { error: "Organisation is required." },
        { status: 400 }
      );
    }

    if (!documentId) {
      return Response.json(
        { error: "Document is required." },
        { status: 400 }
      );
    }

    const { data: invoice, error: invoiceError } = await supabase
      .from("sales_invoices")
      .select("id, organisation_id, status, posted_at")
      .eq("id", invoiceId)
      .eq("organisation_id", organisationId)
      .single();

    if (invoiceError || !invoice) {
      return Response.json(
        { error: "Sales invoice not found." },
        { status: 404 }
      );
    }

    const { data: document, error: documentError } = await supabase
      .from("documents")
      .select("id, organisation_id, file_name")
      .eq("id", documentId)
      .eq("organisation_id", organisationId)
      .single();

    if (documentError || !document) {
      return Response.json(
        { error: "Document not found for this organisation." },
        { status: 404 }
      );
    }

    const { error: updateError } = await supabase
      .from("documents")
      .update({
        source_module: "SALES_INVOICE",
        source_record_id: invoiceId,
        source_record_type: "SALES_INVOICE",
        linked_at: new Date().toISOString(),
        linked_by: user.id,
      })
      .eq("id", documentId)
      .eq("organisation_id", organisationId);

    if (updateError) {
      return Response.json(
        { error: updateError.message || "Unable to attach document." },
        { status: 400 }
      );
    }

    try {
      await supabase.from("audit_logs").insert({
        user_id: user.id,
        organisation_id: organisationId,
        action: "SALES_INVOICE_DOCUMENT_ATTACHED",
        details: {
          sales_invoice_id: invoiceId,
          document_id: documentId,
          file_name: document.file_name,
          source_module: "SALES_INVOICE",
        },
      });
    } catch {
      // Audit logging should not block document attachment.
    }

    return Response.json({
      success: true,
      salesInvoiceId: invoiceId,
      documentId,
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to attach document.",
      },
      { status: 500 }
    );
  }
}