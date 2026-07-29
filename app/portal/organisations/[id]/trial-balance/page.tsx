import { redirect } from "next/navigation";
import {
  ArrowLeft,
  BookOpenCheck,
  Calculator,
  CheckCircle,
  FileSpreadsheet,
  ShieldCheck,
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

type LedgerLine = {
  id: string;
  account_id: string;
  debit_amount: number | null;
  credit_amount: number | null;
  base_debit_amount: number | null;
  base_credit_amount: number | null;
  general_ledger_entry_id: string;
};

type LedgerEntry = {
  id: string;
  status: string | null;
  entry_date: string | null;
};

type Account = {
  id: string;
  account_code: string | null;
  account_name: string | null;
  account_type: string | null;
  account_subtype: string | null;
  fs_section: string | null;
  fs_line_item: string | null;
  management_report_category: string | null;
};

type TrialBalanceRow = {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: string;
  accountSubtype: string;
  fsSection: string;
  fsLineItem: string;
  managementReportCategory: string;
  debitTotal: number;
  creditTotal: number;
  netBalance: number;
  debitBalance: number;
  creditBalance: number;
};

function formatMoney(currencyCode?: string | null, amount?: number | null) {
  return `${currencyCode || "—"} ${Number(amount || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatStatus(status?: string | null) {
  if (!status) return "—";

  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function normalBalanceForAccountType(accountType: string) {
  const debitNormalTypes = ["ASSET", "EXPENSE"];

  if (debitNormalTypes.includes(accountType.toUpperCase())) {
    return "DEBIT";
  }

  return "CREDIT";
}

export default async function TrialBalancePage({
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

  const { data: postedLedgerEntries } = await supabase
    .from("general_ledger_entries")
    .select("id, status, entry_date")
    .eq("organisation_id", id)
    .eq("status", "POSTED")
    .order("entry_date", { ascending: true });

  const ledgerEntries = (postedLedgerEntries || []) as LedgerEntry[];
  const ledgerEntryIds = ledgerEntries.map((entry) => entry.id);

  let ledgerLines: LedgerLine[] = [];

  if (ledgerEntryIds.length > 0) {
    const { data: lineRows } = await supabase
      .from("general_ledger_lines")
      .select(
        "id, account_id, debit_amount, credit_amount, base_debit_amount, base_credit_amount, general_ledger_entry_id"
      )
      .eq("organisation_id", id)
      .in("general_ledger_entry_id", ledgerEntryIds);

    ledgerLines = (lineRows || []) as LedgerLine[];
  }

  const accountIds = Array.from(
    new Set(ledgerLines.map((line) => line.account_id).filter(Boolean))
  );

  let accounts: Account[] = [];

  if (accountIds.length > 0) {
    const { data: accountRows } = await supabase
      .from("chart_of_accounts")
      .select(
        "id, account_code, account_name, account_type, account_subtype, fs_section, fs_line_item, management_report_category"
      )
      .eq("organisation_id", id)
      .in("id", accountIds);

    accounts = (accountRows || []) as Account[];
  }

  const accountMap = new Map(accounts.map((account) => [account.id, account]));

  const trialBalanceMap = new Map<string, TrialBalanceRow>();

  for (const line of ledgerLines) {
    const account = accountMap.get(line.account_id);

    if (!account) continue;

    const accountType = account.account_type || "UNKNOWN";
    const normalBalance = normalBalanceForAccountType(accountType);

    const debitTotal = Number(line.base_debit_amount || line.debit_amount || 0);
    const creditTotal = Number(
      line.base_credit_amount || line.credit_amount || 0
    );

    const existing = trialBalanceMap.get(account.id);

    const currentRow: TrialBalanceRow =
      existing || {
        accountId: account.id,
        accountCode: account.account_code || "No code",
        accountName: account.account_name || "Unnamed account",
        accountType,
        accountSubtype: account.account_subtype || "—",
        fsSection: account.fs_section || "Not mapped",
        fsLineItem: account.fs_line_item || "Not mapped",
        managementReportCategory:
          account.management_report_category || "Not mapped",
        debitTotal: 0,
        creditTotal: 0,
        netBalance: 0,
        debitBalance: 0,
        creditBalance: 0,
      };

    currentRow.debitTotal = Number(
      (currentRow.debitTotal + debitTotal).toFixed(2)
    );
    currentRow.creditTotal = Number(
      (currentRow.creditTotal + creditTotal).toFixed(2)
    );

    const rawNet =
      normalBalance === "DEBIT"
        ? currentRow.debitTotal - currentRow.creditTotal
        : currentRow.creditTotal - currentRow.debitTotal;

    currentRow.netBalance = Number(rawNet.toFixed(2));

    if (currentRow.debitTotal >= currentRow.creditTotal) {
      currentRow.debitBalance = Number(
        (currentRow.debitTotal - currentRow.creditTotal).toFixed(2)
      );
      currentRow.creditBalance = 0;
    } else {
      currentRow.debitBalance = 0;
      currentRow.creditBalance = Number(
        (currentRow.creditTotal - currentRow.debitTotal).toFixed(2)
      );
    }

    trialBalanceMap.set(account.id, currentRow);
  }

  const trialBalanceRows = Array.from(trialBalanceMap.values()).sort((a, b) =>
    a.accountCode.localeCompare(b.accountCode)
  );

  const totalDebitBalance = trialBalanceRows.reduce(
    (sum, row) => sum + row.debitBalance,
    0
  );

  const totalCreditBalance = trialBalanceRows.reduce(
    (sum, row) => sum + row.creditBalance,
    0
  );

  const totalDebitsPosted = trialBalanceRows.reduce(
    (sum, row) => sum + row.debitTotal,
    0
  );

  const totalCreditsPosted = trialBalanceRows.reduce(
    (sum, row) => sum + row.creditTotal,
    0
  );

  const balanceDifference = Number(
    (totalDebitBalance - totalCreditBalance).toFixed(2)
  );

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

          <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-5">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F1F1F1] text-[#073D7F]">
                <FileSpreadsheet className="h-6 w-6" />
              </div>

              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                  Trial Balance
                </div>

                <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
                  Trial balance
                </h1>

                <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                  Review the trial balance for {organisationName}. This report
                  summarises posted General Ledger lines by account and forms
                  the foundation for financial statements, management reports,
                  and account analysis.
                </p>

                <div className="mt-5 flex flex-wrap gap-3">
                  <span className="rounded-full bg-[#F1F1F1] px-4 py-2 text-sm font-semibold text-[#073D7F]">
                    Base currency: {organisation.base_currency_code || "—"}
                  </span>

                  <span className="rounded-full bg-[#F1F1F1] px-4 py-2 text-sm font-semibold text-slate-700">
                    Posted GL entries: {ledgerEntries.length}
                  </span>

                  <span className="rounded-full bg-[#F1F1F1] px-4 py-2 text-sm font-semibold text-slate-700">
                    Accounts: {trialBalanceRows.length}
                  </span>
                </div>
              </div>
            </div>

            <a
              href={`/portal/organisations/${organisation.id}/general-ledger`}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#073D7F] px-6 py-3 text-sm font-semibold text-white shadow-sm"
            >
              <BookOpenCheck className="h-4 w-4" />
              Open General Ledger
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">
              Debit Balance
            </div>
            <div className="mt-3 text-2xl font-semibold text-slate-950">
              {formatMoney(organisation.base_currency_code, totalDebitBalance)}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">
              Credit Balance
            </div>
            <div className="mt-3 text-2xl font-semibold text-slate-950">
              {formatMoney(organisation.base_currency_code, totalCreditBalance)}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">
              Difference
            </div>
            <div className="mt-3 text-2xl font-semibold text-slate-950">
              {formatMoney(
                organisation.base_currency_code,
                Math.abs(balanceDifference)
              )}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">
              Balance Status
            </div>
            <div className="mt-3 inline-flex rounded-full bg-[#F1F1F1] px-4 py-2 text-sm font-semibold text-[#073D7F]">
              {balanceDifference === 0 ? "Balanced" : "Out of Balance"}
            </div>
          </div>
        </div>

        <section className="mt-8 rounded-[2rem] border border-[#D9E3F4] bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-[#D9E3F4] px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                Trial balance report
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Read-only summary calculated directly from posted General Ledger
                lines.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full bg-[#F1F1F1] px-4 py-2 text-sm font-semibold text-[#073D7F]">
              <Calculator className="h-4 w-4" />
              Calculated from posted GL
            </div>
          </div>

          {trialBalanceRows.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F8FAFC] text-[#073D7F]">
                <FileSpreadsheet className="h-6 w-6" />
              </div>

              <h3 className="mt-5 text-lg font-semibold text-slate-950">
                No trial balance yet
              </h3>

              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
                The trial balance will appear after journal entries or other
                source transactions have been posted to the General Ledger.
              </p>

              <div className="mt-6">
                <a
                  href={`/portal/organisations/${organisation.id}/general-ledger`}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#073D7F] px-6 py-3 text-sm font-semibold text-white"
                >
                  <BookOpenCheck className="h-4 w-4" />
                  Open General Ledger
                </a>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#D9E3F4]">
                <thead className="bg-[#F8FAFC]">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Account
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      FS Mapping
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Debit Activity
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Credit Activity
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Debit Balance
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Credit Balance
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#D9E3F4] bg-white">
                  {trialBalanceRows.map((row) => (
                    <tr key={row.accountId} className="hover:bg-[#F8FAFC]">
                      <td className="whitespace-nowrap px-6 py-5">
                        <div className="text-sm font-semibold text-slate-950">
                          {row.accountCode} - {row.accountName}
                        </div>

                        <div className="mt-1 text-xs text-slate-500">
                          Management: {row.managementReportCategory}
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-6 py-5 text-sm text-slate-600">
                        <div>{formatStatus(row.accountType)}</div>
                        <div className="mt-1 text-xs text-slate-500">
                          {formatStatus(row.accountSubtype)}
                        </div>
                      </td>

                      <td className="px-6 py-5 text-sm text-slate-600">
                        <div>{row.fsSection}</div>
                        <div className="mt-1 text-xs text-slate-500">
                          {row.fsLineItem}
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-6 py-5 text-right text-sm font-semibold text-slate-950">
                        {formatMoney(
                          organisation.base_currency_code,
                          row.debitTotal
                        )}
                      </td>

                      <td className="whitespace-nowrap px-6 py-5 text-right text-sm font-semibold text-slate-950">
                        {formatMoney(
                          organisation.base_currency_code,
                          row.creditTotal
                        )}
                      </td>

                      <td className="whitespace-nowrap px-6 py-5 text-right text-sm font-semibold text-slate-950">
                        {row.debitBalance > 0
                          ? formatMoney(
                              organisation.base_currency_code,
                              row.debitBalance
                            )
                          : "—"}
                      </td>

                      <td className="whitespace-nowrap px-6 py-5 text-right text-sm font-semibold text-slate-950">
                        {row.creditBalance > 0
                          ? formatMoney(
                              organisation.base_currency_code,
                              row.creditBalance
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
                      {formatMoney(
                        organisation.base_currency_code,
                        totalDebitsPosted
                      )}
                    </td>

                    <td className="whitespace-nowrap px-6 py-5 text-right text-sm font-semibold text-slate-950">
                      {formatMoney(
                        organisation.base_currency_code,
                        totalCreditsPosted
                      )}
                    </td>

                    <td className="whitespace-nowrap px-6 py-5 text-right text-sm font-semibold text-slate-950">
                      {formatMoney(
                        organisation.base_currency_code,
                        totalDebitBalance
                      )}
                    </td>

                    <td className="whitespace-nowrap px-6 py-5 text-right text-sm font-semibold text-slate-950">
                      {formatMoney(
                        organisation.base_currency_code,
                        totalCreditBalance
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
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
                Read-only trial balance foundation
              </h2>

              <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-600">
                This trial balance is calculated from posted General Ledger
                lines only. Draft journals and unposted source transactions do
                not affect this report. This protects the integrity of reporting
                until review, approval, and posting workflows are completed.
              </p>

              <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#F1F1F1] px-4 py-2 text-sm font-semibold text-[#073D7F]">
                <CheckCircle className="h-4 w-4" />
                Ready for future financial statement mapping
              </div>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}