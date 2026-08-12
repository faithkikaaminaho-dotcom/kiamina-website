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

export default async function SupplierPaymentDetailPage({
  params,
}: {
  params: Promise<{ id: string; paymentId: string }>;
}) {
  const { id, paymentId } = await params;

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

  const { data: payment } = await supabase
    .from("supplier_payments")
    .select("*")
    .eq("id", paymentId)
    .eq("organisation_id", id)
    .single();

  if (!payment) {
    redirect(`/portal/organisations/${id}/supplier-payments`);
  }

  const { data: existingLedgerEntry } = await supabase
    .from("general_ledger_entries")
    .select("id")
    .eq("organisation_id", id)
    .eq("source_module", "SUPPLIER_PAYMENT")
    .eq("source_record_id", paymentId)
    .maybeSingle();

  const canEditPayment =
    editableStatuses.includes(payment.status || "") &&
    !payment.posted_at &&
    !existingLedgerEntry;

  const { data: supplier } = await supabase
    .from("suppliers")
    .select("id, supplier_name, email, phone, supplier_type")
    .eq("id", payment.supplier_id)
    .eq("organisation_id", id)
    .single();

  let linkedBill: AnyRecord | null = null;

  if (payment.purchase_bill_id) {
    const { data: bill } = await supabase
      .from("purchase_bills")
      .select(
        "id, bill_number, supplier_invoice_number, bill_date, due_date, currency_code, total_amount, balance_due, status"
      )
      .eq("id", payment.purchase_bill_id)
      .eq("organisation_id", id)
      .single();

    linkedBill = bill;
  }

  const accountIds = [
    payment.bank_account_id,
    payment.payable_account_id,
    payment.expense_account_id,
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

  const bankAccount = accountMap.get(payment.bank_account_id);
  const payableAccount = accountMap.get(payment.payable_account_id);
  const expenseAccount = accountMap.get(payment.expense_account_id);

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <section className="border-b border-[#D9E3F4] bg-white">
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          <a
            href={`/portal/organisations/${organisation.id}/supplier-payments`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#073D7F]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to supplier payments
          </a>

          <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-5">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F1F1F1] text-[#073D7F]">
                <WalletCards className="h-6 w-6" />
              </div>

              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                  Supplier Payment
                </div>

                <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
                  {payment.payment_number || "Untitled payment"}
                </h1>

                <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                  Review the full draft supplier payment for {organisationName},
                  including supplier details, linked purchase bill, cash outflow,
                  GL mapping, FX information, and control status.
                </p>

                <div className="mt-5 flex flex-wrap gap-3">
                  <span className="rounded-full bg-[#F1F1F1] px-4 py-2 text-sm font-semibold text-[#073D7F]">
                    {formatStatus(payment.status)}
                  </span>

                  <span className="rounded-full bg-[#F1F1F1] px-4 py-2 text-sm font-semibold text-slate-700">
                    {payment.currency_code || organisation.base_currency_code}
                  </span>

                  <span className="rounded-full bg-[#F1F1F1] px-4 py-2 text-sm font-semibold text-slate-700">
                    Payment Date: {formatDate(payment.payment_date)}
                  </span>
                </div>

                {canEditPayment ? (
                  <div className="mt-6">
                    <a
                      href={`/portal/organisations/${organisation.id}/supplier-payments/${payment.id}/edit`}
                      className="inline-flex rounded-full bg-[#073D7F] px-5 py-3 text-sm font-semibold text-white"
                    >
                      Edit Draft Payment
                    </a>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-[#F1F1F1] p-5 text-sm text-slate-600">
              <div className="font-semibold text-slate-950">Supplier</div>
              <div className="mt-2 text-lg font-semibold text-[#073D7F]">
                {supplier?.supplier_name || "Supplier not found"}
              </div>
              <div className="mt-2">{supplier?.email || "No email"}</div>
              <div className="mt-1">{supplier?.phone || "No phone"}</div>

              {canEditPayment ? (
                <a
                  href={`/portal/organisations/${organisation.id}/supplier-payments/${payment.id}/edit`}
                  className="mt-4 inline-flex w-full justify-center rounded-full border border-[#D9E3F4] bg-white px-4 py-2 text-sm font-semibold text-[#073D7F]"
                >
                  Edit Draft Payment
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
              Amount Paid
            </div>
            <div className="mt-3 text-2xl font-semibold text-slate-950">
              {formatMoney(payment.currency_code, payment.amount_paid)}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">
              Bank Charges
            </div>
            <div className="mt-3 text-2xl font-semibold text-slate-950">
              {formatMoney(payment.currency_code, payment.bank_charges)}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">
              Total Cash Outflow
            </div>
            <div className="mt-3 text-2xl font-semibold text-slate-950">
              {formatMoney(payment.currency_code, payment.total_cash_outflow)}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">
              Payment Method
            </div>
            <div className="mt-3 text-2xl font-semibold text-slate-950">
              {formatStatus(payment.payment_method)}
            </div>
          </div>
        </div>

        <BankingReconciliationContextPanel
          organisationId={organisation.id}
          sourceModule="SUPPLIER_PAYMENT"
          sourceRecordId={payment.id}
        />

        <div className="mt-8 grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-[#073D7F]" />
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                Payment Details
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm">
                <div className="font-semibold text-slate-950">
                  Payment Number
                </div>
                <div className="mt-2 text-slate-600">
                  {payment.payment_number || "—"}
                </div>
              </div>

              <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm">
                <div className="font-semibold text-slate-950">Status</div>
                <div className="mt-2 text-slate-600">
                  {formatStatus(payment.status)}
                </div>
              </div>

              <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm">
                <div className="font-semibold text-slate-950">
                  Payment Date
                </div>
                <div className="mt-2 text-slate-600">
                  {formatDate(payment.payment_date)}
                </div>
              </div>

              <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm">
                <div className="font-semibold text-slate-950">
                  Reference Number
                </div>
                <div className="mt-2 text-slate-600">
                  {payment.reference_number || "—"}
                </div>
              </div>

              <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm">
                <div className="font-semibold text-slate-950">Currency</div>
                <div className="mt-2 text-slate-600">
                  {payment.currency_code || "—"}
                </div>
              </div>

              <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm">
                <div className="font-semibold text-slate-950">
                  Linked Purchase Bill
                </div>
                <div className="mt-2 text-slate-600">
                  {linkedBill?.bill_number || "Not linked"}
                </div>
              </div>
            </div>

            {linkedBill ? (
              <div className="mt-6 rounded-2xl border border-[#D9E3F4] bg-white p-5 text-sm leading-7 text-slate-600">
                <div className="font-semibold text-slate-950">
                  Linked Purchase Bill
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Bill
                    </div>
                    <a
                      href={`/portal/organisations/${organisation.id}/purchase-bills/${linkedBill.id}`}
                      className="mt-1 inline-flex font-semibold text-[#073D7F]"
                    >
                      {linkedBill.bill_number}
                    </a>
                  </div>

                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Bill Total
                    </div>
                    <div className="mt-1">
                      {formatMoney(
                        linkedBill.currency_code,
                        linkedBill.total_amount
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Balance Due
                    </div>
                    <div className="mt-1">
                      {formatMoney(
                        linkedBill.currency_code,
                        linkedBill.balance_due
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 text-xs text-slate-500">
                  Supplier invoice reference:{" "}
                  {linkedBill.supplier_invoice_number || "—"}
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-[#D9E3F4] bg-white p-5 text-sm leading-7 text-slate-600">
                <div className="font-semibold text-slate-950">
                  Direct Supplier Payment
                </div>
                <div className="mt-2">
                  This payment is not linked to a purchase bill. It is mapped to
                  an expense account for future posting.
                </div>
              </div>
            )}

            <div className="mt-6 rounded-2xl border border-[#D9E3F4] bg-white p-5 text-sm leading-7 text-slate-600">
              <div className="font-semibold text-slate-950">Narration</div>
              <div className="mt-2">
                {payment.narration || "No narration provided."}
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-[#D9E3F4] bg-white p-5 text-sm leading-7 text-slate-600">
              <div className="font-semibold text-slate-950">Internal Notes</div>
              <div className="mt-2">
                {payment.internal_notes || "No internal notes."}
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
                  Payable Account
                </div>
                <div className="mt-2 text-slate-600">
                  {formatAccount(payableAccount)}
                </div>
              </div>

              <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm">
                <div className="font-semibold text-slate-950">
                  Expense Account
                </div>
                <div className="mt-2 text-slate-600">
                  {formatAccount(expenseAccount)}
                </div>
              </div>

              <div className="rounded-2xl border border-[#D9E3F4] bg-white p-5 text-sm">
                <div className="font-semibold text-slate-950">
                  Exchange Rate
                </div>
                <div className="mt-2 text-slate-600">
                  {formatNumber(payment.exchange_rate)}
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Rate Date
                    </div>
                    <div className="mt-1 text-slate-600">
                      {formatDate(payment.exchange_rate_date)}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Source
                    </div>
                    <div className="mt-1 text-slate-600">
                      {formatStatus(payment.exchange_rate_source)}
                    </div>
                  </div>
                </div>

                <div className="mt-4 inline-flex rounded-full bg-[#F1F1F1] px-3 py-1 text-xs font-semibold text-[#073D7F]">
                  {payment.exchange_rate_is_locked
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
                Draft supplier payment record
              </h2>

              <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-600">
                This supplier payment is currently an operational draft record.
                It does not post to the general ledger, payables ledger,
                supplier statement, bank reconciliation, tax reporting, or
                management reporting until review, posting, and audit trail
                controls are completed.
              </p>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="inline-flex items-center gap-2 rounded-full bg-[#F1F1F1] px-4 py-2 text-sm font-semibold text-[#073D7F]">
                  <CheckCircle className="h-4 w-4" />
                  Ready for review and posting workflow
                </div>

                {canEditPayment ? (
                  <a
                    href={`/portal/organisations/${organisation.id}/supplier-payments/${payment.id}/edit`}
                    className="inline-flex justify-center rounded-full bg-[#073D7F] px-5 py-2 text-sm font-semibold text-white"
                  >
                    Edit Draft Payment
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