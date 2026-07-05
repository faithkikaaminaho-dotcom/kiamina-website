"use client";

import { use, useState } from "react";
import { CheckCircle, UploadCloud, ArrowLeft } from "lucide-react";

export default function ClientUploadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const clientId = id;

  const [module, setModule] = useState("kyc");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!file) {
      setStatus("error");
      setMessage("Please select a file to upload.");
      return;
    }

    try {
      setStatus("loading");
      setMessage("Uploading file securely...");

      const uploadForm = new FormData();
      uploadForm.append("file", file);
      uploadForm.append("clientId", clientId);
      uploadForm.append("module", module);

      const uploadResponse = await fetch("/api/upload-url", {
        method: "POST",
        body: uploadForm,
      });

      const uploadData = await uploadResponse.json();

      if (!uploadResponse.ok) {
        throw new Error(uploadData.error || "File upload failed.");
      }

      setStatus("success");
      setMessage(
        `File uploaded successfully. Storage path: ${uploadData.objectPath}`
      );

      setFile(null);
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error ? error.message : "Upload failed. Try again."
      );
    }
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <section className="border-b border-[#D9E3F4] bg-white">
        <div className="mx-auto max-w-4xl px-6 py-8 lg:px-8">
          <a
            href={`/portal/clients/${clientId}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#073D7F]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to client workspace
          </a>

          <div className="mt-8">
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
              Secure Upload
            </div>

            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
              Upload client document
            </h1>

            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
              Upload KYC, sales, purchases, bank, or payroll documents securely.
              Files are stored in private Google Cloud Storage through a
              protected server-side upload workflow.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-12 lg:px-8">
        <div className="rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F1F1F1] text-[#073D7F]">
            <UploadCloud className="h-5 w-5" />
          </div>

          <form onSubmit={handleUpload} className="mt-8 space-y-6">
            <div>
              <label className="text-sm font-medium text-slate-700">
                Document Module
              </label>
              <select
                value={module}
                onChange={(e) => setModule(e.target.value)}
                className="mt-2 w-full rounded-xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
              >
                <option value="kyc">KYC</option>
                <option value="sales">Sales Documentation</option>
                <option value="purchases">Purchases Documentation</option>
                <option value="bank">Bank Documentation</option>
                <option value="payroll">Payroll Documentation</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Select File
              </label>
              <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="mt-2 w-full rounded-xl border border-[#D9E3F4] bg-white px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
              />
              <p className="mt-2 text-xs text-slate-500">
                Supported files include PDF, images, Excel, CSV, and document
                files.
              </p>
            </div>

            <button
              type="submit"
              disabled={status === "loading"}
              className="rounded-full bg-[#073D7F] px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
            >
              {status === "loading" ? "Uploading..." : "Upload Document"}
            </button>

            {message ? (
              <div
                className={`rounded-xl px-4 py-3 text-sm leading-7 ${
                  status === "success"
                    ? "bg-emerald-50 text-emerald-700"
                    : status === "error"
                    ? "bg-red-50 text-red-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {status === "success" ? (
                  <div className="flex gap-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{message}</span>
                  </div>
                ) : (
                  message
                )}
              </div>
            ) : null}
          </form>
        </div>
      </section>
    </main>
  );
}