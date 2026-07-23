import { redirect } from "next/navigation";
import { ArrowLeft, ReceiptText } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import CreatePurchaseBillForm from "./CreatePurchaseBillForm";

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

export default async function NewPurchaseBillPage({
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

  const { data: suppliers } = await supabase
    .from("suppliers")
    .select("id, supplier_name")
    .eq("organisation_id", id)
    .eq("is_active", true)
    .order("supplier_name", { ascending: true });

  const { data: productsServices } = await supabase
    .from("products_services")
    .select("id, item_name, unit_price, currency_code, expense_account_id, tax_account_id")
    .eq("organisation_id", id)
    .eq("is_active", true)
    .order("item_name", { ascending: true });

  const { data: expenseAccounts } = await supabase
    .from("chart_of_accounts")
    .select("id, account_code, account_name, account_type")
    .eq("organisation_id", id)
    .eq("is_active", true)
    .in("account_type", ["COST_OF_SALES", "OPERATING_EXPENSE"])
    .order("account_code", { ascending: true });

  const { data: payableAccounts } = await supabase
    .from("chart_of_accounts")
    .select("id, account_code, account_name, account_type")
    .eq("organisation_id", id)
    .eq("is_active", true)
    .in("account_type", ["LIABILITY"])
    .order("account_code", { ascending: true });

  const { data: taxAccounts } = await supabase
    .from("chart_of_accounts")
    .select("id, account_code, account_name, account_type")
    .eq("organisation_id", id)
    .eq("is_active", true)
    .in("account_type", ["TAX", "LIABILITY", "ASSET"])
    .order("account_code", { ascending: true });

  const { data: accountingPeriods } = await supabase
    .from("accounting_periods")
    .select("id, name, start_date, end_date")
    .eq("organisation_id", id)
    .order("start_date", { ascending: false });

  const { data: engagements } = await supabase
    .from("engagements")
    .select("id, name, engagement_type")
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
              <ReceiptText className="h-6 w-6" />
            </div>

            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                Purchase Bill
              </div>

              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
                Create draft bill
              </h1>

              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                Create a draft purchase bill for {organisationName}. This
                supports expense capture, payables tracking, supplier
                statements, procurement analysis, and management reporting. It
                will not post to the ledger until a posting workflow is added.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <CreatePurchaseBillForm
          organisationId={organisation.id}
          defaultCurrency={organisation.base_currency_code}
          suppliers={suppliers || []}
          productsServices={productsServices || []}
          expenseAccounts={expenseAccounts || []}
          payableAccounts={payableAccounts || []}
          taxAccounts={taxAccounts || []}
          accountingPeriods={accountingPeriods || []}
          engagements={engagements || []}
        />
      </section>
    </main>
  );
}