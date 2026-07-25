import { redirect } from "next/navigation";
import { ArrowLeft, Landmark } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import CreateFundingTransactionForm from "./CreateFundingTransactionForm";

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

export default async function NewFundingTransactionPage({
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
    .select("id, investor_name, investor_type, funding_type, currency_code")
    .eq("organisation_id", id)
    .eq("is_active", true)
    .order("investor_name", { ascending: true });

  const { data: capitalCalls } = await supabase
    .from("capital_calls")
    .select(
      "id, call_number, investor_id, currency_code, funding_type, funding_purpose, called_amount, received_amount, outstanding_amount, receivable_account_id, equity_account_id, liability_account_id"
    )
    .eq("organisation_id", id)
    .order("created_at", { ascending: false });

  const { data: bankAccounts } = await supabase
    .from("chart_of_accounts")
    .select(
      "id, account_code, account_name, account_type, account_subtype, fs_line_item, management_report_category, is_control_account"
    )
    .eq("organisation_id", id)
    .eq("is_active", true)
    .or("is_bank_account.eq.true,account_type.eq.ASSET")
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

  const { data: incomeAccounts } = await supabase
    .from("chart_of_accounts")
    .select("id, account_code, account_name, account_type, account_subtype")
    .eq("organisation_id", id)
    .eq("is_active", true)
    .eq("account_type", "INCOME")
    .order("account_code", { ascending: true });

  const { data: interestExpenseAccounts } = await supabase
    .from("chart_of_accounts")
    .select("id, account_code, account_name, account_type, account_subtype")
    .eq("organisation_id", id)
    .eq("is_active", true)
    .eq("account_type", "EXPENSE")
    .in("account_subtype", ["FINANCING_EXPENSE", "OTHER_OPERATING_EXPENSE"])
    .order("account_code", { ascending: true });

  const { data: accountingPeriods } = await supabase
    .from("accounting_periods")
    .select("id, name")
    .eq("organisation_id", id)
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
                Create draft funding transaction
              </h1>

              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                Record an actual funding movement for {organisationName}. This
                supports investor funding, capital call receipts, grants,
                donations, loan drawdowns, director loans, shareholder loans,
                repayments, and interest payments. It will not post to the
                ledger until controlled posting and approval workflows are
                added.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <CreateFundingTransactionForm
          organisationId={organisation.id}
          defaultCurrency={organisation.base_currency_code}
          investors={investors || []}
          capitalCalls={capitalCalls || []}
          bankAccounts={bankAccounts || []}
          equityAccounts={equityAccounts || []}
          liabilityAccounts={liabilityAccounts || []}
          incomeAccounts={incomeAccounts || []}
          interestExpenseAccounts={interestExpenseAccounts || []}
          accountingPeriods={accountingPeriods || []}
          engagements={engagements || []}
        />
      </section>
    </main>
  );
}