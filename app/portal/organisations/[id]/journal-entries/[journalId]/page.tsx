import { redirect } from "next/navigation";
import {
  ArrowLeft,
  BookOpenCheck,
  CheckCircle,
  FileText,
  ShieldCheck,
} from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import PostToGeneralLedgerButton from "./PostToGeneralLedgerButton";
import BankingReconciliationContextPanel from "../../components/BankingReconciliationContextPanel";

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

type AnyRecord = Record<string, any>;

function formatDate(value?: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatMoney(currencyCode?: string | null, amount?: number | null) {
  return `${currencyCode || "—"} ${Number(amount || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatNumber(value?: number | string | null) {
  return Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
}

function formatStatus(status?: string | null) {
  if (!status) return "—";

  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatAccount(account?: AnyRecord | null) {
  if (!account) return "Account not found";

  const code = account.account_code || "No code";
  const name = account.account_name || "Unnamed account";

  return `${code} - ${name}`;
}

export default async function JournalEntryDetailPage({
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

  const { data: journalLines } = await supabase
    .from("journal_entry_lines")
    .select("*")
    .eq("journal_entry_id", journalId)
    .eq("organisation_id", id)
    .order("line_number", { ascending: true });

  const lines = journalLines || [];

  const accountIds = lines
    .map((line) => line.account_id)
    .filter(Boolean);

  const customerIds = lines
    .map((line) => line.customer_id)
    .filter(Boolean);

  const supplierIds = lines
    .map((line) => line.supplier_id)
    .filter(Boolean);

  const investorIds = lines
    .map((line) => line.investor_id)
    .filter(Boolean);

  let accounts: AnyRecord[] = [];
  let customers: AnyRecord[] = [];
  let suppliers: AnyRecord[] = [];
  let investors: AnyRecord[] = [];

  if (accountIds.length > 0) {
    const { data: accountRows } = await supabase
      .from("chart_of_accounts")
      .select(
        "id, account_code, account_name, account_type, account_subtype, fs_section, fs_line_item, management_report_category"
      )
      .eq("organisation_id", id)
      .in("id", accountIds);

    accounts = accountRows || [];
  }

  if (customerIds.length > 0) {
    const { data: customerRows } = await supabase
      .from("customers")
      .select("id, customer_name")
      .eq("organisation_id", id)
      .in("id", customerIds);

    customers = customerRows || [];
  }

  if (supplierIds.length > 0) {
    const { data: supplierRows } = await supabase
      .from("suppliers")
      .select("id, supplier_name")
      .eq("organisation_id", id)
      .in("id", supplierIds);

    suppliers = supplierRows || [];
  }

  if (investorIds.length > 0) {
    const { data: investorRows } = await supabase
      .from("investors")
      .select("id, investor_name")
      .eq("organisation_id", id)
      .in("id", investorIds);

    investors = investorRows || [];
  }

  const accountMap = new Map(accounts.map((account) => [account.id, account]));
  const customerMap = new Map(
    customers.map((customer) => [customer.id, customer.customer_name])
  );
  const supplierMap = new Map(
    suppliers.map((supplier) => [supplier.id, supplier.supplier_name])
  );
  const investorMap = new Map(
    investors.map((investor) => [investor.id, investor.investor_name])
  );

  const organisationName =
    organisation.trading_name || organisation.legal_name || "Organisation";

  const totalDebits = lines.reduce(
    (sum, line) => sum + Number(line.debit_amount || 0),
    0
  );

  const totalCredits = lines.reduce(
    (sum, line) => sum + Number(line.credit_amount || 0),
    0
  );

  const difference = Number((totalDebits - totalCredits).toFixed(2));

const exchangeRate = Number(journal.exchange_rate || 1);

const glPreviewRows = lines.map((line) => {
  const account = accountMap.get(line.account_id);

  const customerName = customerMap.get(line.customer_id || "");
  const supplierName = supplierMap.get(line.supplier_id || "");
  const investorName = investorMap.get(line.investor_id || "");

  const debitAmount = Number(line.debit_amount || 0);
  const creditAmount = Number(line.credit_amount || 0);

  const baseDebitAmount = Number((debitAmount * exchangeRate).toFixed(2));
  const baseCreditAmount = Number((creditAmount * exchangeRate).toFixed(2));

  return {
    id: line.id,
    lineNumber: line.line_number,
    account,
    description: line.description || journal.description || "Journal entry",
    customerName,
    supplierName,
    investorName,
    debitAmount,
    creditAmount,
    baseDebitAmount,
    baseCreditAmount,
  };
});

const baseTotalDebits = glPreviewRows.reduce(
  (sum, line) => sum + line.baseDebitAmount,
  0
);

const baseTotalCredits = glPreviewRows.reduce(
  (sum, line) => sum + line.baseCreditAmount,
  0
);

const baseDifference = Number((baseTotalDebits - baseTotalCredits).toFixed(2));

return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <section className="border-b border-[#D9E3F4] bg-white">
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          <a
            href={`/portal/organisations/${organisation.id}/journal-entries`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#073D7F]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to journal register
          </a>

          <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-5">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F1F1F1] text-[#073D7F]">
                <BookOpenCheck className="h-6 w-6" />
              </div>

              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                  Journal Entry
                </div>

                <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
                  {journal.journal_number || "Untitled journal"}
                </h1>

                <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                  Review the full draft journal entry for {organisationName},
                  including journal type, description, reference, FX details,
                  debit and credit lines, and control status.
                </p>

                <div className="mt-5 flex flex-wrap gap-3">
                  <span className="rounded-full bg-[#F1F1F1] px-4 py-2 text-sm font-semibold text-[#073D7F]">
                    {formatStatus(journal.status)}
                  </span>

                  <span className="rounded-full bg-[#F1F1F1] px-4 py-2 text-sm font-semibold text-slate-700">
                    {formatStatus(journal.journal_type)}
                  </span>

                  <span className="rounded-full bg-[#F1F1F1] px-4 py-2 text-sm font-semibold text-slate-700">
                    {journal.currency_code || organisation.base_currency_code}
                  </span>

                  <span className="rounded-full bg-[#F1F1F1] px-4 py-2 text-sm font-semibold text-slate-700">
                    Date: {formatDate(journal.journal_date)}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-[#F1F1F1] p-5 text-sm text-slate-600">
              <div className="font-semibold text-slate-950">
                Journal Balance
              </div>
              {["DRAFT", "READY_FOR_REVIEW", "REVIEWED"].includes(journal.status) ? (
  <a
    href={`/portal/organisations/${organisation.id}/journal-entries/${journal.id}/edit`}
    className="mt-4 inline-flex w-full justify-center rounded-full border border-[#D9E3F4] bg-white px-4 py-2 text-sm font-semibold text-[#073D7F]"
  >
    Edit Draft Journal
  </a>
) : null}
              {journal.status !== "POSTED" && difference === 0 && lines.length >= 2 ? (
  <PostToGeneralLedgerButton journalId={journal.id} />
) : null}

              <div className="mt-3 grid gap-2">
                <div>
                  Debits:{" "}
                  <span className="font-semibold text-slate-950">
                    {formatMoney(journal.currency_code, totalDebits)}
                  </span>
                </div>

                <div>
                  Credits:{" "}
                  <span className="font-semibold text-slate-950">
                    {formatMoney(journal.currency_code, totalCredits)}
                  </span>
                </div>

                <div>
                  Difference:{" "}
                  <span className="font-semibold text-slate-950">
                    {formatMoney(journal.currency_code, Math.abs(difference))}
                  </span>
                </div>
              </div>

              <div className="mt-4 inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#073D7F]">
                {difference === 0 ? "Balanced" : "Out of Balance"}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">
              Total Debits
            </div>
            <div className="mt-3 text-2xl font-semibold text-slate-950">
              {formatMoney(journal.currency_code, totalDebits)}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">
              Total Credits
            </div>
            <div className="mt-3 text-2xl font-semibold text-slate-950">
              {formatMoney(journal.currency_code, totalCredits)}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">
              Difference
            </div>
            <div className="mt-3 text-2xl font-semibold text-slate-950">
              {formatMoney(journal.currency_code, Math.abs(difference))}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">
              Line Count
            </div>
            <div className="mt-3 text-2xl font-semibold text-slate-950">
              {lines.length}
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-8 xl:grid-cols-[1fr_0.85fr]">
          <section className="rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-[#073D7F]" />
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                Journal Details
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm">
                <div className="font-semibold text-slate-950">
                  Journal Number
                </div>
                <div className="mt-2 text-slate-600">
                  {journal.journal_number || "—"}
                </div>
              </div>

              <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm">
                <div className="font-semibold text-slate-950">
                  Journal Type
                </div>
                <div className="mt-2 text-slate-600">
                  {formatStatus(journal.journal_type)}
                </div>
              </div>

              <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm">
                <div className="font-semibold text-slate-950">
                  Journal Date
                </div>
                <div className="mt-2 text-slate-600">
                  {formatDate(journal.journal_date)}
                </div>
              </div>

              <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm">
                <div className="font-semibold text-slate-950">Status</div>
                <div className="mt-2 text-slate-600">
                  {formatStatus(journal.status)}
                </div>
              </div>

              <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm">
                <div className="font-semibold text-slate-950">Currency</div>
                <div className="mt-2 text-slate-600">
                  {journal.currency_code || "—"}
                </div>
              </div>

              <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm">
                <div className="font-semibold text-slate-950">
                  Reference Number
                </div>
                <div className="mt-2 text-slate-600">
                  {journal.reference_number || "—"}
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-[#D9E3F4] bg-white p-5 text-sm leading-7 text-slate-600">
              <div className="font-semibold text-slate-950">Description</div>
              <div className="mt-2">
                {journal.description || "No description provided."}
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm">
            <div className="flex items-center gap-3">
              <BookOpenCheck className="h-5 w-5 text-[#073D7F]" />
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                FX & Posting Status
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm">
                <div className="font-semibold text-slate-950">
                  Exchange Rate
                </div>
                <div className="mt-2 text-slate-600">
                  {formatNumber(journal.exchange_rate)}
                </div>
              </div>

              <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm">
                <div className="font-semibold text-slate-950">
                  Exchange Rate Date
                </div>
                <div className="mt-2 text-slate-600">
                  {formatDate(journal.exchange_rate_date)}
                </div>
              </div>

              <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm">
                <div className="font-semibold text-slate-950">
                  Exchange Rate Source
                </div>
                <div className="mt-2 text-slate-600">
                  {formatStatus(journal.exchange_rate_source)}
                </div>
              </div>

              <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm">
                <div className="font-semibold text-slate-950">
                  FX Rate Lock Status
                </div>
                <div className="mt-2 text-slate-600">
                  {journal.exchange_rate_is_locked
                    ? "FX rate locked"
                    : "FX rate not locked"}
                </div>
              </div>

              <div className="rounded-2xl border border-[#D9E3F4] bg-white p-5 text-sm">
                <div className="font-semibold text-slate-950">
                  Posting Status
                </div>
                <div className="mt-2 text-slate-600">
                  {journal.posted_at
                    ? `Posted on ${formatDate(journal.posted_at)}`
                    : "Not posted"}
                </div>
              </div>
            </div>
          </section>
        </div>

        <section className="mt-8 rounded-[2rem] border border-[#D9E3F4] bg-white shadow-sm">
          <div className="border-b border-[#D9E3F4] px-6 py-5">
            <h2 className="text-lg font-semibold text-slate-950">
              Journal lines
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Debit and credit lines attached to this draft journal entry.
            </p>
          </div>

          {lines.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-slate-500">
              No journal lines found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#D9E3F4]">
                <thead className="bg-[#F8FAFC]">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Line
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Account
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Description / Party
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Debit
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Credit
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#D9E3F4] bg-white">
                  {lines.map((line) => {
                    const account = accountMap.get(line.account_id);

                    const customerName = customerMap.get(line.customer_id || "");
                    const supplierName = supplierMap.get(line.supplier_id || "");
                    const investorName = investorMap.get(line.investor_id || "");

                    return (
                      <tr key={line.id} className="hover:bg-[#F8FAFC]">
                        <td className="whitespace-nowrap px-6 py-5 text-sm font-semibold text-slate-950">
                          {line.line_number}
                        </td>

                        <td className="whitespace-nowrap px-6 py-5">
                          <div className="text-sm font-semibold text-slate-950">
                            {formatAccount(account)}
                          </div>

                          <div className="mt-1 text-xs text-slate-500">
                            {account?.account_type || "—"}{" "}
                            {account?.account_subtype
                              ? `· ${account.account_subtype}`
                              : ""}
                          </div>

                          <div className="mt-1 text-xs text-slate-500">
                            FS line: {account?.fs_line_item || "Not mapped"}
                          </div>
                        </td>

                        <td className="px-6 py-5 text-sm text-slate-600">
                          <div>
                            {line.description || "No line description"}
                          </div>

                          <div className="mt-2 space-y-1 text-xs text-slate-500">
                            {customerName ? <div>Customer: {customerName}</div> : null}
                            {supplierName ? <div>Supplier: {supplierName}</div> : null}
                            {investorName ? (
                              <div>Investor / Funder: {investorName}</div>
                            ) : null}

                            {!customerName && !supplierName && !investorName ? (
                              <div>No party linked</div>
                            ) : null}
                          </div>
                        </td>

                        <td className="whitespace-nowrap px-6 py-5 text-right text-sm font-semibold text-slate-950">
                          {Number(line.debit_amount || 0) > 0
                            ? formatMoney(journal.currency_code, line.debit_amount)
                            : "—"}
                        </td>

                        <td className="whitespace-nowrap px-6 py-5 text-right text-sm font-semibold text-slate-950">
                          {Number(line.credit_amount || 0) > 0
                            ? formatMoney(
                                journal.currency_code,
                                line.credit_amount
                              )
                            : "—"}
                        </td>
                      </tr>
                    );
                  })}

                  <tr className="bg-[#F8FAFC]">
                    <td className="px-6 py-5 text-sm font-semibold text-slate-950">
                      Total
                    </td>

                    <td className="px-6 py-5" />

                    <td className="px-6 py-5" />

                    <td className="whitespace-nowrap px-6 py-5 text-right text-sm font-semibold text-slate-950">
                      {formatMoney(journal.currency_code, totalDebits)}
                    </td>

                    <td className="whitespace-nowrap px-6 py-5 text-right text-sm font-semibold text-slate-950">
                      {formatMoney(journal.currency_code, totalCredits)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="mt-8 rounded-[2rem] border border-[#D9E3F4] bg-white shadow-sm">
  <div className="border-b border-[#D9E3F4] px-6 py-5">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
          General Ledger Preview
        </div>

        <h2 className="mt-3 text-lg font-semibold text-slate-950">
          Posting preview from this journal
        </h2>

        <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-500">
          This preview shows how the journal lines would appear in the General
          Ledger if posted. No ledger entry has been created yet.
        </p>
      </div>

      <div className="rounded-2xl bg-[#F8FAFC] px-5 py-4 text-sm">
        <div className="font-semibold text-slate-950">Source Module</div>
        <div className="mt-1 text-slate-600">JOURNAL_ENTRY</div>
      </div>
    </div>
  </div>

  <div className="grid gap-5 border-b border-[#D9E3F4] px-6 py-6 md:grid-cols-4">
    <div className="rounded-2xl bg-[#F8FAFC] p-5">
      <div className="text-sm font-semibold text-slate-500">
        Preview Debits
      </div>
      <div className="mt-3 text-xl font-semibold text-slate-950">
        {formatMoney(journal.currency_code, totalDebits)}
      </div>
    </div>

    <div className="rounded-2xl bg-[#F8FAFC] p-5">
      <div className="text-sm font-semibold text-slate-500">
        Preview Credits
      </div>
      <div className="mt-3 text-xl font-semibold text-slate-950">
        {formatMoney(journal.currency_code, totalCredits)}
      </div>
    </div>

    <div className="rounded-2xl bg-[#F8FAFC] p-5">
      <div className="text-sm font-semibold text-slate-500">
        Base Currency Impact
      </div>
      <div className="mt-3 text-xl font-semibold text-slate-950">
        {formatMoney(organisation.base_currency_code, baseTotalDebits)}
      </div>
    </div>

    <div className="rounded-2xl bg-[#F8FAFC] p-5">
      <div className="text-sm font-semibold text-slate-500">
        Preview Status
      </div>
      <div className="mt-3 inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#073D7F]">
        {difference === 0 && baseDifference === 0
          ? "Ready for posting review"
          : "Out of balance"}
      </div>
    </div>
  </div>

  {glPreviewRows.length === 0 ? (
    <div className="px-6 py-12 text-center text-sm text-slate-500">
      No journal lines available for General Ledger preview.
    </div>
  ) : (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-[#D9E3F4]">
        <thead className="bg-[#F8FAFC]">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              GL Line
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Account
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Source / Description
            </th>
            <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Debit
            </th>
            <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Credit
            </th>
            <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Base Debit
            </th>
            <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Base Credit
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-[#D9E3F4] bg-white">
          {glPreviewRows.map((line) => (
            <tr key={line.id} className="hover:bg-[#F8FAFC]">
              <td className="whitespace-nowrap px-6 py-5 text-sm font-semibold text-slate-950">
                {line.lineNumber}
              </td>

              <td className="whitespace-nowrap px-6 py-5">
                <div className="text-sm font-semibold text-slate-950">
                  {formatAccount(line.account)}
                </div>

                <div className="mt-1 text-xs text-slate-500">
                  {line.account?.fs_line_item || "FS line not mapped"}
                </div>
              </td>

              <td className="px-6 py-5 text-sm text-slate-600">
                <div>{line.description}</div>

                <div className="mt-2 space-y-1 text-xs text-slate-500">
                  <div>Source: JOURNAL_ENTRY</div>
                  <div>Source Record: {journal.journal_number || journal.id}</div>

                  {line.customerName ? (
                    <div>Customer: {line.customerName}</div>
                  ) : null}

                  {line.supplierName ? (
                    <div>Supplier: {line.supplierName}</div>
                  ) : null}

                  {line.investorName ? (
                    <div>Investor / Funder: {line.investorName}</div>
                  ) : null}
                </div>
              </td>

              <td className="whitespace-nowrap px-6 py-5 text-right text-sm font-semibold text-slate-950">
                {line.debitAmount > 0
                  ? formatMoney(journal.currency_code, line.debitAmount)
                  : "—"}
              </td>

              <td className="whitespace-nowrap px-6 py-5 text-right text-sm font-semibold text-slate-950">
                {line.creditAmount > 0
                  ? formatMoney(journal.currency_code, line.creditAmount)
                  : "—"}
              </td>

              <td className="whitespace-nowrap px-6 py-5 text-right text-sm font-semibold text-slate-950">
                {line.baseDebitAmount > 0
                  ? formatMoney(
                      organisation.base_currency_code,
                      line.baseDebitAmount
                    )
                  : "—"}
              </td>

              <td className="whitespace-nowrap px-6 py-5 text-right text-sm font-semibold text-slate-950">
                {line.baseCreditAmount > 0
                  ? formatMoney(
                      organisation.base_currency_code,
                      line.baseCreditAmount
                    )
                  : "—"}
              </td>
            </tr>
          ))}

          <tr className="bg-[#F8FAFC]">
            <td className="px-6 py-5 text-sm font-semibold text-slate-950">
              Total
            </td>

            <td className="px-6 py-5" />

            <td className="px-6 py-5" />

            <td className="whitespace-nowrap px-6 py-5 text-right text-sm font-semibold text-slate-950">
              {formatMoney(journal.currency_code, totalDebits)}
            </td>

            <td className="whitespace-nowrap px-6 py-5 text-right text-sm font-semibold text-slate-950">
              {formatMoney(journal.currency_code, totalCredits)}
            </td>

            <td className="whitespace-nowrap px-6 py-5 text-right text-sm font-semibold text-slate-950">
              {formatMoney(organisation.base_currency_code, baseTotalDebits)}
            </td>

            <td className="whitespace-nowrap px-6 py-5 text-right text-sm font-semibold text-slate-950">
              {formatMoney(organisation.base_currency_code, baseTotalCredits)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )}

  <div className="border-t border-[#D9E3F4] px-6 py-5 text-sm leading-7 text-slate-600">
    <span className="font-semibold text-slate-950">Control note:</span>{" "}
    This is a preview only. It does not create records in
    general_ledger_entries or general_ledger_lines. Posting should only happen
    after review, approval, and audit trail controls are added.
  </div>
</section>

        <section className="mt-8 rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F1F1F1] text-[#073D7F]">
              <ShieldCheck className="h-5 w-5" />
            </div>

            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                Control Status
              </div>

              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                Draft journal entry record
              </h2>

              <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-600">
                This journal entry is currently an operational draft accounting
                record. It does not update the general ledger, trial balance,
                financial statements, management reports, tax schedules, or
                audit trail postings until Kiamina adds posting, review,
                approval, and audit trail controls.
              </p>

              <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#F1F1F1] px-4 py-2 text-sm font-semibold text-[#073D7F]">
                <CheckCircle className="h-4 w-4" />
                Ready for future review, approval, and posting workflow
              </div>
            </div>
          </div>
        </section>
        <BankingReconciliationContextPanel
  organisationId={organisation.id}
  sourceModule="JOURNAL_ENTRY"
  sourceRecordId={journal.id}
/>
      </section>
    </main>
  );
}