import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import {
  FileText,
  Wallet,
  Building2,
  Users,
  ShieldCheck,
  MessageSquare,
  Database,
  UserCog,
  UploadCloud,
  Bell,
  CheckCircle,
  Clock,
  LogOut,
  LayoutDashboard,
  Briefcase,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PortalPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, role")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/signin");
  }

  const { count: clientsCount } = await supabase
    .from("clients")
    .select("*", { count: "exact", head: true });

  const { count: documentsCount } = await supabase
    .from("documents")
    .select("*", { count: "exact", head: true });

  const { count: pendingReviewCount } = await supabase
    .from("documents")
    .select("*", { count: "exact", head: true })
    .eq("status", "PENDING_REVIEW");

  const { count: openInquiriesCount } = await supabase
    .from("inquiries")
    .select("*", { count: "exact", head: true })
    .eq("status", "OPEN");

  const { data: clients } = await supabase
    .from("clients")
    .select("id, name, country, city, industry, business_type, status, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  const modules = [
    {
      title: "Sales Documentation",
      icon: FileText,
      body: "Customer invoices, receipts, revenue records, and sales support.",
    },
    {
      title: "Purchases Documentation",
      icon: Wallet,
      body: "Supplier invoices, vendor bills, expenses, and procurement files.",
    },
    {
      title: "Bank Documentation",
      icon: Building2,
      body: "Bank statements, payment confirmations, transfers, and reconciliations.",
    },
    {
      title: "Payroll Documentation",
      icon: Users,
      body: "Payroll schedules, employee records, statutory deductions, and payslips.",
    },
  ];

  const stats = [
    {
      label: "Clients",
      value: clientsCount ?? 0,
      icon: Briefcase,
    },
    {
      label: "Documents Uploaded",
      value: documentsCount ?? 0,
      icon: UploadCloud,
    },
    {
      label: "Pending Review",
      value: pendingReviewCount ?? 0,
      icon: Clock,
    },
    {
      label: "Open Inquiries",
      value: openInquiriesCount ?? 0,
      icon: MessageSquare,
    },
  ];

  const statuses = [
    "Uploaded",
    "Pending Review",
    "Inquiry Raised",
    "Client Responded",
    "Approved",
    "Rejected",
    "Processed",
    "Archived",
  ];

  const roleCards = [
    "Super Admin",
    "Accountant User",
    "Customer Support User",
    "IT / System Admin",
    "Client Admin User",
    "Client Approver User",
    "Client Standard User",
  ];

  const sidebarItems = [
    {
      label: "Dashboard",
      href: "/portal",
    icon: LayoutDashboard,
    },
    {
     label: "Inquiries",
      href: "/portal/inquiries",
      icon: MessageSquare,
    },
    {
      label: "Clients",
      href: "/portal/clients/new",
      icon: Briefcase,
    },
    {
      label: "Organisations",
      href: "/portal/organisations",
      icon: Building2,
    },
    {
      label: "Operations",
      href: "/portal/operations",
      icon: CheckCircle,
    },
    {
      label: "Documents",
      href: "/portal/operations",
      icon: FileText,
    },
    {
      label: "People",
      href: "/portal/people",
      icon: Users,
    },
    {
      label: "Master Data",
      href: "/portal/settings/master-data",
      icon: Database,
    },
    {
      label: "Users",
      href: "/portal/administration/users",
      icon: UserCog,
    },
    {
      label: "Settings",
      href: "/portal/settings/master-data",
      icon: ShieldCheck,
    },
  ];

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <div className="mx-auto grid max-w-[1500px] gap-0 lg:grid-cols-[280px_1fr]">
        <aside className="hidden min-h-screen border-r border-[#D9E3F4] bg-white px-5 py-6 lg:block">
          <div className="rounded-[1.5rem] bg-[#073D7F] p-5 text-white">
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
              Kiamina Portal
            </div>
            <div className="mt-3 text-lg font-semibold">Secure Workspace</div>
          </div>

          <nav className="mt-8 space-y-2">
            {sidebarItems.map((item, index) => {
              const Icon = item.icon;
         
              return (
                <a
                  key={item.label}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold ${
                    index === 0
                      ? "bg-[#073D7F] text-white"
                      : "text-slate-600 hover:bg-[#F1F1F1] hover:text-[#073D7F]"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </a>
              );
            })}
          </nav>

          <form action="/auth/signout" method="post" className="mt-8">
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-red-50 hover:text-red-700"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </form>
        </aside>

        <section>
          <header className="border-b border-[#D9E3F4] bg-white">
            <div className="flex flex-col gap-5 px-6 py-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                  Dashboard
                </div>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                  Welcome, {profile.full_name || profile.email}
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                  Role:{" "}
                  <span className="font-semibold text-[#073D7F]">
                    {profile.role}
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#D9E3F4] bg-white text-[#073D7F]">
                  <Bell className="h-5 w-5" />
                </button>

                <form action="/auth/signout" method="post" className="lg:hidden">
                  <button
                    type="submit"
                    className="rounded-full bg-[#073D7F] px-5 py-3 text-sm font-semibold text-white"
                  >
                    Sign Out
                  </button>
                </form>
              </div>
            </div>
          </header>

          <div className="px-6 py-8 lg:px-8">
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
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                    Clients
                  </div>

                  <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
                    Latest client workspaces
                  </h2>

                  <p className="mt-5 text-base leading-8 text-slate-600">
                    <a
                      href="/portal/clients/new"
                      className="mt-6 inline-flex rounded-full bg-[#073D7F] px-6 py-3 text-sm font-semibold text-white"
                    >
                     Create Client Workspace
                    </a>
                    These are the latest client records stored in Supabase. This
                    confirms the portal is now connected to real database data.
                  </p>
                </div>
              </div>

              <div className="mt-8 overflow-hidden rounded-[1.5rem] border border-[#D9E3F4]">
                <div className="grid grid-cols-5 bg-[#F1F1F1] px-5 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  <div>Client</div>
                  <div>Country</div>
                  <div>City</div>
                  <div>Industry</div>
                  <div>Status</div>
                </div>

                <div className="divide-y divide-[#D9E3F4] bg-white">
                  {clients && clients.length > 0 ? (
                    clients.map((client) => (
                      <div
                        key={client.id}
                        className="grid grid-cols-5 px-5 py-4 text-sm text-slate-700"
                      >
                        <a
                          href={`/portal/clients/${client.id}`}
                          className="font-semibold text-[#073D7F] hover:underline"
                        >
                          {client.name}
                        </a>
                        <div>{client.country || "—"}</div>
                        <div>{client.city || "—"}</div>
                        <div>{client.industry || "—"}</div>
                        <div>
                          <span className="rounded-full bg-[#F1F1F1] px-3 py-1 text-xs font-semibold text-[#073D7F]">
                            {client.status}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-5 py-8 text-sm text-slate-500">
                      No clients found yet.
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className="mt-8 rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm">
              <div className="max-w-3xl">
                <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                  Document Modules
                </div>

                <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
                  Structured financial documentation workspace.
                </h2>

                <p className="mt-5 text-base leading-8 text-slate-600">
                  Access document workflows for sales, purchases, bank, and
                  payroll records, with review, approval, inquiry, export, and
                  audit controls.
                </p>
              </div>

              <div className="mt-10 grid gap-6 md:grid-cols-2">
                {modules.map((module) => {
                  const Icon = module.icon;

                  return (
                    <div
                      key={module.title}
                      className="rounded-[1.5rem] border border-[#D9E3F4] bg-[#F8FAFC] p-6"
                    >
                      <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#073D7F]">
                        <Icon className="h-5 w-5" />
                      </div>

                      <h3 className="text-xl font-semibold text-slate-950">
                        {module.title}
                      </h3>

                      <p className="mt-4 text-sm leading-7 text-slate-600">
                        {module.body}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="mt-8 grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm">
                <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                  Workflow Status
                </div>

                <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
                  Documents are tracked from upload to archive.
                </h2>

                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  {statuses.map((status) => (
                    <div
                      key={status}
                      className="rounded-2xl border border-[#D9E3F4] bg-[#F1F1F1] px-5 py-4 text-sm font-semibold text-[#073D7F]"
                    >
                      {status}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm">
                <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                  Role-Based Access
                </div>

                <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
                  Access is controlled by user role and client workspace.
                </h2>

                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  {roleCards.map((role) => (
                    <div
                      key={role}
                      className="rounded-2xl border border-[#D9E3F4] bg-[#F8FAFC] px-5 py-4 text-sm font-semibold text-[#073D7F]"
                    >
                      <UserCog className="mb-3 h-5 w-5" />
                      {role}
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="mt-8 rounded-[2rem] bg-[#073D7F] p-8 text-white shadow-sm">
              <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
                <div>
                  <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                    Inquiry Management
                  </div>

                  <h2 className="mt-4 text-3xl font-semibold tracking-tight">
                    Two-way inquiries between Kiamina and client teams.
                  </h2>

                  <p className="mt-5 text-base leading-8 text-blue-100">
                    Inquiries can be raised by Kiamina or by clients, allowing
                    clarification requests, document follow-ups, comments,
                    rejection reasons, and responses to be tracked against each
                    submission.
                  </p>
                </div>

                <div className="grid gap-4">
                  {[
                    "Kiamina can request missing documents or clarification.",
                    "Clients can ask questions about classification or requirements.",
                    "Rejected submissions notify users through the portal and by email.",
                    "Inquiry history remains attached to the document record.",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm leading-7 text-blue-100"
                    >
                      <MessageSquare className="mt-1 h-5 w-5 shrink-0 text-[#6491DE]" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="mt-8 rounded-[2rem] border border-[#D9E3F4] bg-[#F1F1F1] p-8">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#073D7F]">
                <Database className="h-5 w-5" />
              </div>

              <h2 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950">
                Secure upload, extraction, preview, export, and audit features
                will be activated inside protected workflows.
              </h2>

              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                The portal foundation is structured for Google Cloud Storage,
                signed upload links, automated document extraction, role-based
                approval, audit trails, and restricted deletion controls.
              </p>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}