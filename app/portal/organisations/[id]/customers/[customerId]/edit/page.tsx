import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, UserRoundCog } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import EditCustomerForm from "./EditCustomerForm";

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

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ id: string; customerId: string }>;
}) {
  const { id, customerId } = await params;
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

  const { data: customer } = await supabase
    .from("customers")
    .select("*")
    .eq("id", customerId)
    .eq("organisation_id", id)
    .single();

  if (!customer) {
    redirect(`/portal/organisations/${id}/customers`);
  }

  const { data: receivableAccounts } = await supabase
    .from("chart_of_accounts")
    .select("id, account_code, account_name")
    .eq("organisation_id", id)
    .eq("is_active", true)
    .eq("account_type", "ASSET")
    .eq("account_subtype", "CURRENT_ASSET")
    .or(
      "fs_line_item.ilike.%receivable%,management_report_category.ilike.%receivable%,is_control_account.eq.true"
    )
    .order("account_code", { ascending: true });

  const organisationName =
    organisation.trading_name ||
    organisation.legal_name ||
    "Organisation";

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <section className="border-b border-[#D9E3F4] bg-white">
        <div className="mx-auto max-w-6xl px-6 py-8 lg:px-8">
          <Link
            href={`/portal/organisations/${id}/customers/${customerId}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#073D7F]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to customer
          </Link>

          <div className="mt-8 flex items-start gap-5">
            <div className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#F1F1F1] text-[#073D7F]">
              <UserRoundCog className="h-6 w-6" />
            </div>

            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                Customer Master Data
              </div>

              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
                Edit customer
              </h1>

              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                Update {customer.customer_name} for {organisationName}.
                Historical invoices and receipts remain unchanged.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10 lg:px-8">
        <EditCustomerForm
          organisationId={organisation.id}
          customer={customer}
          defaultCurrency={organisation.base_currency_code}
          receivableAccounts={receivableAccounts || []}
        />
      </section>
    </main>
  );
}