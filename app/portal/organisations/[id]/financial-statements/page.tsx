import { redirect } from "next/navigation";
import {
  ArrowLeft,
  BookOpenCheck,
  CheckCircle,
  FileSpreadsheet,
  Landmark,
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

type FsLineRow = {
  key: string;
  accountType: string;
  accountSubtype: string;
  fsSection: string;
  fsLineItem: string;
  balance: number;
  accountCount: number;
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

function normaliseText(value?: string | null) {
  return (value || "")
    .toString()
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
}

function isOciLine(row: FsLineRow) {
  const combined = `${row.accountSubtype} ${row.fsSection} ${row.fsLineItem}`;

  return combined.toUpperCase().includes("OTHER COMPREHENSIVE");
}

function sortRows(rows: FsLineRow[]) {
  return rows.sort((a, b) => {
    const sectionCompare = a.fsSection.localeCompare(b.fsSection);
    if (sectionCompare !== 0) return sectionCompare;

    return a.fsLineItem.localeCompare(b.fsLineItem);
  });
}

export default async function FinancialStatementsPage({
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
    .select(
      "id, legal_name, trading_name, base_currency_code, reporting_framework_code"
    )
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
  const fsLineMap = new Map<string, FsLineRow>();
  const fsLineAccountTracker = new Map<string, Set<string>>();

  for (const line of ledgerLines) {
    const account = accountMap.get(line.account_id);
    if (!account) continue;

    const debitAmount = Number(line.base_debit_amount || line.debit_amount || 0);
    const creditAmount = Number(
      line.base_credit_amount || line.credit_amount || 0
    );

    const accountType = normaliseText(account.account_type || "UNKNOWN");
    const accountSubtype = account.account_subtype || "Not classified";
    const fsSection = account.fs_section || "Not mapped";
    const fsLineItem = account.fs_line_item || "Not mapped";

    let movement = 0;

    if (accountType === "ASSET") {
      movement = debitAmount - creditAmount;
    } else if (accountType === "LIABILITY" || accountType === "EQUITY") {
      movement = creditAmount - debitAmount;
    } else if (accountType === "INCOME") {
      movement = creditAmount - debitAmount;
    } else if (accountType === "EXPENSE") {
      movement = debitAmount - creditAmount;
    } else {
      continue;
    }

    const key = `${accountType}::${fsSection}::${fsLineItem}`;

    const existing = fsLineMap.get(key);

    const row: FsLineRow =
      existing || {
        key,
        accountType,
        accountSubtype,
        fsSection,
        fsLineItem,
        balance: 0,
        accountCount: 0,
      };

    row.balance = Number((row.balance + movement).toFixed(2));

    if (!fsLineAccountTracker.has(key)) {
      fsLineAccountTracker.set(key, new Set<string>());
    }

    fsLineAccountTracker.get(key)?.add(account.id);
    row.accountCount = fsLineAccountTracker.get(key)?.size || 0;

    fsLineMap.set(key, row);
  }

  const allFsRows = Array.from(fsLineMap.values()).filter(
    (row) => row.balance !== 0
  );

  const assetRows = sortRows(
    allFsRows.filter((row) => row.accountType === "ASSET")
  );

  const liabilityRows = sortRows(
    allFsRows.filter((row) => row.accountType === "LIABILITY")
  );

  const equityRows = sortRows(
    allFsRows.filter((row) => row.accountType === "EQUITY")
  );

  const incomeRows = sortRows(
    allFsRows.filter((row) => row.accountType === "INCOME" && !isOciLine(row))
  );

  const expenseRows = sortRows(
    allFsRows.filter((row) => row.accountType === "EXPENSE")
  );

  const ociRows = sortRows(
    allFsRows.filter((row) => row.accountType === "INCOME" && isOciLine(row))
  );

  const totalAssets = assetRows.reduce((sum, row) => sum + row.balance, 0);
  const totalLiabilities = liabilityRows.reduce(
    (sum, row) => sum + row.balance,
    0
  );
  const totalEquityBeforeResult = equityRows.reduce(
    (sum, row) => sum + row.balance,
    0
  );

  const totalIncome = incomeRows.reduce((sum, row) => sum + row.balance, 0);
  const totalExpenses = expenseRows.reduce((sum, row) => sum + row.balance, 0);
  const profitOrLoss = Number((totalIncome - totalExpenses).toFixed(2));

  const totalOci = ociRows.reduce((sum, row) => sum + row.balance, 0);
  const totalComprehensiveIncome = Number((profitOrLoss + totalOci).toFixed(2));

  const totalEquityIncludingCurrentResult = Number(
    (totalEquityBeforeResult + totalComprehensiveIncome).toFixed(2)
  );

  const totalLiabilitiesAndEquity = Number(
    (totalLiabilities + totalEquityIncludingCurrentResult).toFixed(2)
  );

  const statementDifference = Number(
    (totalAssets - totalLiabilitiesAndEquity).toFixed(2)
  );

  const organisationName =
    organisation.trading_name || organisation.legal_name || "Organisation";

  const baseCurrencyCode = organisation.base_currency_code;

  function renderFsRows(rows: FsLineRow[], emptyMessage: string) {
    if (rows.length === 0) {
      return (
        <div className="px-6 py-8 text-sm text-slate-500">{emptyMessage}</div>
      );
    }

    return (
      <div className="divide-y divide-[#D9E3F4]">
        {rows.map((row) => (
          <div
            key={row.key}
            className="grid gap-4 px-6 py-5 text-sm md:grid-cols-[1fr_0.45fr_0.35fr]"
          >
            <div>
              <div className="font-semibold text-slate-950">
                {row.fsLineItem}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                FS section: {row.fsSection}
              </div>
            </div>

            <div className="text-slate-600">
              <div>{formatStatus(row.accountSubtype)}</div>
              <div className="mt-1 text-xs text-slate-500">
                Aggregated accounts: {row.accountCount}
              </div>
            </div>

            <div className="text-right font-semibold text-slate-950">
              {formatMoney(baseCurrencyCode, row.balance)}
            </div>
          </div>
        ))}
      </div>
    );
  }

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
                  IFRS-Aligned Financial Statements Foundation
                </div>

                <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
                  Financial statements
                </h1>

                <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                  Review financial statement line items for {organisationName},
                  generated from posted General Ledger lines and aggregated by
                  mapped FS line item, not individual GL account name.
                </p>

                <div className="mt-5 flex flex-wrap gap-3">
                  <span className="rounded-full bg-[#F1F1F1] px-4 py-2 text-sm font-semibold text-[#073D7F]">
                    Base currency: {organisation.base_currency_code || "—"}
                  </span>

                  <span className="rounded-full bg-[#F1F1F1] px-4 py-2 text-sm font-semibold text-slate-700">
                    Framework: {organisation.reporting_framework_code || "—"}
                  </span>

                  <span className="rounded-full bg-[#F1F1F1] px-4 py-2 text-sm font-semibold text-slate-700">
                    Posted GL entries: {ledgerEntries.length}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <a
                href={`/portal/organisations/${organisation.id}/trial-balance`}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#073D7F] px-6 py-3 text-sm font-semibold text-white shadow-sm"
              >
                <BookOpenCheck className="h-4 w-4" />
                Open Trial Balance
              </a>

              <a
                href={`/portal/organisations/${organisation.id}/general-ledger`}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#D9E3F4] bg-white px-6 py-3 text-sm font-semibold text-[#073D7F]"
              >
                <Landmark className="h-4 w-4" />
                Open General Ledger
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">
              Total Assets
            </div>
            <div className="mt-3 text-2xl font-semibold text-slate-950">
              {formatMoney(baseCurrencyCode, totalAssets)}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">
              Total Liabilities
            </div>
            <div className="mt-3 text-2xl font-semibold text-slate-950">
              {formatMoney(baseCurrencyCode, totalLiabilities)}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">
              Equity Including Current Result
            </div>
            <div className="mt-3 text-2xl font-semibold text-slate-950">
              {formatMoney(baseCurrencyCode, totalEquityIncludingCurrentResult)}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">
              Statement Status
            </div>
            <div className="mt-3 inline-flex rounded-full bg-[#F1F1F1] px-4 py-2 text-sm font-semibold text-[#073D7F]">
              {statementDifference === 0 ? "Balanced" : "Out of Balance"}
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">
              Total Income
            </div>
            <div className="mt-3 text-2xl font-semibold text-slate-950">
              {formatMoney(baseCurrencyCode, totalIncome)}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">
              Total Expenses
            </div>
            <div className="mt-3 text-2xl font-semibold text-slate-950">
              {formatMoney(baseCurrencyCode, totalExpenses)}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">
              Profit / Surplus
            </div>
            <div className="mt-3 text-2xl font-semibold text-slate-950">
              {formatMoney(baseCurrencyCode, profitOrLoss > 0 ? profitOrLoss : 0)}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">
              Loss / Deficit
            </div>
            <div className="mt-3 text-2xl font-semibold text-slate-950">
              {formatMoney(
                baseCurrencyCode,
                profitOrLoss < 0 ? Math.abs(profitOrLoss) : 0
              )}
            </div>
          </div>
        </div>

        <section className="mt-8 rounded-[2rem] border border-[#D9E3F4] bg-white shadow-sm">
          <div className="border-b border-[#D9E3F4] px-6 py-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">
                  Statement of Financial Position
                </h2>
                <p className="mt-2 text-sm leading-7 text-slate-500">
                  Presented by mapped FS line items. Individual GL account names
                  are aggregated beneath each FS item.
                </p>
              </div>

              <div className="rounded-2xl bg-[#F8FAFC] px-5 py-4 text-sm">
                <div className="font-semibold text-slate-950">
                  Accounting equation check
                </div>
                <div className="mt-1 text-slate-600">
                  Assets less liabilities and equity:{" "}
                  <span className="font-semibold text-slate-950">
                    {formatMoney(baseCurrencyCode, Math.abs(statementDifference))}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {assetRows.length + liabilityRows.length + equityRows.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F8FAFC] text-[#073D7F]">
                <FileSpreadsheet className="h-6 w-6" />
              </div>

              <h3 className="mt-5 text-lg font-semibold text-slate-950">
                No financial position balances yet
              </h3>

              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
                The statement of financial position will appear after asset,
                liability, and equity FS line items have posted General Ledger
                balances.
              </p>
            </div>
          ) : (
            <div>
              <div className="border-b border-[#D9E3F4]">
                <div className="bg-[#F8FAFC] px-6 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-[#6491DE]">
                  Assets
                </div>

                {renderFsRows(assetRows, "No asset FS item balances posted yet.")}

                <div className="grid gap-4 bg-[#F8FAFC] px-6 py-5 text-sm md:grid-cols-[1fr_0.45fr_0.35fr]">
                  <div className="font-semibold text-slate-950">
                    Total Assets
                  </div>
                  <div />
                  <div className="text-right font-semibold text-slate-950">
                    {formatMoney(baseCurrencyCode, totalAssets)}
                  </div>
                </div>
              </div>

              <div className="border-b border-[#D9E3F4]">
                <div className="bg-[#F8FAFC] px-6 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-[#6491DE]">
                  Liabilities
                </div>

                {renderFsRows(
                  liabilityRows,
                  "No liability FS item balances posted yet."
                )}

                <div className="grid gap-4 bg-[#F8FAFC] px-6 py-5 text-sm md:grid-cols-[1fr_0.45fr_0.35fr]">
                  <div className="font-semibold text-slate-950">
                    Total Liabilities
                  </div>
                  <div />
                  <div className="text-right font-semibold text-slate-950">
                    {formatMoney(baseCurrencyCode, totalLiabilities)}
                  </div>
                </div>
              </div>

              <div>
                <div className="bg-[#F8FAFC] px-6 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-[#6491DE]">
                  Equity
                </div>

                {renderFsRows(
                  equityRows,
                  "No equity FS item balances posted yet."
                )}

                <div className="grid gap-4 border-t border-[#D9E3F4] bg-white px-6 py-5 text-sm md:grid-cols-[1fr_0.45fr_0.35fr]">
                  <div>
                    <div className="font-semibold text-slate-950">
                      Current period result bridge
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      Links profit or loss and OCI to equity until closing
                      entries / retained earnings workflow is fully built.
                    </div>
                  </div>
                  <div className="text-sm text-slate-600">
                    Profit or loss + OCI
                  </div>
                  <div className="text-right font-semibold text-slate-950">
                    {formatMoney(baseCurrencyCode, totalComprehensiveIncome)}
                  </div>
                </div>

                <div className="grid gap-4 bg-[#F8FAFC] px-6 py-5 text-sm md:grid-cols-[1fr_0.45fr_0.35fr]">
                  <div className="font-semibold text-slate-950">
                    Total Equity Including Current Result
                  </div>
                  <div />
                  <div className="text-right font-semibold text-slate-950">
                    {formatMoney(
                      baseCurrencyCode,
                      totalEquityIncludingCurrentResult
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t border-[#D9E3F4] bg-[#073D7F] px-6 py-6 text-white">
                <div className="grid gap-4 md:grid-cols-[1fr_0.45fr]">
                  <div>
                    <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#6491DE]">
                      Total Liabilities and Equity
                    </div>
                    <div className="mt-2 text-sm text-blue-100">
                      Includes current period result bridge until closing entries
                      and statement of changes in equity are fully built.
                    </div>
                  </div>

                  <div className="text-right text-xl font-semibold">
                    {formatMoney(baseCurrencyCode, totalLiabilitiesAndEquity)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="mt-8 rounded-[2rem] border border-[#D9E3F4] bg-white shadow-sm">
          <div className="border-b border-[#D9E3F4] px-6 py-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">
                  Statement of Profit or Loss and Other Comprehensive Income /
                  Activities
                </h2>
                <p className="mt-2 text-sm leading-7 text-slate-500">
                  Presented by mapped FS line items from posted General Ledger
                  balances. This foundation supports both business reporting and
                  nonprofit activities reporting.
                </p>
              </div>

              <div className="rounded-2xl bg-[#F8FAFC] px-5 py-4 text-sm">
                <div className="font-semibold text-slate-950">
                  Total comprehensive result
                </div>
                <div className="mt-1 text-slate-600">
                  {totalComprehensiveIncome >= 0
                    ? "Surplus / Profit"
                    : "Deficit / Loss"}
                  :{" "}
                  <span className="font-semibold text-slate-950">
                    {formatMoney(
                      baseCurrencyCode,
                      Math.abs(totalComprehensiveIncome)
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {incomeRows.length + expenseRows.length + ociRows.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F8FAFC] text-[#073D7F]">
                <FileSpreadsheet className="h-6 w-6" />
              </div>

              <h3 className="mt-5 text-lg font-semibold text-slate-950">
                No profit or loss balances yet
              </h3>

              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
                This statement will appear after income, expense, or OCI FS line
                items have posted General Ledger balances.
              </p>
            </div>
          ) : (
            <div>
              <div className="border-b border-[#D9E3F4]">
                <div className="bg-[#F8FAFC] px-6 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-[#6491DE]">
                  Income
                </div>

                {renderFsRows(incomeRows, "No income FS item balances posted yet.")}

                <div className="grid gap-4 bg-[#F8FAFC] px-6 py-5 text-sm md:grid-cols-[1fr_0.45fr_0.35fr]">
                  <div className="font-semibold text-slate-950">
                    Total Income
                  </div>
                  <div />
                  <div className="text-right font-semibold text-slate-950">
                    {formatMoney(baseCurrencyCode, totalIncome)}
                  </div>
                </div>
              </div>

              <div className="border-b border-[#D9E3F4]">
                <div className="bg-[#F8FAFC] px-6 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-[#6491DE]">
                  Expenses
                </div>

                {renderFsRows(
                  expenseRows,
                  "No expense FS item balances posted yet."
                )}

                <div className="grid gap-4 bg-[#F8FAFC] px-6 py-5 text-sm md:grid-cols-[1fr_0.45fr_0.35fr]">
                  <div className="font-semibold text-slate-950">
                    Total Expenses
                  </div>
                  <div />
                  <div className="text-right font-semibold text-slate-950">
                    {formatMoney(baseCurrencyCode, totalExpenses)}
                  </div>
                </div>
              </div>

              <div className="border-b border-[#D9E3F4] bg-white">
                <div className="grid gap-4 px-6 py-5 text-sm md:grid-cols-[1fr_0.45fr_0.35fr]">
                  <div>
                    <div className="font-semibold text-slate-950">
                      Profit or Loss / Surplus or Deficit for the Period
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      Income less expenses.
                    </div>
                  </div>
                  <div />
                  <div className="text-right font-semibold text-slate-950">
                    {formatMoney(baseCurrencyCode, profitOrLoss)}
                  </div>
                </div>
              </div>

              <div className="border-b border-[#D9E3F4]">
                <div className="bg-[#F8FAFC] px-6 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-[#6491DE]">
                  Other Comprehensive Income
                </div>

                {renderFsRows(ociRows, "No OCI FS item balances posted yet.")}

                <div className="grid gap-4 bg-[#F8FAFC] px-6 py-5 text-sm md:grid-cols-[1fr_0.45fr_0.35fr]">
                  <div className="font-semibold text-slate-950">
                    Total Other Comprehensive Income
                  </div>
                  <div />
                  <div className="text-right font-semibold text-slate-950">
                    {formatMoney(baseCurrencyCode, totalOci)}
                  </div>
                </div>
              </div>

              <div className="border-t border-[#D9E3F4] bg-[#073D7F] px-6 py-6 text-white">
                <div className="grid gap-4 md:grid-cols-[1fr_0.45fr]">
                  <div>
                    <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#6491DE]">
                      Total Comprehensive Income / Result
                    </div>
                    <div className="mt-2 text-sm text-blue-100">
                      Links to equity through the current period result bridge
                      until closing entries and changes in equity are built.
                    </div>
                  </div>

                  <div className="text-right text-xl font-semibold">
                    {formatMoney(baseCurrencyCode, totalComprehensiveIncome)}
                  </div>
                </div>
              </div>
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
                Foundation-stage IFRS-aligned reporting
              </h2>

              <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-600">
                These statements are generated from posted General Ledger lines
                and mapped FS line items only. This is not yet a complete IFRS
                or IAS-compliant financial statement pack. Full compliance will
                require reporting periods, comparatives, statement of changes in
                equity, statement of cash flows, notes, accounting policies,
                disclosures, review controls, and export-ready financial
                statement formatting.
              </p>

              <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#F1F1F1] px-4 py-2 text-sm font-semibold text-[#073D7F]">
                <CheckCircle className="h-4 w-4" />
                Ready for future full financial statement pack workflow
              </div>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}