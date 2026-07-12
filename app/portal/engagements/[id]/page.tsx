import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  Briefcase,
  CheckCircle,
  ClipboardList,
  Coins,
  FileText,
  FolderOpen,
  ShieldCheck,
} from "lucide-react";

export const dynamic = "force-dynamic";

function formatLabel(value?: string | null) {
  if (!value) return "—";

  const special: Record<string, string> = {
    US_GAAP: "US GAAP",
    IFRS_SME: "IFRS for SMEs",
  };

  if (special[value]) return special[value];

  return value
    .split("_")
    .join(" ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default async function EngagementDetailPage({
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

  if (!profile || !["SUPER_ADMIN", "ADMIN", "STAFF"].includes(profile.role)) {
    redirect("/portal");
  }

  const { data: engagement } = await supabase
    .from("engagements")
    .select(
      `
      id,
      organisation_id,
      name,
      engagement_type,
      status,
      reporting_period_start,
      reporting_period_end,
      reporting_framework_code,
      currency_code,
      created_at,
      organisations (
        id,
        legal_name,
        jurisdiction_code
      )
    `
    )
    .eq("id", id)
    .single();

  if (!engagement) {
    redirect("/portal/organisations");
  }
  const { data: engagementDocuments } = await supabase
    .from("documents")
    .select("id, file_name, module, document_type, status, created_at")
    .eq("engagement_id", id)
    .order("created_at", { ascending: false })
    .limit(8);

  const organisation = Array.isArray(engagement.organisations)
    ? engagement.organisations[0]
    : engagement.organisations;

  const workspaceModules = [
    {
      title: "Documents",
      description:
        "Link source documents, evidence, and client uploads to this engagement.",
      icon: FolderOpen,
    },
    {
      title: "Working Papers",
      description:
        "Prepare structured schedules, reconciliations, review notes, and support.",
      icon: ClipboardList,
    },
    {
      title: "Accounting",
      description:
        "Connect journals, trial balance, adjustments, and ledger activity.",
      icon: BookOpen,
    },
    {
      title: "Financial Reporting",
      description:
        "Generate unaudited financial statements and reporting deliverables.",
      icon: FileText,
    },
    {
      title: "Management Reporting",
      description:
        "Prepare monthly reports, KPIs, commentary, and strategic advisory.",
      icon: BarChart3,
    },
    {
      title: "Quality Review",
      description:
        "Track review status, approval points, validation checks, and sign-off.",
      icon: ShieldCheck,
    },
  ];

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <section className="border-b border-[#D9E3F4] bg-white">
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          <a
            href={`/portal/organisations/${engagement.organisation_id}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#073D7F]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to organisation
          </a>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_0.35fr]">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                Engagement Workspace
              </div>

              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
                {engagement.name}
              </h1>

              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                Organisation:{" "}
                <span className="font-semibold text-slate-950">
                  {organisation?.legal_name || "—"}
                </span>
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-[#F1F1F1] p-5">
              <div className="flex items-center gap-3">
                <Briefcase className="h-5 w-5 text-[#073D7F]" />
                <div className="text-sm font-semibold text-slate-950">
                  Engagement Status
                </div>
              </div>

              <div className="mt-4 inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#073D7F]">
                {formatLabel(engagement.status)}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <Briefcase className="h-6 w-6 text-[#073D7F]" />
            <div className="mt-5 text-sm font-medium text-slate-500">
              Engagement Type
            </div>
            <div className="mt-2 text-lg font-semibold text-slate-950">
              {formatLabel(engagement.engagement_type)}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <FileText className="h-6 w-6 text-[#073D7F]" />
            <div className="mt-5 text-sm font-medium text-slate-500">
              Reporting Framework
            </div>
            <div className="mt-2 text-lg font-semibold text-slate-950">
              {formatLabel(engagement.reporting_framework_code)}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <Coins className="h-6 w-6 text-[#073D7F]" />
            <div className="mt-5 text-sm font-medium text-slate-500">
              Currency
            </div>
            <div className="mt-2 text-lg font-semibold text-slate-950">
              {engagement.currency_code || "—"}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <CheckCircle className="h-6 w-6 text-[#073D7F]" />
            <div className="mt-5 text-sm font-medium text-slate-500">
              Period
            </div>
            <div className="mt-2 text-lg font-semibold text-slate-950">
              {engagement.reporting_period_start || "—"} to{" "}
              {engagement.reporting_period_end || "—"}
            </div>
          </div>
        </div>

        <section className="mt-8 rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm">
          <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
            Workspace Modules
          </div>

          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
            Engagement operating workspace
          </h2>

          <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
            This engagement workspace will become the centre for documents,
            working papers, accounting records, financial statements, management
            reports, review workflow, tax, payroll, compliance, and advisory
            deliverables.
          </p>

          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {workspaceModules.map((module) => {
              const Icon = module.icon;

              return (
                <div
                  key={module.title}
                  className="rounded-[1.5rem] border border-[#D9E3F4] bg-[#F8FAFC] p-6"
                >
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#073D7F]">
                    <Icon className="h-5 w-5" />
                  </div>

                  <h3 className="mt-5 text-lg font-semibold text-slate-950">
                    {module.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {module.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                Engagement Documents
              </div>
        
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
                Source documents linked to this engagement
              </h2>
        
              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                Upload and review source documents that support this engagement&apos;s
                working papers, accounting records, reporting, tax, payroll, compliance,
                or advisory deliverables.
              </p>
            </div>
        
            <a
              href={`/portal/engagements/${engagement.id}/upload`}
              className="inline-flex rounded-full bg-[#073D7F] px-6 py-3 text-sm font-semibold text-white"
            >
              Upload Document
            </a>
          </div>
                
          <div className="mt-8 space-y-4">
            {engagementDocuments && engagementDocuments.length > 0 ? (
              engagementDocuments.map((doc) => (
                <a
                  key={doc.id}
                  href={`/portal/documents/${doc.id}`}
                  className="block rounded-2xl border border-[#D9E3F4] bg-[#F8FAFC] p-5 transition hover:border-[#073D7F]"
                >
                  <div className="font-semibold text-[#073D7F]">{doc.file_name}</div>
        
                  <div className="mt-2 text-sm text-slate-600">
                    {doc.module || "General"} · {doc.document_type || "Document"} ·{" "}
                    {doc.status || "Uploaded"}
                  </div>
                </a>
              ))
            ) : (
              <div className="rounded-2xl border border-[#D9E3F4] bg-[#F8FAFC] p-5 text-sm text-slate-500">
                No documents have been linked to this engagement yet.
              </div>
            )}
          </div>
        </section>
        <section className="mt-8 rounded-[2rem] bg-[#073D7F] p-8 text-white">
          <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
            Next Platform Layer
          </div>

          <h2 className="mt-4 text-3xl font-semibold tracking-tight">
            This is the bridge between client documents and the accounting
            engine.
          </h2>

          <p className="mt-4 max-w-4xl text-base leading-8 text-blue-100">
            The engagement workspace allows Kiamina to organise work by service
            line and reporting period. The next stage will link documents to
            engagements, then introduce working papers, trial balance, journals,
            IFRS/US GAAP mapping, management reporting, and advisory outputs.
          </p>
        </section>
      </section>
    </main>
  );
}