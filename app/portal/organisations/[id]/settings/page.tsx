import { redirect } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Globe2,
  Mail,
  Phone,
  Settings,
  ShieldCheck,
  UserRound,
} from "lucide-react";
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
  logo_url: string | null;
  logo_storage_path: string | null;
  country_code: string | null;
  country_name: string | null;
  primary_email: string | null;
  primary_phone: string | null;
  primary_contact_name: string | null;
  primary_contact_email: string | null;
  primary_contact_phone: string | null;
  risk_rating: string | null;
  onboarding_status: string | null;
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

function formatStatus(value?: string | null) {
  if (!value) return "Not set";

  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
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
      "id, legal_name, trading_name, logo_url, logo_storage_path, country_code, country_name, primary_email, primary_phone, primary_contact_name, primary_contact_email, primary_contact_phone, risk_rating, onboarding_status, base_currency_code, reporting_framework_code, accounting_year_start_month, accounting_year_start_day, accounting_year_end_month, accounting_year_end_day"
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

          <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-5">
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
                  Configure the organisation’s core profile, reporting basis,
                  client status, contact details, and accounting year. These
                  settings support accounting workflows, reporting filters,
                  onboarding review, and future compliance controls.
                </p>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-[#F8FAFC] p-5">
              <div className="flex items-start gap-4">
                {organisation.logo_url ? (
                  <img
                    src={organisation.logo_url}
                    alt={`${organisationName} logo`}
                    className="h-14 w-14 rounded-2xl border border-[#D9E3F4] bg-white object-contain p-2"
                  />
                ) : (
                  <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#073D7F]">
                    <Building2 className="h-6 w-6" />
                  </div>
                )}

                <div>
                  <div className="text-sm font-semibold text-slate-950">
                    Client Context
                  </div>
                  <div className="mt-2 text-sm text-slate-500">
                    {organisation.country_name || "Country not set"} ·{" "}
                    {organisation.base_currency_code || "Currency not set"}
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    {formatStatus(organisation.onboarding_status)} · Risk:{" "}
                    {formatStatus(organisation.risk_rating)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="mb-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
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
            <div className="mt-1 text-sm text-slate-500">
              Legal: {organisation.legal_name || "Not set"}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Globe2 className="h-5 w-5 text-[#073D7F]" />
              <div className="text-sm font-semibold text-slate-500">
                Reporting Basis
              </div>
            </div>

            <div className="mt-3 text-lg font-semibold text-slate-950">
              {organisation.reporting_framework_code || "Not set"}
            </div>
            <div className="mt-1 text-sm text-slate-500">
              {organisation.country_name || "Country not set"} ·{" "}
              {organisation.base_currency_code || "Currency not set"}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-[#073D7F]" />
              <div className="text-sm font-semibold text-slate-500">
                Client Status
              </div>
            </div>

            <div className="mt-3 text-lg font-semibold text-slate-950">
              {formatStatus(organisation.onboarding_status)}
            </div>
            <div className="mt-1 text-sm text-slate-500">
              Risk: {formatStatus(organisation.risk_rating)}
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

        <div className="mb-8 grid gap-5 md:grid-cols-2">
          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-[#073D7F]" />
              <div className="text-sm font-semibold text-slate-500">
                General Contact
              </div>
            </div>

            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <div>Email: {organisation.primary_email || "Not set"}</div>
              <div>Phone: {organisation.primary_phone || "Not set"}</div>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <UserRound className="h-5 w-5 text-[#073D7F]" />
              <div className="text-sm font-semibold text-slate-500">
                Primary Contact Person
              </div>
            </div>

            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <div>Name: {organisation.primary_contact_name || "Not set"}</div>
              <div>
                Email: {organisation.primary_contact_email || "Not set"}
              </div>
              <div>
                Phone: {organisation.primary_contact_phone || "Not set"}
              </div>
            </div>
          </div>
        </div>

        <AccountingYearSettingsForm
          organisation={organisation}
        />
      </section>
    </main>
  );
}