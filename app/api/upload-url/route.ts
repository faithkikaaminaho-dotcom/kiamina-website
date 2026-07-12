export const runtime = "nodejs";

import { randomUUID } from "crypto";
import { storage, bucketName } from "@/lib/storage/gcs";
import { createClient } from "@/utils/supabase/server";

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Not authenticated." }, { status: 401 });
    }

    if (!bucketName) {
      return Response.json(
        { error: "GCS bucket name is not configured." },
        { status: 500 }
      );
    }

    const formData = await request.formData();

    const file = formData.get("file");

    const clientId =
      formData.get("client_id")?.toString() ||
      formData.get("clientId")?.toString() ||
      "";

    const organisationId =
      formData.get("organisation_id")?.toString() ||
      formData.get("organisationId")?.toString() ||
      "";

    const engagementId =
      formData.get("engagement_id")?.toString() ||
      formData.get("engagementId")?.toString() ||
      "";

    const documentCategoryId =
      formData.get("document_category_id")?.toString() ||
      formData.get("documentCategoryId")?.toString() ||
      "";

    const module = formData.get("module")?.toString() || "Other";

    const documentType =
      formData.get("document_type")?.toString() ||
      formData.get("documentType")?.toString() ||
      module;

    if (!(file instanceof File)) {
      return Response.json({ error: "File is required." }, { status: 400 });
    }

    if (!clientId) {
      return Response.json(
        { error: "Client ID is required for document upload." },
        { status: 400 }
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (
      !profile ||
      !["SUPER_ADMIN", "ADMIN", "STAFF", "CLIENT"].includes(profile.role)
    ) {
      return Response.json({ error: "Access denied." }, { status: 403 });
    }

    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("id, name, organisation_id")
      .eq("id", clientId)
      .single();

    if (clientError || !client) {
      return Response.json({ error: "Client not found." }, { status: 404 });
    }

    let finalOrganisationId = organisationId || client.organisation_id || null;
    let finalEngagementId = engagementId || null;
    let finalCategoryId = documentCategoryId || null;
    let finalModule = module;

    if (finalEngagementId) {
      const { data: engagement, error: engagementError } = await supabase
        .from("engagements")
        .select("id, organisation_id")
        .eq("id", finalEngagementId)
        .single();

      if (engagementError || !engagement) {
        return Response.json(
          { error: "Engagement not found." },
          { status: 404 }
        );
      }

      finalOrganisationId = engagement.organisation_id;
    }

    if (documentCategoryId) {
      const { data: category, error: categoryError } = await supabase
        .from("document_categories")
        .select("id, name")
        .eq("id", documentCategoryId)
        .single();

      if (categoryError || !category) {
        return Response.json(
          { error: "Invalid document category selected." },
          { status: 400 }
        );
      }

      finalCategoryId = category.id;
      finalModule = category.name;
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const safeFileName = sanitizeFileName(file.name);

    const storagePath = [
      "clients",
      clientId,
      finalEngagementId ? `engagements/${finalEngagementId}` : "documents",
      `${randomUUID()}-${safeFileName}`,
    ].join("/");

    const bucket = storage.bucket(bucketName);
    const gcsFile = bucket.file(storagePath);

    await gcsFile.save(buffer, {
      resumable: false,
      contentType: file.type || "application/octet-stream",
      metadata: {
        metadata: {
          uploadedBy: user.id,
          clientId,
          organisationId: finalOrganisationId || "",
          engagementId: finalEngagementId || "",
          documentCategoryId: finalCategoryId || "",
          module: finalModule,
          documentType,
        },
      },
    });

    const { data: documentRecord, error: documentError } = await supabase
      .from("documents")
      .insert({
        client_id: clientId,
        organisation_id: finalOrganisationId,
        engagement_id: finalEngagementId,
        document_category_id: finalCategoryId,
        module: finalModule,
        document_type: documentType,
        file_name: file.name,
        file_path: storagePath,
        storage_path: storagePath,
        file_size: file.size,
        mime_type: file.type || "application/octet-stream",
        status: "UPLOADED",
        uploaded_by: user.id,
      })
      .select("id")
      .single();

    if (documentError || !documentRecord) {
      return Response.json(
        {
          error: documentError?.message || "Unable to save document record.",
        },
        { status: 500 }
      );
    }

    await supabase.from("document_reviews").insert({
      document_id: documentRecord.id,
      client_id: clientId,
      organisation_id: finalOrganisationId,
      engagement_id: finalEngagementId,
      document_category_id: finalCategoryId,
      status: "PENDING_REVIEW",
      created_by: user.id,
    });

    await supabase.from("audit_logs").insert({
      user_id: user.id,
      client_id: clientId,
      organisation_id: finalOrganisationId,
      engagement_id: finalEngagementId,
      action: "DOCUMENT_UPLOADED",
      details: {
        document_id: documentRecord.id,
        file_name: file.name,
        file_path: storagePath,
        storage_path: storagePath,
        module: finalModule,
        document_type: documentType,
        document_category_id: finalCategoryId,
        client_name: client.name,
      },
    });

    return Response.json({
      success: true,
      documentId: documentRecord.id,
      filePath: storagePath,
      storagePath,
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to upload document.",
      },
      { status: 500 }
    );
  }
}