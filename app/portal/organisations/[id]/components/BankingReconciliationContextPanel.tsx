import { AlertTriangle, Banknote, CheckCircle, ExternalLink } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import PostLinkedBankLineDraftsButton from "./PostLinkedBankLineDraftsButton";

type AnyRecord = Record<string, any>;

type LinkedRecord = {
  allocationId: string;
  allocationType: string | null;
  sourceModule: string | null;
  sourceRecordId: string | null;
  label: string;
  status: string | null;
  amount: number;
  date: string | null;
  href: string | null;
  description: string | null;
};

function toNumber(value: unknown) {
  const numericValue = Number(value || 0);

  return Number.isFinite(numericValue) ? numericValue : 0;
}

function roundMoney(value: number) {
  return Number(value.toFixed(2));
}

function formatMoney(currencyCode?: string | null, amount?: number | null) {
  return `${currencyCode || "—"} ${Number(amount || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
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
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatModule(module?: string | null) {
  if (!module) return "Unlinked";

  return module
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function buildSourceHref({
  organisationId,
  sourceModule,
  sourceRecordId,
}: {
  organisationId: string;
  sourceModule?: string | null;
  sourceRecordId?: string | null;
}) {
  if (!sourceModule || !sourceRecordId) return null;

  if (sourceModule === "CUSTOMER_RECEIPT") {
    return `/portal/organisations/${organisationId}/customer-receipts/${sourceRecordId}`;
  }

  if (sourceModule === "SUPPLIER_PAYMENT") {
    return `/portal/organisations/${organisationId}/supplier-payments/${sourceRecordId}`;
  }

  if (sourceModule === "FUNDING_TRANSACTION") {
    return `/portal/organisations/${organisationId}/funding-transactions/${sourceRecordId}`;
  }

  if (sourceModule === "JOURNAL_ENTRY") {
    return `/portal/organisations/${organisationId}/journal-entries/${sourceRecordId}`;
  }

  return null;
}

async function getSourceRecordMaps({
  supabase,
  organisationId,
  allocations,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  organisationId: string;
  allocations: AnyRecord[];
}) {
  const customerReceiptIds = allocations
    .filter((allocation) => allocation.source_module === "CUSTOMER_RECEIPT")
    .map((allocation) => allocation.source_record_id)
    .filter(Boolean);

  const supplierPaymentIds = allocations
    .filter((allocation) => allocation.source_module === "SUPPLIER_PAYMENT")
    .map((allocation) => allocation.source_record_id)
    .filter(Boolean);

  const fundingTransactionIds = allocations
    .filter((allocation) => allocation.source_module === "FUNDING_TRANSACTION")
    .map((allocation) => allocation.source_record_id)
    .filter(Boolean);

  const journalEntryIds = allocations
    .filter((allocation) => allocation.source_module === "JOURNAL_ENTRY")
    .map((allocation) => allocation.source_record_id)
    .filter(Boolean);

  const customerReceiptMap = new Map<string, AnyRecord>();
  const supplierPaymentMap = new Map<string, AnyRecord>();
  const fundingTransactionMap = new Map<string, AnyRecord>();
  const journalEntryMap = new Map<string, AnyRecord>();

  if (customerReceiptIds.length > 0) {
    const { data } = await supabase
      .from("customer_receipts")
      .select("id, receipt_number, receipt_date, currency_code, amount_received, net_amount, status")
      .eq("organisation_id", organisationId)
      .in("id", customerReceiptIds);

    for (const row of data || []) {
      customerReceiptMap.set(row.id, row);
    }
  }

  if (supplierPaymentIds.length > 0) {
    const { data } = await supabase
      .from("supplier_payments")
      .select("id, payment_number, payment_date, currency_code, amount_paid, total_cash_outflow, status")
      .eq("organisation_id", organisationId)
      .in("id", supplierPaymentIds);

    for (const row of data || []) {
      supplierPaymentMap.set(row.id, row);
    }
  }

  if (fundingTransactionIds.length > 0) {
    const { data } = await supabase
      .from("funding_transactions")
      .select("id, transaction_number, transaction_date, transaction_type, currency_code, amount, net_amount, status")
      .eq("organisation_id", organisationId)
      .in("id", fundingTransactionIds);

    for (const row of data || []) {
      fundingTransactionMap.set(row.id, row);
    }
  }

  if (journalEntryIds.length > 0) {
    const { data } = await supabase
      .from("journal_entries")
      .select("id, journal_number, journal_date, journal_type, currency_code, total_debits, total_credits, status")
      .eq("organisation_id", organisationId)
      .in("id", journalEntryIds);

    for (const row of data || []) {
      journalEntryMap.set(row.id, row);
    }
  }

  return {
    customerReceiptMap,
    supplierPaymentMap,
    fundingTransactionMap,
    journalEntryMap,
  };
}

function buildLinkedRecord({
  organisationId,
  allocation,
  customerReceiptMap,
  supplierPaymentMap,
  fundingTransactionMap,
  journalEntryMap,
}: {
  organisationId: string;
  allocation: AnyRecord;
  customerReceiptMap: Map<string, AnyRecord>;
  supplierPaymentMap: Map<string, AnyRecord>;
  fundingTransactionMap: Map<string, AnyRecord>;
  journalEntryMap: Map<string, AnyRecord>;
}): LinkedRecord {
  const sourceModule = allocation.source_module || null;
  const sourceRecordId = allocation.source_record_id || null;
  const allocationAmount = roundMoney(toNumber(allocation.allocation_amount));

  if (sourceModule === "CUSTOMER_RECEIPT" && sourceRecordId) {
    const record = customerReceiptMap.get(sourceRecordId);

    return {
      allocationId: allocation.id,
      allocationType: allocation.allocation_type,
      sourceModule,
      sourceRecordId,
      label: record?.receipt_number || "Customer receipt",
      status: record?.status || allocation.status,
      amount: allocationAmount,
      date: record?.receipt_date || null,
      href: buildSourceHref({ organisationId, sourceModule, sourceRecordId }),
      description: allocation.allocation_description,
    };
  }

  if (sourceModule === "SUPPLIER_PAYMENT" && sourceRecordId) {
    const record = supplierPaymentMap.get(sourceRecordId);

    return {
      allocationId: allocation.id,
      allocationType: allocation.allocation_type,
      sourceModule,
      sourceRecordId,
      label: record?.payment_number || "Supplier payment",
      status: record?.status || allocation.status,
      amount: allocationAmount,
      date: record?.payment_date || null,
      href: buildSourceHref({ organisationId, sourceModule, sourceRecordId }),
      description: allocation.allocation_description,
    };
  }

  if (sourceModule === "FUNDING_TRANSACTION" && sourceRecordId) {
    const record = fundingTransactionMap.get(sourceRecordId);

    return {
      allocationId: allocation.id,
      allocationType: allocation.allocation_type,
      sourceModule,
      sourceRecordId,
      label: record?.transaction_number || "Funding transaction",
      status: record?.status || allocation.status,
      amount: allocationAmount,
      date: record?.transaction_date || null,
      href: buildSourceHref({ organisationId, sourceModule, sourceRecordId }),
      description: allocation.allocation_description,
    };
  }

  if (sourceModule === "JOURNAL_ENTRY" && sourceRecordId) {
    const record = journalEntryMap.get(sourceRecordId);

    return {
      allocationId: allocation.id,
      allocationType: allocation.allocation_type,
      sourceModule,
      sourceRecordId,
      label: record?.journal_number || "Journal entry",
      status: record?.status || allocation.status,
      amount: allocationAmount,
      date: record?.journal_date || null,
      href: buildSourceHref({ organisationId, sourceModule, sourceRecordId }),
      description: allocation.allocation_description,
    };
  }

  return {
    allocationId: allocation.id,
    allocationType: allocation.allocation_type,
    sourceModule,
    sourceRecordId,
    label: allocation.allocation_description || "Unlinked allocation",
    status: allocation.status,
    amount: allocationAmount,
    date: null,
    href: null,
    description: allocation.allocation_description,
  };
}

export default async function BankingReconciliationContextPanel({
  organisationId,
  sourceModule,
  sourceRecordId,
}: {
  organisationId: string;
  sourceModule: string;
  sourceRecordId: string;
}) {
  const supabase = await createClient();

  const { data: currentAllocation } = await supabase
    .from("bank_reconciliation_allocations")
    .select(
      "id, organisation_id, bank_account_id, bank_statement_line_id, allocation_type, source_module, source_record_id, allocation_description, allocation_amount, bank_charge_amount, bank_charge_treatment, status, created_at"
    )
    .eq("organisation_id", organisationId)
    .eq("source_module", sourceModule)
    .eq("source_record_id", sourceRecordId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!currentAllocation?.bank_statement_line_id) {
    return null;
  }

  const { data: bankLine } = await supabase
    .from("bank_statement_lines")
    .select(
      "id, organisation_id, bank_account_id, transaction_date, description, reference_number, money_in, money_out, currency_code, allocated_amount, unallocated_amount, reconciliation_status"
    )
    .eq("id", currentAllocation.bank_statement_line_id)
    .eq("organisation_id", organisationId)
    .single();

  if (!bankLine) {
    return null;
  }

  const { data: bankAccount } = await supabase
    .from("bank_accounts")
    .select("id, account_name, bank_name, account_number, currency_code, gl_account_id")
    .eq("id", bankLine.bank_account_id)
    .eq("organisation_id", organisationId)
    .maybeSingle();

  const { data: allocationRows } = await supabase
    .from("bank_reconciliation_allocations")
    .select(
      "id, organisation_id, bank_account_id, bank_statement_line_id, allocation_type, source_module, source_record_id, allocation_description, allocation_amount, bank_charge_amount, bank_charge_treatment, status, created_at"
    )
    .eq("organisation_id", organisationId)
    .eq("bank_statement_line_id", bankLine.id)
    .order("created_at", { ascending: true });

  const allocations = allocationRows || [];

  const {
    customerReceiptMap,
    supplierPaymentMap,
    fundingTransactionMap,
    journalEntryMap,
  } = await getSourceRecordMaps({
    supabase,
    organisationId,
    allocations,
  });

  const linkedRecords = allocations.map((allocation) =>
    buildLinkedRecord({
      organisationId,
      allocation,
      customerReceiptMap,
      supplierPaymentMap,
      fundingTransactionMap,
      journalEntryMap,
    })
  );

  const moneyIn = roundMoney(toNumber(bankLine.money_in));
  const moneyOut = roundMoney(toNumber(bankLine.money_out));
  const bankLineAmount = moneyIn > 0 ? moneyIn : moneyOut;

  const linkedTotal = roundMoney(
    linkedRecords.reduce((sum, record) => sum + record.amount, 0)
  );

  const difference = roundMoney(bankLineAmount - linkedTotal);
  const isBalanced = Math.abs(difference) < 0.01;

  const hasUnpostedDrafts = linkedRecords.some((record) =>
    ["DRAFT", "READY_FOR_REVIEW", "REVIEWED", "UNDER_REVIEW"].includes(
      record.status || ""
    )
  );

  const postedRecords = linkedRecords.filter(
    (record) => record.status === "POSTED"
  );

  return (
    <section className="mb-8 rounded-[2rem] border border-[#D9E3F4] bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F1F1F1] text-[#073D7F]">
              <Banknote className="h-5 w-5" />
            </div>

            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                Banking Reconciliation Context
              </div>
              <h2 className="mt-1 text-2xl font-semibold text-slate-950">
                Linked bank-line split group
              </h2>
            </div>
          </div>

          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
            Review all source records linked to this bank statement line before posting.
            Already posted matched records must not be reposted. Wrong matches should be
            unmatched from Banking, not deleted from the source register.
          </p>
        </div>

        <div
          className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
            isBalanced
              ? "bg-emerald-50 text-emerald-700"
              : "bg-amber-50 text-amber-700"
          }`}
        >
          {isBalanced ? (
            <span className="inline-flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Fully covered
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Difference exists
            </span>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm">
          <div className="font-semibold text-slate-500">Bank Line Amount</div>
          <div className="mt-2 text-xl font-semibold text-slate-950">
            {formatMoney(bankLine.currency_code, bankLineAmount)}
          </div>
        </div>

        <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm">
          <div className="font-semibold text-slate-500">Linked Coverage</div>
          <div className="mt-2 text-xl font-semibold text-slate-950">
            {formatMoney(bankLine.currency_code, linkedTotal)}
          </div>
        </div>

        <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm">
          <div className="font-semibold text-slate-500">Difference</div>
          <div
            className={`mt-2 text-xl font-semibold ${
              isBalanced ? "text-emerald-700" : "text-amber-700"
            }`}
          >
            {formatMoney(bankLine.currency_code, Math.abs(difference))}
          </div>
        </div>

        <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm">
          <div className="font-semibold text-slate-500">Bank Status</div>
          <div className="mt-2 text-xl font-semibold text-slate-950">
            {formatStatus(bankLine.reconciliation_status)}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-[#D9E3F4] bg-[#F8FAFC] p-5 text-sm leading-7 text-slate-600">
        <div className="grid gap-4 lg:grid-cols-3">
          <div>
            <div className="font-semibold text-slate-950">Bank account</div>
            <div className="mt-1">
              {bankAccount?.account_name || "Bank account not found"}
            </div>
            <div className="text-xs text-slate-500">
              {bankAccount?.bank_name || "—"} · {bankAccount?.account_number || "—"}
            </div>
          </div>

          <div>
            <div className="font-semibold text-slate-950">Bank line date</div>
            <div className="mt-1">{formatDate(bankLine.transaction_date)}</div>
            <div className="text-xs text-slate-500">
              Ref: {bankLine.reference_number || "—"}
            </div>
          </div>

          <div>
            <div className="font-semibold text-slate-950">Description</div>
            <div className="mt-1">{bankLine.description || "—"}</div>
          </div>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-[#D9E3F4]">
        <div className="grid grid-cols-12 bg-[#F8FAFC] px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          <div className="col-span-3">Linked record</div>
          <div className="col-span-2">Type</div>
          <div className="col-span-2">Date</div>
          <div className="col-span-2 text-right">Coverage</div>
          <div className="col-span-2 text-center">Status</div>
          <div className="col-span-1 text-right">Open</div>
        </div>

        {linkedRecords.length === 0 ? (
          <div className="px-4 py-6 text-sm text-slate-600">
            No linked records found for this bank line.
          </div>
        ) : (
          linkedRecords.map((record) => (
            <div
              key={record.allocationId}
              className="grid grid-cols-12 items-center border-t border-[#D9E3F4] px-4 py-4 text-sm"
            >
              <div className="col-span-3">
                <div className="font-semibold text-slate-950">{record.label}</div>
                <div className="mt-1 line-clamp-1 text-xs text-slate-500">
                  {record.description || "No description"}
                </div>
              </div>

              <div className="col-span-2 text-slate-600">
                {formatModule(record.sourceModule || record.allocationType)}
              </div>

              <div className="col-span-2 text-slate-600">
                {formatDate(record.date)}
              </div>

              <div className="col-span-2 text-right font-semibold text-slate-950">
                {formatMoney(bankLine.currency_code, record.amount)}
              </div>

              <div className="col-span-2 text-center">
                <span className="rounded-full bg-[#F1F1F1] px-3 py-1 text-xs font-semibold text-[#073D7F]">
                  {formatStatus(record.status)}
                </span>
              </div>

              <div className="col-span-1 text-right">
                {record.href ? (
                  <a
                    href={record.href}
                    className="inline-flex items-center justify-end text-[#073D7F]"
                    title="Open linked record"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div
        className={`mt-6 rounded-2xl border px-5 py-4 text-sm leading-7 ${
          isBalanced
            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
            : "border-amber-200 bg-amber-50 text-amber-800"
        }`}
      >
        {isBalanced ? (
          <div>
            <div className="font-semibold">Ready for group review.</div>
            <div className="mt-1">
              This bank line is fully covered. The next step is to post all unposted
              linked drafts together, while skipping any already posted matched records.
              Posted linked records found: {postedRecords.length}. Unposted drafts found:{" "}
              {hasUnpostedDrafts ? "Yes" : "No"}.
              {hasUnpostedDrafts ? (
  <div className="mt-4">
    <PostLinkedBankLineDraftsButton
      bankLineId={bankLine.id}
      disabled={!isBalanced}
    />
  </div>
) : null}
            </div>
          </div>
        ) : (
          <div>
            <div className="font-semibold">Posting should remain blocked.</div>
            <div className="mt-1">
              The total linked coverage does not equal the bank line amount. The reviewer
              should edit linked drafts, delete/void incorrect drafts, unmatch wrong links,
              or match/add the remaining amount before posting.
            </div>
          </div>
        )}
      </div>
    </section>
  );
}