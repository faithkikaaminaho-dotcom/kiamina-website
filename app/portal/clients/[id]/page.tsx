import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import {
  Building2,
  FileText,
  UploadCloud,
  ShieldCheck,
  MessageSquare,
  Clock,
  CheckCircle,
  Archive,
  ArrowLeft,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ClientWorkspacePage({
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/signin");
  }

  const { data: client } = await supabase
    .from("clients")
    .select("id, name, country, city, industry, business_type, status, created_at")
    .eq("id", id)
    .single();

  if (!client) {
    redirect("/portal");
  }

  const { count: documentsCount } = await supabase
    .from("documents")
    .select("*", { count: "exact", head: true })
    .eq("client_id", id);

  const { count: pendingReviewCount } = await supabase
    .from("documents")
    .select("*", { count: "exact", head: true })
    .eq("client_id", id)
    .eq("status", "PENDING_REVIEW");

  const { count: approvedCount } = await supabase
    .from("documents")
    .select("*", { count: "exact", head: true })
    .eq("client_id", id)
    .eq("status", "APPROVED");

  const { count: openInquiriesCount } = await supabase
    .from("inquiries")
    .select("*", { count: "exact", head: true })
    .eq("client_id", id)
    .eq("status", "OPEN");

  const { data: recentDocuments } = await supabase
    .from("documents")
    .select("id, file_name, module, status, created_at")
    .eq("client_id", id)
    .order("created_at", { ascending: false })
    .limit(5);

  const stats = [
    {
      label: "Documents",
      value: documentsCount ?? 0,
      icon: FileText,
    },
    {
      label: "Pending Review",
      value: pendingReviewCount ?? 0,
      icon: Clock,
    },
    {
      label: "Approved",
      value: approvedCount ?? 0,
      icon: CheckCircle,
    },
    {
      label: "Open Inquiries",
      value: openInquiriesCount ?? 0,
      icon: MessageSquare,
    },
  ];

  const modules = [
    "KYC",
    "Sales Documentation",
    "Purchases Documentation",
    "Bank Documentation",
    "Payroll Documentation",
  ];

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <section className="border-b border-[#D9E3F4] bg-white">
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          <a
            href="/portal"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#073D7F]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to portal
          </a>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_0.35fr]">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                Client Workspace
              </div>

              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
                {client.name}
              </h1>

              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                Manage client onboarding, KYC, documents, approvals, inquiries,
                and audit activity from one secure workspace.
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-[#F1F1F1] p-5">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-[#073D7F]" />
                <div className="text-sm font-semibold text-slate-950">
                  Client Status
                </div>
              </div>

              <div className="mt-4 inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#073D7F]">
                {client.status}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.label}
                className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-slate-500">
                    {stat.label}
                  </div>
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F1F1F1] text-[#073D7F]">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>

                <div className="mt-5 text-3xl font-semibold text-slate-950">
                  {stat.value}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 grid gap-8 xl:grid-cols-[0.8fr_1.2fr]">
          <section className="rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm">
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
              Client Details
            </div>

            <div className="mt-6 space-y-4 text-sm text-slate-600">
              <p>
                <span className="font-semibold text-slate-950">Country:</span>{" "}
                {client.country || "—"}
              </p>
              <p>
                <span className="font-semibold text-slate-950">City:</span>{" "}
                {client.city || "—"}
              </p>
              <p>
                <span className="font-semibold text-slate-950">Industry:</span>{" "}
                {client.industry || "—"}
              </p>
              <p>
                <span className="font-semibold text-slate-950">
                  Business Type:
                </span>{" "}
                {client.business_type || "—"}
              </p>
            </div>
          </section>

          <section className="rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                  Document Modules
                </div>

                <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
                  Workspace modules
                </h2>
              </div>

              <a
                href={`/portal/clients/${client.id}/upload`}
                className="inline-flex rounded-full bg-[#073D7F] px-5 py-3 text-sm font-semibold text-white"
              >
                Upload Document
              </a>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {modules.map((module) => (
                <div
                  key={module}
                  className="rounded-2xl border border-[#D9E3F4] bg-[#F8FAFC] px-5 py-4 text-sm font-semibold text-[#073D7F]"
                >
                  {module}
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="mt-8 rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                Recent Documents
              </div>

              <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
                Latest uploaded records
              </h2>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full bg-[#F1F1F1] px-4 py-2 text-sm font-semibold text-[#073D7F]">
              <Archive className="h-4 w-4" />
              Audit-ready workspace
            </div>
          </div>

          <div className="mt-8 overflow-hidden rounded-[1.5rem] border border-[#D9E3F4]">
            <div className="grid grid-cols-4 bg-[#F1F1F1] px-5 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              <div>File</div>
              <div>Module</div>
              <div>Status</div>
              <div>Date</div>
            </div>

            <div className="divide-y divide-[#D9E3F4] bg-white">
              {recentDocuments && recentDocuments.length > 0 ? (
                recentDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="grid grid-cols-4 px-5 py-4 text-sm text-slate-700"
                  >
                    <a
                      href={`/portal/documents/${doc.id}`}
                      className="font-semibold text-[#073D7F] hover:underline"
                    >
                      {doc.file_name}
                    </a>
                    <div>{doc.module}</div>
                    <div>
                      <span className="rounded-full bg-[#F1F1F1] px-3 py-1 text-xs font-semibold text-[#073D7F]">
                        {doc.status}
                      </span>
                    </div>
                    <div>
                      {doc.created_at
                        ? new Date(doc.created_at).toLocaleDateString()
                        : "—"}
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-5 py-8 text-sm text-slate-500">
                  No documents uploaded yet.
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] bg-[#073D7F] p-8 text-white">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                Controls
              </div>

              <h2 className="mt-4 text-3xl font-semibold tracking-tight">
                KYC, approval, inquiry, and audit controls are attached to this
                client workspace.
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                "KYC restricted access",
                "Approval workflow",
                "Inquiry tracking",
                "Audit logging",
                "Signed uploads",
                "Role-based permissions",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-semibold text-blue-100"
                >
                  <ShieldCheck className="mb-3 h-5 w-5 text-[#6491DE]" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}