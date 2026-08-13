import { createClient } from "@/utils/supabase/server";
import { uploadBufferToGcs } from "@/lib/storage/gcs";

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

function cleanText(value: unknown) {
  const text = value ? String(value).trim() : "";
  return text.length > 0 ? text : null;
}

function safeFileName(fileName: string) {
  const extension = fileName.includes(".")
    ? fileName.slice(fileName.lastIndexOf("."))
    : "";

  const baseName = fileName
    .replace(extension, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return `${baseName || "document"}${extension.toLowerCase()}`;
}

async function uploadToStorage({
  buffer,
  storagePath,
  contentType,
}: {
  buffer: Buffer;
  storagePath: string;
  contentType: string;
}) {
  const uploader = uploadBufferToGcs as unknown as (args: {
    buffer: Buffer;
    contentType: string;
    filePath: string;
    storagePath: string;
    objectName: string;
    destination: string;
    path: string;
  }) => Promise<unknown>;

  return uploader({
    buffer,
    contentType,
    filePath: storagePath,
    storagePath,
    objectName: storagePath,
    destination: storagePath,
    path: storagePath,
  });
}

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

    const formData = await request.formData();

    const organisationId = cleanText(formData.get("organisation_id"));
    const documentType = cleanText(formData.get("document_type"));
    const description = cleanText(formData.get("description"));
    const file = formData.get("file");

    if (!organisationId) {
      return Response.json(
        { error: "Organisation is required." },
        { status: 400 }
      );
    }

    if (!(file instanceof File)) {
      return Response.json({ error: "File is required." }, { status: 400 });
    }

    if (file.size <= 0) {
      return Response.json(
        { error: "The selected file is empty." },
        { status: 400 }
      );
    }

    const maxFileSize = 25 * 1024 * 1024;

    if (file.size > maxFileSize) {
      return Response.json(
        { error: "File size must not exceed 25MB." },
        { status: 400 }
      );
    }

    const { data: invoice, error: invoiceError } = await supabase
      .from("sales_invoices")
      .select("id, organisation_id, invoice_number, status, posted_at")
      .eq("id", invoiceId)
      .eq("organisation_id", organisationId)
      .single();

    if (invoiceError || !invoice) {
      return Response.json(
        { error: "Sales invoice not found." },
        { status: 404 }
      );
    }

    const originalFileName = file.name || "supporting-document";
    const cleanedFileName = safeFileName(originalFileName);
    const contentType = file.type || "application/octet-stream";
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const storagePath = [
      "organisations",
      organisationId,
      "sales-invoices",
      invoiceId,
      `${timestamp}-${cleanedFileName}`,
    ].join("/");

    await uploadToStorage({
      buffer: fileBuffer,
      storagePath,
      contentType,
    });

    const { data: document, error: documentError } = await supabase
      .from("documents")
      .insert({
        organisation_id: organisationId,
        uploaded_by: user.id,
        module: "SALES_INVOICE",
        document_type: documentType || "Sales Invoice Supporting Document",
        status: "UPLOADED",
        file_name: originalFileName,
        storage_path: storagePath,
        file_path: storagePath,
        file_size: file.size,
        mime_type: contentType,
        content_type: contentType,
        description,
        source_module: "SALES_INVOICE",
        source_record_id: invoiceId,
        source_record_type: "SALES_INVOICE",
        linked_at: new Date().toISOString(),
        linked_by: user.id,
        extraction_status: "NOT_STARTED",
        uploader_review_status: "PENDING",
      })
      .select("id, file_name")
      .single();

    if (documentError || !document) {
      return Response.json(
        {
          error:
            documentError?.message ||
            "The file uploaded, but the document record could not be created.",
        },
        { status: 400 }
      );
    }

    try {
      await supabase.from("audit_logs").insert({
        user_id: user.id,
        organisation_id: organisationId,
        action: "SALES_INVOICE_DOCUMENT_UPLOADED_AND_LINKED",
        details: {
          sales_invoice_id: invoiceId,
          invoice_number: invoice.invoice_number,
          document_id: document.id,
          file_name: document.file_name,
          storage_path: storagePath,
          content_type: contentType,
          file_size: file.size,
          source_module: "SALES_INVOICE",
        },
      });
    } catch {
      // Audit logging should not block upload.
    }

    return Response.json({
      success: true,
      salesInvoiceId: invoiceId,
      documentId: document.id,
      fileName: document.file_name,
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to upload supporting document.",
      },
      { status: 500 }
    );
  }
}