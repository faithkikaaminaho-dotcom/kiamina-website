import { redirect } from "next/navigation";
import { ArrowLeft, FileText } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import CreateBankStatementLinesForm from "./CreateBankStatementLinesForm";

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

export default async function NewBankStatementLinesPage({
  params,
}: {
  params: Promise<{ id: string; bankAccountId: string }>;
}) {
  const { id, bankAccountId } = await params;

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

  const { data: bankAccount } = await supabase
    .from("bank_accounts")
    .select("id, account_name, bank_name, account_number, currency_code")
    .eq("id", bankAccountId)
    .eq("organisation_id", id)
    .single();

  if (!bankAccount) {
    redirect(`/portal/organisations/${id}/banking`);
  }

  const organisationName =
    organisation.trading_name || organisation.legal_name || "Organisation";

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <section className="border-b border-[#D9E3F4] bg-white">
        <div className="mx-auto max-w-6xl px-6 py-8 lg:px-8">
          <a
            href={`/portal/organisations/${organisation.id}/banking/${bankAccount.id}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#073D7F]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to bank account
          </a>

          <div className="mt-8 flex items-start gap-5">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F1F1F1] text-[#073D7F]">
              <FileText className="h-6 w-6" />
            </div>

            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                Bank Statement Import
              </div>

              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
                Import statement lines
              </h1>

              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                Manually enter bank statement lines for {bankAccount.account_name}{" "}
                under {organisationName}. Later, this screen will receive
                extracted lines from uploaded bank statements.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10 lg:px-8">
        <CreateBankStatementLinesForm
          organisationId={organisation.id}
          bankAccountId={bankAccount.id}
          currencyCode={bankAccount.currency_code || organisation.base_currency_code}
        />
      </section>
    </main>
  );
}