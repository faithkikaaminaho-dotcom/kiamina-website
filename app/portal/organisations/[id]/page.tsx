import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import QuickEngagementForm from "./QuickEngagementForm";
import {
  ArrowLeft,
  Archive,
  BookOpenCheck,
  Building2,
  CheckCircle,
  Clock,
  Coins,
  FileText,
  Globe2,
  Landmark,
  Mail,
  Plus,
  ReceiptText,
  ShieldCheck,
  UserRound,
  WalletCards,
} from "lucide-react";

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

function formatFramework(code?: string | null) {
  if (!code) return "—";

  const labels: Record<string, string> = {
    IFRS: "IFRS",
    US_GAAP: "US GAAP",
    IFRS_SME: "IFRS for SMEs",
  };

  return labels[code] || code;
}

function formatStatus(status?: string | null) {
  if (!status) return "—";

  return status
    .split("_")
    .join(" ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

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

export default async function OrganisationDetailPage({
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

  const role = profile?.role as string | undefined;

  if (!role || !internalRoles.includes(role)) {
    redirect("/portal");
  }

  const { data: organisation } = await supabase
    .from("organisations")
    .select(
      "id, legal_name, trading_name, organisation_type, status, jurisdiction_code, reporting_framework_code, base_currency_code, registration_number, tax_identification_number, financial_year_end_month, financial_year_end_day, primary_contact_name, primary_contact_email, primary_contact_phone, risk_rating, legacy_client_id, created_at"
    )
    .eq("id", id)
    .single();

  if (!organisation) {
    redirect("/portal/organisations");
  }

  const organisationName =
    organisation.trading_name || organisation.legal_name || "Organisation";

  const financialYearEnd =
    organisation.financial_year_end_month && organisation.financial_year_end_day
      ? `${organisation.financial_year_end_day}/${organisation.financial_year_end_month}`
      : "—";

  const { count: documentsCount } = await supabase
    .from("documents")
    .select("*", { count: "exact", head: true })
    .eq("organisation_id", id);

  const { count: pendingReviewCount } = await supabase
    .from("document_reviews")
    .select("*", { count: "exact", head: true })
    .eq("organisation_id", id)
    .eq("status", "PENDING_REVIEW");

  const { count: approvedCount } = await supabase
    .from("document_reviews")
    .select("*", { count: "exact", head: true })
    .eq("organisation_id", id)
    .eq("status", "APPROVED");

  const { count: engagementsCount } = await supabase
    .from("engagements")
    .select("*", { count: "exact", head: true })
    .eq("organisation_id", id);

  const { count: chartAccountsCount } = await supabase
    .from("chart_of_accounts")
    .select("*", { count: "exact", head: true })
    .eq("organisation_id", id)
    .eq("is_active", true);

  const { count: customersCount } = await supabase
    .from("customers")
    .select("*", { count: "exact", head: true })
    .eq("organisation_id", id)
    .eq("is_active", true);

  const { count: suppliersCount } = await supabase
    .from("suppliers")
    .select("*", { count: "exact", head: true })
    .eq("organisation_id", id)
    .eq("is_active", true);

  const { count: productsServicesCount } = await supabase
    .from("products_services")
    .select("*", { count: "exact", head: true })
    .eq("organisation_id", id)
    .eq("is_active", true);

  const { count: investorsCount } = await supabase
    .from("investors")
    .select("*", { count: "exact", head: true })
    .eq("organisation_id", id)
    .eq("is_active", true);

  const { count: salesInvoicesCount } = await supabase
    .from("sales_invoices")
    .select("*", { count: "exact", head: true })
    .eq("organisation_id", id);

  const { count: draftSalesInvoicesCount } = await supabase
    .from("sales_invoices")
    .select("*", { count: "exact", head: true })
    .eq("organisation_id", id)
    .eq("status", "DRAFT");

  const { count: purchaseBillsCount } = await supabase
    .from("purchase_bills")
    .select("*", { count: "exact", head: true })
    .eq("organisation_id", id);

  const { count: draftPurchaseBillsCount } = await supabase
    .from("purchase_bills")
    .select("*", { count: "exact", head: true })
    .eq("organisation_id", id)
    .eq("status", "DRAFT");

  const { count: customerReceiptsCount } = await supabase
    .from("customer_receipts")
    .select("*", { count: "exact", head: true })
    .eq("organisation_id", id);

  const { count: supplierPaymentsCount } = await supabase
    .from("supplier_payments")
    .select("*", { count: "exact", head: true })
    .eq("organisation_id", id);

  const { count: capitalCallsCount } = await supabase
    .from("capital_calls")
    .select("*", { count: "exact", head: true })
    .eq("organisation_id", id);

  const { count: fundingTransactionsCount } = await supabase
    .from("funding_transactions")
    .select("*", { count: "exact", head: true })
    .eq("organisation_id", id);

  const { count: journalEntriesCount } = await supabase
    .from("journal_entries")
    .select("*", { count: "exact", head: true })
    .eq("organisation_id", id);

  const { count: draftJournalEntriesCount } = await supabase
    .from("journal_entries")
    .select("*", { count: "exact", head: true })
    .eq("organisation_id", id)
    .eq("status", "DRAFT");

  const { count: generalLedgerEntriesCount } = await supabase
  .from("general_ledger_entries")
  .select("*", { count: "exact", head: true })
  .eq("organisation_id", id);

const { count: postedGeneralLedgerEntriesCount } = await supabase
  .from("general_ledger_entries")
  .select("*", { count: "exact", head: true })
  .eq("organisation_id", id)
  .eq("status", "POSTED");  

  const { data: recentDocuments } = await supabase
    .from("documents")
    .select("id, file_name, module, status, created_at")
    .eq("organisation_id", id)
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: engagements } = await supabase
    .from("engagements")
    .select(
      "id, name, engagement_type, status, reporting_period_start, reporting_period_end"
    )
    .eq("organisation_id", id)
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: organisationUsers } = await supabase
    .from("organisation_users")
    .select("id, user_id, role, access_role, status, created_at")
    .eq("organisation_id", id)
    .order("created_at", { ascending: false });

  const assignedUserIds =
    organisationUsers?.map((record) => record.user_id).filter(Boolean) || [];

  let assignedProfiles: {
    id: string;
    email: string | null;
    full_name: string | null;
    role: string | null;
    status: string | null;
  }[] = [];

  if (assignedUserIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, email, full_name, role, status")
      .in("id", assignedUserIds);

    assignedProfiles = profiles || [];
  }

  const assignedClientUsers =
    organisationUsers?.map((record) => {
      const assignedProfile = assignedProfiles.find(
        (person) => person.id === record.user_id
      );

      return {
        ...record,
        profile: assignedProfile,
      };
    }) || [];

  const { data: chartAccounts } = await supabase
    .from("chart_of_accounts")
    .select(
      "id, account_code, account_name, account_type, fs_section, fs_line_item, is_active"
    )
    .eq("organisation_id", id)
    .order("account_code", { ascending: true })
    .limit(5);

  const { data: recentCustomers } = await supabase
    .from("customers")
    .select("id, customer_name, customer_type, email, is_active")
    .eq("organisation_id", id)
    .order("created_at", { ascending: false })
    .limit(3);

  const { data: recentSuppliers } = await supabase
    .from("suppliers")
    .select("id, supplier_name, supplier_type, email, is_active")
    .eq("organisation_id", id)
    .order("created_at", { ascending: false })
    .limit(3);

  const { data: recentProductsServices } = await supabase
    .from("products_services")
    .select("id, item_name, item_type, unit_price, currency_code, is_active")
    .eq("organisation_id", id)
    .order("created_at", { ascending: false })
    .limit(3);

  const { data: recentInvestors } = await supabase
    .from("investors")
    .select(
      "id, investor_name, investor_type, funding_type, committed_amount, currency_code, is_active"
    )
    .eq("organisation_id", id)
    .order("created_at", { ascending: false })
    .limit(3);

  const { data: recentSalesInvoices } = await supabase
    .from("sales_invoices")
    .select(
      "id, invoice_number, invoice_date, currency_code, total_amount, balance_due, status, customer_id"
    )
    .eq("organisation_id", id)
    .order("created_at", { ascending: false })
    .limit(3);

  const salesInvoiceCustomerIds =
    recentSalesInvoices?.map((invoice) => invoice.customer_id).filter(Boolean) ||
    [];

  let salesInvoiceCustomers: {
    id: string;
    customer_name: string | null;
  }[] = [];

  if (salesInvoiceCustomerIds.length > 0) {
    const { data: customersForInvoices } = await supabase
      .from("customers")
      .select("id, customer_name")
      .in("id", salesInvoiceCustomerIds);

    salesInvoiceCustomers = customersForInvoices || [];
  }

  const recentSalesInvoicesWithCustomers =
    recentSalesInvoices?.map((invoice) => {
      const customer = salesInvoiceCustomers.find(
        (record) => record.id === invoice.customer_id
      );

      return {
        ...invoice,
        customer,
      };
    }) || [];

  const { data: recentPurchaseBills } = await supabase
    .from("purchase_bills")
    .select(
      "id, bill_number, bill_date, currency_code, total_amount, balance_due, status, supplier_id"
    )
    .eq("organisation_id", id)
    .order("created_at", { ascending: false })
    .limit(3);

  const purchaseBillSupplierIds =
    recentPurchaseBills?.map((bill) => bill.supplier_id).filter(Boolean) || [];

  let purchaseBillSuppliers: {
    id: string;
    supplier_name: string | null;
  }[] = [];

  if (purchaseBillSupplierIds.length > 0) {
    const { data: suppliersForBills } = await supabase
      .from("suppliers")
      .select("id, supplier_name")
      .in("id", purchaseBillSupplierIds);

    purchaseBillSuppliers = suppliersForBills || [];
  }

  const recentPurchaseBillsWithSuppliers =
    recentPurchaseBills?.map((bill) => {
      const supplier = purchaseBillSuppliers.find(
        (record) => record.id === bill.supplier_id
      );

      return {
        ...bill,
        supplier,
      };
    }) || [];

  const { data: recentCustomerReceipts } = await supabase
    .from("customer_receipts")
    .select(
      "id, receipt_number, receipt_date, currency_code, amount_received, net_amount, status, customer_id"
    )
    .eq("organisation_id", id)
    .order("created_at", { ascending: false })
    .limit(3);

  const customerReceiptCustomerIds =
    recentCustomerReceipts
      ?.map((receipt) => receipt.customer_id)
      .filter(Boolean) || [];

  let customerReceiptCustomers: {
    id: string;
    customer_name: string | null;
  }[] = [];

  if (customerReceiptCustomerIds.length > 0) {
    const { data: customersForReceipts } = await supabase
      .from("customers")
      .select("id, customer_name")
      .in("id", customerReceiptCustomerIds);

    customerReceiptCustomers = customersForReceipts || [];
  }

  const recentCustomerReceiptsWithCustomers =
    recentCustomerReceipts?.map((receipt) => {
      const customer = customerReceiptCustomers.find(
        (record) => record.id === receipt.customer_id
      );

      return {
        ...receipt,
        customer,
      };
    }) || [];

  const { data: recentSupplierPayments } = await supabase
    .from("supplier_payments")
    .select(
      "id, payment_number, payment_date, currency_code, amount_paid, total_cash_outflow, status, supplier_id"
    )
    .eq("organisation_id", id)
    .order("created_at", { ascending: false })
    .limit(3);

  const supplierPaymentSupplierIds =
    recentSupplierPayments
      ?.map((payment) => payment.supplier_id)
      .filter(Boolean) || [];

  let supplierPaymentSuppliers: {
    id: string;
    supplier_name: string | null;
  }[] = [];

  if (supplierPaymentSupplierIds.length > 0) {
    const { data: suppliersForPayments } = await supabase
      .from("suppliers")
      .select("id, supplier_name")
      .in("id", supplierPaymentSupplierIds);

    supplierPaymentSuppliers = suppliersForPayments || [];
  }

  const recentSupplierPaymentsWithSuppliers =
    recentSupplierPayments?.map((payment) => {
      const supplier = supplierPaymentSuppliers.find(
        (record) => record.id === payment.supplier_id
      );

      return {
        ...payment,
        supplier,
      };
    }) || [];

  const { data: recentCapitalCalls } = await supabase
    .from("capital_calls")
    .select(
      "id, call_number, call_date, currency_code, called_amount, outstanding_amount, status, investor_id"
    )
    .eq("organisation_id", id)
    .order("created_at", { ascending: false })
    .limit(3);

  const capitalCallInvestorIds =
    recentCapitalCalls?.map((call) => call.investor_id).filter(Boolean) || [];

  let capitalCallInvestors: {
    id: string;
    investor_name: string | null;
  }[] = [];

  if (capitalCallInvestorIds.length > 0) {
    const { data: investorsForCapitalCalls } = await supabase
      .from("investors")
      .select("id, investor_name")
      .in("id", capitalCallInvestorIds);

    capitalCallInvestors = investorsForCapitalCalls || [];
  }

  const recentCapitalCallsWithInvestors =
    recentCapitalCalls?.map((call) => {
      const investor = capitalCallInvestors.find(
        (record) => record.id === call.investor_id
      );

      return {
        ...call,
        investor,
      };
    }) || [];

  const { data: recentFundingTransactions } = await supabase
    .from("funding_transactions")
    .select(
      "id, transaction_number, transaction_date, transaction_type, currency_code, amount, net_amount, status, investor_id"
    )
    .eq("organisation_id", id)
    .order("created_at", { ascending: false })
    .limit(3);

  const fundingTransactionInvestorIds =
    recentFundingTransactions
      ?.map((transaction) => transaction.investor_id)
      .filter(Boolean) || [];

  let fundingTransactionInvestors: {
    id: string;
    investor_name: string | null;
  }[] = [];

  if (fundingTransactionInvestorIds.length > 0) {
    const { data: investorsForFundingTransactions } = await supabase
      .from("investors")
      .select("id, investor_name")
      .in("id", fundingTransactionInvestorIds);

    fundingTransactionInvestors = investorsForFundingTransactions || [];
  }

  const recentFundingTransactionsWithInvestors =
    recentFundingTransactions?.map((transaction) => {
      const investor = fundingTransactionInvestors.find(
        (record) => record.id === transaction.investor_id
      );

      return {
        ...transaction,
        investor,
      };
    }) || [];

  const { data: recentJournalEntries } = await supabase
    .from("journal_entries")
    .select(
      "id, journal_number, journal_date, journal_type, description, currency_code, total_debits, total_credits, status"
    )
    .eq("organisation_id", id)
    .order("created_at", { ascending: false })
    .limit(3);

  const summaryStats = [
    {
      label: "Documents",
      value: documentsCount ?? 0,
      icon: FileText,
    },
    {
      label: "Pending Reviews",
      value: pendingReviewCount ?? 0,
      icon: Clock,
    },
    {
      label: "Approved Reviews",
      value: approvedCount ?? 0,
      icon: CheckCircle,
    },
    {
      label: "Engagements",
      value: engagementsCount ?? 0,
      icon: Archive,
    },
    {
      label: "Client Users",
      value: assignedClientUsers.length,
      icon: UserRound,
    },
  ];

  const moduleCards = [
    {
      title: "Documents & Reviews",
      description:
        "Upload, review, approve, and manage client source documents.",
      icon: FileText,
      countLabel: "Documents",
      countValue: documentsCount ?? 0,
      secondaryLabel: "Pending Reviews",
      secondaryValue: pendingReviewCount ?? 0,
      primaryAction: organisation.legacy_client_id
        ? {
            label: "Upload Document",
            href: `/portal/clients/${organisation.legacy_client_id}/upload`,
          }
        : null,
      secondaryAction: {
        label: "Open Reviews",
        href: "/portal/operations",
      },
    },
    {
      title: "Engagements",
      description:
        "Create service workspaces for bookkeeping, reporting, tax, payroll, and advisory work.",
      icon: Archive,
      countLabel: "Engagements",
      countValue: engagementsCount ?? 0,
      secondaryLabel: "Recent Records",
      secondaryValue: engagements?.length ?? 0,
      primaryAction: {
        label: "Create Engagement",
        href: `/portal/organisations/${organisation.id}/engagements/new`,
      },
      secondaryAction: null,
    },
    {
      title: "Sales & Receivables",
      description:
        "Manage sales invoices, customer receipts, receivables, and customer balances.",
      icon: ReceiptText,
      countLabel: "Sales Invoices",
      countValue: salesInvoicesCount ?? 0,
      secondaryLabel: "Customer Receipts",
      secondaryValue: customerReceiptsCount ?? 0,
      primaryAction: {
        label: "View Sales Invoices",
        href: `/portal/organisations/${organisation.id}/sales-invoices`,
      },
      secondaryAction: {
        label: "Create Invoice",
        href: `/portal/organisations/${organisation.id}/sales-invoices/new`,
      },
    },
    {
      title: "Purchases & Payables",
      description:
        "Manage purchase bills, supplier payments, payables, and supplier balances.",
      icon: WalletCards,
      countLabel: "Purchase Bills",
      countValue: purchaseBillsCount ?? 0,
      secondaryLabel: "Supplier Payments",
      secondaryValue: supplierPaymentsCount ?? 0,
      primaryAction: {
        label: "View Purchase Bills",
        href: `/portal/organisations/${organisation.id}/purchase-bills`,
      },
      secondaryAction: {
        label: "Create Bill",
        href: `/portal/organisations/${organisation.id}/purchase-bills/new`,
      },
    },
    {
      title: "Money Movement",
      description:
        "Track customer receipts, supplier payments, cash inflows, and cash outflows.",
      icon: Coins,
      countLabel: "Receipts",
      countValue: customerReceiptsCount ?? 0,
      secondaryLabel: "Payments",
      secondaryValue: supplierPaymentsCount ?? 0,
      primaryAction: {
        label: "View Receipts",
        href: `/portal/organisations/${organisation.id}/customer-receipts`,
      },
      secondaryAction: {
        label: "View Payments",
        href: `/portal/organisations/${organisation.id}/supplier-payments`,
      },
    },
    {
      title: "Funding",
      description:
        "Track capital calls, investor funding, grants, loans, repayments, and funding movements.",
      icon: Landmark,
      countLabel: "Capital Calls",
      countValue: capitalCallsCount ?? 0,
      secondaryLabel: "Funding Transactions",
      secondaryValue: fundingTransactionsCount ?? 0,
      primaryAction: {
        label: "View Capital Calls",
        href: `/portal/organisations/${organisation.id}/capital-calls`,
      },
      secondaryAction: {
        label: "View Funding",
        href: `/portal/organisations/${organisation.id}/funding-transactions`,
      },
    },
    {
      title: "Journals",
      description:
        "Create and review manual journals, opening balances, accruals, prepayments, payroll, tax, depreciation, FX, and correction entries.",
      icon: BookOpenCheck,
      countLabel: "Journal Entries",
      countValue: journalEntriesCount ?? 0,
      secondaryLabel: "Draft Journals",
      secondaryValue: draftJournalEntriesCount ?? 0,
      primaryAction: {
        label: "View Journals",
        href: `/portal/organisations/${organisation.id}/journal-entries`,
      },
      secondaryAction: {
        label: "Create Journal",
        href: `/portal/organisations/${organisation.id}/journal-entries/new`,
      },
    },
    {
  title: "General Ledger",
  description:
    "Review controlled ledger entries posted from journals and source transactions once posting workflows are enabled.",
  icon: BookOpenCheck,
  countLabel: "Ledger Entries",
  countValue: generalLedgerEntriesCount ?? 0,
  secondaryLabel: "Posted Entries",
  secondaryValue: postedGeneralLedgerEntriesCount ?? 0,
  primaryAction: {
    label: "Open Ledger",
    href: `/portal/organisations/${organisation.id}/general-ledger`,
  },
  secondaryAction: {
    label: "Open Journals",
    href: `/portal/organisations/${organisation.id}/journal-entries`,
  },
},
{
  title: "Trial Balance",
  description:
    "Review account balances calculated from posted General Ledger lines for reporting and financial statement preparation.",
  icon: FileText,
  countLabel: "Accounts",
  countValue: chartAccountsCount ?? 0,
  secondaryLabel: "Posted GL Entries",
  secondaryValue: postedGeneralLedgerEntriesCount ?? 0,
  primaryAction: {
    label: "Open Trial Balance",
    href: `/portal/organisations/${organisation.id}/trial-balance`,
  },
  secondaryAction: {
    label: "Open Ledger",
    href: `/portal/organisations/${organisation.id}/general-ledger`,
  },
},
    {
      title: "Accounting Master Data",
      description:
        "Maintain chart of accounts, customers, suppliers, products, services, and funders.",
      icon: Building2,
      countLabel: "Accounts",
      countValue: chartAccountsCount ?? 0,
      secondaryLabel: "Master Records",
      secondaryValue:
        (customersCount ?? 0) +
        (suppliersCount ?? 0) +
        (productsServicesCount ?? 0) +
        (investorsCount ?? 0),
      primaryAction: {
        label: "Add Account",
        href: `/portal/organisations/${organisation.id}/chart-of-accounts/new`,
      },
      secondaryAction: {
        label: "Add Customer",
        href: `/portal/organisations/${organisation.id}/customers/new`,
      },
    },
    {
      title: "Client User Access",
      description:
        "Control the people linked to this organisation and their client access level.",
      icon: UserRound,
      countLabel: "Assigned Users",
      countValue: assignedClientUsers.length,
      secondaryLabel: "Active Organisation",
      secondaryValue: 1,
      primaryAction: {
        label: "Manage People",
        href: "/portal/people",
      },
      secondaryAction: null,
    },
  ];

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <section className="border-b border-[#D9E3F4] bg-white">
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          <a
            href="/portal/organisations"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#073D7F]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to organisations
          </a>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_0.38fr]">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                Organisation Workspace
              </div>

              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
                {organisation.legal_name}
              </h1>

              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                A central workspace for documents, engagements, accounting,
                journals, receivables, payables, funding, reporting,
                compliance, and advisory workflows for {organisationName}.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <span className="rounded-full bg-[#F1F1F1] px-4 py-2 text-sm font-semibold text-[#073D7F]">
                  {formatStatus(organisation.status)}
                </span>

                <span className="rounded-full bg-[#F1F1F1] px-4 py-2 text-sm font-semibold text-slate-700">
                  {organisation.jurisdiction_code || "No jurisdiction"}
                </span>

                <span className="rounded-full bg-[#F1F1F1] px-4 py-2 text-sm font-semibold text-slate-700">
                  {formatFramework(organisation.reporting_framework_code)}
                </span>

                <span className="rounded-full bg-[#F1F1F1] px-4 py-2 text-sm font-semibold text-slate-700">
                  {organisation.base_currency_code || "No currency"}
                </span>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-[#F1F1F1] p-5">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-[#073D7F]" />
                <div className="text-sm font-semibold text-slate-950">
                  Client Context
                </div>
              </div>

              <div className="mt-5 space-y-3 text-sm text-slate-600">
                <div>
                  <span className="font-semibold text-slate-950">
                    Trading Name:
                  </span>{" "}
                  {organisation.trading_name || "—"}
                </div>

                <div>
                  <span className="font-semibold text-slate-950">
                    Financial Year End:
                  </span>{" "}
                  {financialYearEnd}
                </div>

                <div>
                  <span className="font-semibold text-slate-950">
                    Risk Rating:
                  </span>{" "}
                  {formatStatus(organisation.risk_rating)}
                </div>

                <div>
                  <span className="font-semibold text-slate-950">
                    Primary Contact:
                  </span>{" "}
                  {organisation.primary_contact_name || "—"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
          {summaryStats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.label}
                className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-slate-500">
                    {stat.label}
                  </div>

                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F1F1F1] text-[#073D7F]">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>

                <div className="mt-5 text-3xl font-semibold text-slate-950">
                  {stat.value}
                </div>
              </div>
            );
          })}
        </div>

        <section className="mt-8 rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm">
          <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr]">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                Quick Actions
              </div>

              <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
                Start common workflows
              </h2>

              <p className="mt-3 text-sm leading-7 text-slate-600">
                Use these shortcuts for the work Kiamina performs most often
                for this organisation.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {organisation.legacy_client_id ? (
                <a
                  href={`/portal/clients/${organisation.legacy_client_id}/upload`}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#073D7F] px-5 py-3 text-sm font-semibold text-white"
                >
                  <Plus className="h-4 w-4" />
                  Upload Document
                </a>
              ) : null}

              <a
                href={`/portal/organisations/${organisation.id}/engagements/new`}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#D9E3F4] bg-white px-5 py-3 text-sm font-semibold text-[#073D7F]"
              >
                <Plus className="h-4 w-4" />
                Create Engagement
              </a>

              <a
                href={`/portal/organisations/${organisation.id}/journal-entries/new`}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#D9E3F4] bg-white px-5 py-3 text-sm font-semibold text-[#073D7F]"
              >
                <Plus className="h-4 w-4" />
                Journal Entry
              </a>

              <a
  href={`/portal/organisations/${organisation.id}/general-ledger`}
  className="inline-flex items-center justify-center gap-2 rounded-full border border-[#D9E3F4] bg-white px-5 py-3 text-sm font-semibold text-[#073D7F]"
>
  <BookOpenCheck className="h-4 w-4" />
  General Ledger
</a>

<a
  href={`/portal/organisations/${organisation.id}/trial-balance`}
  className="inline-flex items-center justify-center gap-2 rounded-full border border-[#D9E3F4] bg-white px-5 py-3 text-sm font-semibold text-[#073D7F]"
>
  <FileText className="h-4 w-4" />
  Trial Balance
</a>

              <a
                href={`/portal/organisations/${organisation.id}/sales-invoices/new`}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#D9E3F4] bg-white px-5 py-3 text-sm font-semibold text-[#073D7F]"
              >
                <Plus className="h-4 w-4" />
                Sales Invoice
              </a>

              <a
                href={`/portal/organisations/${organisation.id}/purchase-bills/new`}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#D9E3F4] bg-white px-5 py-3 text-sm font-semibold text-[#073D7F]"
              >
                <Plus className="h-4 w-4" />
                Purchase Bill
              </a>

              <a
                href={`/portal/organisations/${organisation.id}/customer-receipts/new`}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#D9E3F4] bg-white px-5 py-3 text-sm font-semibold text-[#073D7F]"
              >
                <Plus className="h-4 w-4" />
                Customer Receipt
              </a>

              <a
                href={`/portal/organisations/${organisation.id}/supplier-payments/new`}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#D9E3F4] bg-white px-5 py-3 text-sm font-semibold text-[#073D7F]"
              >
                <Plus className="h-4 w-4" />
                Supplier Payment
              </a>

              <a
                href={`/portal/organisations/${organisation.id}/capital-calls/new`}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#D9E3F4] bg-white px-5 py-3 text-sm font-semibold text-[#073D7F]"
              >
                <Plus className="h-4 w-4" />
                Capital Call
              </a>

              <a
                href={`/portal/organisations/${organisation.id}/funding-transactions/new`}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#D9E3F4] bg-white px-5 py-3 text-sm font-semibold text-[#073D7F]"
              >
                <Plus className="h-4 w-4" />
                Funding Transaction
              </a>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm">
          <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
            Work Modules
          </div>

          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
            Organised client work areas
          </h2>

          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            Each module gives the Kiamina team a clearer route into the records,
            workflows, and controls required for this organisation.
          </p>

          <div className="mt-8 grid gap-5 xl:grid-cols-4">
            {moduleCards.map((module) => {
              const Icon = module.icon;

              return (
                <div
                  key={module.title}
                  className="rounded-[1.5rem] border border-[#D9E3F4] bg-[#F8FAFC] p-6"
                >
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#073D7F]">
                    <Icon className="h-5 w-5" />
                  </div>

                  <h3 className="mt-5 text-lg font-semibold text-slate-950">
                    {module.title}
                  </h3>

                  <p className="mt-3 min-h-[70px] text-sm leading-7 text-slate-600">
                    {module.description}
                  </p>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-white p-4">
                      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        {module.countLabel}
                      </div>
                      <div className="mt-2 text-2xl font-semibold text-slate-950">
                        {module.countValue}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-white p-4">
                      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        {module.secondaryLabel}
                      </div>
                      <div className="mt-2 text-2xl font-semibold text-slate-950">
                        {module.secondaryValue}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-col gap-3">
                    {module.primaryAction ? (
                      <a
                        href={module.primaryAction.href}
                        className="rounded-full bg-[#073D7F] px-5 py-3 text-center text-sm font-semibold text-white"
                      >
                        {module.primaryAction.label}
                      </a>
                    ) : null}

                    {module.secondaryAction ? (
                      <a
                        href={module.secondaryAction.href}
                        className="rounded-full border border-[#D9E3F4] bg-white px-5 py-3 text-center text-sm font-semibold text-[#073D7F]"
                      >
                        {module.secondaryAction.label}
                      </a>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-8 grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm">
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
              Engagement Setup
            </div>

            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
              Create a new engagement
            </h2>

            <p className="mt-3 text-sm leading-7 text-slate-600">
              Quickly create a service workspace or use the advanced setup flow
              for more detailed engagement configuration.
            </p>

            <div className="mt-6 rounded-[1.5rem] border border-[#D9E3F4] bg-[#F8FAFC] p-5">
              <QuickEngagementForm organisationId={organisation.id} />
            </div>

            <a
              href={`/portal/organisations/${organisation.id}/engagements/new`}
              className="mt-5 inline-flex rounded-full border border-[#D9E3F4] bg-white px-5 py-3 text-sm font-semibold text-[#073D7F]"
            >
              Advanced Engagement Setup
            </a>
          </div>

          <div className="rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm">
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
              Organisation Configuration
            </div>

            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
              Reporting profile
            </h2>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-[#F1F1F1] p-5">
                <Globe2 className="h-5 w-5 text-[#073D7F]" />
                <div className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Jurisdiction
                </div>
                <div className="mt-2 font-semibold text-slate-950">
                  {organisation.jurisdiction_code || "—"}
                </div>
              </div>

              <div className="rounded-2xl bg-[#F1F1F1] p-5">
                <FileText className="h-5 w-5 text-[#073D7F]" />
                <div className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Framework
                </div>
                <div className="mt-2 font-semibold text-slate-950">
                  {formatFramework(organisation.reporting_framework_code)}
                </div>
              </div>

              <div className="rounded-2xl bg-[#F1F1F1] p-5">
                <Coins className="h-5 w-5 text-[#073D7F]" />
                <div className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Base Currency
                </div>
                <div className="mt-2 font-semibold text-slate-950">
                  {organisation.base_currency_code || "—"}
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-[#D9E3F4] bg-white p-5 text-sm text-slate-600">
                <div className="font-semibold text-slate-950">
                  Registration Number
                </div>
                <div className="mt-2">
                  {organisation.registration_number || "—"}
                </div>
              </div>

              <div className="rounded-2xl border border-[#D9E3F4] bg-white p-5 text-sm text-slate-600">
                <div className="font-semibold text-slate-950">
                  Tax Identification Number
                </div>
                <div className="mt-2">
                  {organisation.tax_identification_number || "—"}
                </div>
              </div>

              <div className="rounded-2xl border border-[#D9E3F4] bg-white p-5 text-sm text-slate-600">
                <div className="font-semibold text-slate-950">
                  Organisation Type
                </div>
                <div className="mt-2">
                  {organisation.organisation_type || "—"}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm">
          <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
            Recent Activity
          </div>

          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
            Latest organisation records
          </h2>

          <div className="mt-8 grid gap-6 xl:grid-cols-3">
            <div className="overflow-hidden rounded-[1.5rem] border border-[#D9E3F4]">
              <div className="bg-[#F1F1F1] px-5 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-[#6491DE]">
                Recent Documents
              </div>

              <div className="divide-y divide-[#D9E3F4]">
                {recentDocuments && recentDocuments.length > 0 ? (
                  recentDocuments.map((doc) => (
                    <a
                      key={doc.id}
                      href={`/portal/documents/${doc.id}`}
                      className="block px-5 py-4 text-sm hover:bg-[#F8FAFC]"
                    >
                      <div className="font-semibold text-slate-950">
                        {doc.file_name}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {doc.module} · {formatStatus(doc.status)} ·{" "}
                        {formatDate(doc.created_at)}
                      </div>
                    </a>
                  ))
                ) : (
                  <div className="px-5 py-8 text-sm text-slate-500">
                    No documents uploaded yet.
                  </div>
                )}
              </div>
            </div>

            <div className="overflow-hidden rounded-[1.5rem] border border-[#D9E3F4]">
              <div className="bg-[#F1F1F1] px-5 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-[#6491DE]">
                Recent Engagements
              </div>

              <div className="divide-y divide-[#D9E3F4]">
                {engagements && engagements.length > 0 ? (
                  engagements.map((engagement) => (
                    <a
                      key={engagement.id}
                      href={`/portal/engagements/${engagement.id}`}
                      className="block px-5 py-4 text-sm hover:bg-[#F8FAFC]"
                    >
                      <div className="font-semibold text-slate-950">
                        {engagement.name}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {engagement.engagement_type} ·{" "}
                        {formatStatus(engagement.status)}
                      </div>
                    </a>
                  ))
                ) : (
                  <div className="px-5 py-8 text-sm text-slate-500">
                    No engagements created yet.
                  </div>
                )}
              </div>
            </div>

            <div className="overflow-hidden rounded-[1.5rem] border border-[#D9E3F4]">
              <div className="bg-[#F1F1F1] px-5 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-[#6491DE]">
                Recent Accounts
              </div>

              <div className="divide-y divide-[#D9E3F4]">
                {chartAccounts && chartAccounts.length > 0 ? (
                  chartAccounts.map((account) => (
                    <div key={account.id} className="px-5 py-4 text-sm">
                      <div className="font-semibold text-slate-950">
                        {account.account_code} · {account.account_name}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {formatStatus(account.account_type)} ·{" "}
                        {account.fs_line_item ||
                          account.fs_section ||
                          "Not mapped"}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-5 py-8 text-sm text-slate-500">
                    No chart of accounts created yet.
                  </div>
                )}
              </div>
            </div>

            <div className="overflow-hidden rounded-[1.5rem] border border-[#D9E3F4]">
              <div className="flex items-center justify-between gap-4 bg-[#F1F1F1] px-5 py-4">
                <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#6491DE]">
                  Recent Journals
                </div>

                <a
                  href={`/portal/organisations/${organisation.id}/journal-entries`}
                  className="text-sm font-semibold text-[#073D7F]"
                >
                  View all
                </a>
              </div>

              <div className="divide-y divide-[#D9E3F4]">
                {recentJournalEntries && recentJournalEntries.length > 0 ? (
                  recentJournalEntries.map((journal) => (
                    <div key={journal.id} className="px-5 py-4 text-sm">
                      <div className="font-semibold text-slate-950">
                        {journal.journal_number}
                      </div>

                      <div className="mt-1 text-xs text-slate-500">
                        {formatStatus(journal.journal_type)} ·{" "}
                        {formatDate(journal.journal_date)}
                      </div>

                      <div className="mt-2 text-sm font-semibold text-slate-950">
                        {formatMoney(journal.currency_code, journal.total_debits)}
                      </div>

                      <div className="mt-2 inline-flex rounded-full bg-[#F1F1F1] px-3 py-1 text-xs font-semibold text-[#073D7F]">
                        {formatStatus(journal.status)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-5 py-8 text-sm text-slate-500">
                    No journal entries recorded yet.
                  </div>
                )}
              </div>
            </div>

            <div className="overflow-hidden rounded-[1.5rem] border border-[#D9E3F4]">
              <div className="flex items-center justify-between gap-4 bg-[#F1F1F1] px-5 py-4">
                <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#6491DE]">
                  Recent Sales Invoices
                </div>

                <a
                  href={`/portal/organisations/${organisation.id}/sales-invoices`}
                  className="text-sm font-semibold text-[#073D7F]"
                >
                  View all
                </a>
              </div>

              <div className="divide-y divide-[#D9E3F4]">
                {recentSalesInvoicesWithCustomers.length > 0 ? (
                  recentSalesInvoicesWithCustomers.map((invoice) => (
                    <div key={invoice.id} className="px-5 py-4 text-sm">
                      <div className="font-semibold text-slate-950">
                        {invoice.invoice_number}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {invoice.customer?.customer_name ||
                          "Customer not linked"}{" "}
                        · {formatDate(invoice.invoice_date)}
                      </div>
                      <div className="mt-2 text-sm font-semibold text-slate-950">
                        {formatMoney(
                          invoice.currency_code,
                          invoice.total_amount
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-5 py-8 text-sm text-slate-500">
                    No sales invoices created yet.
                  </div>
                )}
              </div>
            </div>

            <div className="overflow-hidden rounded-[1.5rem] border border-[#D9E3F4]">
              <div className="flex items-center justify-between gap-4 bg-[#F1F1F1] px-5 py-4">
                <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#6491DE]">
                  Recent Purchase Bills
                </div>

                <a
                  href={`/portal/organisations/${organisation.id}/purchase-bills`}
                  className="text-sm font-semibold text-[#073D7F]"
                >
                  View all
                </a>
              </div>

              <div className="divide-y divide-[#D9E3F4]">
                {recentPurchaseBillsWithSuppliers.length > 0 ? (
                  recentPurchaseBillsWithSuppliers.map((bill) => (
                    <div key={bill.id} className="px-5 py-4 text-sm">
                      <div className="font-semibold text-slate-950">
                        {bill.bill_number}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {bill.supplier?.supplier_name ||
                          "Supplier not linked"}{" "}
                        · {formatDate(bill.bill_date)}
                      </div>
                      <div className="mt-2 text-sm font-semibold text-slate-950">
                        {formatMoney(bill.currency_code, bill.total_amount)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-5 py-8 text-sm text-slate-500">
                    No purchase bills created yet.
                  </div>
                )}
              </div>
            </div>

            <div className="overflow-hidden rounded-[1.5rem] border border-[#D9E3F4]">
              <div className="flex items-center justify-between gap-4 bg-[#F1F1F1] px-5 py-4">
                <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#6491DE]">
                  Recent Receipts
                </div>

                <a
                  href={`/portal/organisations/${organisation.id}/customer-receipts`}
                  className="text-sm font-semibold text-[#073D7F]"
                >
                  View all
                </a>
              </div>

              <div className="divide-y divide-[#D9E3F4]">
                {recentCustomerReceiptsWithCustomers.length > 0 ? (
                  recentCustomerReceiptsWithCustomers.map((receipt) => (
                    <div key={receipt.id} className="px-5 py-4 text-sm">
                      <div className="font-semibold text-slate-950">
                        {receipt.receipt_number}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {receipt.customer?.customer_name ||
                          "Customer not linked"}{" "}
                        · {formatDate(receipt.receipt_date)}
                      </div>
                      <div className="mt-2 text-sm font-semibold text-slate-950">
                        {formatMoney(receipt.currency_code, receipt.net_amount)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-5 py-8 text-sm text-slate-500">
                    No customer receipts recorded yet.
                  </div>
                )}
              </div>
            </div>

            <div className="overflow-hidden rounded-[1.5rem] border border-[#D9E3F4]">
              <div className="flex items-center justify-between gap-4 bg-[#F1F1F1] px-5 py-4">
                <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#6491DE]">
                  Recent Payments
                </div>

                <a
                  href={`/portal/organisations/${organisation.id}/supplier-payments`}
                  className="text-sm font-semibold text-[#073D7F]"
                >
                  View all
                </a>
              </div>

              <div className="divide-y divide-[#D9E3F4]">
                {recentSupplierPaymentsWithSuppliers.length > 0 ? (
                  recentSupplierPaymentsWithSuppliers.map((payment) => (
                    <div key={payment.id} className="px-5 py-4 text-sm">
                      <div className="font-semibold text-slate-950">
                        {payment.payment_number}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {payment.supplier?.supplier_name ||
                          "Supplier not linked"}{" "}
                        · {formatDate(payment.payment_date)}
                      </div>
                      <div className="mt-2 text-sm font-semibold text-slate-950">
                        {formatMoney(
                          payment.currency_code,
                          payment.total_cash_outflow
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-5 py-8 text-sm text-slate-500">
                    No supplier payments recorded yet.
                  </div>
                )}
              </div>
            </div>

            <div className="overflow-hidden rounded-[1.5rem] border border-[#D9E3F4]">
              <div className="flex items-center justify-between gap-4 bg-[#F1F1F1] px-5 py-4">
                <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#6491DE]">
                  Recent Capital Calls
                </div>

                <a
                  href={`/portal/organisations/${organisation.id}/capital-calls`}
                  className="text-sm font-semibold text-[#073D7F]"
                >
                  View all
                </a>
              </div>

              <div className="divide-y divide-[#D9E3F4]">
                {recentCapitalCallsWithInvestors.length > 0 ? (
                  recentCapitalCallsWithInvestors.map((call) => (
                    <div key={call.id} className="px-5 py-4 text-sm">
                      <div className="font-semibold text-slate-950">
                        {call.call_number}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {call.investor?.investor_name ||
                          "Investor / funder not linked"}{" "}
                        · {formatDate(call.call_date)}
                      </div>
                      <div className="mt-2 text-sm font-semibold text-slate-950">
                        {formatMoney(call.currency_code, call.called_amount)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-5 py-8 text-sm text-slate-500">
                    No capital calls recorded yet.
                  </div>
                )}
              </div>
            </div>

            <div className="overflow-hidden rounded-[1.5rem] border border-[#D9E3F4]">
              <div className="flex items-center justify-between gap-4 bg-[#F1F1F1] px-5 py-4">
                <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#6491DE]">
                  Recent Funding
                </div>

                <a
                  href={`/portal/organisations/${organisation.id}/funding-transactions`}
                  className="text-sm font-semibold text-[#073D7F]"
                >
                  View all
                </a>
              </div>

              <div className="divide-y divide-[#D9E3F4]">
                {recentFundingTransactionsWithInvestors.length > 0 ? (
                  recentFundingTransactionsWithInvestors.map((transaction) => (
                    <div key={transaction.id} className="px-5 py-4 text-sm">
                      <div className="font-semibold text-slate-950">
                        {transaction.transaction_number}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {transaction.investor?.investor_name ||
                          "Investor / funder not linked"}{" "}
                        · {formatDate(transaction.transaction_date)}
                      </div>
                      <div className="mt-2 text-sm font-semibold text-slate-950">
                        {formatMoney(
                          transaction.currency_code,
                          transaction.net_amount
                        )}
                      </div>
                      <div className="mt-2 inline-flex rounded-full bg-[#F1F1F1] px-3 py-1 text-xs font-semibold text-[#073D7F]">
                        {formatStatus(transaction.transaction_type)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-5 py-8 text-sm text-slate-500">
                    No funding transactions recorded yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm">
          <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
            Configuration & Access
          </div>

          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
            Master data and user access
          </h2>

          <div className="mt-8 grid gap-6 xl:grid-cols-2">
            <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-[#F8FAFC] p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-950">
                    Accounting master data
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    Customers, suppliers, products/services, funders, and chart
                    of accounts used across accounting workflows.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <a
                  href={`/portal/organisations/${organisation.id}/customers/new`}
                  className="rounded-full bg-[#073D7F] px-5 py-3 text-center text-sm font-semibold text-white"
                >
                  Add Customer
                </a>

                <a
                  href={`/portal/organisations/${organisation.id}/suppliers/new`}
                  className="rounded-full border border-[#D9E3F4] bg-white px-5 py-3 text-center text-sm font-semibold text-[#073D7F]"
                >
                  Add Supplier
                </a>

                <a
                  href={`/portal/organisations/${organisation.id}/products-services/new`}
                  className="rounded-full border border-[#D9E3F4] bg-white px-5 py-3 text-center text-sm font-semibold text-[#073D7F]"
                >
                  Add Product / Service
                </a>

                <a
                  href={`/portal/organisations/${organisation.id}/investors/new`}
                  className="rounded-full border border-[#D9E3F4] bg-white px-5 py-3 text-center text-sm font-semibold text-[#073D7F]"
                >
                  Add Funder
                </a>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-4">
                <div className="rounded-2xl bg-white p-4">
                  <div className="text-xs text-slate-500">Customers</div>
                  <div className="mt-2 text-2xl font-semibold text-slate-950">
                    {customersCount ?? 0}
                  </div>
                </div>

                <div className="rounded-2xl bg-white p-4">
                  <div className="text-xs text-slate-500">Suppliers</div>
                  <div className="mt-2 text-2xl font-semibold text-slate-950">
                    {suppliersCount ?? 0}
                  </div>
                </div>

                <div className="rounded-2xl bg-white p-4">
                  <div className="text-xs text-slate-500">Items</div>
                  <div className="mt-2 text-2xl font-semibold text-slate-950">
                    {productsServicesCount ?? 0}
                  </div>
                </div>

                <div className="rounded-2xl bg-white p-4">
                  <div className="text-xs text-slate-500">Funders</div>
                  <div className="mt-2 text-2xl font-semibold text-slate-950">
                    {investorsCount ?? 0}
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {recentCustomers && recentCustomers.length > 0 ? (
                  recentCustomers.map((customer) => (
                    <div
                      key={customer.id}
                      className="rounded-2xl border border-[#D9E3F4] bg-white p-4 text-sm"
                    >
                      <div className="font-semibold text-slate-950">
                        {customer.customer_name}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        Customer · {customer.email || "No email"}
                      </div>
                    </div>
                  ))
                ) : null}

                {recentSuppliers && recentSuppliers.length > 0 ? (
                  recentSuppliers.map((supplier) => (
                    <div
                      key={supplier.id}
                      className="rounded-2xl border border-[#D9E3F4] bg-white p-4 text-sm"
                    >
                      <div className="font-semibold text-slate-950">
                        {supplier.supplier_name}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        Supplier · {supplier.email || "No email"}
                      </div>
                    </div>
                  ))
                ) : null}

                {recentProductsServices && recentProductsServices.length > 0 ? (
                  recentProductsServices.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-[#D9E3F4] bg-white p-4 text-sm"
                    >
                      <div className="font-semibold text-slate-950">
                        {item.item_name}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        Product / Service ·{" "}
                        {formatMoney(item.currency_code, item.unit_price)}
                      </div>
                    </div>
                  ))
                ) : null}

                {recentInvestors && recentInvestors.length > 0 ? (
                  recentInvestors.map((investor) => (
                    <div
                      key={investor.id}
                      className="rounded-2xl border border-[#D9E3F4] bg-white p-4 text-sm"
                    >
                      <div className="font-semibold text-slate-950">
                        {investor.investor_name}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        Funder · {formatStatus(investor.funding_type)} ·{" "}
                        {formatMoney(
                          investor.currency_code,
                          investor.committed_amount
                        )}
                      </div>
                    </div>
                  ))
                ) : null}
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-[#F8FAFC] p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-950">
                    Assigned client users
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    Users linked to this organisation for client-specific
                    access and future document workflows.
                  </p>
                </div>

                <a
                  href="/portal/people"
                  className="rounded-full border border-[#D9E3F4] bg-white px-5 py-3 text-center text-sm font-semibold text-[#073D7F]"
                >
                  Manage People
                </a>
              </div>

              <div className="mt-6 space-y-3">
                {assignedClientUsers.length > 0 ? (
                  assignedClientUsers.map((record) => (
                    <div
                      key={record.id}
                      className="rounded-2xl border border-[#D9E3F4] bg-white p-4 text-sm"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="font-semibold text-slate-950">
                            {record.profile?.full_name || "Unnamed Client User"}
                          </div>

                          <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                            <Mail className="h-4 w-4" />
                            {record.profile?.email || "—"}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full bg-[#F1F1F1] px-3 py-1 text-xs font-semibold text-[#073D7F]">
                            {formatStatus(record.access_role)}
                          </span>

                          <span className="rounded-full bg-[#F8FAFC] px-3 py-1 text-xs font-semibold text-slate-600">
                            {formatStatus(record.status)}
                          </span>
                        </div>
                      </div>

                      <a
                        href={`/portal/people/${record.user_id}`}
                        className="mt-3 inline-flex text-sm font-semibold text-[#073D7F]"
                      >
                        Open Profile
                      </a>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-[#D9E3F4] bg-white p-5 text-sm text-slate-500">
                    No client users have been assigned to this organisation yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] bg-[#073D7F] p-8 text-white">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                Long-Term Architecture
              </div>

              <h2 className="mt-4 text-3xl font-semibold tracking-tight">
                This organisation record is the centre of client work.
              </h2>

              <p className="mt-4 max-w-3xl text-base leading-8 text-blue-100">
                Documents, engagements, accounting records, journals, tax,
                payroll, compliance, financial reporting, and advisory workflows
                connect through this organisation model.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                "Documents",
                "Engagements",
                "Accounting",
                "Journals",
                "General Ledger",
                "Financial Reporting",
                "Tax",
                "Payroll",
                "Compliance",
                "Advisory",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-semibold text-blue-100"
                >
                  <ShieldCheck className="mb-3 h-5 w-5 text-[#6491DE]" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        {organisation.legacy_client_id ? (
          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href={`/portal/clients/${organisation.legacy_client_id}`}
              className="rounded-full border border-[#D9E3F4] bg-white px-6 py-3 text-sm font-semibold text-[#073D7F]"
            >
              Open Legacy Client Workspace
            </a>

            <a
              href={`/portal/clients/${organisation.legacy_client_id}/upload`}
              className="rounded-full bg-[#073D7F] px-6 py-3 text-sm font-semibold text-white"
            >
              Upload Document
            </a>
          </div>
        ) : null}
      </section>
    </main>
  );
}