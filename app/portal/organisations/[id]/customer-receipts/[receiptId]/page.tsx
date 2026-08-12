import { redirect } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle,
  Coins,
  FileText,
  ShieldCheck,
  WalletCards,
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

export default async function CustomerReceiptDetailPage({
  params,
}: {
  params: Promise<{ id: string; receiptId: string }>;
}) {
  const { id, receiptId } = await params;

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

  const { data: receipt } = await supabase
    .from("customer_receipts")
    .select("*")
    .eq("id", receiptId)
    .eq("organisation_id", id)
    .single();

  if (!receipt) {
    redirect(`/portal/organisations/${id}/customer-receipts`);
  }

  const { data: existingLedgerEntry } = await supabase
    .from("general_ledger_entries")
    .select("id")
    .eq("organisation_id", id)
    .eq("source_module", "CUSTOMER_RECEIPT")
    .eq("source_record_id", receiptId)
    .maybeSingle();

  const canEditReceipt =
    editableStatuses.includes(receipt.status || "") &&
    !receipt.posted_at &&
    !existingLedgerEntry;

  const { data: customer } = await supabase
    .from("customers")
    .select("id, customer_name, email, phone, customer_type")
    .eq("id", receipt.customer_id)
    .eq("organisation_id", id)
    .single();

  let linkedInvoice: AnyRecord | null = null;

  if (receipt.sales_invoice_id) {
    const { data: invoice } = await supabase
      .from("sales_invoices")
      .select(
        "id, invoice_number, invoice_date, due_date, currency_code, total_amount, balance_due, status"
      )
      .eq("id", receipt.sales_invoice_id)
      .eq("organisation_id", id)
      .single();

    linkedInvoice = invoice;
  }

  const accountIds = [
    receipt.bank_account_id,
    receipt.receivable_account_id,
    receipt.income_account_id,
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

  const bankAccount = accountMap.get(receipt.bank_account_id);
  const receivableAccount = accountMap.get(receipt.receivable_account_id);
  const incomeAccount = accountMap.get(receipt.income_account_id);

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <section className="border-b border-[#D9E3F4] bg-white">
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          <a
            href={`/portal/organisations/${organisation.id}/customer-receipts`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#073D7F]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to customer receipts
          </a>

          <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-5">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F1F1F1] text-[#073D7F]">
                <WalletCards className="h-6 w-6" />
              </div>

              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                  Customer Receipt
                </div>

                <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
                  {receipt.receipt_number || "Untitled receipt"}
                </h1>

                <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                  Review the full draft customer receipt for {organisationName},
                  including customer details, linked invoice, cash movement, GL
                  mapping, FX information, and control status.
                </p>

                <div className="mt-5 flex flex-wrap gap-3">
                  <span className="rounded-full bg-[#F1F1F1] px-4 py-2 text-sm font-semibold text-[#073D7F]">
                    {formatStatus(receipt.status)}
                  </span>

                  <span className="rounded-full bg-[#F1F1F1] px-4 py-2 text-sm font-semibold text-slate-700">
                    {receipt.currency_code || organisation.base_currency_code}
                  </span>

                  <span className="rounded-full bg-[#F1F1F1] px-4 py-2 text-sm font-semibold text-slate-700">
                    Receipt Date: {formatDate(receipt.receipt_date)}
                  </span>
                </div>

                {canEditReceipt ? (
                  <div className="mt-6">
                    <a
                      href={`/portal/organisations/${organisation.id}/customer-receipts/${receipt.id}/edit`}
                      className="inline-flex rounded-full bg-[#073D7F] px-5 py-3 text-sm font-semibold text-white"
                    >
                      Edit Draft Receipt
                    </a>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-[#F1F1F1] p-5 text-sm text-slate-600">
              <div className="font-semibold text-slate-950">Customer</div>
              <div className="mt-2 text-lg font-semibold text-[#073D7F]">
                {customer?.customer_name || "Customer not found"}
              </div>
              <div className="mt-2">{customer?.email || "No email"}</div>
              <div className="mt-1">{customer?.phone || "No phone"}</div>

              {canEditReceipt ? (
                <a
                  href={`/portal/organisations/${organisation.id}/customer-receipts/${receipt.id}/edit`}
                  className="mt-4 inline-flex w-full justify-center rounded-full border border-[#D9E3F4] bg-white px-4 py-2 text-sm font-semibold text-[#073D7F]"
                >
                  Edit Draft Receipt
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
              Amount Received
            </div>
            <div className="mt-3 text-2xl font-semibold text-slate-950">
              {formatMoney(receipt.currency_code, receipt.amount_received)}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">
              Bank Charges
            </div>
            <div className="mt-3 text-2xl font-semibold text-slate-950">
              {formatMoney(receipt.currency_code, receipt.bank_charges)}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">
              Net Amount
            </div>
            <div className="mt-3 text-2xl font-semibold text-slate-950">
              {formatMoney(receipt.currency_code, receipt.net_amount)}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">
              Payment Method
            </div>
            <div className="mt-3 text-2xl font-semibold text-slate-950">
              {formatStatus(receipt.payment_method)}
            </div>
          </div>
        </div>

        <BankingReconciliationContextPanel
          organisationId={organisation.id}
          sourceModule="CUSTOMER_RECEIPT"
          sourceRecordId={receipt.id}
        />

        <div className="mt-8 grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-[#073D7F]" />
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                Receipt Details
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm">
                <div className="font-semibold text-slate-950">
                  Receipt Number
                </div>
                <div className="mt-2 text-slate-600">
                  {receipt.receipt_number || "—"}
                </div>
              </div>

              <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm">
                <div className="font-semibold text-slate-950">Status</div>
                <div className="mt-2 text-slate-600">
                  {formatStatus(receipt.status)}
                </div>
              </div>

              <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm">
                <div className="font-semibold text-slate-950">
                  Receipt Date
                </div>
                <div className="mt-2 text-slate-600">
                  {formatDate(receipt.receipt_date)}
                </div>
              </div>

              <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm">
                <div className="font-semibold text-slate-950">
                  Reference Number
                </div>
                <div className="mt-2 text-slate-600">
                  {receipt.reference_number || "—"}
                </div>
              </div>

              <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm">
                <div className="font-semibold text-slate-950">Currency</div>
                <div className="mt-2 text-slate-600">
                  {receipt.currency_code || "—"}
                </div>
              </div>

              <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm">
                <div className="font-semibold text-slate-950">
                  Linked Invoice
                </div>
                <div className="mt-2 text-slate-600">
                  {linkedInvoice?.invoice_number || "Not linked"}
                </div>
              </div>
            </div>

            {linkedInvoice ? (
              <div className="mt-6 rounded-2xl border border-[#D9E3F4] bg-white p-5 text-sm leading-7 text-slate-600">
                <div className="font-semibold text-slate-950">
                  Linked Sales Invoice
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Invoice
                    </div>
                    <a
                      href={`/portal/organisations/${organisation.id}/sales-invoices/${linkedInvoice.id}`}
                      className="mt-1 inline-flex font-semibold text-[#073D7F]"
                    >
                      {linkedInvoice.invoice_number}
                    </a>
                  </div>

                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Invoice Total
                    </div>
                    <div className="mt-1">
                      {formatMoney(
                        linkedInvoice.currency_code,
                        linkedInvoice.total_amount
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Balance Due
                    </div>
                    <div className="mt-1">
                      {formatMoney(
                        linkedInvoice.currency_code,
                        linkedInvoice.balance_due
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-[#D9E3F4] bg-white p-5 text-sm leading-7 text-slate-600">
                <div className="font-semibold text-slate-950">
                  Direct Receipt
                </div>
                <div className="mt-2">
                  This receipt is not linked to a sales invoice. It is mapped to
                  an income or revenue account for future posting.
                </div>
              </div>
            )}

            <div className="mt-6 rounded-2xl border border-[#D9E3F4] bg-white p-5 text-sm leading-7 text-slate-600">
              <div className="font-semibold text-slate-950">Narration</div>
              <div className="mt-2">
                {receipt.narration || "No narration provided."}
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-[#D9E3F4] bg-white p-5 text-sm leading-7 text-slate-600">
              <div className="font-semibold text-slate-950">Internal Notes</div>
              <div className="mt-2">
                {receipt.internal_notes || "No internal notes."}
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
                  {formatAccount(bankAccount)}
                </div>
              </div>

              <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm">
                <div className="font-semibold text-slate-950">
                  Receivable Account
                </div>
                <div className="mt-2 text-slate-600">
                  {formatAccount(receivableAccount)}
                </div>
              </div>

              <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm">
                <div className="font-semibold text-slate-950">
                  Income / Revenue Account
                </div>
                <div className="mt-2 text-slate-600">
                  {formatAccount(incomeAccount)}
                </div>
              </div>

              <div className="rounded-2xl border border-[#D9E3F4] bg-white p-5 text-sm">
                <div className="font-semibold text-slate-950">
                  Exchange Rate
                </div>
                <div className="mt-2 text-slate-600">
                  {formatNumber(receipt.exchange_rate)}
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Rate Date
                    </div>
                    <div className="mt-1 text-slate-600">
                      {formatDate(receipt.exchange_rate_date)}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Source
                    </div>
                    <div className="mt-1 text-slate-600">
                      {formatStatus(receipt.exchange_rate_source)}
                    </div>
                  </div>
                </div>

                <div className="mt-4 inline-flex rounded-full bg-[#F1F1F1] px-3 py-1 text-xs font-semibold text-[#073D7F]">
                  {receipt.exchange_rate_is_locked
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
                Draft customer receipt record
              </h2>

              <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-600">
                This customer receipt is currently an operational draft record.
                It does not post to the general ledger, receivables ledger,
                customer statement, bank reconciliation, tax reporting, or
                management reporting until review, posting, and audit trail
                controls are completed.
              </p>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="inline-flex items-center gap-2 rounded-full bg-[#F1F1F1] px-4 py-2 text-sm font-semibold text-[#073D7F]">
                  <CheckCircle className="h-4 w-4" />
                  Ready for review and posting workflow
                </div>

                {canEditReceipt ? (
                  <a
                    href={`/portal/organisations/${organisation.id}/customer-receipts/${receipt.id}/edit`}
                    className="inline-flex justify-center rounded-full bg-[#073D7F] px-5 py-2 text-sm font-semibold text-white"
                  >
                    Edit Draft Receipt
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