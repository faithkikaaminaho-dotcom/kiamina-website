import { redirect } from "next/navigation";
import { ArrowLeft, ReceiptText } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import BankingReconciliationContextPanel from "../../../components/BankingReconciliationContextPanel";
import EditSupplierPaymentForm from "./EditSupplierPaymentForm";

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

function isPayableLikeAccount(account: {
  account_type: string | null;
  account_subtype?: string | null;
  fs_line_item?: string | null;
  account_name?: string | null;
}) {
  const text = `${account.account_type || ""} ${account.account_subtype || ""} ${
    account.fs_line_item || ""
  } ${account.account_name || ""}`.toUpperCase();

  return (
    text.includes("LIABILITY") ||
    text.includes("PAYABLE") ||
    text.includes("TRADE PAYABLE")
  );
}

function isExpenseLikeAccount(account: {
  account_type: string | null;
  account_subtype?: string | null;
  fs_line_item?: string | null;
  account_name?: string | null;
}) {
  const text = `${account.account_type || ""} ${account.account_subtype || ""} ${
    account.fs_line_item || ""
  } ${account.account_name || ""}`.toUpperCase();

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

export default async function EditSupplierPaymentPage({
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

  if (
    payment.status === "POSTED" ||
    payment.posted_at ||
    !editableStatuses.includes(payment.status || "")
  ) {
    redirect(`/portal/organisations/${id}/supplier-payments/${paymentId}`);
  }

  const { data: existingLedgerEntry } = await supabase
    .from("general_ledger_entries")
    .select("id")
    .eq("organisation_id", id)
    .eq("source_module", "SUPPLIER_PAYMENT")
    .eq("source_record_id", paymentId)
    .maybeSingle();

  if (existingLedgerEntry) {
    redirect(`/portal/organisations/${id}/supplier-payments/${paymentId}`);
  }

  const { data: suppliers } = await supabase
    .from("suppliers")
    .select("id, supplier_name")
    .eq("organisation_id", id)
    .eq("is_active", true)
    .order("supplier_name", { ascending: true });

  const { data: bills } = await supabase
    .from("purchase_bills")
    .select(
      "id, bill_number, supplier_id, currency_code, total_amount, balance_due, status, payable_account_id"
    )
    .eq("organisation_id", id)
    .order("bill_date", { ascending: false });

  /*
    IMPORTANT:
    supplier_payments.bank_account_id points to the Banking module bank account,
    not the Chart of Accounts bank GL account. The bank account itself has
    gl_account_id for posting control.
  */
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
      account_subtype: "Bank",
      fs_line_item: null,
      management_report_category: null,
      is_control_account: true,
      tax_relevant: false,
    })) || [];

  const { data: allAccounts } = await supabase
    .from("chart_of_accounts")
    .select(
      "id, account_code, account_name, account_type, account_subtype, fs_line_item, management_report_category, is_control_account, tax_relevant"
    )
    .eq("organisation_id", id)
    .or("is_active.is.true,is_active.is.null")
    .order("account_code", { ascending: true });

  const payableAccounts =
    allAccounts?.filter((account) => isPayableLikeAccount(account)) || [];

  const expenseAccounts =
    allAccounts?.filter((account) => isExpenseLikeAccount(account)) || [];

  const organisationName =
    organisation.trading_name || organisation.legal_name || "Organisation";

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <section className="border-b border-[#D9E3F4] bg-white">
        <div className="mx-auto max-w-6xl px-6 py-8 lg:px-8">
          <a
            href={`/portal/organisations/${organisation.id}/supplier-payments/${payment.id}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#073D7F]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to supplier payment detail
          </a>

          <div className="mt-8 flex items-start gap-5">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F1F1F1] text-[#073D7F]">
              <ReceiptText className="h-6 w-6" />
            </div>

            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                Edit Draft Supplier Payment
              </div>

              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
                {payment.payment_number || "Draft supplier payment"}
              </h1>

              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                Review and edit this draft supplier payment for {organisationName}
                before posting the linked bank-line group to the General Ledger.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10 lg:px-8">
        <BankingReconciliationContextPanel
          organisationId={organisation.id}
          sourceModule="SUPPLIER_PAYMENT"
          sourceRecordId={payment.id}
        />

        <EditSupplierPaymentForm
          organisationId={organisation.id}
          payment={payment}
          defaultCurrency={organisation.base_currency_code}
          suppliers={suppliers || []}
          bills={bills || []}
          bankAccounts={bankAccounts}
          payableAccounts={payableAccounts}
          expenseAccounts={expenseAccounts}
        />
      </section>
    </main>
  );
}