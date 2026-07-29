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

type StatementRow = {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: string;
  accountSubtype: string;
  fsSection: string;
  fsLineItem: string;
  balance: number;
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

function sortRows(rows: StatementRow[]) {
  return rows.sort((a, b) => {
    const sectionCompare = a.fsSection.localeCompare(b.fsSection);
    if (sectionCompare !== 0) return sectionCompare;

    const lineCompare = a.fsLineItem.localeCompare(b.fsLineItem);
    if (lineCompare !== 0) return lineCompare;

    return a.accountCode.localeCompare(b.accountCode);
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
  const statementMap = new Map<string, StatementRow>();

  for (const line of ledgerLines) {
    const account = accountMap.get(line.account_id);
    if (!account) continue;

    const debitAmount = Number(line.base_debit_amount || line.debit_amount || 0);
    const creditAmount = Number(
      line.base_credit_amount || line.credit_amount || 0
    );

    const accountType = (account.account_type || "UNKNOWN").toUpperCase();

    let movement = 0;

    if (accountType === "ASSET") {
      movement = debitAmount - creditAmount;
    } else if (accountType === "LIABILITY" || accountType === "EQUITY") {
      movement = creditAmount - debitAmount;
    } else {
      continue;
    }

    const existing = statementMap.get(account.id);

    const row: StatementRow =
      existing || {
        accountId: account.id,
        accountCode: account.account_code || "No code",
        accountName: account.account_name || "Unnamed account",
        accountType,
        accountSubtype: account.account_subtype || "—",
        fsSection: account.fs_section || "Not mapped",
        fsLineItem: account.fs_line_item || "Not mapped",
        balance: 0,
      };

    row.balance = Number((row.balance + movement).toFixed(2));

    statementMap.set(account.id, row);
  }

  const statementRows = Array.from(statementMap.values()).filter(
    (row) => row.balance !== 0
  );

  const assetRows = sortRows(
    statementRows.filter((row) => row.accountType === "ASSET")
  );

  const liabilityRows = sortRows(
    statementRows.filter((row) => row.accountType === "LIABILITY")
  );

  const equityRows = sortRows(
    statementRows.filter((row) => row.accountType === "EQUITY")
  );

  const totalAssets = assetRows.reduce((sum, row) => sum + row.balance, 0);
  const totalLiabilities = liabilityRows.reduce(
    (sum, row) => sum + row.balance,
    0
  );
  const totalEquity = equityRows.reduce((sum, row) => sum + row.balance, 0);

  const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;
  const statementDifference = Number(
    (totalAssets - totalLiabilitiesAndEquity).toFixed(2)
  );

  const organisationName =
  organisation.trading_name || organisation.legal_name || "Organisation";

const baseCurrencyCode = organisation.base_currency_code;

function renderRows(rows: StatementRow[], emptyMessage: string) {
    if (rows.length === 0) {
      return (
        <div className="px-6 py-8 text-sm text-slate-500">{emptyMessage}</div>
      );
    }

    return (
      <div className="divide-y divide-[#D9E3F4]">
        {rows.map((row) => (
          <div
            key={row.accountId}
            className="grid gap-4 px-6 py-5 text-sm md:grid-cols-[1fr_0.5fr_0.35fr]"
          >
            <div>
              <div className="font-semibold text-slate-950">
                {row.accountCode} - {row.accountName}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {row.fsLineItem}
              </div>
            </div>

            <div className="text-slate-600">
              <div>{formatStatus(row.accountSubtype)}</div>
              <div className="mt-1 text-xs text-slate-500">{row.fsSection}</div>
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
                  Financial Statements
                </div>

                <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
                  Statement of financial position
                </h1>

                <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                  Review a read-only statement of financial position for{" "}
                  {organisationName}, generated from posted General Ledger lines
                  and chart of accounts financial statement mapping.
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
              {formatMoney(organisation.base_currency_code, totalAssets)}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">
              Total Liabilities
            </div>
            <div className="mt-3 text-2xl font-semibold text-slate-950">
              {formatMoney(organisation.base_currency_code, totalLiabilities)}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">
              Total Equity
            </div>
            <div className="mt-3 text-2xl font-semibold text-slate-950">
              {formatMoney(organisation.base_currency_code, totalEquity)}
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

        <section className="mt-8 rounded-[2rem] border border-[#D9E3F4] bg-white shadow-sm">
          <div className="border-b border-[#D9E3F4] px-6 py-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">
                  Statement of Financial Position
                </h2>
                <p className="mt-2 text-sm leading-7 text-slate-500">
                  Generated from posted General Ledger balances only. Draft
                  journals and unposted transactions are excluded.
                </p>
              </div>

              <div className="rounded-2xl bg-[#F8FAFC] px-5 py-4 text-sm">
                <div className="font-semibold text-slate-950">
                  Accounting equation check
                </div>
                <div className="mt-1 text-slate-600">
                  Assets less liabilities and equity:{" "}
                  <span className="font-semibold text-slate-950">
                    {formatMoney(
                      organisation.base_currency_code,
                      Math.abs(statementDifference)
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {statementRows.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F8FAFC] text-[#073D7F]">
                <FileSpreadsheet className="h-6 w-6" />
              </div>

              <h3 className="mt-5 text-lg font-semibold text-slate-950">
                No financial statement balances yet
              </h3>

              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
                The statement of financial position will appear after asset,
                liability, and equity accounts have posted General Ledger
                balances.
              </p>
            </div>
          ) : (
            <div>
              <div className="border-b border-[#D9E3F4]">
                <div className="bg-[#F8FAFC] px-6 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-[#6491DE]">
                  Assets
                </div>

                {renderRows(assetRows, "No asset balances posted yet.")}

                <div className="grid gap-4 bg-[#F8FAFC] px-6 py-5 text-sm md:grid-cols-[1fr_0.5fr_0.35fr]">
                  <div className="font-semibold text-slate-950">
                    Total Assets
                  </div>
                  <div />
                  <div className="text-right font-semibold text-slate-950">
                    {formatMoney(organisation.base_currency_code, totalAssets)}
                  </div>
                </div>
              </div>

              <div className="border-b border-[#D9E3F4]">
                <div className="bg-[#F8FAFC] px-6 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-[#6491DE]">
                  Liabilities
                </div>

                {renderRows(
                  liabilityRows,
                  "No liability balances posted yet."
                )}

                <div className="grid gap-4 bg-[#F8FAFC] px-6 py-5 text-sm md:grid-cols-[1fr_0.5fr_0.35fr]">
                  <div className="font-semibold text-slate-950">
                    Total Liabilities
                  </div>
                  <div />
                  <div className="text-right font-semibold text-slate-950">
                    {formatMoney(
                      organisation.base_currency_code,
                      totalLiabilities
                    )}
                  </div>
                </div>
              </div>

              <div>
                <div className="bg-[#F8FAFC] px-6 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-[#6491DE]">
                  Equity
                </div>

                {renderRows(equityRows, "No equity balances posted yet.")}

                <div className="grid gap-4 bg-[#F8FAFC] px-6 py-5 text-sm md:grid-cols-[1fr_0.5fr_0.35fr]">
                  <div className="font-semibold text-slate-950">
                    Total Equity
                  </div>
                  <div />
                  <div className="text-right font-semibold text-slate-950">
                    {formatMoney(organisation.base_currency_code, totalEquity)}
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
                      Should agree to total assets after all postings and
                      mappings are complete.
                    </div>
                  </div>

                  <div className="text-right text-xl font-semibold">
                    {formatMoney(
                      organisation.base_currency_code,
                      totalLiabilitiesAndEquity
                    )}
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
                Read-only financial statements foundation
              </h2>

              <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-600">
                This statement is generated from posted General Ledger lines
                only. It is not yet a final unaudited financial statement pack.
                Future versions will include statement of profit or loss,
                statement of cash flows, statement of changes in equity, notes,
                review controls, export, and reporting period filters.
              </p>

              <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#F1F1F1] px-4 py-2 text-sm font-semibold text-[#073D7F]">
                <CheckCircle className="h-4 w-4" />
                Ready for future IFRS-ready financial statement pack
              </div>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}