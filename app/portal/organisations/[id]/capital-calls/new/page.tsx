import { redirect } from "next/navigation";
import { ArrowLeft, Landmark } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import CreateCapitalCallForm from "./CreateCapitalCallForm";

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

export default async function NewCapitalCallPage({
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
    .select("id, legal_name, trading_name, base_currency_code")
    .eq("id", id)
    .single();

  if (!organisation) {
    redirect("/portal/organisations");
  }

  const { data: investors } = await supabase
    .from("investors")
    .select(
      "id, investor_name, investor_type, funding_type, currency_code, committed_amount, contributed_amount, outstanding_amount"
    )
    .eq("organisation_id", id)
    .eq("is_active", true)
    .order("investor_name", { ascending: true });

  const { data: receivableAccounts } = await supabase
    .from("chart_of_accounts")
    .select(
      "id, account_code, account_name, account_type, account_subtype, fs_line_item, management_report_category, is_control_account"
    )
    .eq("organisation_id", id)
    .eq("is_active", true)
    .eq("account_type", "ASSET")
    .eq("account_subtype", "CURRENT_ASSET")
    .or(
      "fs_line_item.ilike.%receivable%,management_report_category.ilike.%receivable%,is_control_account.eq.true"
    )
    .order("account_code", { ascending: true });

  const { data: equityAccounts } = await supabase
    .from("chart_of_accounts")
    .select("id, account_code, account_name, account_type, account_subtype")
    .eq("organisation_id", id)
    .eq("is_active", true)
    .eq("account_type", "EQUITY")
    .order("account_code", { ascending: true });

  const { data: liabilityAccounts } = await supabase
    .from("chart_of_accounts")
    .select("id, account_code, account_name, account_type, account_subtype")
    .eq("organisation_id", id)
    .eq("is_active", true)
    .eq("account_type", "LIABILITY")
    .order("account_code", { ascending: true });

  const { data: accountingPeriods } = await supabase
  .from("accounting_periods")
  .select("id, name, start_date, end_date, period_type")
  .eq("organisation_id", id)
  .not("name", "ilike", "%management%")
  .not("name", "ilike", "%report%")
  .order("start_date", { ascending: false });

  const { data: engagements } = await supabase
    .from("engagements")
    .select("id, name")
    .eq("organisation_id", id)
    .order("created_at", { ascending: false });

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
              <Landmark className="h-6 w-6" />
            </div>

            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                Funding Module
              </div>

              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
                Create draft capital call
              </h1>

              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                Raise a draft capital call for {organisationName}. Capital calls
                track funding requests, shareholder commitments, donor funding
                obligations, director loans, shareholder loans, and other
                committed funding arrangements before the cash is received.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <CreateCapitalCallForm
          organisationId={organisation.id}
          defaultCurrency={organisation.base_currency_code}
          investors={investors || []}
          receivableAccounts={receivableAccounts || []}
          equityAccounts={equityAccounts || []}
          liabilityAccounts={liabilityAccounts || []}
          accountingPeriods={accountingPeriods || []}
          engagements={engagements || []}
        />
      </section>
    </main>
  );
}