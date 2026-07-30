import { redirect } from "next/navigation";
import {
  ArrowLeft,
  Banknote,
  Building2,
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

function formatStatus(status?: string | null) {
  if (!status) return "—";

  return status
    .split("_")
    .join(" ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default async function BankingPage({
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

  const { data: bankAccounts } = await supabase
    .from("bank_accounts")
    .select(
      "id, account_name, bank_name, account_number, account_type, currency_code, opening_balance, current_balance, is_active, created_at"
    )
    .eq("organisation_id", id)
    .order("account_name", { ascending: true });

  const { count: bankAccountsCount } = await supabase
    .from("bank_accounts")
    .select("*", { count: "exact", head: true })
    .eq("organisation_id", id)
    .eq("is_active", true);

  const { count: statementLinesCount } = await supabase
    .from("bank_statement_lines")
    .select("*", { count: "exact", head: true })
    .eq("organisation_id", id);

  const { count: unmatchedLinesCount } = await supabase
    .from("bank_statement_lines")
    .select("*", { count: "exact", head: true })
    .eq("organisation_id", id)
    .eq("reconciliation_status", "UNMATCHED");

  const { count: matchedLinesCount } = await supabase
    .from("bank_statement_lines")
    .select("*", { count: "exact", head: true })
    .eq("organisation_id", id)
    .in("reconciliation_status", ["MATCHED", "RECONCILED"]);

  const { data: recentLines } = await supabase
    .from("bank_statement_lines")
    .select(
      "id, transaction_date, description, reference_number, money_in, money_out, running_balance, currency_code, reconciliation_status"
    )
    .eq("organisation_id", id)
    .order("transaction_date", { ascending: false })
    .limit(8);

  const organisationName =
    organisation.trading_name || organisation.legal_name || "Organisation";

  const totalBankBalance =
    bankAccounts?.reduce(
      (sum, account) => sum + Number(account.current_balance || 0),
      0
    ) || 0;

  const summaryStats = [
    {
      label: "Bank Accounts",
      value: bankAccountsCount ?? 0,
      icon: Building2,
    },
    {
      label: "Statement Lines",
      value: statementLinesCount ?? 0,
      icon: FileText,
    },
    {
      label: "Unmatched Lines",
      value: unmatchedLinesCount ?? 0,
      icon: RefreshCcw,
    },
    {
      label: "Matched Lines",
      value: matchedLinesCount ?? 0,
      icon: CheckCircle,
    },
  ];

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
                <Banknote className="h-6 w-6" />
              </div>

              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                  Banking
                </div>

                <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
                  Banking workspace
                </h1>

                <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                  Manage bank accounts, uploaded bank statements, extracted bank
                  lines, matching, added transactions, and reconciliation for{" "}
                  {organisationName}.
                </p>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-[#F1F1F1] p-5 text-sm text-slate-600">
              <div className="font-semibold text-slate-950">
                Total Bank Balance
              </div>
              <div className="mt-3 text-2xl font-semibold text-slate-950">
                {formatMoney(organisation.base_currency_code, totalBankBalance)}
              </div>
              <div className="mt-2 text-xs text-slate-500">
                Based on bank account current balances.
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={`/portal/organisations/${organisation.id}/banking/bank-accounts/new`}
              className="inline-flex items-center gap-2 rounded-full bg-[#073D7F] px-5 py-3 text-sm font-semibold text-white"
            >
              <Plus className="h-4 w-4" />
              Add Bank Account
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
          {summaryStats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.label}
                className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-slate-500">
                    {stat.label}
                  </div>

                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F1F1F1] text-[#073D7F]">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>

                <div className="mt-5 text-3xl font-semibold text-slate-950">
                  {stat.value}
                </div>
              </div>
            );
          })}
        </div>

        <section className="mt-8 rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                Bank Accounts
              </div>

              <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
                Connected bank and cash accounts
              </h2>

              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                Each bank account should be linked to the appropriate cash or
                bank account in the chart of accounts so reconciled transactions
                can flow correctly into the General Ledger.
              </p>
            </div>

            <a
              href={`/portal/organisations/${organisation.id}/banking/bank-accounts/new`}
              className="rounded-full bg-[#073D7F] px-5 py-3 text-center text-sm font-semibold text-white"
            >
              Add Bank Account
            </a>
          </div>

          <div className="mt-8 grid gap-5 xl:grid-cols-3">
            {bankAccounts && bankAccounts.length > 0 ? (
              bankAccounts.map((account) => (
                <div
                  key={account.id}
                  className="rounded-[1.5rem] border border-[#D9E3F4] bg-[#F8FAFC] p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-950">
                        {account.account_name}
                      </h3>

                      <p className="mt-2 text-sm text-slate-500">
                        {account.bank_name || "Bank not specified"} ·{" "}
                        {account.account_number || "No account number"}
                      </p>
                    </div>

                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#073D7F]">
                      {formatStatus(account.account_type)}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-white p-4">
                      <div className="text-xs text-slate-500">
                        Opening Balance
                      </div>
                      <div className="mt-2 font-semibold text-slate-950">
                        {formatMoney(
                          account.currency_code,
                          account.opening_balance
                        )}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-white p-4">
                      <div className="text-xs text-slate-500">
                        Current Balance
                      </div>
                      <div className="mt-2 font-semibold text-slate-950">
                        {formatMoney(
                          account.currency_code,
                          account.current_balance
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 text-xs text-slate-500">
                    Created: {formatDate(account.created_at)}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-[#D9E3F4] bg-[#F8FAFC] p-8 text-sm text-slate-500 xl:col-span-3">
                No bank accounts have been created yet.
              </div>
            )}
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] border border-[#D9E3F4] bg-white shadow-sm">
          <div className="border-b border-[#D9E3F4] px-6 py-5">
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
              Bank Statement Lines
            </div>

            <h2 className="mt-3 text-lg font-semibold text-slate-950">
              Recent imported bank lines
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-500">
              Bank statement lines will later be extracted from uploaded bank
              statements. Each line can then be matched to source transactions or
              used to add a new transaction.
            </p>
          </div>

          {!recentLines || recentLines.length === 0 ? (
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
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#D9E3F4] bg-white">
                  {recentLines.map((line) => (
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
                        <span className="rounded-full bg-[#F1F1F1] px-3 py-1 text-xs font-semibold text-[#073D7F]">
                          {formatStatus(line.reconciliation_status)}
                        </span>
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