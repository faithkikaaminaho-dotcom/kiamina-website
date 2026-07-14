import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  ClipboardList,
  FileText,
  Mail,
  Phone,
  ShieldCheck,
  User,
} from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import InquiryStatusForm from "./InquiryStatusForm";
import ConvertInquiryButton from "./ConvertInquiryButton";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

type ServiceInquiry = {
  id: string;
  organisation_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string | null;
  jurisdiction_code: string;
  country: string | null;
  currency: string | null;
  reporting_framework: string | null;
  industry: string;
  services_needed: string[];
  monthly_transaction_volume: string | null;
  payroll_size: string | null;
  reporting_frequency: string | null;
  has_backlog: string | null;
  backlog_details: string | null;
  compliance_concerns: string | null;
  current_accounting_system: string | null;
  documentation_status: string | null;
  message: string | null;
  status: string;
  priority: string;
  source: string;
  created_at: string;
  updated_at: string;
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function statusClassName(status: string) {
  if (status === "NEW") {
    return "bg-blue-50 text-blue-700 ring-blue-200";
  }

  if (status === "IN_REVIEW") {
    return "bg-amber-50 text-amber-700 ring-amber-200";
  }

  if (status === "CONVERTED") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  }

  if (status === "CLOSED") {
    return "bg-slate-100 text-slate-600 ring-slate-200";
  }

  return "bg-slate-100 text-slate-600 ring-slate-200";
}

function DetailCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[2rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="border-t border-[#D9E3F4] py-4 first:border-t-0 first:pt-0 last:pb-0">
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </div>
      <div className="mt-2 text-sm leading-7 text-slate-700">
        {value && value.trim() ? value : "Not provided"}
      </div>
    </div>
  );
}

export default async function InquiryDetailPage({ params }: PageProps) {
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
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  const internalRoles = [
    "SUPER_ADMIN",
    "ADMIN",
    "STAFF",
    "IT_ADMIN",
    "ACCOUNTANT_ADMIN",
    "ACCOUNTANT_USER",
    "CUSTOMER_SUPPORT",
    "COMPLIANCE_ADMIN",
    "OPERATIONS_ADMIN",
  ];

  if (!profile || !internalRoles.includes(profile.role)) {
    redirect("/portal");
  }

  const { data, error } = await supabase
    .from("service_inquiries")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    redirect("/portal/inquiries");
  }

  const inquiry = data as ServiceInquiry;

  return (
    <main className="min-h-screen bg-[#F8FAFC] px-6 py-8 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <Link
            href="/portal/inquiries"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#073D7F]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to inquiries
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_0.45fr]">
          <div>
            <div className="rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm">
              <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
                <div>
                  <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                    Inquiry Review
                  </div>

                  <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
                    {inquiry.organisation_name}
                  </h1>

                  <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                    {inquiry.industry} ·{" "}
                    {inquiry.country || inquiry.jurisdiction_code} ·{" "}
                    {inquiry.currency || "Currency not set"} ·{" "}
                    {inquiry.reporting_framework || "Framework not set"}
                  </p>
                </div>

                <span
                  className={`w-fit rounded-full px-4 py-2 text-xs font-semibold ring-1 ${statusClassName(
                    inquiry.status
                  )}`}
                >
                  {inquiry.status.replaceAll("_", " ")}
                </span>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl bg-[#F8FAFC] p-5">
                  <Building2 className="h-5 w-5 text-[#073D7F]" />
                  <div className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Industry
                  </div>
                  <div className="mt-2 text-sm font-semibold text-slate-950">
                    {inquiry.industry}
                  </div>
                </div>

                <div className="rounded-2xl bg-[#F8FAFC] p-5">
                  <ShieldCheck className="h-5 w-5 text-[#073D7F]" />
                  <div className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Priority
                  </div>
                  <div className="mt-2 text-sm font-semibold text-slate-950">
                    {inquiry.priority}
                  </div>
                </div>

                <div className="rounded-2xl bg-[#F8FAFC] p-5">
                  <CalendarDays className="h-5 w-5 text-[#073D7F]" />
                  <div className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Submitted
                  </div>
                  <div className="mt-2 text-sm font-semibold text-slate-950">
                    {formatDateTime(inquiry.created_at)}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-8">
              <DetailCard title="Services Requested">
                <div className="flex flex-wrap gap-3">
                  {(inquiry.services_needed || []).map((service) => (
                    <span
                      key={service}
                      className="rounded-full bg-[#F1F6FF] px-4 py-2 text-sm font-semibold text-[#073D7F]"
                    >
                      {service}
                    </span>
                  ))}
                </div>
              </DetailCard>

              <DetailCard title="Operational Scope">
                <DetailRow
                  label="Monthly transaction volume"
                  value={inquiry.monthly_transaction_volume}
                />
                <DetailRow label="Payroll size" value={inquiry.payroll_size} />
                <DetailRow
                  label="Reporting frequency"
                  value={inquiry.reporting_frequency}
                />
                <DetailRow
                  label="Documentation status"
                  value={inquiry.documentation_status}
                />
                <DetailRow
                  label="Current accounting system"
                  value={inquiry.current_accounting_system}
                />
              </DetailCard>

              <DetailCard title="Backlog and Compliance">
                <DetailRow
                  label="Has accounting backlog?"
                  value={inquiry.has_backlog}
                />
                <DetailRow
                  label="Backlog details"
                  value={inquiry.backlog_details}
                />
                <DetailRow
                  label="Compliance concerns"
                  value={inquiry.compliance_concerns}
                />
              </DetailCard>

              <DetailCard title="Additional Message">
                <p className="text-sm leading-8 text-slate-700">
                  {inquiry.message || "No additional message provided."}
                </p>
              </DetailCard>
            </div>
          </div>

          <aside className="space-y-8">
            <DetailCard title="Contact Information">
              <div className="space-y-5">
                <div className="flex gap-3">
                  <User className="mt-1 h-5 w-5 text-[#073D7F]" />
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Contact person
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-950">
                      {inquiry.contact_name}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Mail className="mt-1 h-5 w-5 text-[#073D7F]" />
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Email
                    </div>
                    <div className="mt-1 break-all text-sm font-semibold text-slate-950">
                      {inquiry.contact_email}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Phone className="mt-1 h-5 w-5 text-[#073D7F]" />
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Phone
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-950">
                      {inquiry.contact_phone || "Not provided"}
                    </div>
                  </div>
                </div>
              </div>
            </DetailCard>

            <DetailCard title="Jurisdiction Context">
              <DetailRow label="Country" value={inquiry.country} />
              <DetailRow
                label="Jurisdiction code"
                value={inquiry.jurisdiction_code}
              />
              <DetailRow label="Currency" value={inquiry.currency} />
              <DetailRow
                label="Reporting framework"
                value={inquiry.reporting_framework}
              />
            </DetailCard>

            <DetailCard title="Conversion">
              <ConvertInquiryButton
                inquiryId={inquiry.id}
                currentStatus={inquiry.status}
              />
            </DetailCard>
            
            <DetailCard title="Status Management">
              <InquiryStatusForm
                inquiryId={inquiry.id}
                currentStatus={inquiry.status}
              />
            </DetailCard>
            
            <DetailCard title="Internal Notes">
              <div className="flex items-start gap-3 rounded-2xl bg-[#F8FAFC] p-5">
                <ClipboardList className="mt-0.5 h-5 w-5 text-[#073D7F]" />
                <p className="text-sm leading-7 text-slate-600">
                  Staff assignment, conversion to client, and follow-up email actions will
                  be added in the next step.
                </p>
              </div>
            </DetailCard>
          </aside>
        </div>
      </div>
    </main>
  );
}