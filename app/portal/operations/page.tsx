import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import {
  ArrowLeft,
  Clock,
  FileText,
  Building2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function OperationsPage() {
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

  const { data: reviews } = await supabase
    .from("document_reviews")
    .select(
      `
      id,
      status,
      created_at,
      document_id,
      documents (
        id,
        file_name,
        module,
        status,
        client_id,
        clients (
          id,
          name
        )
      )
    `
    )
    .order("created_at", { ascending: false })
    .limit(20);

  const { count: pendingReviewCount } = await supabase
    .from("document_reviews")
    .select("*", { count: "exact", head: true })
    .eq("status", "PENDING_REVIEW");

  const { count: assignedCount } = await supabase
    .from("document_reviews")
    .select("*", { count: "exact", head: true })
    .eq("status", "ASSIGNED");

  const { count: approvedCount } = await supabase
    .from("document_reviews")
    .select("*", { count: "exact", head: true })
    .eq("status", "APPROVED");

  const { count: changesRequestedCount } = await supabase
    .from("document_reviews")
    .select("*", { count: "exact", head: true })
    .eq("status", "CHANGES_REQUESTED");

  const stats = [
    {
      label: "Pending Review",
      value: pendingReviewCount ?? 0,
      icon: Clock,
    },
    {
      label: "Assigned",
      value: assignedCount ?? 0,
      icon: FileText,
    },
    {
      label: "Approved",
      value: approvedCount ?? 0,
      icon: CheckCircle,
    },
    {
      label: "Changes Requested",
      value: changesRequestedCount ?? 0,
      icon: AlertCircle,
    },
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

          <div className="mt-8">
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
              Operations Workspace
            </div>

            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
              Review queue and daily work control.
            </h1>

            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
              Track uploaded documents that require review, assignment,
              approval, rejection, or client follow-up.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
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

        <section className="mt-8 rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                Review Queue
              </div>

              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
                Documents awaiting action
              </h2>

              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                Every upload creates a review work item. This queue will become
                the main workspace for accountants, reviewers, and managers.
              </p>
            </div>
          </div>

          <div className="mt-8 overflow-hidden rounded-[1.5rem] border border-[#D9E3F4]">
            <div className="grid grid-cols-5 bg-[#F1F1F1] px-5 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              <div>Document</div>
              <div>Client</div>
              <div>Module</div>
              <div>Review Status</div>
              <div>Date</div>
            </div>

            <div className="divide-y divide-[#D9E3F4] bg-white">
              {reviews && reviews.length > 0 ? (
                reviews.map((review: any) => {
                  const document = review.documents;
                  const client = document?.clients;

                  return (
                    <div
                      key={review.id}
                      className="grid grid-cols-5 px-5 py-4 text-sm text-slate-700"
                    >
                      <a
                        href={`/portal/documents/${document?.id}`}
                        className="font-semibold text-[#073D7F] hover:underline"
                      >
                        {document?.file_name || "Unknown document"}
                      </a>

                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-[#073D7F]" />
                        {client?.name || "Unknown client"}
                      </div>

                      <div>{document?.module || "—"}</div>

                      <div>
                        <span className="rounded-full bg-[#F1F1F1] px-3 py-1 text-xs font-semibold text-[#073D7F]">
                          {review.status}
                        </span>
                      </div>

                      <div>
                        {review.created_at
                          ? new Date(review.created_at).toLocaleDateString()
                          : "—"}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="px-5 py-8 text-sm text-slate-500">
                  No review work items found yet.
                </div>
              )}
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}