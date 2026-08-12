import { redirect } from "next/navigation";
import { ArrowLeft, ListTree, Plus } from "lucide-react";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

const internalRoles = [
  "SUPER_ADMIN",
  "ADMIN",
  "STAFF",
  "IT_ADMIN",
  "ACCOUNTANT_ADMIN",
  "ACCOUNTANT_USER",
  "CUSTOMER_SUPPORT",
  "COMPLIANCE_ADMIN",
  "OPERATIONS_ADMIN",
];

type AccountRecord = {
  id: string;
  account_code: string | null;
  account_name: string | null;
  account_type: string | null;
  account_subtype: string | null;
  normal_balance: string | null;
  fs_section: string | null;
  fs_line_item: string | null;
  cash_flow_category: string | null;
  management_report_category: string | null;
  is_active: boolean | null;
};

function formatStatus(isActive?: boolean | null) {
  if (isActive === false) return "Inactive";
  return "Active";
}

function formatAccountText(value?: string | null) {
  if (!value) return "—";

  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getAccountGroup(account: AccountRecord) {
  const accountType = account.account_type || "";
  const accountSubtype = account.account_subtype || "";

  const combined = `${accountType} ${accountSubtype}`.toUpperCase();

  if (
    combined.includes("ASSET") ||
    combined.includes("CURRENT_ASSET") ||
    combined.includes("NON_CURRENT_ASSET")
  ) {
    return "Asset";
  }

  if (
    combined.includes("LIABILITY") ||
    combined.includes("CURRENT_LIABILITY") ||
    combined.includes("NON_CURRENT_LIABILITY")
  ) {
    return "Liability";
  }

  if (combined.includes("EQUITY") || combined.includes("CAPITAL")) {
    return "Equity";
  }

  if (
    combined.includes("INCOME") ||
    combined.includes("REVENUE") ||
    combined.includes("OPERATING_INCOME") ||
    combined.includes("INVESTING_INCOME") ||
    combined.includes("FINANCING_INCOME")
  ) {
    return "Income";
  }

  if (
    combined.includes("EXPENSE") ||
    combined.includes("COST_OF_SALES") ||
    combined.includes("COST OF SALES") ||
    combined.includes("INCOME_TAX") ||
    combined.includes("FINANCING_EXPENSE") ||
    combined.includes("INVESTING_EXPENSE") ||
    combined.includes("OPERATING_EXPENSE")
  ) {
    return "Expense";
  }

  return "Other";
}

function groupedByType(accounts: AccountRecord[]) {
  return {
    Asset: accounts.filter((account) => getAccountGroup(account) === "Asset"),
    Liability: accounts.filter(
      (account) => getAccountGroup(account) === "Liability"
    ),
    Equity: accounts.filter((account) => getAccountGroup(account) === "Equity"),
    Income: accounts.filter((account) => getAccountGroup(account) === "Income"),
    Expense: accounts.filter(
      (account) => getAccountGroup(account) === "Expense"
    ),
    Other: accounts.filter((account) => getAccountGroup(account) === "Other"),
  };
}

export default async function ChartOfAccountsPage({
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

  const { data: accountsData, error: accountsError } = await supabase
    .from("chart_of_accounts")
    .select(
      "id, account_code, account_name, account_type, account_subtype, normal_balance, fs_section, fs_line_item, cash_flow_category, management_report_category, is_active"
    )
    .eq("organisation_id", organisation.id)
    .order("account_code", { ascending: true });

  const accounts = (accountsData || []) as AccountRecord[];
  const groupedAccounts = groupedByType(accounts);

  const activeIncomeAccounts = accounts.filter(
    (account) =>
      getAccountGroup(account) === "Income" && account.is_active !== false
  );

  const activeExpenseAccounts = accounts.filter(
    (account) =>
      getAccountGroup(account) === "Expense" && account.is_active !== false
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
                <ListTree className="h-6 w-6" />
              </div>

              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                  Chart of Accounts
                </div>

                <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
                  {organisationName}
                </h1>

                <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                  View and manage accounts used for transaction categorisation,
                  ledger posting, Trial Balance, financial statement mapping,
                  and management reporting.
                </p>
              </div>
            </div>

            <a
              href={`/portal/organisations/${organisation.id}/chart-of-accounts/new`}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#073D7F] px-5 py-3 text-sm font-semibold text-white"
            >
              <Plus className="h-4 w-4" />
              Add Account
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        {accountsError ? (
          <div className="rounded-[1.5rem] border border-red-200 bg-red-50 p-5 text-sm leading-7 text-red-700">
            Unable to load Chart of Accounts: {accountsError.message}
          </div>
        ) : null}

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">
              Total Accounts
            </div>
            <div className="mt-3 text-3xl font-semibold text-slate-950">
              {accounts.length}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">
              Income Accounts
            </div>
            <div className="mt-3 text-3xl font-semibold text-slate-950">
              {activeIncomeAccounts.length}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">
              Expense Accounts
            </div>
            <div className="mt-3 text-3xl font-semibold text-slate-950">
              {activeExpenseAccounts.length}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">
              Base Currency
            </div>
            <div className="mt-3 text-3xl font-semibold text-slate-950">
              {organisation.base_currency_code || "—"}
            </div>
          </div>
        </div>

        {activeIncomeAccounts.length === 0 || activeExpenseAccounts.length === 0 ? (
          <div className="mt-8 rounded-[1.5rem] border border-amber-200 bg-amber-50 p-6 text-sm leading-7 text-amber-800">
            <div className="font-semibold text-amber-950">
              Required posting accounts missing
            </div>
            <div className="mt-2">
              Direct customer receipts require at least one Income account.
              Direct supplier payments require at least one Expense account.
            </div>
            <a
              href={`/portal/organisations/${organisation.id}/chart-of-accounts/new`}
              className="mt-4 inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#073D7F]"
            >
              Add missing account
            </a>
          </div>
        ) : null}

        {accounts.length === 0 ? (
          <div className="mt-8 rounded-[2rem] border border-[#D9E3F4] bg-white p-8 text-center shadow-sm">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
              No accounts created yet
            </h2>

            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              Create your first account before posting source transactions to
              the General Ledger.
            </p>

            <a
              href={`/portal/organisations/${organisation.id}/chart-of-accounts/new`}
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-[#073D7F] px-5 py-3 text-sm font-semibold text-white"
            >
              <Plus className="h-4 w-4" />
              Add First Account
            </a>
          </div>
        ) : (
          <div className="mt-8 space-y-8">
            {Object.entries(groupedAccounts)
              .filter(([, items]) => items.length > 0)
              .map(([accountType, items]) => (
                <section
                  key={accountType}
                  className="rounded-[2rem] border border-[#D9E3F4] bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-col gap-3 border-b border-[#D9E3F4] pb-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                        {accountType}
                      </div>

                      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                        {items.length} account{items.length === 1 ? "" : "s"}
                      </h2>
                    </div>

                    <a
                      href={`/portal/organisations/${organisation.id}/chart-of-accounts/new`}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-[#D9E3F4] bg-white px-4 py-2 text-sm font-semibold text-[#073D7F]"
                    >
                      <Plus className="h-4 w-4" />
                      Add Account
                    </a>
                  </div>

                  <div className="mt-5 overflow-x-auto rounded-2xl border border-[#D9E3F4]">
                    <table className="min-w-full divide-y divide-[#D9E3F4] text-left text-sm">
                      <thead className="bg-[#F8FAFC]">
                        <tr>
                          <th className="whitespace-nowrap px-4 py-3 font-semibold uppercase tracking-[0.14em] text-slate-500">
                            Code
                          </th>
                          <th className="whitespace-nowrap px-4 py-3 font-semibold uppercase tracking-[0.14em] text-slate-500">
                            Account
                          </th>
                          <th className="whitespace-nowrap px-4 py-3 font-semibold uppercase tracking-[0.14em] text-slate-500">
                            Type
                          </th>
                          <th className="whitespace-nowrap px-4 py-3 font-semibold uppercase tracking-[0.14em] text-slate-500">
                            Subtype
                          </th>
                          <th className="whitespace-nowrap px-4 py-3 font-semibold uppercase tracking-[0.14em] text-slate-500">
                            FS Section
                          </th>
                          <th className="whitespace-nowrap px-4 py-3 font-semibold uppercase tracking-[0.14em] text-slate-500">
                            FS Line
                          </th>
                          <th className="whitespace-nowrap px-4 py-3 font-semibold uppercase tracking-[0.14em] text-slate-500">
                            Cash Flow
                          </th>
                          <th className="whitespace-nowrap px-4 py-3 font-semibold uppercase tracking-[0.14em] text-slate-500">
                            Normal Balance
                          </th>
                          <th className="whitespace-nowrap px-4 py-3 font-semibold uppercase tracking-[0.14em] text-slate-500">
                            Status
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-[#D9E3F4] bg-white">
                        {items.map((account) => (
                          <tr key={account.id}>
                            <td className="whitespace-nowrap px-4 py-4 font-semibold text-slate-950">
                              {account.account_code || "—"}
                            </td>

                            <td className="min-w-[220px] px-4 py-4 text-slate-700">
                              {account.account_name || "Unnamed account"}
                            </td>

                            <td className="min-w-[180px] px-4 py-4 text-slate-600">
                              {formatAccountText(account.account_type)}
                            </td>

                            <td className="min-w-[180px] px-4 py-4 text-slate-600">
                              {formatAccountText(account.account_subtype)}
                            </td>

                            <td className="min-w-[220px] px-4 py-4 text-slate-600">
                              {account.fs_section || "—"}
                            </td>

                            <td className="min-w-[220px] px-4 py-4 text-slate-600">
                              {account.fs_line_item || "—"}
                            </td>

                            <td className="min-w-[180px] px-4 py-4 text-slate-600">
                              {account.cash_flow_category || "—"}
                            </td>

                            <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                              {account.normal_balance || "—"}
                            </td>

                            <td className="whitespace-nowrap px-4 py-4">
                              <span className="inline-flex rounded-full bg-[#F1F1F1] px-3 py-1 text-xs font-semibold text-[#073D7F]">
                                {formatStatus(account.is_active)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              ))}
          </div>
        )}
      </section>
    </main>
  );
}