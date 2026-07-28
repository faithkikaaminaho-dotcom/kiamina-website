import { redirect } from "next/navigation";
import {
  ArrowLeft,
  BookOpenCheck,
  Eye,
  FileText,
  Plus,
  Search,
} from "lucide-react";
import { createClient } from "@/utils/supabase/server";

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

type JournalEntryRow = {
  id: string;
  journal_number: string | null;
  journal_date: string | null;
  journal_type: string | null;
  description: string | null;
  reference_number: string | null;
  currency_code: string | null;
  total_debits: number | null;
  total_credits: number | null;
  status: string | null;
  created_at: string | null;
};

function formatDate(value: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatMoney(currencyCode: string | null, amount: number | null) {
  const numericAmount = Number(amount || 0);

  return `${currencyCode || "—"} ${numericAmount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatStatus(status: string | null) {
  if (!status) return "Draft";

  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatType(value: string | null) {
  if (!value) return "—";

  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default async function JournalEntriesPage({
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

  const { data: journalEntries, error: journalEntriesError } = await supabase
    .from("journal_entries")
    .select(
      "id, journal_number, journal_date, journal_type, description, reference_number, currency_code, total_debits, total_credits, status, created_at"
    )
    .eq("organisation_id", id)
    .order("journal_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (journalEntriesError) {
    console.error("Journal entries register error:", journalEntriesError.message);
  }

  const journalRows = (journalEntries || []) as JournalEntryRow[];

  const organisationName =
    organisation.trading_name || organisation.legal_name || "Organisation";

  const totalDebits = journalRows.reduce(
    (sum, journal) => sum + Number(journal.total_debits || 0),
    0
  );

  const totalCredits = journalRows.reduce(
    (sum, journal) => sum + Number(journal.total_credits || 0),
    0
  );

  const draftCount = journalRows.filter(
    (journal) => (journal.status || "DRAFT") === "DRAFT"
  ).length;

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
                <BookOpenCheck className="h-6 w-6" />
              </div>

              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                  Journals Module
                </div>

                <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
                  Journal entries
                </h1>

                <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                  Review draft journals created for {organisationName}. This
                  includes manual journals, opening balances, payroll journals,
                  tax journals, accruals, prepayments, depreciation, FX
                  revaluations, correction entries, and year-end adjustments.
                </p>
              </div>
            </div>

            <a
              href={`/portal/organisations/${organisation.id}/journal-entries/new`}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#073D7F] px-6 py-3 text-sm font-semibold text-white shadow-sm"
            >
              <Plus className="h-4 w-4" />
              New Journal Entry
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="grid gap-5 md:grid-cols-4">
          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">
              Total Journals
            </div>
            <div className="mt-3 text-3xl font-semibold text-slate-950">
              {journalRows.length}
            </div>
            <p className="mt-2 text-sm text-slate-500">
              All journal entries recorded.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">
              Draft Journals
            </div>
            <div className="mt-3 text-3xl font-semibold text-slate-950">
              {draftCount}
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Not yet posted to the ledger.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">
              Total Debits
            </div>
            <div className="mt-3 text-3xl font-semibold text-slate-950">
              {formatMoney(
                organisation.base_currency_code,
                Number(totalDebits.toFixed(2))
              )}
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Aggregate draft journal debits.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">
              Total Credits
            </div>
            <div className="mt-3 text-3xl font-semibold text-slate-950">
              {formatMoney(
                organisation.base_currency_code,
                Number(totalCredits.toFixed(2))
              )}
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Aggregate draft journal credits.
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-[2rem] border border-[#D9E3F4] bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-[#D9E3F4] px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                Journal register
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                A working register of draft journals created for this
                organisation.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-[#D9E3F4] bg-[#F8FAFC] px-4 py-2 text-sm text-slate-500">
              <Search className="h-4 w-4" />
              Search and filters will be added later
            </div>
          </div>

          {journalRows.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F8FAFC] text-[#073D7F]">
                <FileText className="h-6 w-6" />
              </div>

              <h3 className="mt-5 text-lg font-semibold text-slate-950">
                No journal entries yet
              </h3>

              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
                Create the first draft journal entry for this organisation. It
                will appear here before future review, approval, posting, and
                general ledger workflows.
              </p>

              <a
                href={`/portal/organisations/${organisation.id}/journal-entries/new`}
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-[#073D7F] px-6 py-3 text-sm font-semibold text-white"
              >
                <Plus className="h-4 w-4" />
                Create Journal Entry
              </a>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#D9E3F4]">
                <thead className="bg-[#F8FAFC]">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Journal
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Date
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Debits
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Credits
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Status
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#D9E3F4] bg-white">
                  {journalRows.map((journal) => (
                    <tr key={journal.id} className="hover:bg-[#F8FAFC]">
                      <td className="whitespace-nowrap px-6 py-5">
                        <div className="font-semibold text-slate-950">
                          {journal.journal_number || "Untitled journal"}
                        </div>

                        <div className="mt-1 text-xs text-slate-500">
                          Ref: {journal.reference_number || "Not provided"}
                        </div>

                        <div className="mt-1 max-w-xs truncate text-xs text-slate-500">
                          {journal.description || "No description"}
                        </div>

                        <div className="mt-1 text-xs text-slate-500">
                          Created {formatDate(journal.created_at)}
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-6 py-5 text-sm text-slate-600">
                        {formatType(journal.journal_type)}
                      </td>

                      <td className="whitespace-nowrap px-6 py-5 text-sm text-slate-600">
                        {formatDate(journal.journal_date)}
                      </td>

                      <td className="whitespace-nowrap px-6 py-5 text-right text-sm font-semibold text-slate-950">
                        {formatMoney(journal.currency_code, journal.total_debits)}
                      </td>

                      <td className="whitespace-nowrap px-6 py-5 text-right text-sm font-semibold text-slate-950">
                        {formatMoney(
                          journal.currency_code,
                          journal.total_credits
                        )}
                      </td>

                      <td className="whitespace-nowrap px-6 py-5">
                        <span className="inline-flex rounded-full bg-[#F1F1F1] px-3 py-1 text-xs font-semibold text-[#073D7F]">
                          {formatStatus(journal.status)}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-6 py-5 text-right">
                        <a
                          href={`/portal/organisations/${organisation.id}/journal-entries/${journal.id}`}
                          className="inline-flex items-center gap-2 rounded-full border border-[#D9E3F4] bg-white px-4 py-2 text-xs font-semibold text-[#073D7F] hover:border-[#073D7F]"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-6 rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 text-sm leading-7 text-slate-600 shadow-sm">
          <span className="font-semibold text-slate-950">Control note:</span>{" "}
          These journal entries are draft accounting records. They do not affect
          the ledger, trial balance, financial statements, or management reports
          until Kiamina adds posting, review, approval, and audit trail controls.
        </div>
      </section>
    </main>
  );
}