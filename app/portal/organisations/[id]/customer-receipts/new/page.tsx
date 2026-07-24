import { redirect } from "next/navigation";
import { ArrowLeft, WalletCards } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import CreateCustomerReceiptForm from "./CreateCustomerReceiptForm";

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

export default async function NewCustomerReceiptPage({
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

  const { data: customers } = await supabase
    .from("customers")
    .select("id, customer_name")
    .eq("organisation_id", id)
    .eq("is_active", true)
    .order("customer_name", { ascending: true });

  const { data: invoices } = await supabase
    .from("sales_invoices")
    .select(
  "id, invoice_number, customer_id, currency_code, total_amount, balance_due, status, receivable_account_id"
)
    .eq("organisation_id", id)
    .order("created_at", { ascending: false });

  const { data: bankAccounts } = await supabase
    .from("chart_of_accounts")
    .select("id, account_code, account_name, account_type")
    .eq("organisation_id", id)
    .eq("is_active", true)
    .or("is_bank_account.eq.true,account_type.eq.ASSET")
    .order("account_code", { ascending: true });

  const { data: receivableAccounts } = await supabase
    .from("chart_of_accounts")
    .select("id, account_code, account_name, account_type")
    .eq("organisation_id", id)
    .eq("is_active", true)
    .eq("account_type", "ASSET")
    .order("account_code", { ascending: true });

  const { data: incomeAccounts } = await supabase
  .from("chart_of_accounts")
  .select("id, account_code, account_name, account_type")
  .eq("organisation_id", id)
  .eq("is_active", true)
  .in("account_type", ["REVENUE", "OTHER_INCOME"])
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
              <WalletCards className="h-6 w-6" />
            </div>

            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                Customer Receipt
              </div>

              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
                Create draft customer receipt
              </h1>

              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                Record a draft customer receipt for {organisationName}. This
                supports cash receipt tracking, receivables settlement, customer
                statements, bank reconciliation, and management reporting. It
                will not post to the ledger until a controlled posting workflow
                is added.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <CreateCustomerReceiptForm
          organisationId={organisation.id}
          defaultCurrency={organisation.base_currency_code}
          customers={customers || []}
          invoices={invoices || []}
          bankAccounts={bankAccounts || []}
          receivableAccounts={receivableAccounts || []}
          incomeAccounts={incomeAccounts || []}
          accountingPeriods={accountingPeriods || []}
          engagements={engagements || []}
        />
      </section>
    </main>
  );
}