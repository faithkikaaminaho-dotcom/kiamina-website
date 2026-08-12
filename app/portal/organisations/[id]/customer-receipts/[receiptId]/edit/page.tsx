import { redirect } from "next/navigation";
import { ArrowLeft, WalletCards } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import BankingReconciliationContextPanel from "../../../components/BankingReconciliationContextPanel";
import EditCustomerReceiptForm from "./EditCustomerReceiptForm";

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

function isReceivableLikeAccount(account: {
  account_type: string | null;
  account_subtype?: string | null;
  fs_line_item?: string | null;
  account_name?: string | null;
}) {
  const text = `${account.account_type || ""} ${account.account_subtype || ""} ${
    account.fs_line_item || ""
  } ${account.account_name || ""}`.toUpperCase();

  return (
    text.includes("ASSET") ||
    text.includes("RECEIVABLE") ||
    text.includes("TRADE RECEIVABLE")
  );
}

function isIncomeLikeAccount(account: {
  account_type: string | null;
  account_subtype?: string | null;
  fs_line_item?: string | null;
  account_name?: string | null;
}) {
  const text = `${account.account_type || ""} ${account.account_subtype || ""} ${
    account.fs_line_item || ""
  } ${account.account_name || ""}`.toUpperCase();

  return (
    text.includes("INCOME") ||
    text.includes("REVENUE") ||
    text.includes("OPERATING_INCOME") ||
    text.includes("INVESTING_INCOME") ||
    text.includes("FINANCING_INCOME")
  );
}

export default async function EditCustomerReceiptPage({
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

  if (
    receipt.status === "POSTED" ||
    receipt.posted_at ||
    !editableStatuses.includes(receipt.status || "")
  ) {
    redirect(`/portal/organisations/${id}/customer-receipts/${receiptId}`);
  }

  const { data: existingLedgerEntry } = await supabase
    .from("general_ledger_entries")
    .select("id")
    .eq("organisation_id", id)
    .eq("source_module", "CUSTOMER_RECEIPT")
    .eq("source_record_id", receiptId)
    .maybeSingle();

  if (existingLedgerEntry) {
    redirect(`/portal/organisations/${id}/customer-receipts/${receiptId}`);
  }

  const { data: customers } = await supabase
    .from("customers")
    .select("id, customer_name")
    .eq("organisation_id", id)
    .eq("is_active", true)
    .order("customer_name", { ascending: true });

  const { data: invoices } = await supabase
    .from("sales_invoices")
    .select(
      "id, invoice_number, customer_id, currency_code, total_amount, balance_due, status, receivable_account_id"
    )
    .eq("organisation_id", id)
    .order("invoice_date", { ascending: false });

  /*
    IMPORTANT:
    customer_receipts.bank_account_id points to the Banking module bank account,
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
    })) || [];

  const { data: allAccounts } = await supabase
    .from("chart_of_accounts")
    .select("id, account_code, account_name, account_type, account_subtype, fs_line_item")
    .eq("organisation_id", id)
    .or("is_active.is.true,is_active.is.null")
    .order("account_code", { ascending: true });

  const receivableAccounts =
    allAccounts?.filter((account) => isReceivableLikeAccount(account)) || [];

  const incomeAccounts =
    allAccounts?.filter((account) => isIncomeLikeAccount(account)) || [];

  const organisationName =
    organisation.trading_name || organisation.legal_name || "Organisation";

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <section className="border-b border-[#D9E3F4] bg-white">
        <div className="mx-auto max-w-6xl px-6 py-8 lg:px-8">
          <a
            href={`/portal/organisations/${organisation.id}/customer-receipts/${receipt.id}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#073D7F]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to customer receipt detail
          </a>

          <div className="mt-8 flex items-start gap-5">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F1F1F1] text-[#073D7F]">
              <WalletCards className="h-6 w-6" />
            </div>

            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                Edit Draft Customer Receipt
              </div>

              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
                {receipt.receipt_number || "Draft receipt"}
              </h1>

              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                Review and edit this draft customer receipt for {organisationName}
                before posting the linked bank-line group to the General Ledger.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10 lg:px-8">
        <BankingReconciliationContextPanel
          organisationId={organisation.id}
          sourceModule="CUSTOMER_RECEIPT"
          sourceRecordId={receipt.id}
        />

        <EditCustomerReceiptForm
          organisationId={organisation.id}
          receipt={receipt}
          defaultCurrency={organisation.base_currency_code}
          customers={customers || []}
          invoices={invoices || []}
          bankAccounts={bankAccounts}
          receivableAccounts={receivableAccounts}
          incomeAccounts={incomeAccounts}
        />
      </section>
    </main>
  );
}