export const runtime = "nodejs";

import { storage, bucketName } from "@/lib/storage/gcs";
import { createClient } from "@/utils/supabase/server";

const moduleMap: Record<string, string> = {
  kyc: "KYC",
  sales: "SALES",
  purchases: "PURCHASES",
  bank: "BANK",
  payroll: "PAYROLL",
};

export async function POST(request: Request) {
  try {
    if (!bucketName) {
      return Response.json(
        { error: "GCS_BUCKET_NAME is missing." },
        { status: 500 }
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Not authenticated." }, { status: 401 });
    }

    const formData = await request.formData();

    const file = formData.get("file") as File | null;
    const clientId = formData.get("clientId") as string | null;
    const module = formData.get("module") as string | null;

    if (!file || !clientId || !module) {
      return Response.json(
        { error: "file, clientId, and module are required." },
        { status: 400 }
      );
    }

    const dbModule = moduleMap[module];

    if (!dbModule) {
      return Response.json({ error: "Invalid document module." }, { status: 400 });
    }

    const safeFileName = file.name
      .replace(/[^a-zA-Z0-9._-]/g, "-")
      .replace(/-+/g, "-")
      .toLowerCase();

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

    const objectPath = `clients/${clientId}/${module}/${timestamp}-${safeFileName}`;

    const bytes = Buffer.from(await file.arrayBuffer());

    await storage.bucket(bucketName).file(objectPath).save(bytes, {
      contentType: file.type || "application/octet-stream",
      resumable: false,
      metadata: {
        cacheControl: "no-store",
      },
    });

    const { data: documentRecord, error: documentError } = await supabase
      .from("documents")
      .insert({
        client_id: clientId,
        uploaded_by: user.id,
        module: dbModule,
        status: "UPLOADED",
        file_name: file.name,
        storage_path: objectPath,
        content_type: file.type || "application/octet-stream",
        extraction_status: "NOT_STARTED",
        uploader_review_status: "PENDING",
      })
      .select("id")
      .single();

    if (documentError) {
      return Response.json(
        {
          error:
            "File uploaded to storage, but database record failed: " +
            documentError.message,
        },
        { status: 500 }
      );
    }
        const { error: reviewError } = await supabase
      .from("document_reviews")
     .insert({
        document_id: documentRecord.id,
        client_id: clientId,
        status: "PENDING_REVIEW",
        created_by: user.id,
      });

    if (reviewError) {
      return Response.json(
        {
          error:
            "File uploaded and document saved, but review record failed: " +
            reviewError.message,
        },
        { status: 500 }
      );
   }

    await supabase.from("audit_logs").insert({
      client_id: clientId,
      document_id: documentRecord.id,
      user_id: user.id,
      action: "DOCUMENT_UPLOADED",
      details: {
        file_name: file.name,
        storage_path: objectPath,
        module: dbModule,
        content_type: file.type || "application/octet-stream",
      },
    });

    return Response.json({
      success: true,
      documentId: documentRecord.id,
      objectPath,
      fileName: file.name,
      contentType: file.type || "application/octet-stream",
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to upload file.",
      },
      { status: 500 }
    );
  }
}