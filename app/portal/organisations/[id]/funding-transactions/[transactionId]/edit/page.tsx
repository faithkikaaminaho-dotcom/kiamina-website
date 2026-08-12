import { redirect } from "next/navigation";
import { ArrowLeft, Landmark } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import BankingReconciliationContextPanel from "../../../components/BankingReconciliationContextPanel";
import EditFundingTransactionForm from "./EditFundingTransactionForm";

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

const editableStatuses = ["DRAFT", "READY_FOR_REVIEW", "REVIEWED", "UNDER_REVIEW"];

function accountText(account: {
  account_type: string | null;
  account_subtype?: string | null;
  fs_line_item?: string | null;
  account_name?: string | null;
}) {
  return `${account.account_type || ""} ${account.account_subtype || ""} ${
    account.fs_line_item || ""
  } ${account.account_name || ""}`.toUpperCase();
}

function isEquityLikeAccount(account: {
  account_type: string | null;
  account_subtype?: string | null;
  fs_line_item?: string | null;
  account_name?: string | null;
}) {
  const text = accountText(account);

  return text.includes("EQUITY") || text.includes("CAPITAL");
}

function isLiabilityLikeAccount(account: {
  account_type: string | null;
  account_subtype?: string | null;
  fs_line_item?: string | null;
  account_name?: string | null;
}) {
  const text = accountText(account);

  return (
    text.includes("LIABILITY") ||
    text.includes("LOAN") ||
    text.includes("PAYABLE")
  );
}

function isIncomeLikeAccount(account: {
  account_type: string | null;
  account_subtype?: string | null;
  fs_line_item?: string | null;
  account_name?: string | null;
}) {
  const text = accountText(account);

  return (
    text.includes("INCOME") ||
    text.includes("REVENUE") ||
    text.includes("GRANT") ||
    text.includes("DONATION") ||
    text.includes("OPERATING_INCOME") ||
    text.includes("INVESTING_INCOME") ||
    text.includes("FINANCING_INCOME")
  );
}

function isExpenseLikeAccount(account: {
  account_type: string | null;
  account_subtype?: string | null;
  fs_line_item?: string | null;
  account_name?: string | null;
}) {
  const text = accountText(account);

  return (
    text.includes("EXPENSE") ||
    text.includes("COST_OF_SALES") ||
    text.includes("COST OF SALES") ||
    text.includes("INCOME_TAX") ||
    text.includes("FINANCING_EXPENSE") ||
    text.includes("INVESTING_EXPENSE") ||
    text.includes("OPERATING_EXPENSE")
  );
}

export default async function EditFundingTransactionPage({
  params,
}: {
  params: Promise<{ id: string; transactionId: string }>;
}) {
  const { id, transactionId } = await params;

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

  const { data: transaction } = await supabase
    .from("funding_transactions")
    .select("*")
    .eq("id", transactionId)
    .eq("organisation_id", id)
    .single();

  if (!transaction) {
    redirect(`/portal/organisations/${id}/funding-transactions`);
  }

  if (
    transaction.status === "POSTED" ||
    transaction.posted_at ||
    !editableStatuses.includes(transaction.status || "")
  ) {
    redirect(
      `/portal/organisations/${id}/funding-transactions/${transactionId}`
    );
  }

  const { data: existingLedgerEntry } = await supabase
    .from("general_ledger_entries")
    .select("id")
    .eq("organisation_id", id)
    .eq("source_module", "FUNDING_TRANSACTION")
    .eq("source_record_id", transactionId)
    .maybeSingle();

  if (existingLedgerEntry) {
    redirect(
      `/portal/organisations/${id}/funding-transactions/${transactionId}`
    );
  }

  const { data: investors } = await supabase
    .from("investors")
    .select("id, investor_name")
    .eq("organisation_id", id)
    .order("investor_name", { ascending: true });

  const { data: capitalCalls } = await supabase
    .from("capital_calls")
    .select(
      "id, call_number, investor_id, currency_code, amount_called, outstanding_amount, status"
    )
    .eq("organisation_id", id)
    .order("call_date", { ascending: false });

  const { data: bankingAccounts } = await supabase
    .from("bank_accounts")
    .select("id, account_name, bank_name, account_number, currency_code")
    .eq("organisation_id", id)
    .order("account_name", { ascending: true });

  const bankAccounts =
    bankingAccounts?.map((account) => ({
      id: account.id,
      account_code:
        account.bank_name ||
        account.currency_code ||
        account.account_number ||
        "Bank",
      account_name:
        account.account_number && account.account_name
          ? `${account.account_name} (${account.account_number})`
          : account.account_name || account.account_number || "Unnamed bank account",
      account_type: "Asset",
    })) || [];

  const { data: allAccounts } = await supabase
    .from("chart_of_accounts")
    .select(
      "id, account_code, account_name, account_type, account_subtype, fs_line_item, management_report_category, is_control_account, tax_relevant"
    )
    .eq("organisation_id", id)
    .or("is_active.is.true,is_active.is.null")
    .order("account_code", { ascending: true });

  const equityAccounts =
    allAccounts?.filter((account) => isEquityLikeAccount(account)) || [];

  const liabilityAccounts =
    allAccounts?.filter((account) => isLiabilityLikeAccount(account)) || [];

  const incomeAccounts =
    allAccounts?.filter((account) => isIncomeLikeAccount(account)) || [];

  const expenseAccounts =
    allAccounts?.filter((account) => isExpenseLikeAccount(account)) || [];

  const organisationName =
    organisation.trading_name || organisation.legal_name || "Organisation";

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <section className="border-b border-[#D9E3F4] bg-white">
        <div className="mx-auto max-w-6xl px-6 py-8 lg:px-8">
          <a
            href={`/portal/organisations/${organisation.id}/funding-transactions/${transaction.id}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#073D7F]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to funding transaction detail
          </a>

          <div className="mt-8 flex items-start gap-5">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F1F1F1] text-[#073D7F]">
              <Landmark className="h-6 w-6" />
            </div>

            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                Edit Draft Funding Transaction
              </div>

              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
                {transaction.transaction_number || "Draft funding transaction"}
              </h1>

              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                Review and edit this draft funding transaction for{" "}
                {organisationName} before posting the linked bank-line group to
                the General Ledger.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10 lg:px-8">
        <BankingReconciliationContextPanel
          organisationId={organisation.id}
          sourceModule="FUNDING_TRANSACTION"
          sourceRecordId={transaction.id}
        />

        <EditFundingTransactionForm
          organisationId={organisation.id}
          transaction={transaction}
          defaultCurrency={organisation.base_currency_code}
          investors={investors || []}
          capitalCalls={capitalCalls || []}
          bankAccounts={bankAccounts}
          equityAccounts={equityAccounts}
          liabilityAccounts={liabilityAccounts}
          incomeAccounts={incomeAccounts}
          expenseAccounts={expenseAccounts}
        />
      </section>
    </main>
  );
}