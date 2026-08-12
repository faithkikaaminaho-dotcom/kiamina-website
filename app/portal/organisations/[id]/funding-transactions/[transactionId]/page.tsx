import { redirect } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle,
  Coins,
  FileText,
  Landmark,
  ShieldCheck,
} from "lucide-react";
import { createClient } from "@/utils/supabase/server";
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

const editableStatuses = ["DRAFT", "READY_FOR_REVIEW", "REVIEWED", "UNDER_REVIEW"];

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
  if (!account) return "Not selected";

  const code = account.account_code || "No code";
  const name = account.account_name || "Unnamed account";

  return `${code} - ${name}`;
}

function formatBankAccount(account?: AnyRecord | null) {
  if (!account) return "Not selected";

  const bankName = account.bank_name || "Bank";
  const accountName = account.account_name || "Unnamed bank account";
  const accountNumber = account.account_number ? ` (${account.account_number})` : "";

  return `${bankName} - ${accountName}${accountNumber}`;
}

function isOutflow(transactionType?: string | null) {
  return transactionType === "LOAN_REPAYMENT" || transactionType === "INTEREST_PAYMENT";
}

export default async function FundingTransactionDetailPage({
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

  const { data: existingLedgerEntry } = await supabase
    .from("general_ledger_entries")
    .select("id")
    .eq("organisation_id", id)
    .eq("source_module", "FUNDING_TRANSACTION")
    .eq("source_record_id", transactionId)
    .maybeSingle();

  const canEditTransaction =
    editableStatuses.includes(transaction.status || "") &&
    !transaction.posted_at &&
    !existingLedgerEntry;

  let investor: AnyRecord | null = null;

  if (transaction.investor_id) {
    const { data: investorRecord } = await supabase
      .from("investors")
      .select(
        "id, investor_name, investor_type, funding_type, email, phone, currency_code, committed_amount, contributed_amount, outstanding_amount"
      )
      .eq("id", transaction.investor_id)
      .eq("organisation_id", id)
      .single();

    investor = investorRecord;
  }

  let linkedCapitalCall: AnyRecord | null = null;

  if (transaction.capital_call_id) {
    const { data: capitalCall } = await supabase
      .from("capital_calls")
      .select(
        "id, call_number, call_date, due_date, currency_code, called_amount, amount_received, outstanding_amount, funding_type, purpose, status"
      )
      .eq("id", transaction.capital_call_id)
      .eq("organisation_id", id)
      .single();

    linkedCapitalCall = capitalCall;
  }

  let bankAccount: AnyRecord | null = null;

  if (transaction.bank_account_id) {
    const { data: bankAccountRecord } = await supabase
      .from("bank_accounts")
      .select("id, account_name, bank_name, account_number, currency_code, gl_account_id")
      .eq("id", transaction.bank_account_id)
      .eq("organisation_id", id)
      .maybeSingle();

    bankAccount = bankAccountRecord;
  }

  const accountIds = [
    transaction.equity_account_id,
    transaction.liability_account_id,
    transaction.income_account_id,
    transaction.interest_expense_account_id,
  ].filter(Boolean);

  let accounts: AnyRecord[] = [];

  if (accountIds.length > 0) {
    const { data: chartAccounts } = await supabase
      .from("chart_of_accounts")
      .select(
        "id, account_code, account_name, account_type, account_subtype, fs_section, fs_line_item"
      )
      .eq("organisation_id", id)
      .in("id", accountIds);

    accounts = chartAccounts || [];
  }

  const accountMap = new Map(accounts.map((account) => [account.id, account]));

  const organisationName =
    organisation.trading_name || organisation.legal_name || "Organisation";

  const equityAccount = accountMap.get(transaction.equity_account_id);
  const liabilityAccount = accountMap.get(transaction.liability_account_id);
  const incomeAccount = accountMap.get(transaction.income_account_id);
  const interestExpenseAccount = accountMap.get(
    transaction.interest_expense_account_id
  );

  const transactionIsOutflow = isOutflow(transaction.transaction_type);

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <section className="border-b border-[#D9E3F4] bg-white">
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          <a
            href={`/portal/organisations/${organisation.id}/funding-transactions`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#073D7F]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to funding transactions
          </a>

          <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-5">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F1F1F1] text-[#073D7F]">
                <Landmark className="h-6 w-6" />
              </div>

              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                  Funding Transaction
                </div>

                <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
                  {transaction.transaction_number ||
                    "Untitled funding transaction"}
                </h1>

                <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                  Review the full draft funding transaction for {organisationName},
                  including investor or funder details, linked capital call,
                  funding type, cash movement, GL mapping, FX information, and
                  control status.
                </p>

                <div className="mt-5 flex flex-wrap gap-3">
                  <span className="rounded-full bg-[#F1F1F1] px-4 py-2 text-sm font-semibold text-[#073D7F]">
                    {formatStatus(transaction.status)}
                  </span>

                  <span className="rounded-full bg-[#F1F1F1] px-4 py-2 text-sm font-semibold text-slate-700">
                    {formatStatus(transaction.transaction_type)}
                  </span>

                  <span className="rounded-full bg-[#F1F1F1] px-4 py-2 text-sm font-semibold text-slate-700">
                    {transaction.currency_code || organisation.base_currency_code}
                  </span>

                  <span className="rounded-full bg-[#F1F1F1] px-4 py-2 text-sm font-semibold text-slate-700">
                    Date: {formatDate(transaction.transaction_date)}
                  </span>
                </div>

                {canEditTransaction ? (
                  <div className="mt-6">
                    <a
                      href={`/portal/organisations/${organisation.id}/funding-transactions/${transaction.id}/edit`}
                      className="inline-flex rounded-full bg-[#073D7F] px-5 py-3 text-sm font-semibold text-white"
                    >
                      Edit Draft Funding Transaction
                    </a>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-[#F1F1F1] p-5 text-sm text-slate-600">
              <div className="font-semibold text-slate-950">
                Investor / Funder
              </div>
              <div className="mt-2 text-lg font-semibold text-[#073D7F]">
                {investor?.investor_name || "No investor / funder linked"}
              </div>
              <div className="mt-2">{investor?.email || "No email"}</div>
              <div className="mt-1">{investor?.phone || "No phone"}</div>

              {canEditTransaction ? (
                <a
                  href={`/portal/organisations/${organisation.id}/funding-transactions/${transaction.id}/edit`}
                  className="mt-4 inline-flex w-full justify-center rounded-full border border-[#D9E3F4] bg-white px-4 py-2 text-sm font-semibold text-[#073D7F]"
                >
                  Edit Draft Transaction
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">
              Transaction Amount
            </div>
            <div className="mt-3 text-2xl font-semibold text-slate-950">
              {formatMoney(transaction.currency_code, transaction.amount)}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">
              Bank Charges
            </div>
            <div className="mt-3 text-2xl font-semibold text-slate-950">
              {formatMoney(transaction.currency_code, transaction.bank_charges)}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">
              {transactionIsOutflow ? "Total Cash Outflow" : "Net Amount Received"}
            </div>
            <div className="mt-3 text-2xl font-semibold text-slate-950">
              {formatMoney(transaction.currency_code, transaction.net_amount)}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">
              Payment Method
            </div>
            <div className="mt-3 text-2xl font-semibold text-slate-950">
              {formatStatus(transaction.payment_method)}
            </div>
          </div>
        </div>

        <BankingReconciliationContextPanel
          organisationId={organisation.id}
          sourceModule="FUNDING_TRANSACTION"
          sourceRecordId={transaction.id}
        />

        <div className="mt-8 grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-[#073D7F]" />
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                Transaction Details
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm">
                <div className="font-semibold text-slate-950">
                  Transaction Number
                </div>
                <div className="mt-2 text-slate-600">
                  {transaction.transaction_number || "—"}
                </div>
              </div>

              <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm">
                <div className="font-semibold text-slate-950">
                  Transaction Type
                </div>
                <div className="mt-2 text-slate-600">
                  {formatStatus(transaction.transaction_type)}
                </div>
              </div>

              <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm">
                <div className="font-semibold text-slate-950">
                  Transaction Date
                </div>
                <div className="mt-2 text-slate-600">
                  {formatDate(transaction.transaction_date)}
                </div>
              </div>

              <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm">
                <div className="font-semibold text-slate-950">Status</div>
                <div className="mt-2 text-slate-600">
                  {formatStatus(transaction.status)}
                </div>
              </div>

              <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm">
                <div className="font-semibold text-slate-950">Currency</div>
                <div className="mt-2 text-slate-600">
                  {transaction.currency_code || "—"}
                </div>
              </div>

              <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm">
                <div className="font-semibold text-slate-950">
                  Reference Number
                </div>
                <div className="mt-2 text-slate-600">
                  {transaction.reference_number || "—"}
                </div>
              </div>
            </div>

            {linkedCapitalCall ? (
              <div className="mt-6 rounded-2xl border border-[#D9E3F4] bg-white p-5 text-sm leading-7 text-slate-600">
                <div className="font-semibold text-slate-950">
                  Linked Capital Call
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Capital Call
                    </div>
                    <a
                      href={`/portal/organisations/${organisation.id}/capital-calls/${linkedCapitalCall.id}`}
                      className="mt-1 inline-flex font-semibold text-[#073D7F]"
                    >
                      {linkedCapitalCall.call_number}
                    </a>
                  </div>

                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Called Amount
                    </div>
                    <div className="mt-1">
                      {formatMoney(
                        linkedCapitalCall.currency_code,
                        linkedCapitalCall.called_amount
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Outstanding
                    </div>
                    <div className="mt-1">
                      {formatMoney(
                        linkedCapitalCall.currency_code,
                        linkedCapitalCall.outstanding_amount
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 text-xs text-slate-500">
                  Purpose: {linkedCapitalCall.purpose || "—"}
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-[#D9E3F4] bg-white p-5 text-sm leading-7 text-slate-600">
                <div className="font-semibold text-slate-950">
                  No Capital Call Linked
                </div>
                <div className="mt-2">
                  This funding transaction is not linked to a capital call. It
                  may represent direct funding, loan drawdown, donation, grant,
                  repayment, interest payment, or another funding movement.
                </div>
              </div>
            )}

            <div className="mt-6 rounded-2xl border border-[#D9E3F4] bg-white p-5 text-sm leading-7 text-slate-600">
              <div className="font-semibold text-slate-950">
                Funding Purpose
              </div>
              <div className="mt-2">
                {transaction.purpose || "No funding purpose provided."}
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-[#D9E3F4] bg-white p-5 text-sm leading-7 text-slate-600">
              <div className="font-semibold text-slate-950">Narration</div>
              <div className="mt-2">
                {transaction.narration || "No narration provided."}
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-[#D9E3F4] bg-white p-5 text-sm leading-7 text-slate-600">
              <div className="font-semibold text-slate-950">Internal Notes</div>
              <div className="mt-2">
                {transaction.internal_notes || "No internal notes."}
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm">
            <div className="flex items-center gap-3">
              <Coins className="h-5 w-5 text-[#073D7F]" />
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                GL & FX Mapping
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm">
                <div className="font-semibold text-slate-950">
                  Bank Account
                </div>
                <div className="mt-2 text-slate-600">
                  {formatBankAccount(bankAccount)}
                </div>
              </div>

              <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm">
                <div className="font-semibold text-slate-950">
                  Equity / Fund Account
                </div>
                <div className="mt-2 text-slate-600">
                  {formatAccount(equityAccount)}
                </div>
              </div>

              <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm">
                <div className="font-semibold text-slate-950">
                  Liability Account
                </div>
                <div className="mt-2 text-slate-600">
                  {formatAccount(liabilityAccount)}
                </div>
              </div>

              <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm">
                <div className="font-semibold text-slate-950">
                  Income / Grant Account
                </div>
                <div className="mt-2 text-slate-600">
                  {formatAccount(incomeAccount)}
                </div>
              </div>

              <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm">
                <div className="font-semibold text-slate-950">
                  Interest Expense Account
                </div>
                <div className="mt-2 text-slate-600">
                  {formatAccount(interestExpenseAccount)}
                </div>
              </div>

              <div className="rounded-2xl border border-[#D9E3F4] bg-white p-5 text-sm">
                <div className="font-semibold text-slate-950">
                  Exchange Rate
                </div>
                <div className="mt-2 text-slate-600">
                  {formatNumber(transaction.exchange_rate)}
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Rate Date
                    </div>
                    <div className="mt-1 text-slate-600">
                      {formatDate(transaction.exchange_rate_date)}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Source
                    </div>
                    <div className="mt-1 text-slate-600">
                      {formatStatus(transaction.exchange_rate_source)}
                    </div>
                  </div>
                </div>

                <div className="mt-4 inline-flex rounded-full bg-[#F1F1F1] px-3 py-1 text-xs font-semibold text-[#073D7F]">
                  {transaction.exchange_rate_is_locked
                    ? "FX Rate Locked"
                    : "FX Rate Not Locked"}
                </div>
              </div>
            </div>
          </section>
        </div>

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
                Draft funding transaction record
              </h2>

              <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-600">
                This funding transaction is currently an operational draft
                record. It does not update the general ledger, investor balance,
                loan balance, capital call balance, bank balance, financial
                reporting, or management reporting until review, posting, and
                audit trail controls are completed.
              </p>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="inline-flex items-center gap-2 rounded-full bg-[#F1F1F1] px-4 py-2 text-sm font-semibold text-[#073D7F]">
                  <CheckCircle className="h-4 w-4" />
                  Ready for review, matching, and posting workflow
                </div>

                {canEditTransaction ? (
                  <a
                    href={`/portal/organisations/${organisation.id}/funding-transactions/${transaction.id}/edit`}
                    className="inline-flex justify-center rounded-full bg-[#073D7F] px-5 py-2 text-sm font-semibold text-white"
                  >
                    Edit Draft Funding Transaction
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}