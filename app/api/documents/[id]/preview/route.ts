export const runtime = "nodejs";

import { storage, bucketName } from "@/lib/storage/gcs";
import { createClient } from "@/utils/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!bucketName) {
      return Response.json({ error: "Bucket is not configured." }, { status: 500 });
    }

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Not authenticated." }, { status: 401 });
    }

    const { data: document } = await supabase
      .from("documents")
      .select("id, client_id, file_name, storage_path, content_type")
      .eq("id", id)
      .single();

    if (!document) {
      return Response.json({ error: "Document not found." }, { status: 404 });
    }

    const [buffer] = await storage
      .bucket(bucketName)
      .file(document.storage_path)
      .download();

    await supabase.from("audit_logs").insert({
      client_id: document.client_id,
      document_id: document.id,
      user_id: user.id,
      action: "DOCUMENT_PREVIEWED",
      details: {
        file_name: document.file_name,
        storage_path: document.storage_path,
      },
    });

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": document.content_type || "application/octet-stream",
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