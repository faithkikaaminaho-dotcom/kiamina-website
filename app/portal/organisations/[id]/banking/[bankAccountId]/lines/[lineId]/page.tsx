import { redirect } from "next/navigation";
import { ArrowLeft, Banknote, CheckCircle, RefreshCcw } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import MatchBankLineForm from "./MatchBankLineForm";

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

type SourceCandidate = {
  source_module: string;
  source_record_id: string;
  label: string;
  description: string;
  amount: number;
  currency_code: string | null;
  transaction_date: string | null;
  status: string | null;
};

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

function toNumber(value: unknown) {
  const numericValue = Number(value || 0);

  return Number.isFinite(numericValue) ? numericValue : 0;
}

export default async function BankStatementLineDetailPage({
  params,
}: {
  params: Promise<{ id: string; bankAccountId: string; lineId: string }>;
}) {
  const { id, bankAccountId, lineId } = await params;

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
    .select("id, account_name, bank_name, account_number, currency_code")
    .eq("id", bankAccountId)
    .eq("organisation_id", id)
    .single();

  if (!bankAccount) {
    redirect(`/portal/organisations/${id}/banking`);
  }

  const { data: bankLine } = await supabase
    .from("bank_statement_lines")
    .select(
      "id, organisation_id, bank_account_id, transaction_date, value_date, description, reference_number, money_in, money_out, running_balance, currency_code, reconciliation_status, matched_source_module, matched_source_record_id, matched_amount, added_transaction_module, added_transaction_id, notes, created_at"
    )
    .eq("id", lineId)
    .eq("organisation_id", id)
    .eq("bank_account_id", bankAccountId)
    .single();

  if (!bankLine) {
    redirect(`/portal/organisations/${id}/banking/${bankAccountId}`);
  }

  const bankLineAmount =
    toNumber(bankLine.money_in) > 0
      ? toNumber(bankLine.money_in)
      : toNumber(bankLine.money_out);

  const isMoneyIn = toNumber(bankLine.money_in) > 0;
  const isAlreadyMatched = [
    "MATCHED",
    "RECONCILED",
    "ADDED_TO_BOOKS",
  ].includes(bankLine.reconciliation_status || "");

  const candidates: SourceCandidate[] = [];

  const { data: customerReceipts } = await supabase
    .from("customer_receipts")
    .select(
      "id, receipt_number, receipt_date, currency_code, amount_received, net_amount, status, customer_id"
    )
    .eq("organisation_id", id)
    .order("receipt_date", { ascending: false })
    .limit(50);

  if (customerReceipts) {
    candidates.push(
      ...customerReceipts.map((receipt) => ({
        source_module: "CUSTOMER_RECEIPT",
        source_record_id: receipt.id,
        label: receipt.receipt_number || "Customer Receipt",
        description: "Customer receipt recorded in source transactions.",
        amount: toNumber(receipt.net_amount || receipt.amount_received),
        currency_code: receipt.currency_code,
        transaction_date: receipt.receipt_date,
        status: receipt.status,
      }))
    );
  }

  const { data: supplierPayments } = await supabase
    .from("supplier_payments")
    .select(
      "id, payment_number, payment_date, currency_code, amount_paid, total_cash_outflow, status, supplier_id"
    )
    .eq("organisation_id", id)
    .order("payment_date", { ascending: false })
    .limit(50);

  if (supplierPayments) {
    candidates.push(
      ...supplierPayments.map((payment) => ({
        source_module: "SUPPLIER_PAYMENT",
        source_record_id: payment.id,
        label: payment.payment_number || "Supplier Payment",
        description: "Supplier payment recorded in source transactions.",
        amount: toNumber(payment.total_cash_outflow || payment.amount_paid),
        currency_code: payment.currency_code,
        transaction_date: payment.payment_date,
        status: payment.status,
      }))
    );
  }

  const { data: fundingTransactions } = await supabase
    .from("funding_transactions")
    .select(
      "id, transaction_number, transaction_date, transaction_type, currency_code, amount, net_amount, status, investor_id"
    )
    .eq("organisation_id", id)
    .order("transaction_date", { ascending: false })
    .limit(50);

  if (fundingTransactions) {
    candidates.push(
      ...fundingTransactions.map((transaction) => ({
        source_module: "FUNDING_TRANSACTION",
        source_record_id: transaction.id,
        label: transaction.transaction_number || "Funding Transaction",
        description: `Funding transaction · ${formatStatus(
          transaction.transaction_type
        )}`,
        amount: toNumber(transaction.net_amount || transaction.amount),
        currency_code: transaction.currency_code,
        transaction_date: transaction.transaction_date,
        status: transaction.status,
      }))
    );
  }

  const { data: capitalCalls } = await supabase
    .from("capital_calls")
    .select(
      "id, call_number, call_date, currency_code, called_amount, outstanding_amount, status, investor_id"
    )
    .eq("organisation_id", id)
    .order("call_date", { ascending: false })
    .limit(50);

  if (capitalCalls) {
    candidates.push(
      ...capitalCalls.map((call) => ({
        source_module: "CAPITAL_CALL",
        source_record_id: call.id,
        label: call.call_number || "Capital Call",
        description: "Capital call recorded in funding source transactions.",
        amount: toNumber(call.called_amount),
        currency_code: call.currency_code,
        transaction_date: call.call_date,
        status: call.status,
      }))
    );
  }

  const { data: journalEntries } = await supabase
    .from("journal_entries")
    .select(
      "id, journal_number, journal_date, journal_type, description, currency_code, total_debits, total_credits, status"
    )
    .eq("organisation_id", id)
    .order("journal_date", { ascending: false })
    .limit(50);

  if (journalEntries) {
    candidates.push(
      ...journalEntries.map((journal) => ({
        source_module: "JOURNAL_ENTRY",
        source_record_id: journal.id,
        label: journal.journal_number || "Journal Entry",
        description:
          journal.description ||
          `Journal entry · ${formatStatus(journal.journal_type)}`,
        amount: toNumber(journal.total_debits || journal.total_credits),
        currency_code: journal.currency_code,
        transaction_date: journal.journal_date,
        status: journal.status,
      }))
    );
  }

  const { data: salesInvoices } = await supabase
    .from("sales_invoices")
    .select(
      "id, invoice_number, invoice_date, currency_code, total_amount, balance_due, status, customer_id"
    )
    .eq("organisation_id", id)
    .order("invoice_date", { ascending: false })
    .limit(50);

  if (salesInvoices) {
    candidates.push(
      ...salesInvoices.map((invoice) => ({
        source_module: "SALES_INVOICE",
        source_record_id: invoice.id,
        label: invoice.invoice_number || "Sales Invoice",
        description: "Sales invoice recorded in source transactions.",
        amount: toNumber(invoice.total_amount),
        currency_code: invoice.currency_code,
        transaction_date: invoice.invoice_date,
        status: invoice.status,
      }))
    );
  }

  const { data: purchaseBills } = await supabase
    .from("purchase_bills")
    .select(
      "id, bill_number, bill_date, currency_code, total_amount, balance_due, status, supplier_id"
    )
    .eq("organisation_id", id)
    .order("bill_date", { ascending: false })
    .limit(50);

  if (purchaseBills) {
    candidates.push(
      ...purchaseBills.map((bill) => ({
        source_module: "PURCHASE_BILL",
        source_record_id: bill.id,
        label: bill.bill_number || "Purchase Bill",
        description: "Purchase bill recorded in source transactions.",
        amount: toNumber(bill.total_amount),
        currency_code: bill.currency_code,
        transaction_date: bill.bill_date,
        status: bill.status,
      }))
    );
  }

  const { data: generalLedgerEntries } = await supabase
    .from("general_ledger_entries")
    .select(
      "id, entry_number, entry_date, source_module, description, currency_code, total_debits, total_credits, status"
    )
    .eq("organisation_id", id)
    .order("entry_date", { ascending: false })
    .limit(50);

  if (generalLedgerEntries) {
    candidates.push(
      ...generalLedgerEntries.map((entry) => ({
        source_module: "GENERAL_LEDGER_ENTRY",
        source_record_id: entry.id,
        label: entry.entry_number || "General Ledger Entry",
        description:
          entry.description ||
          `General Ledger entry · ${formatStatus(entry.source_module)}`,
        amount: toNumber(entry.total_debits || entry.total_credits),
        currency_code: entry.currency_code,
        transaction_date: entry.entry_date,
        status: entry.status,
      }))
    );
  }

  const likelyCandidates = candidates
    .filter((candidate) => {
      const sameAmount =
        Math.abs(toNumber(candidate.amount) - toNumber(bankLineAmount)) < 0.01;

      if (isMoneyIn) {
        return [
          "CUSTOMER_RECEIPT",
          "FUNDING_TRANSACTION",
          "CAPITAL_CALL",
          "SALES_INVOICE",
          "JOURNAL_ENTRY",
          "GENERAL_LEDGER_ENTRY",
        ].includes(candidate.source_module) || sameAmount;
      }

      return [
        "SUPPLIER_PAYMENT",
        "PURCHASE_BILL",
        "JOURNAL_ENTRY",
        "GENERAL_LEDGER_ENTRY",
      ].includes(candidate.source_module) || sameAmount;
    })
    .sort((a, b) => {
      const aAmountMatch =
        Math.abs(toNumber(a.amount) - toNumber(bankLineAmount)) < 0.01 ? 0 : 1;
      const bAmountMatch =
        Math.abs(toNumber(b.amount) - toNumber(bankLineAmount)) < 0.01 ? 0 : 1;

      return aAmountMatch - bAmountMatch;
    });

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <section className="border-b border-[#D9E3F4] bg-white">
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          <a
            href={`/portal/organisations/${organisation.id}/banking/${bankAccount.id}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#073D7F]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to bank account
          </a>

          <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-5">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F1F1F1] text-[#073D7F]">
                <Banknote className="h-6 w-6" />
              </div>

              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                  Bank Reconciliation
                </div>

                <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
                  Open / Match bank line
                </h1>

                <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                  Match this bank statement line to an existing source
                  transaction or keep it unmatched until the correct transaction
                  is created.
                </p>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-[#F1F1F1] p-5 text-sm text-slate-600">
              <div className="font-semibold text-slate-950">
                Bank Account
              </div>

              <div className="mt-2 text-sm text-slate-700">
                {bankAccount.account_name}
              </div>

              <div className="mt-1 text-xs text-slate-500">
                {bankAccount.bank_name || "No bank name"} ·{" "}
                {bankAccount.account_number || "No account number"}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <section className="mb-8 rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                Bank Line Details
              </div>

              <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
                {bankLine.description}
              </h2>

              <div className="mt-3 text-sm text-slate-500">
                {formatDate(bankLine.transaction_date)} ·{" "}
                {bankLine.reference_number || "No reference"}
              </div>
            </div>

            <div className="rounded-[1.5rem] bg-[#F8FAFC] p-5 text-right">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                {isMoneyIn ? "Money In" : "Money Out"}
              </div>

              <div className="mt-2 text-3xl font-semibold text-slate-950">
                {formatMoney(bankLine.currency_code, bankLineAmount)}
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl bg-[#F8FAFC] p-4 text-sm">
              <div className="text-xs text-slate-500">Transaction Date</div>
              <div className="mt-1 font-semibold text-slate-950">
                {formatDate(bankLine.transaction_date)}
              </div>
            </div>

            <div className="rounded-2xl bg-[#F8FAFC] p-4 text-sm">
              <div className="text-xs text-slate-500">Value Date</div>
              <div className="mt-1 font-semibold text-slate-950">
                {formatDate(bankLine.value_date)}
              </div>
            </div>

            <div className="rounded-2xl bg-[#F8FAFC] p-4 text-sm">
              <div className="text-xs text-slate-500">Running Balance</div>
              <div className="mt-1 font-semibold text-slate-950">
                {bankLine.running_balance !== null
                  ? formatMoney(bankLine.currency_code, bankLine.running_balance)
                  : "—"}
              </div>
            </div>

            <div className="rounded-2xl bg-[#F8FAFC] p-4 text-sm">
              <div className="text-xs text-slate-500">Reconciliation</div>
              <div className="mt-1 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#073D7F]">
                {bankLine.reconciliation_status === "UNMATCHED" ? (
                  <RefreshCcw className="h-3 w-3" />
                ) : (
                  <CheckCircle className="h-3 w-3" />
                )}
                {formatStatus(bankLine.reconciliation_status)}
              </div>
            </div>
          </div>

          {bankLine.matched_source_module ? (
            <div className="mt-6 rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-5 text-sm leading-7 text-emerald-800">
              This line is matched to{" "}
              <span className="font-semibold">
                {formatStatus(bankLine.matched_source_module)}
              </span>{" "}
              for {formatMoney(bankLine.currency_code, bankLine.matched_amount)}.
            </div>
          ) : null}

          {bankLine.notes ? (
            <div className="mt-6 rounded-[1.5rem] border border-[#D9E3F4] bg-[#F8FAFC] p-5 text-sm leading-7 text-slate-600">
              <span className="font-semibold text-slate-950">Note:</span>{" "}
              {bankLine.notes}
            </div>
          ) : null}
        </section>

        <MatchBankLineForm
          organisationId={organisation.id}
          bankAccountId={bankAccount.id}
          lineId={bankLine.id}
          bankLineAmount={bankLineAmount}
          bankLineCurrency={bankLine.currency_code}
          candidates={likelyCandidates}
          isAlreadyMatched={isAlreadyMatched}
        />
      </section>
    </main>
  );
}