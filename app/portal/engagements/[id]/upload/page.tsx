"use client";

import {
  use,
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { ArrowLeft, CheckCircle, UploadCloud } from "lucide-react";

type EngagementContext = {
  id: string;
  name: string;
  organisation_id: string;
  organisation_name: string;
  legacy_client_id: string | null;
};

const documentModules = [
  "Bank Statements",
  "Sales Invoices",
  "Purchase Invoices",
  "Payroll Records",
  "Tax Records",
  "Contracts",
  "Management Reports",
  "Financial Statements",
  "KYC / Compliance",
  "Other",
];

export default function EngagementUploadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [engagement, setEngagement] = useState<EngagementContext | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [module, setModule] = useState("Bank Statements");
  const [documentType, setDocumentType] = useState("Bank Statements");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadEngagement = async () => {
      try {
        const response = await fetch(`/api/engagements/${id}/context`, {
          cache: "no-store",
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Unable to load engagement.");
        }

        setEngagement(result.engagement);
      } catch (error) {
        setStatus("error");
        setMessage(
          error instanceof Error
            ? error.message
            : "Unable to load engagement."
        );
      }
    };

    loadEngagement();
  }, [id]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null);
  };

  const handleModuleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setModule(e.target.value);
    setDocumentType(e.target.value);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!engagement) {
      setStatus("error");
      setMessage("Engagement context is not available.");
      return;
    }

    if (!engagement.legacy_client_id) {
      setStatus("error");
      setMessage(
        "This organisation is not linked to a legacy client record yet. Document upload requires the client bridge."
      );
      return;
    }

    if (!file) {
      setStatus("error");
      setMessage("Please select a file to upload.");
      return;
    }

    try {
      setStatus("loading");
      setMessage("Uploading document...");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("client_id", engagement.legacy_client_id);
      formData.append("organisation_id", engagement.organisation_id);
      formData.append("engagement_id", engagement.id);
      formData.append("module", module);
      formData.append("document_type", documentType);

      const response = await fetch("/api/upload-url", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to upload document.");
      }

      setStatus("success");
      setMessage("Document uploaded and linked to engagement successfully.");
      setFile(null);
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error ? error.message : "Unable to upload document."
      );
    }
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <section className="border-b border-[#D9E3F4] bg-white">
        <div className="mx-auto max-w-4xl px-6 py-8 lg:px-8">
          <a
            href={`/portal/engagements/${id}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#073D7F]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to engagement
          </a>

          <div className="mt-8">
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
              Engagement Documents
            </div>

            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
              Upload engagement document
            </h1>

            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
              Upload a source document directly into this engagement workspace.
            </p>

            {engagement ? (
              <div className="mt-5 rounded-2xl border border-[#D9E3F4] bg-[#F8FAFC] p-5 text-sm text-slate-600">
                <span className="font-semibold text-slate-950">
                  Engagement:
                </span>{" "}
                {engagement.name}
                <br />
                <span className="font-semibold text-slate-950">
                  Organisation:
                </span>{" "}
                {engagement.organisation_name}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-12 lg:px-8">
        <div className="rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F1F1F1] text-[#073D7F]">
            <UploadCloud className="h-5 w-5" />
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="text-sm font-medium text-slate-700">
                Document Module
              </label>
              <select
                value={module}
                onChange={handleModuleChange}
                className="mt-2 w-full rounded-xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
              >
                {documentModules.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Document Type
              </label>
              <input
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="mt-2 w-full rounded-xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
                placeholder="Example: July 2026 bank statement"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                File
              </label>
              <input
                type="file"
                onChange={handleFileChange}
                className="mt-2 w-full rounded-xl border border-dashed border-[#D9E3F4] bg-[#F8FAFC] px-4 py-6 text-sm outline-none focus:border-[#073D7F]"
              />
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