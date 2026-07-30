import { redirect } from "next/navigation";
import { ArrowLeft, Banknote } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import CreateBankAccountForm from "./CreateBankAccountForm";

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

export default async function NewBankAccountPage({
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

  const { data: accounts } = await supabase
    .from("chart_of_accounts")
    .select("id, account_code, account_name, account_type, account_subtype")
    .eq("organisation_id", id)
    .eq("is_active", true)
    .order("account_code", { ascending: true });

  const organisationName =
    organisation.trading_name || organisation.legal_name || "Organisation";

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <section className="border-b border-[#D9E3F4] bg-white">
        <div className="mx-auto max-w-6xl px-6 py-8 lg:px-8">
          <a
            href={`/portal/organisations/${organisation.id}/banking`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#073D7F]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to banking
          </a>

          <div className="mt-8 flex items-start gap-5">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F1F1F1] text-[#073D7F]">
              <Banknote className="h-6 w-6" />
            </div>

            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                Banking Setup
              </div>

              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
                Add bank account
              </h1>

              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                Create a bank, cash, petty cash, mobile money, or domiciliary
                account for {organisationName}. Link it to the correct Chart of
                Accounts line so reconciliation can support General Ledger
                posting.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10 lg:px-8">
        <CreateBankAccountForm
          organisationId={organisation.id}
          defaultCurrency={organisation.base_currency_code}
          accounts={accounts || []}
        />
      </section>
    </main>
  );
}