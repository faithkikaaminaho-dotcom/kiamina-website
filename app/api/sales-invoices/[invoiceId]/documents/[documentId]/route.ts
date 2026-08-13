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

export async function DELETE(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ invoiceId: string; documentId: string }>;
  }
) {
  try {
    const { invoiceId, documentId } = await params;
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

    const url = new URL(request.url);
    const organisationId = String(
      url.searchParams.get("organisation_id") || ""
    ).trim();

    if (!organisationId) {
      return Response.json(
        { error: "Organisation is required." },
        { status: 400 }
      );
    }

    const { data: invoice, error: invoiceError } = await supabase
      .from("sales_invoices")
      .select("id, organisation_id")
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
      .select("id, file_name")
      .eq("id", documentId)
      .eq("organisation_id", organisationId)
      .eq("source_module", "SALES_INVOICE")
      .eq("source_record_id", invoiceId)
      .single();

    if (documentError || !document) {
      return Response.json(
        { error: "Linked document not found." },
        { status: 404 }
      );
    }

    const { error: updateError } = await supabase
      .from("documents")
      .update({
        source_module: null,
        source_record_id: null,
        source_record_type: null,
        linked_at: null,
        linked_by: null,
      })
      .eq("id", documentId)
      .eq("organisation_id", organisationId)
      .eq("source_module", "SALES_INVOICE")
      .eq("source_record_id", invoiceId);

    if (updateError) {
      return Response.json(
        { error: updateError.message || "Unable to detach document." },
        { status: 400 }
      );
    }

    try {
      await supabase.from("audit_logs").insert({
        user_id: user.id,
        organisation_id: organisationId,
        action: "SALES_INVOICE_DOCUMENT_DETACHED",
        details: {
          sales_invoice_id: invoiceId,
          document_id: documentId,
          file_name: document.file_name,
          source_module: "SALES_INVOICE",
        },
      });
    } catch {
      // Audit logging should not block document detachment.
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
            : "Unable to detach document.",
      },
      { status: 500 }
    );
  }
}