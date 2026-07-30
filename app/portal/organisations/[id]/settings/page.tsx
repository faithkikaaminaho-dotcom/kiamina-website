import { redirect } from "next/navigation";
import { ArrowLeft, Building2, CalendarDays, Settings } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import AccountingYearSettingsForm from "./AccountingYearSettingsForm";

export const dynamic = "force-dynamic";

const internalRoles = [
  "SUPER_ADMIN",
  "ADMIN",
  "STAFF",
  "IT_ADMIN",
  "ACCOUNTANT_ADMIN",
  "ACCOUNTANT_USER",
  "COMPLIANCE_ADMIN",
  "OPERATIONS_ADMIN",
];

type Organisation = {
  id: string;
  legal_name: string | null;
  trading_name: string | null;
  base_currency_code: string | null;
  reporting_framework_code: string | null;
  accounting_year_start_month: number | null;
  accounting_year_start_day: number | null;
  accounting_year_end_month: number | null;
  accounting_year_end_day: number | null;
};

function formatAccountingYear(organisation: Organisation) {
  const startMonth = organisation.accounting_year_start_month;
  const startDay = organisation.accounting_year_start_day;
  const endMonth = organisation.accounting_year_end_month;
  const endDay = organisation.accounting_year_end_day;

  if (!startMonth || !startDay || !endMonth || !endDay) {
    return "Not configured";
  }

  return `${String(startDay).padStart(2, "0")}/${String(startMonth).padStart(
    2,
    "0"
  )} to ${String(endDay).padStart(2, "0")}/${String(endMonth).padStart(
    2,
    "0"
  )}`;
}

export default async function OrganisationSettingsPage({
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

  if (!profile || !internalRoles.includes(profile.role)) {
    redirect("/portal");
  }

  const { data: organisationRow } = await supabase
    .from("organisations")
    .select(
      "id, legal_name, trading_name, base_currency_code, reporting_framework_code, accounting_year_start_month, accounting_year_start_day, accounting_year_end_month, accounting_year_end_day"
    )
    .eq("id", id)
    .single();

  if (!organisationRow) {
    redirect("/portal/organisations");
  }

  const organisation = organisationRow as Organisation;

  const organisationName =
    organisation.trading_name || organisation.legal_name || "Organisation";

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <section className="border-b border-[#D9E3F4] bg-white">
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          <a
            href={`/portal/organisations/${organisation.id}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#073D7F]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to organisation workspace
          </a>

          <div className="mt-8 flex items-start gap-5">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F1F1F1] text-[#073D7F]">
              <Settings className="h-6 w-6" />
            </div>

            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                Organisation Settings
              </div>

              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
                Settings for {organisationName}
              </h1>

              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                Configure organisation-level settings that drive reporting,
                period controls, accounting year setup, and future compliance
                workflows.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="mb-8 grid gap-5 md:grid-cols-3">
          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-[#073D7F]" />
              <div className="text-sm font-semibold text-slate-500">
                Organisation
              </div>
            </div>

            <div className="mt-3 text-lg font-semibold text-slate-950">
              {organisationName}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">
              Reporting Framework
            </div>

            <div className="mt-3 text-lg font-semibold text-slate-950">
              {organisation.reporting_framework_code || "Not set"}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <CalendarDays className="h-5 w-5 text-[#073D7F]" />
              <div className="text-sm font-semibold text-slate-500">
                Accounting Year
              </div>
            </div>

            <div className="mt-3 text-lg font-semibold text-slate-950">
              {formatAccountingYear(organisation)}
            </div>
          </div>
        </div>

        <AccountingYearSettingsForm
          organisationId={organisation.id}
          startMonth={organisation.accounting_year_start_month}
          startDay={organisation.accounting_year_start_day}
          endMonth={organisation.accounting_year_end_month}
          endDay={organisation.accounting_year_end_day}
        />
      </section>
    </main>
  );
}