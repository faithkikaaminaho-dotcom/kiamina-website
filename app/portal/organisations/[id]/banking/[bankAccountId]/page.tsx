import { redirect } from "next/navigation";
import {
  ArrowLeft,
  Banknote,
  CheckCircle,
  FileText,
  Plus,
  RefreshCcw,
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

function formatMoney(currencyCode?: string | null, amount?: number | null) {
  return `${currencyCode || "—"} ${Number(amount || 0).toLocaleString(
    "en-US",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )}`;
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatStatus(status?: string | null) {
  if (!status) return "—";

  return status
    .split("_")
    .join(" ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default async function BankAccountDetailPage({
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
    .select(
      "id, account_name, bank_name, account_number, account_type, currency_code, gl_account_id, opening_balance, current_balance, is_active, notes, created_at"
    )
    .eq("id", bankAccountId)
    .eq("organisation_id", id)
    .single();

  if (!bankAccount) {
    redirect(`/portal/organisations/${id}/banking`);
  }

  let linkedGlAccount:
    | {
        id: string;
        account_code: string | null;
        account_name: string | null;
      }
    | null = null;

  if (bankAccount.gl_account_id) {
    const { data: account } = await supabase
      .from("chart_of_accounts")
      .select("id, account_code, account_name")
      .eq("id", bankAccount.gl_account_id)
      .eq("organisation_id", id)
      .single();

    linkedGlAccount = account || null;
  }

  const { count: totalLinesCount } = await supabase
    .from("bank_statement_lines")
    .select("*", { count: "exact", head: true })
    .eq("organisation_id", id)
    .eq("bank_account_id", bankAccountId);

  const { count: unmatchedLinesCount } = await supabase
    .from("bank_statement_lines")
    .select("*", { count: "exact", head: true })
    .eq("organisation_id", id)
    .eq("bank_account_id", bankAccountId)
    .eq("reconciliation_status", "UNMATCHED");

  const { count: matchedLinesCount } = await supabase
    .from("bank_statement_lines")
    .select("*", { count: "exact", head: true })
    .eq("organisation_id", id)
    .eq("bank_account_id", bankAccountId)
    .in("reconciliation_status", ["MATCHED", "RECONCILED", "ADDED_TO_BOOKS"]);

  const { data: statementLines } = await supabase
    .from("bank_statement_lines")
    .select(
      "id, transaction_date, value_date, description, reference_number, money_in, money_out, running_balance, currency_code, reconciliation_status, matched_source_module, matched_source_record_id, added_transaction_module, added_transaction_id, created_at"
    )
    .eq("organisation_id", id)
    .eq("bank_account_id", bankAccountId)
    .order("transaction_date", { ascending: false })
    .limit(50);

  const { data: statementImports } = await supabase
    .from("bank_statement_imports")
    .select(
      "id, file_name, statement_start_date, statement_end_date, opening_balance, closing_balance, status, extraction_status, created_at"
    )
    .eq("organisation_id", id)
    .eq("bank_account_id", bankAccountId)
    .order("created_at", { ascending: false })
    .limit(5);

  const organisationName =
    organisation.trading_name || organisation.legal_name || "Organisation";

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <section className="border-b border-[#D9E3F4] bg-white">
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          <a
            href={`/portal/organisations/${organisation.id}/banking`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#073D7F]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to banking
          </a>

          <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-5">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F1F1F1] text-[#073D7F]">
                <Banknote className="h-6 w-6" />
              </div>

              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                  Bank Account
                </div>

                <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
                  {bankAccount.account_name}
                </h1>

                <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                  Review bank statement lines, imports, matching status, and
                  reconciliation progress for {organisationName}.
                </p>

                <div className="mt-5 flex flex-wrap gap-3">
                  <span className="rounded-full bg-[#F1F1F1] px-4 py-2 text-sm font-semibold text-[#073D7F]">
                    {formatStatus(bankAccount.account_type)}
                  </span>

                  <span className="rounded-full bg-[#F1F1F1] px-4 py-2 text-sm font-semibold text-slate-700">
                    {bankAccount.bank_name || "No bank name"}
                  </span>

                  <span className="rounded-full bg-[#F1F1F1] px-4 py-2 text-sm font-semibold text-slate-700">
                    {bankAccount.account_number || "No account number"}
                  </span>

                  <span className="rounded-full bg-[#F1F1F1] px-4 py-2 text-sm font-semibold text-slate-700">
                    {bankAccount.currency_code || organisation.base_currency_code}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-[#F1F1F1] p-5 text-sm text-slate-600">
              <div className="font-semibold text-slate-950">
                Current Balance
              </div>

              <div className="mt-3 text-2xl font-semibold text-slate-950">
                {formatMoney(bankAccount.currency_code, bankAccount.current_balance)}
              </div>

              <div className="mt-2 text-xs text-slate-500">
                Based on latest imported balance or manual setup.
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={`/portal/organisations/${organisation.id}/banking/${bankAccount.id}/statement-lines/new`}
              className="inline-flex items-center gap-2 rounded-full bg-[#073D7F] px-5 py-3 text-sm font-semibold text-white"
            >
              <Plus className="h-4 w-4" />
              Import Statement Lines
            </a>

            <a
              href={`/portal/organisations/${organisation.id}/upload`}
              className="inline-flex items-center gap-2 rounded-full border border-[#D9E3F4] bg-white px-5 py-3 text-sm font-semibold text-[#073D7F]"
            >
              <FileText className="h-4 w-4" />
              Upload Bank Statement
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-medium text-slate-500">
              Statement Lines
            </div>
            <div className="mt-5 text-3xl font-semibold text-slate-950">
              {totalLinesCount ?? 0}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-medium text-slate-500">
              Unmatched Lines
            </div>
            <div className="mt-5 text-3xl font-semibold text-slate-950">
              {unmatchedLinesCount ?? 0}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-medium text-slate-500">
              Matched / Added
            </div>
            <div className="mt-5 text-3xl font-semibold text-slate-950">
              {matchedLinesCount ?? 0}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-medium text-slate-500">
              Linked GL Account
            </div>
            <div className="mt-5 text-sm font-semibold leading-6 text-slate-950">
              {linkedGlAccount
                ? `${linkedGlAccount.account_code} - ${linkedGlAccount.account_name}`
                : "Not linked"}
            </div>
          </div>
        </div>

        <section className="mt-8 rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-[#073D7F]" />
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
              Recent Imports
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {statementImports && statementImports.length > 0 ? (
              statementImports.map((record) => (
                <div
                  key={record.id}
                  className="rounded-[1.5rem] border border-[#D9E3F4] bg-[#F8FAFC] p-5"
                >
                  <div className="font-semibold text-slate-950">
                    {record.file_name || "Manual bank statement import"}
                  </div>

                  <div className="mt-2 text-sm text-slate-500">
                    {formatDate(record.statement_start_date)} to{" "}
                    {formatDate(record.statement_end_date)}
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-white p-4 text-sm">
                      <div className="text-xs text-slate-500">
                        Opening Balance
                      </div>
                      <div className="mt-1 font-semibold text-slate-950">
                        {formatMoney(bankAccount.currency_code, record.opening_balance)}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-white p-4 text-sm">
                      <div className="text-xs text-slate-500">
                        Closing Balance
                      </div>
                      <div className="mt-1 font-semibold text-slate-950">
                        {formatMoney(bankAccount.currency_code, record.closing_balance)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#073D7F]">
                      {formatStatus(record.status)}
                    </span>

                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                      {formatStatus(record.extraction_status)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-[#D9E3F4] bg-[#F8FAFC] p-8 text-sm text-slate-500 lg:col-span-2">
                No bank statement imports yet.
              </div>
            )}
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] border border-[#D9E3F4] bg-white shadow-sm">
          <div className="border-b border-[#D9E3F4] px-6 py-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                  Bank Statement Lines
                </div>

                <h2 className="mt-3 text-lg font-semibold text-slate-950">
                  Imported bank transactions
                </h2>

                <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-500">
                  These lines are imported from bank statements. Next, we will
                  add matching to receipts, payments, funding transactions,
                  capital calls, journals, and General Ledger records.
                </p>
              </div>

              <a
                href={`/portal/organisations/${organisation.id}/banking/${bankAccount.id}/statement-lines/new`}
                className="rounded-full bg-[#073D7F] px-5 py-3 text-center text-sm font-semibold text-white"
              >
                Import Lines
              </a>
            </div>
          </div>

          {!statementLines || statementLines.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-slate-500">
              No bank statement lines imported yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#D9E3F4]">
                <thead className="bg-[#F8FAFC]">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Description
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Money In
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Money Out
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Balance
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Reconciliation
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#D9E3F4] bg-white">
                  {statementLines.map((line) => (
                    <tr key={line.id} className="hover:bg-[#F8FAFC]">
                      <td className="whitespace-nowrap px-6 py-5 text-sm text-slate-600">
                        {formatDate(line.transaction_date)}
                      </td>

                      <td className="px-6 py-5 text-sm text-slate-600">
                        <div className="font-semibold text-slate-950">
                          {line.description}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {line.reference_number || "No reference"}
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-6 py-5 text-right text-sm font-semibold text-slate-950">
                        {Number(line.money_in || 0) > 0
                          ? formatMoney(line.currency_code, line.money_in)
                          : "—"}
                      </td>

                      <td className="whitespace-nowrap px-6 py-5 text-right text-sm font-semibold text-slate-950">
                        {Number(line.money_out || 0) > 0
                          ? formatMoney(line.currency_code, line.money_out)
                          : "—"}
                      </td>

                      <td className="whitespace-nowrap px-6 py-5 text-right text-sm font-semibold text-slate-950">
                        {line.running_balance !== null
                          ? formatMoney(line.currency_code, line.running_balance)
                          : "—"}
                      </td>

                      <td className="whitespace-nowrap px-6 py-5 text-sm">
                        <div className="inline-flex items-center gap-2 rounded-full bg-[#F1F1F1] px-3 py-1 text-xs font-semibold text-[#073D7F]">
                          {line.reconciliation_status === "UNMATCHED" ? (
                            <RefreshCcw className="h-3 w-3" />
                          ) : (
                            <CheckCircle className="h-3 w-3" />
                          )}
                          {formatStatus(line.reconciliation_status)}
                        </div>

                        {line.matched_source_module ? (
                          <div className="mt-2 text-xs text-slate-500">
                            Matched to: {formatStatus(line.matched_source_module)}
                          </div>
                        ) : null}

                        {line.added_transaction_module ? (
                          <div className="mt-2 text-xs text-slate-500">
                            Added as: {formatStatus(line.added_transaction_module)}
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}