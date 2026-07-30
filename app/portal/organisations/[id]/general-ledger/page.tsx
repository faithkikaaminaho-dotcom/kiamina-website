import { redirect } from "next/navigation";
import {
  ArrowLeft,
  BookOpenCheck,
  Eye,
  FileText,
  Landmark,
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

type GeneralLedgerEntryRow = {
  id: string;
  entry_number: string | null;
  entry_date: string | null;
  source_module: string | null;
  source_record_id: string | null;
  source_reference: string | null;
  description: string | null;
  currency_code: string | null;
  total_debits: number | null;
  total_credits: number | null;
  status: string | null;
  posted_at: string | null;
  created_at: string | null;
};

type AccountingPeriod = {
  id: string;
  period_name: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string | null;
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

function formatModule(value: string | null) {
  if (!value) return "—";

  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default async function GeneralLedgerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    period?: string;
    start_date?: string;
    end_date?: string;
  }>;
}) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;

  const selectedPeriodId = resolvedSearchParams.period || "";
  const customStartDate = resolvedSearchParams.start_date || "";
  const customEndDate = resolvedSearchParams.end_date || "";

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

  const { data: periodRows } = await supabase
    .from("accounting_periods")
    .select("id, period_name, start_date, end_date, status")
    .eq("organisation_id", id)
    .order("start_date", { ascending: false });

  const accountingPeriods = (periodRows || []) as AccountingPeriod[];

  const selectedPeriod =
    accountingPeriods.find((period) => period.id === selectedPeriodId) || null;

  let generalLedgerEntriesQuery = supabase
    .from("general_ledger_entries")
    .select(
      "id, entry_number, entry_date, source_module, source_record_id, source_reference, description, currency_code, total_debits, total_credits, status, posted_at, created_at"
    )
    .eq("organisation_id", id)
    .order("entry_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (selectedPeriod?.start_date) {
    generalLedgerEntriesQuery = generalLedgerEntriesQuery.gte(
      "entry_date",
      selectedPeriod.start_date
    );
  }

  if (selectedPeriod?.end_date) {
    generalLedgerEntriesQuery = generalLedgerEntriesQuery.lte(
      "entry_date",
      selectedPeriod.end_date
    );
  }

  if (!selectedPeriod && customStartDate) {
    generalLedgerEntriesQuery = generalLedgerEntriesQuery.gte(
      "entry_date",
      customStartDate
    );
  }

  if (!selectedPeriod && customEndDate) {
    generalLedgerEntriesQuery = generalLedgerEntriesQuery.lte(
      "entry_date",
      customEndDate
    );
  }

  const { data: generalLedgerEntries, error: generalLedgerEntriesError } =
    await generalLedgerEntriesQuery;

  if (generalLedgerEntriesError) {
    console.error(
      "General ledger register error:",
      generalLedgerEntriesError.message
    );
  }

  const ledgerRows = (generalLedgerEntries || []) as GeneralLedgerEntryRow[];

  const organisationName =
    organisation.trading_name || organisation.legal_name || "Organisation";

  const totalDebits = ledgerRows.reduce(
    (sum, entry) => sum + Number(entry.total_debits || 0),
    0
  );

  const totalCredits = ledgerRows.reduce(
    (sum, entry) => sum + Number(entry.total_credits || 0),
    0
  );

  const draftCount = ledgerRows.filter(
    (entry) => (entry.status || "DRAFT") === "DRAFT"
  ).length;

  const postedCount = ledgerRows.filter(
    (entry) => (entry.status || "") === "POSTED"
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
                  General Ledger
                </div>

                <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
                  General ledger
                </h1>

                <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                  Review ledger entries for {organisationName}. This register is
                  the foundation for posting journals, invoices, bills,
                  receipts, payments, funding transactions, trial balance,
                  financial statements, and management reports.
                </p>

                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
                  This register now supports saved reporting periods and custom
                  date ranges. The filter is based on the General Ledger entry
                  date.
                </p>

                <form
                  action={`/portal/organisations/${organisation.id}/general-ledger`}
                  method="get"
                  className="mt-6 rounded-[1.5rem] border border-[#D9E3F4] bg-[#F8FAFC] p-5"
                >
                  <div className="grid gap-4 xl:grid-cols-[1.2fr_0.7fr_0.7fr_auto] xl:items-end">
                    <div>
                      <label
                        htmlFor="period"
                        className="text-sm font-semibold text-slate-700"
                      >
                        Reporting period
                      </label>

                      <select
                        id="period"
                        name="period"
                        defaultValue={selectedPeriodId}
                        className="mt-2 w-full rounded-2xl border border-[#D9E3F4] bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none"
                      >
                        <option value="">
                          All General Ledger entries
                        </option>

                        {accountingPeriods.map((period) => (
                          <option key={period.id} value={period.id}>
                            {period.period_name || "Unnamed period"}{" "}
                            {period.start_date && period.end_date
                              ? `(${period.start_date} to ${period.end_date})`
                              : ""}
                          </option>
                        ))}
                      </select>

                      <p className="mt-2 text-xs leading-5 text-slate-500">
                        Select a saved accounting period, or leave it blank and
                        use a custom date range.
                      </p>
                    </div>

                    <div>
                      <label
                        htmlFor="start_date"
                        className="text-sm font-semibold text-slate-700"
                      >
                        Custom start date
                      </label>

                      <input
                        id="start_date"
                        name="start_date"
                        type="date"
                        defaultValue={customStartDate}
                        className="mt-2 w-full rounded-2xl border border-[#D9E3F4] bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="end_date"
                        className="text-sm font-semibold text-slate-700"
                      >
                        Custom end date
                      </label>

                      <input
                        id="end_date"
                        name="end_date"
                        type="date"
                        defaultValue={customEndDate}
                        className="mt-2 w-full rounded-2xl border border-[#D9E3F4] bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="inline-flex items-center justify-center rounded-full bg-[#073D7F] px-6 py-3 text-sm font-semibold text-white shadow-sm"
                    >
                      Apply
                    </button>
                  </div>

                  <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    {selectedPeriod ? (
                      <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-600">
                        Current view:{" "}
                        <span className="font-semibold text-slate-950">
                          {selectedPeriod.period_name || "Unnamed period"}
                        </span>{" "}
                        {selectedPeriod.start_date && selectedPeriod.end_date
                          ? `from ${selectedPeriod.start_date} to ${selectedPeriod.end_date}`
                          : ""}
                      </div>
                    ) : customStartDate || customEndDate ? (
                      <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-600">
                        Current view:{" "}
                        <span className="font-semibold text-slate-950">
                          Custom period
                        </span>{" "}
                        {customStartDate
                          ? `from ${customStartDate}`
                          : "from beginning"}{" "}
                        {customEndDate
                          ? `to ${customEndDate}`
                          : "to latest ledger entry"}
                      </div>
                    ) : (
                      <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-600">
                        Current view:{" "}
                        <span className="font-semibold text-slate-950">
                          All General Ledger entries
                        </span>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-3">
                      <a
                        href={`/portal/organisations/${organisation.id}/general-ledger`}
                        className="inline-flex items-center justify-center rounded-full border border-[#D9E3F4] bg-white px-5 py-3 text-sm font-semibold text-[#073D7F]"
                      >
                        Clear Filter
                      </a>

                      <a
                        href={`/portal/organisations/${organisation.id}/periods/new`}
                        className="inline-flex items-center justify-center rounded-full border border-[#D9E3F4] bg-white px-5 py-3 text-sm font-semibold text-[#073D7F]"
                      >
                        Create Period
                      </a>
                    </div>
                  </div>
                </form>
              </div>
            </div>

            <a
              href={`/portal/organisations/${organisation.id}/journal-entries`}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#073D7F] px-6 py-3 text-sm font-semibold text-white shadow-sm"
            >
              <Landmark className="h-4 w-4" />
              Open Journals
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="grid gap-5 md:grid-cols-4">
          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">
              Ledger Entries
            </div>
            <div className="mt-3 text-3xl font-semibold text-slate-950">
              {ledgerRows.length}
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Entries in current view.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">
              Draft Entries
            </div>
            <div className="mt-3 text-3xl font-semibold text-slate-950">
              {draftCount}
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Not yet posted to final ledger.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">
              Posted Entries
            </div>
            <div className="mt-3 text-3xl font-semibold text-slate-950">
              {postedCount}
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Posted entries in current view.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">
              Ledger Balance
            </div>
            <div className="mt-3 text-2xl font-semibold text-slate-950">
              {formatMoney(
                organisation.base_currency_code,
                Number(Math.abs(totalDebits - totalCredits).toFixed(2))
              )}
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Debits and credits should remain balanced.
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-[2rem] border border-[#D9E3F4] bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-[#D9E3F4] px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                Ledger register
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                A controlled register of draft, approved, posted, reversed, and
                void ledger entries filtered by selected period or custom date
                range.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-[#D9E3F4] bg-[#F8FAFC] px-4 py-2 text-sm text-slate-500">
              <Search className="h-4 w-4" />
              Search by account and source will be added later
            </div>
          </div>

          {ledgerRows.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F8FAFC] text-[#073D7F]">
                <FileText className="h-6 w-6" />
              </div>

              <h3 className="mt-5 text-lg font-semibold text-slate-950">
                No ledger entries in this view
              </h3>

              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
                There are no General Ledger entries for the selected reporting
                period or custom date range. Clear the filter or select another
                period to view available ledger records.
              </p>

              <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <a
                  href={`/portal/organisations/${organisation.id}/journal-entries`}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#073D7F] px-6 py-3 text-sm font-semibold text-white"
                >
                  <BookOpenCheck className="h-4 w-4" />
                  Open Journals
                </a>

                <a
                  href={`/portal/organisations/${organisation.id}/journal-entries/new`}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-[#D9E3F4] bg-white px-6 py-3 text-sm font-semibold text-[#073D7F]"
                >
                  <Plus className="h-4 w-4" />
                  Create Journal
                </a>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#D9E3F4]">
                <thead className="bg-[#F8FAFC]">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Entry
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Source
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
                  {ledgerRows.map((entry) => (
                    <tr key={entry.id} className="hover:bg-[#F8FAFC]">
                      <td className="whitespace-nowrap px-6 py-5">
                        <div className="font-semibold text-slate-950">
                          {entry.entry_number || "Untitled GL entry"}
                        </div>

                        <div className="mt-1 text-xs text-slate-500">
                          Ref: {entry.source_reference || "Not provided"}
                        </div>

                        <div className="mt-1 max-w-xs truncate text-xs text-slate-500">
                          {entry.description || "No description"}
                        </div>

                        <div className="mt-1 text-xs text-slate-500">
                          Created {formatDate(entry.created_at)}
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-6 py-5 text-sm text-slate-600">
                        {formatModule(entry.source_module)}
                      </td>

                      <td className="whitespace-nowrap px-6 py-5 text-sm text-slate-600">
                        {formatDate(entry.entry_date)}
                      </td>

                      <td className="whitespace-nowrap px-6 py-5 text-right text-sm font-semibold text-slate-950">
                        {formatMoney(entry.currency_code, entry.total_debits)}
                      </td>

                      <td className="whitespace-nowrap px-6 py-5 text-right text-sm font-semibold text-slate-950">
                        {formatMoney(entry.currency_code, entry.total_credits)}
                      </td>

                      <td className="whitespace-nowrap px-6 py-5">
                        <span className="inline-flex rounded-full bg-[#F1F1F1] px-3 py-1 text-xs font-semibold text-[#073D7F]">
                          {formatStatus(entry.status)}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-6 py-5 text-right">
                        <a
                          href={`/portal/organisations/${organisation.id}/general-ledger/${entry.id}`}
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
          The general ledger is the posting layer. The saved reporting period
          selector and custom date range are foundation controls and filter the
          register by General Ledger entry date. The module remains
          foundation-stage until full review, approval, reversal, source
          transaction posting, period locking, and audit trail workflows are
          completed.
        </div>
      </section>
    </main>
  );
}