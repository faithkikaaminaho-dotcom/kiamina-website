import { redirect } from "next/navigation";
import { ArrowLeft, BookOpenCheck } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import CreateJournalEntryForm from "../../new/CreateJournalEntryForm";

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

const editableStatuses = ["DRAFT", "READY_FOR_REVIEW", "REVIEWED"];

export default async function EditJournalEntryPage({
  params,
}: {
  params: Promise<{ id: string; journalId: string }>;
}) {
  const { id, journalId } = await params;

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

  const { data: journal } = await supabase
    .from("journal_entries")
    .select("*")
    .eq("id", journalId)
    .eq("organisation_id", id)
    .single();

  if (!journal) {
    redirect(`/portal/organisations/${id}/journal-entries`);
  }

  if (!editableStatuses.includes(journal.status)) {
    redirect(`/portal/organisations/${id}/journal-entries/${journalId}`);
  }

  const { data: existingLedgerEntry } = await supabase
    .from("general_ledger_entries")
    .select("id")
    .eq("organisation_id", id)
    .eq("source_module", "JOURNAL_ENTRY")
    .eq("source_record_id", journalId)
    .maybeSingle();

  if (existingLedgerEntry) {
    redirect(`/portal/organisations/${id}/journal-entries/${journalId}`);
  }

  const { data: journalLines } = await supabase
    .from("journal_entry_lines")
    .select(
      "account_id, description, debit_amount, credit_amount, customer_id, supplier_id, investor_id, department_id, location_id, project_id, cost_centre_id, class_id, fund_grant_id, service_line_id"
    )
    .eq("journal_entry_id", journalId)
    .eq("organisation_id", id)
    .order("line_number", { ascending: true });

  const { data: accounts } = await supabase
    .from("chart_of_accounts")
    .select("id, account_code, account_name, account_type, account_subtype")
    .eq("organisation_id", id)
    .eq("is_active", true)
    .order("account_code", { ascending: true });

  const { data: customers } = await supabase
    .from("customers")
    .select("id, customer_name")
    .eq("organisation_id", id)
    .eq("is_active", true)
    .order("customer_name", { ascending: true });

  const { data: suppliers } = await supabase
    .from("suppliers")
    .select("id, supplier_name")
    .eq("organisation_id", id)
    .eq("is_active", true)
    .order("supplier_name", { ascending: true });

  const { data: investors } = await supabase
    .from("investors")
    .select("id, investor_name")
    .eq("organisation_id", id)
    .eq("is_active", true)
    .order("investor_name", { ascending: true });

  const { data: trackingCategories } = await supabase
    .from("tracking_categories")
    .select("id, category_code, category_name")
    .eq("organisation_id", id)
    .or("is_active.eq.true,is_active.is.null")
    .order("category_code", { ascending: true });

  const { data: trackingOptions } = await supabase
    .from("tracking_options")
    .select("id, tracking_category_id, option_code, option_name, is_active")
    .eq("organisation_id", id)
    .or("is_active.eq.true,is_active.is.null")
    .order("option_name", { ascending: true });

  const organisationName =
    organisation.trading_name || organisation.legal_name || "Organisation";

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <section className="border-b border-[#D9E3F4] bg-white">
        <div className="mx-auto max-w-6xl px-6 py-8 lg:px-8">
          <a
            href={`/portal/organisations/${organisation.id}/journal-entries/${journal.id}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#073D7F]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to journal detail
          </a>

          <div className="mt-8 flex items-start gap-5">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F1F1F1] text-[#073D7F]">
              <BookOpenCheck className="h-6 w-6" />
            </div>

            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                Edit Draft Journal
              </div>

              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
                {journal.journal_number || "Draft journal"}
              </h1>

              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                Review and edit this draft journal for {organisationName} before
                posting to the General Ledger. Posted or voided journals cannot
                be edited.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10 lg:px-8">
        <CreateJournalEntryForm
          organisationId={organisation.id}
          defaultCurrency={organisation.base_currency_code}
          accounts={accounts || []}
          customers={customers || []}
          suppliers={suppliers || []}
          investors={investors || []}
          trackingCategories={trackingCategories || []}
          trackingOptions={trackingOptions || []}
          mode="edit"
          initialJournal={journal}
          initialLines={journalLines || []}
        />
      </section>
    </main>
  );
}