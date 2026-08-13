import { redirect } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle,
  Coins,
  FileText,
  MapPinned,
  ReceiptText,
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

const editableStatuses = ["DRAFT", "READY_FOR_REVIEW", "UNDER_REVIEW", "REVIEWED"];

type AnyRecord = Record<string, any>;

const trackingDimensionFields = [
  { key: "class_id", label: "Class" },
  { key: "cost_centre_id", label: "Cost Centre" },
  { key: "department_id", label: "Department" },
  { key: "fund_grant_id", label: "Fund / Grant" },
  { key: "location_id", label: "Location" },
  { key: "project_id", label: "Project" },
  { key: "service_line_id", label: "Service Line" },
];

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

function formatTrackingOption(option?: AnyRecord | null) {
  if (!option) return "—";

  const code = option.option_code ? `${option.option_code} - ` : "";

  return `${code}${option.option_name || "Unnamed option"}`;
}

export default async function SalesInvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string; invoiceId: string }>;
}) {
  const { id, invoiceId } = await params;

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

  const { data: invoice } = await supabase
    .from("sales_invoices")
    .select("*")
    .eq("id", invoiceId)
    .eq("organisation_id", id)
    .single();

  if (!invoice) {
    redirect(`/portal/organisations/${id}/sales-invoices`);
  }

  const { data: customer } = await supabase
    .from("customers")
    .select("id, customer_name, email, phone, customer_type")
    .eq("id", invoice.customer_id)
    .eq("organisation_id", id)
    .single();

  const { data: lines } = await supabase
    .from("sales_invoice_lines")
    .select("*")
    .eq("sales_invoice_id", invoiceId)
    .eq("organisation_id", id)
    .order("created_at", { ascending: true });

  const invoiceLines = lines || [];

  const accountIds = [
    invoice.revenue_account_id,
    invoice.receivable_account_id,
    invoice.tax_account_id,
    ...invoiceLines.map((line) => line.revenue_account_id),
    ...invoiceLines.map((line) => line.tax_account_id),
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

  const trackingOptionIds = Array.from(
    new Set(
      invoiceLines.flatMap((line) =>
        trackingDimensionFields
          .map((field) => line[field.key])
          .filter(Boolean)
      )
    )
  );

  let trackingOptions: AnyRecord[] = [];

  if (trackingOptionIds.length > 0) {
    const { data } = await supabase
      .from("tracking_options")
      .select("id, option_code, option_name, tracking_category_id")
      .eq("organisation_id", id)
      .in("id", trackingOptionIds);

    trackingOptions = data || [];
  }

  const { data: linkedDocuments } = await supabase
    .from("documents")
    .select(
      "id, file_name, document_type, document_category_id, status, source_module, source_record_id, created_at, file_path, storage_path, mime_type, content_type"
    )
    .eq("organisation_id", id)
    .eq("source_module", "SALES_INVOICE")
    .eq("source_record_id", invoiceId)
    .order("created_at", { ascending: false });

  const accountMap = new Map(accounts.map((account) => [account.id, account]));
  const trackingOptionMap = new Map(
    trackingOptions.map((option) => [option.id, option])
  );

  const organisationName =
    organisation.trading_name || organisation.legal_name || "Organisation";

  const revenueAccount = accountMap.get(invoice.revenue_account_id);
  const receivableAccount = accountMap.get(invoice.receivable_account_id);
  const taxAccount = accountMap.get(invoice.tax_account_id);

  const invoiceStatus = String(invoice.status || "DRAFT").toUpperCase();
  const canEditInvoice =
    !invoice.posted_at && editableStatuses.includes(invoiceStatus);

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <section className="border-b border-[#D9E3F4] bg-white">
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          <a
            href={`/portal/organisations/${organisation.id}/sales-invoices`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#073D7F]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to sales invoices
          </a>

          <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-5">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F1F1F1] text-[#073D7F]">
                <ReceiptText className="h-6 w-6" />
              </div>

              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                  Sales Invoice
                </div>

                <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
                  {invoice.invoice_number || "Untitled invoice"}
                </h1>

                <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                  Review the full draft sales invoice for {organisationName},
                  including customer details, invoice lines, GL mapping, FX
                  information, dimensions, supporting documents, and control
                  status.
                </p>

                <div className="mt-5 flex flex-wrap gap-3">
                  <span className="rounded-full bg-[#F1F1F1] px-4 py-2 text-sm font-semibold text-[#073D7F]">
                    {formatStatus(invoice.status)}
                  </span>

                  <span className="rounded-full bg-[#F1F1F1] px-4 py-2 text-sm font-semibold text-slate-700">
                    {invoice.currency_code || organisation.base_currency_code}
                  </span>

                  <span className="rounded-full bg-[#F1F1F1] px-4 py-2 text-sm font-semibold text-slate-700">
                    Invoice Date: {formatDate(invoice.invoice_date)}
                  </span>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  {canEditInvoice ? (
                    <a
                      href={`/portal/organisations/${organisation.id}/sales-invoices/${invoice.id}/edit`}
                      className="rounded-full bg-[#073D7F] px-6 py-3 text-sm font-semibold text-white"
                    >
                      Edit Draft Invoice
                    </a>
                  ) : null}

                  <a
                    href={`/portal/organisations/${organisation.id}/sales-invoices`}
                    className="rounded-full border border-[#D9E3F4] bg-white px-6 py-3 text-sm font-semibold text-[#073D7F]"
                  >
                    Invoice Register
                  </a>
                </div>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-[#F1F1F1] p-5 text-sm text-slate-600">
              <div className="font-semibold text-slate-950">Customer</div>
              <div className="mt-2 text-lg font-semibold text-[#073D7F]">
                {customer?.customer_name || "Customer not found"}
              </div>
              <div className="mt-2">{customer?.email || "No email"}</div>
              <div className="mt-1">{customer?.phone || "No phone"}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">
              Subtotal
            </div>
            <div className="mt-3 text-2xl font-semibold text-slate-950">
              {formatMoney(invoice.currency_code, invoice.subtotal_amount)}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">
              Discount
            </div>
            <div className="mt-3 text-2xl font-semibold text-slate-950">
              {formatMoney(invoice.currency_code, invoice.discount_amount)}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">Tax</div>
            <div className="mt-3 text-2xl font-semibold text-slate-950">
              {formatMoney(invoice.currency_code, invoice.tax_amount)}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">Total</div>
            <div className="mt-3 text-2xl font-semibold text-slate-950">
              {formatMoney(invoice.currency_code, invoice.total_amount)}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">
              Balance Due
            </div>
            <div className="mt-3 text-2xl font-semibold text-slate-950">
              {formatMoney(invoice.currency_code, invoice.balance_due)}
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-[#073D7F]" />
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                Invoice Details
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm">
                <div className="font-semibold text-slate-950">
                  Invoice Number
                </div>
                <div className="mt-2 text-slate-600">
                  {invoice.invoice_number || "—"}
                </div>
              </div>

              <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm">
                <div className="font-semibold text-slate-950">Status</div>
                <div className="mt-2 text-slate-600">
                  {formatStatus(invoice.status)}
                </div>
              </div>

              <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm">
                <div className="font-semibold text-slate-950">
                  Invoice Date
                </div>
                <div className="mt-2 text-slate-600">
                  {formatDate(invoice.invoice_date)}
                </div>
              </div>

              <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm">
                <div className="font-semibold text-slate-950">Due Date</div>
                <div className="mt-2 text-slate-600">
                  {formatDate(invoice.due_date)}
                </div>
              </div>

              <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm">
                <div className="font-semibold text-slate-950">Currency</div>
                <div className="mt-2 text-slate-600">
                  {invoice.currency_code || "—"}
                </div>
              </div>

              <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm">
                <div className="font-semibold text-slate-950">Amount Paid</div>
                <div className="mt-2 text-slate-600">
                  {formatMoney(invoice.currency_code, invoice.amount_paid)}
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-[#D9E3F4] bg-white p-5 text-sm leading-7 text-slate-600">
              <div className="font-semibold text-slate-950">Customer Notes</div>
              <div className="mt-2">{invoice.notes || "No customer notes."}</div>
            </div>

            <div className="mt-4 rounded-2xl border border-[#D9E3F4] bg-white p-5 text-sm leading-7 text-slate-600">
              <div className="font-semibold text-slate-950">Internal Notes</div>
              <div className="mt-2">
                {invoice.internal_notes || "No internal notes."}
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm">
            <div className="flex items-center gap-3">
              <Coins className="h-5 w-5 text-[#073D7F]" />
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                Header GL & FX Mapping
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm">
                <div className="font-semibold text-slate-950">
                  Default Revenue Account
                </div>
                <div className="mt-2 text-slate-600">
                  {formatAccount(revenueAccount)}
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
                  Default Tax Account
                </div>
                <div className="mt-2 text-slate-600">
                  {formatAccount(taxAccount)}
                </div>
              </div>

              <div className="rounded-2xl border border-[#D9E3F4] bg-white p-5 text-sm">
                <div className="font-semibold text-slate-950">
                  Exchange Rate
                </div>
                <div className="mt-2 text-slate-600">
                  {formatNumber(invoice.exchange_rate)}
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Rate Date
                    </div>
                    <div className="mt-1 text-slate-600">
                      {formatDate(invoice.exchange_rate_date)}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Source
                    </div>
                    <div className="mt-1 text-slate-600">
                      {formatStatus(invoice.exchange_rate_source)}
                    </div>
                  </div>
                </div>

                <div className="mt-4 inline-flex rounded-full bg-[#F1F1F1] px-3 py-1 text-xs font-semibold text-[#073D7F]">
                  {invoice.exchange_rate_is_locked
                    ? "FX Rate Locked"
                    : "FX Rate Not Locked"}
                </div>
              </div>
            </div>
          </section>
        </div>

        <section className="mt-8 rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                Supporting Documents
              </div>

              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                Evidence linked to this sales invoice
              </h2>

              <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-600">
                Supporting documents are linked using source module{" "}
                <span className="font-semibold text-slate-950">
                  SALES_INVOICE
                </span>{" "}
                and this invoice ID. Upload and attach controls will be added in
                the next sales document step.
              </p>
            </div>

            {canEditInvoice ? (
              <a
                href={`/portal/organisations/${organisation.id}/sales-invoices/${invoice.id}/edit`}
                className="rounded-full border border-[#D9E3F4] bg-white px-6 py-3 text-sm font-semibold text-[#073D7F]"
              >
                Manage in Edit
              </a>
            ) : null}
          </div>

          <div className="mt-6 space-y-3">
            {linkedDocuments && linkedDocuments.length > 0 ? (
              linkedDocuments.map((document) => (
                <a
                  key={document.id}
                  href={`/portal/documents/${document.id}`}
                  className="block rounded-2xl border border-[#D9E3F4] bg-[#F8FAFC] p-5 transition hover:border-[#073D7F]"
                >
                  <div className="font-semibold text-[#073D7F]">
                    {document.file_name || "Untitled document"}
                  </div>

                  <div className="mt-2 text-sm text-slate-600">
                    {document.document_type || "Document"} ·{" "}
                    {formatStatus(document.status)} · Uploaded{" "}
                    {formatDate(document.created_at)}
                  </div>
                </a>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-[#D9E3F4] bg-[#F8FAFC] p-5 text-sm text-slate-500">
                No supporting documents are linked to this invoice yet.
              </div>
            )}
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] border border-[#D9E3F4] bg-white shadow-sm">
          <div className="border-b border-[#D9E3F4] px-6 py-5">
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
              Invoice Lines
            </div>

            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
              Products, services, GL accounts, and dimensions
            </h2>
          </div>

          {invoiceLines.length === 0 ? (
            <div className="px-6 py-12 text-sm text-slate-500">
              No invoice lines were found for this invoice.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[2600px] divide-y divide-[#D9E3F4]">
                <thead className="bg-[#F8FAFC]">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Description
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Qty
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Unit Price
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Discount
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Tax Rate
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Tax
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Total
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Revenue Account
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Tax Account
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Receivable Account
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Class
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Cost Centre
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Department
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Fund / Grant
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Location
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Project
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Service Line
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#D9E3F4] bg-white">
                  {invoiceLines.map((line) => {
                    const lineRevenueAccount = accountMap.get(
                      line.revenue_account_id
                    );

                    const lineTaxAccount = accountMap.get(line.tax_account_id);

                    return (
                      <tr key={line.id} className="hover:bg-[#F8FAFC]">
                        <td className="min-w-[260px] px-6 py-5 text-sm">
                          <div className="font-semibold text-slate-950">
                            {line.description || "No description"}
                          </div>
                        </td>

                        <td className="whitespace-nowrap px-6 py-5 text-right text-sm text-slate-600">
                          {formatNumber(line.quantity)}
                        </td>

                        <td className="whitespace-nowrap px-6 py-5 text-right text-sm text-slate-600">
                          {formatMoney(invoice.currency_code, line.unit_price)}
                        </td>

                        <td className="whitespace-nowrap px-6 py-5 text-right text-sm text-slate-600">
                          {formatMoney(
                            invoice.currency_code,
                            line.discount_amount
                          )}
                        </td>

                        <td className="whitespace-nowrap px-6 py-5 text-right text-sm text-slate-600">
                          {formatNumber(line.tax_rate)}%
                        </td>

                        <td className="whitespace-nowrap px-6 py-5 text-right text-sm text-slate-600">
                          {formatMoney(invoice.currency_code, line.tax_amount)}
                        </td>

                        <td className="whitespace-nowrap px-6 py-5 text-right text-sm font-semibold text-slate-950">
                          {formatMoney(invoice.currency_code, line.line_total)}
                        </td>

                        <td className="min-w-[220px] px-6 py-5 text-sm text-slate-600">
                          {formatAccount(lineRevenueAccount)}
                        </td>

                        <td className="min-w-[220px] px-6 py-5 text-sm text-slate-600">
                          {formatAccount(lineTaxAccount)}
                        </td>

                        <td className="min-w-[220px] px-6 py-5 text-sm text-slate-600">
                          {formatAccount(receivableAccount)}
                        </td>

                        <td className="min-w-[180px] px-6 py-5 text-sm text-slate-600">
                          {formatTrackingOption(
                            trackingOptionMap.get(line.class_id)
                          )}
                        </td>

                        <td className="min-w-[180px] px-6 py-5 text-sm text-slate-600">
                          {formatTrackingOption(
                            trackingOptionMap.get(line.cost_centre_id)
                          )}
                        </td>

                        <td className="min-w-[180px] px-6 py-5 text-sm text-slate-600">
                          {formatTrackingOption(
                            trackingOptionMap.get(line.department_id)
                          )}
                        </td>

                        <td className="min-w-[180px] px-6 py-5 text-sm text-slate-600">
                          {formatTrackingOption(
                            trackingOptionMap.get(line.fund_grant_id)
                          )}
                        </td>

                        <td className="min-w-[180px] px-6 py-5 text-sm text-slate-600">
                          {formatTrackingOption(
                            trackingOptionMap.get(line.location_id)
                          )}
                        </td>

                        <td className="min-w-[180px] px-6 py-5 text-sm text-slate-600">
                          {formatTrackingOption(
                            trackingOptionMap.get(line.project_id)
                          )}
                        </td>

                        <td className="min-w-[180px] px-6 py-5 text-sm text-slate-600">
                          {formatTrackingOption(
                            trackingOptionMap.get(line.service_line_id)
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="mt-8 rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F1F1F1] text-[#073D7F]">
              <MapPinned className="h-5 w-5" />
            </div>

            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                Sales Dimensions
              </div>

              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                Line-level reporting classification
              </h2>

              <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-600">
                Sales invoice dimensions are captured at line level so future
                sales reports can analyse revenue by department, location,
                project, cost centre, class, fund/grant, and service line.
              </p>
            </div>
          </div>
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
                Draft invoice record
              </h2>

              <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-600">
                This sales invoice is currently an operational draft record. It
                does not post to the general ledger, receivables ledger,
                customer statement, tax reporting, or management reporting until
                Kiamina adds posting, review, approval, and audit trail controls.
              </p>

              <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#F1F1F1] px-4 py-2 text-sm font-semibold text-[#073D7F]">
                <CheckCircle className="h-4 w-4" />
                Ready for future review and posting workflow
              </div>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}