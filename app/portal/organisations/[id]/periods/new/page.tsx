import { redirect } from "next/navigation";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import CreateAccountingPeriodForm from "./CreateAccountingPeriodForm";

export const dynamic = "force-dynamic";

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

export default async function NewAccountingPeriodPage({
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

  const { data: organisation } = await supabase
    .from("organisations")
    .select(
      "id, legal_name, trading_name, reporting_framework_code, base_currency_code, accounting_year_start_month, accounting_year_start_day, accounting_year_end_month, accounting_year_end_day"
    )
    .eq("id", id)
    .single();

  if (!organisation) {
    redirect("/portal/organisations");
  }

  const { data: engagements } = await supabase
    .from("engagements")
    .select("id, name, engagement_type")
    .eq("organisation_id", id)
    .order("created_at", { ascending: false });

  const organisationName =
    organisation.trading_name || organisation.legal_name || "Organisation";

  const defaultFramework = organisation.reporting_framework_code || "";
  const defaultCurrency = organisation.base_currency_code || "";

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <section className="border-b border-[#D9E3F4] bg-white">
        <div className="mx-auto max-w-6xl px-6 py-8 lg:px-8">
          <a
            href={`/portal/organisations/${organisation.id}/periods`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#073D7F]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to period control
          </a>

          <div className="mt-8 flex items-start gap-5">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F1F1F1] text-[#073D7F]">
              <CalendarDays className="h-6 w-6" />
            </div>

            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                Period Control
              </div>

              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
                Create lock, close, or reporting range
              </h1>

              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                Create a date range for {organisationName}. You can manually
                select dates or generate month, quarter, six-month, and year-end
                ranges from the organisation’s saved accounting year setup.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10 lg:px-8">
        <CreateAccountingPeriodForm
          organisationId={organisation.id}
          engagements={engagements || []}
          defaultFramework={defaultFramework}
          defaultCurrency={defaultCurrency}
          accountingYearStartMonth={organisation.accounting_year_start_month}
          accountingYearStartDay={organisation.accounting_year_start_day}
          accountingYearEndMonth={organisation.accounting_year_end_month}
          accountingYearEndDay={organisation.accounting_year_end_day}
        />
      </section>
    </main>
  );
}