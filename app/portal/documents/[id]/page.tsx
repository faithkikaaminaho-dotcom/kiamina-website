import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import {
  ArrowLeft,
  Download,
  FileText,
  ShieldCheck,
  Clock,
  Database,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin");
  }

  const { data: document } = await supabase
    .from("documents")
    .select(
      "id, client_id, file_name, module, status, storage_path, content_type, created_at, extraction_status, uploader_review_status"
    )
    .eq("id", id)
    .single();

  if (!document) {
    redirect("/portal");
  }

  const { data: client } = await supabase
    .from("clients")
    .select("id, name")
    .eq("id", document.client_id)
    .single();

  const { data: auditLogs } = await supabase
    .from("audit_logs")
    .select("id, action, details, created_at")
    .eq("document_id", document.id)
    .order("created_at", { ascending: false })
    .limit(8);

  const isPreviewable =
    document.content_type?.startsWith("image/") ||
    document.content_type === "application/pdf";

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <section className="border-b border-[#D9E3F4] bg-white">
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          <a
            href={`/portal/clients/${document.client_id}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#073D7F]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to client workspace
          </a>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_0.35fr]">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                Document Detail
              </div>

              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
                {document.file_name}
              </h1>

              <p className="mt-4 text-base leading-8 text-slate-600">
                Client:{" "}
                <span className="font-semibold text-slate-950">
                  {client?.name || "Unknown client"}
                </span>
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-[#F1F1F1] p-5">
              <div className="text-sm font-semibold text-slate-950">
                Current Status
              </div>

              <div className="mt-4 inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#073D7F]">
                {document.status}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F1F1F1] text-[#073D7F]">
              <FileText className="h-5 w-5" />
            </div>

            <h2 className="mt-5 text-2xl font-semibold tracking-tight text-slate-950">
              Document information
            </h2>

            <div className="mt-6 space-y-4 text-sm text-slate-600">
              <p>
                <span className="font-semibold text-slate-950">Module:</span>{" "}
                {document.module}
              </p>

              <p>
                <span className="font-semibold text-slate-950">
                  Content Type:
                </span>{" "}
                {document.content_type || "—"}
              </p>

              <p>
                <span className="font-semibold text-slate-950">
                  Extraction:
                </span>{" "}
                {document.extraction_status}
              </p>

              <p>
                <span className="font-semibold text-slate-950">
                  Uploader Review:
                </span>{" "}
                {document.uploader_review_status}
              </p>

              <p>
                <span className="font-semibold text-slate-950">Uploaded:</span>{" "}
                {document.created_at
                  ? new Date(document.created_at).toLocaleString()
                  : "—"}
              </p>
            </div>

            <a
              href={`/api/documents/${document.id}/download`}
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#073D7F] px-6 py-3 text-sm font-semibold text-white"
            >
              <Download className="h-4 w-4" />
              Download Securely
            </a>
          </section>

          <section className="rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm">
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
              Preview
            </div>

            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
              Secure document preview
            </h2>

            <div className="mt-8 overflow-hidden rounded-[1.5rem] border border-[#D9E3F4] bg-[#F8FAFC]">
              {isPreviewable ? (
                document.content_type === "application/pdf" ? (
                  <iframe
                    src={`/api/documents/${document.id}/preview`}
                    className="h-[640px] w-full"
                    title={document.file_name}
                  />
                ) : (
                  <img
                    src={`/api/documents/${document.id}/preview`}
                    alt={document.file_name}
                    className="max-h-[640px] w-full object-contain"
                  />
                )
              ) : (
                <div className="p-8 text-sm leading-7 text-slate-600">
                  This file type is best handled by secure download. Preview can be added
                  later for supported document formats.
                </div>
              )}
            </div>
          </section>
        </div>

        <section className="mt-8 rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F1F1F1] text-[#073D7F]">
              <ShieldCheck className="h-5 w-5" />
            </div>

            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                Audit Trail
              </div>

              <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
                Recent document activity
              </h2>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            {auditLogs && auditLogs.length > 0 ? (
              auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-2xl border border-[#D9E3F4] bg-[#F8FAFC] p-5 text-sm text-slate-600"
                >
                  <div className="flex items-center gap-2 font-semibold text-slate-950">
                    <Clock className="h-4 w-4 text-[#073D7F]" />
                    {log.action}
                  </div>
                  <div className="mt-2">
                    {log.created_at
                      ? new Date(log.created_at).toLocaleString()
                      : "—"}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-[#D9E3F4] bg-[#F8FAFC] p-5 text-sm text-slate-500">
                No audit activity recorded yet.
              </div>
            )}
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] bg-[#073D7F] p-8 text-white">
          <Database className="h-6 w-6 text-[#6491DE]" />

          <h2 className="mt-5 text-3xl font-semibold tracking-tight">
            This document is now part of the controlled accounting workflow.
          </h2>

          <p className="mt-4 max-w-3xl text-base leading-8 text-blue-100">
            Next workflow steps will include preview URL generation, approval,
            rejection, inquiries, OCR extraction, processing notes, exports, and
            archive controls.
          </p>
        </section>
      </section>
    </main>
  );
}