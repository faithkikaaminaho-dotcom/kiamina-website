export const runtime = "nodejs";

import { bucketName, downloadBufferFromGcs } from "@/lib/storage/gcs";
import { createClient } from "@/utils/supabase/server";

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
      .select(
        "id, client_id, file_name, file_path, storage_path, mime_type, content_type"
      )
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

    await supabase.from("audit_logs").insert({
      client_id: document.client_id,
      document_id: document.id,
      user_id: user.id,
      action: "DOCUMENT_PREVIEWED",
      details: {
        file_name: document.file_name,
        storage_path: storagePath,
      },
    });

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          document.mime_type || document.content_type || "application/octet-stream",
        "Content-Disposition": `inline; filename="${document.file_name}"`,
        "Cache-Control": "no-store",
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