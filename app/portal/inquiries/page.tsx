import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Building2,
  ClipboardList,
  Mail,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

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
  documentation_status: string | null;
  status: string;
  priority: string;
  created_at: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
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

export default async function PortalInquiriesPage() {
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

  const { data: inquiries, error } = await supabase
    .from("service_inquiries")
    .select(
      `
      id,
      organisation_name,
      contact_name,
      contact_email,
      contact_phone,
      jurisdiction_code,
      country,
      currency,
      reporting_framework,
      industry,
      services_needed,
      monthly_transaction_volume,
      payroll_size,
      reporting_frequency,
      has_backlog,
      documentation_status,
      status,
      priority,
      created_at
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const items = (inquiries || []) as ServiceInquiry[];

  const newCount = items.filter((item) => item.status === "NEW").length;
  const reviewCount = items.filter((item) => item.status === "IN_REVIEW").length;
  const convertedCount = items.filter(
    (item) => item.status === "CONVERTED"
  ).length;

  return (
    <main className="min-h-screen bg-[#F8FAFC] px-6 py-8 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
              Portal
            </div>

            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
              Service Inquiries
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
              Review pricing, onboarding, and service requests submitted from
              the Get Started page.
            </p>
          </div>

          <Link
            href="/portal"
            className="inline-flex items-center justify-center rounded-full border border-[#D9E3F4] bg-white px-5 py-3 text-sm font-semibold text-[#073D7F] shadow-sm"
          >
            Back to Portal
          </Link>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <ClipboardList className="h-6 w-6 text-[#073D7F]" />
            <div className="mt-4 text-3xl font-semibold text-slate-950">
              {newCount}
            </div>
            <p className="mt-1 text-sm text-slate-600">New inquiries</p>
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <ShieldCheck className="h-6 w-6 text-[#073D7F]" />
            <div className="mt-4 text-3xl font-semibold text-slate-950">
              {reviewCount}
            </div>
            <p className="mt-1 text-sm text-slate-600">In review</p>
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <Building2 className="h-6 w-6 text-[#073D7F]" />
            <div className="mt-4 text-3xl font-semibold text-slate-950">
              {convertedCount}
            </div>
            <p className="mt-1 text-sm text-slate-600">Converted</p>
          </div>
        </div>

        <section className="mt-8 overflow-hidden rounded-[2rem] border border-[#D9E3F4] bg-white shadow-sm">
          <div className="border-b border-[#D9E3F4] px-6 py-5">
            <h2 className="text-lg font-semibold text-slate-950">
              Submitted inquiries
            </h2>
          </div>

          {items.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#F1F6FF] text-[#073D7F]">
                <ClipboardList className="h-7 w-7" />
              </div>

              <h3 className="mt-5 text-xl font-semibold text-slate-950">
                No inquiries yet
              </h3>

              <p className="mt-2 text-sm text-slate-600">
                New submissions from the Get Started page will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#D9E3F4]">
              {items.map((item) => (
                <article
                  key={item.id}
                  className="grid gap-6 px-6 py-6 transition hover:bg-[#F8FAFC] lg:grid-cols-[1.1fr_1fr_0.8fr_auto]"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-semibold text-slate-950">
                        {item.organisation_name}
                      </h3>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusClassName(
                          item.status
                        )}`}
                      >
                        {item.status.replaceAll("_", " ")}
                      </span>
                    </div>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {item.industry} · {item.country || item.jurisdiction_code}{" "}
                      · {item.currency || "Currency not set"}
                    </p>

                    <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Submitted {formatDate(item.created_at)}
                    </p>
                  </div>

                  <div>
                    <div className="text-sm font-semibold text-slate-950">
                      {item.contact_name}
                    </div>

                    <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                      <Mail className="h-4 w-4 text-[#073D7F]" />
                      <span>{item.contact_email}</span>
                    </div>

                    {item.contact_phone ? (
                      <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                        <Phone className="h-4 w-4 text-[#073D7F]" />
                        <span>{item.contact_phone}</span>
                      </div>
                    ) : null}
                  </div>

                  <div>
                    <div className="text-sm font-semibold text-slate-950">
                      Requested services
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {(item.services_needed || []).slice(0, 3).map((service) => (
                        <span
                          key={service}
                          className="rounded-full bg-[#F1F6FF] px-3 py-1 text-xs font-semibold text-[#073D7F]"
                        >
                          {service}
                        </span>
                      ))}

                      {(item.services_needed || []).length > 3 ? (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                          +{item.services_needed.length - 3} more
                        </span>
                      ) : null}
                    </div>

                    <p className="mt-3 text-xs leading-5 text-slate-500">
                      {item.monthly_transaction_volume || "Volume not stated"} ·{" "}
                      {item.payroll_size || "Payroll not stated"}
                    </p>
                  </div>

                  <div className="flex items-center lg:justify-end">
                    <Link
                      href={`/portal/inquiries/${item.id}`}
                      className="inline-flex items-center gap-2 rounded-full bg-[#073D7F] px-5 py-3 text-sm font-semibold text-white"
                    >
                      Review
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}