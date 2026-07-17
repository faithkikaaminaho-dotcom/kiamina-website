export const runtime = "nodejs";

import { bucketName, downloadBufferFromGcs } from "@/lib/storage/gcs";
import { createClient } from "@/utils/supabase/server";

function inferMimeType(fileName?: string | null) {
  const name = fileName?.toLowerCase() || "";

  if (name.endsWith(".pdf")) return "application/pdf";
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
  if (name.endsWith(".webp")) return "image/webp";
  if (name.endsWith(".gif")) return "image/gif";
  if (name.endsWith(".txt")) return "text/plain";
  if (name.endsWith(".csv")) return "text/csv";

  if (name.endsWith(".doc")) return "application/msword";
  if (name.endsWith(".docx")) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }

  if (name.endsWith(".xls")) return "application/vnd.ms-excel";
  if (name.endsWith(".xlsx")) {
    return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  }

  return "application/octet-stream";
}

function shouldPreviewInline(mimeType: string) {
  return (
    mimeType === "application/pdf" ||
    mimeType.startsWith("image/") ||
    mimeType.startsWith("text/")
  );
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!bucketName) {
      return Response.json(
        { error: "Bucket is not configured." },
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

    const { data: document, error: documentError } = await supabase
      .from("documents")
      .select("id, client_id, file_name, file_path, storage_path, mime_type")
      .eq("id", id)
      .single();

    if (documentError || !document) {
      return Response.json({ error: "Document not found." }, { status: 404 });
    }

    const storagePath = document.storage_path || document.file_path;

    if (!storagePath) {
      return Response.json(
        { error: "Document storage path is missing." },
        { status: 500 }
      );
    }

    const buffer = await downloadBufferFromGcs(storagePath);

    const mimeType =
      document.mime_type || inferMimeType(document.file_name);

    const dispositionType = shouldPreviewInline(mimeType)
      ? "inline"
      : "attachment";

    await supabase.from("audit_logs").insert({
      client_id: document.client_id,
      document_id: document.id,
      user_id: user.id,
      action: "DOCUMENT_PREVIEWED",
      details: {
        file_name: document.file_name,
        storage_path: storagePath,
        mime_type: mimeType,
      },
    });

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `${dispositionType}; filename="${document.file_name}"`,
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to preview document.",
      },
      { status: 500 }
    );
  }
}