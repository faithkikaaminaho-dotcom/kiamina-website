import { createClient } from "@/utils/supabase/server";
import { reserveDocumentNumber } from "@/lib/numbering";

export const runtime = "nodejs";

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

type InvoiceLineInput = {
  product_service_id?: string | null;
  description?: string | null;
  quantity?: number | string | null;
  unit_price?: number | string | null;
  discount_amount?: number | string | null;
  tax_rate?: number | string | null;
  revenue_account_id?: string | null;
  tax_account_id?: string | null;
};

function toNumber(value: unknown, fallback = 0) {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function calculateLine(line: InvoiceLineInput) {
  const quantity = toNumber(line.quantity, 1);
  const unitPrice = toNumber(line.unit_price, 0);
  const discountAmount = toNumber(line.discount_amount, 0);
  const taxRate = toNumber(line.tax_rate, 0);

  const netAmount = Math.max(quantity * unitPrice - discountAmount, 0);
  const taxAmount = Number(((netAmount * taxRate) / 100).toFixed(2));
  const lineTotal = Number((netAmount + taxAmount).toFixed(2));

  return {
    quantity,
    unitPrice,
    discountAmount,
    taxRate,
    taxAmount,
    lineTotal,
    netAmount,
  };
}

function getMissingColumnName(errorMessage: string) {
  const match = errorMessage.match(/Could not find the '([^']+)' column/i);
  return match?.[1] || null;
}

async function insertWithSchemaRetry({
  supabase,
  table,
  payload,
  selectColumns = "id",
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  table: string;
  payload: Record<string, unknown>;
  selectColumns?: string;
}) {
  let safePayload = { ...payload };
  const removedColumns: string[] = [];

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const { data, error } = await supabase
      .from(table)
      .insert(safePayload)
      .select(selectColumns)
      .single();

    if (!error && data) {
      return { data, removedColumns };
    }

    const missingColumn = getMissingColumnName(error?.message || "");

    if (missingColumn && missingColumn in safePayload) {
      delete safePayload[missingColumn];
      removedColumns.push(missingColumn);
      continue;
    }

    throw new Error(error?.message || `Unable to insert into ${table}.`);
  }

  throw new Error(`Unable to insert into ${table} after schema retry.`);
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Not authenticated." }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile || !internalRoles.includes(profile.role)) {
      return Response.json({ error: "Access denied." }, { status: 403 });
    }

    const body = await request.json();

    const organisationId = String(body.organisation_id || "").trim();
    const customerId = body.customer_id ? String(body.customer_id).trim() : null;

    const accountingPeriodId = body.accounting_period_id
      ? String(body.accounting_period_id).trim()
      : null;

    const engagementId = body.engagement_id
      ? String(body.engagement_id).trim()
      : null;

    const invoiceNumber = await reserveDocumentNumber({
      supabase,
      organisationId,
      documentType: "SALES_INVOICE",
      providedNumber: body.invoice_number,
    });

    const invoiceDate = String(body.invoice_date || "").trim();
    const dueDate = body.due_date ? String(body.due_date).trim() : null;

    const currencyCode = body.currency_code
      ? String(body.currency_code).trim().toUpperCase()
      : null;

    const exchangeRate = toNumber(body.exchange_rate, 1);

    const exchangeRateDate = body.exchange_rate_date
      ? String(body.exchange_rate_date).trim()
      : null;

    const exchangeRateSource = body.exchange_rate_source
      ? String(body.exchange_rate_source).trim()
      : null;

    const exchangeRateIsLocked = Boolean(body.exchange_rate_is_locked);

    const revenueAccountId = body.revenue_account_id
      ? String(body.revenue_account_id).trim()
      : null;

    const receivableAccountId = body.receivable_account_id
      ? String(body.receivable_account_id).trim()
      : null;

    const taxAccountId = body.tax_account_id
      ? String(body.tax_account_id).trim()
      : null;

    const notes = body.notes ? String(body.notes).trim() : null;

    const internalNotes = body.internal_notes
      ? String(body.internal_notes).trim()
      : null;

    const lines: InvoiceLineInput[] = Array.isArray(body.lines)
      ? body.lines
      : [];

    if (!organisationId) {
      return Response.json(
        { error: "Organisation is required." },
        { status: 400 }
      );
    }

    if (!customerId) {
      return Response.json(
        { error: "Customer is required." },
        { status: 400 }
      );
    }

    if (!invoiceNumber) {
      return Response.json(
        { error: "Invoice number is required." },
        { status: 400 }
      );
    }

    if (!invoiceDate) {
      return Response.json(
        { error: "Invoice date is required." },
        { status: 400 }
      );
    }

    if (lines.length < 1) {
      return Response.json(
        { error: "At least one invoice line is required." },
        { status: 400 }
      );
    }

    const { data: organisation, error: organisationError } = await supabase
      .from("organisations")
      .select("id, legal_name, trading_name, base_currency_code")
      .eq("id", organisationId)
      .single();

    if (organisationError || !organisation) {
      return Response.json(
        { error: "Organisation not found." },
        { status: 404 }
      );
    }

    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .select("id, customer_name")
      .eq("id", customerId)
      .eq("organisation_id", organisationId)
      .single();

    if (customerError || !customer) {
      return Response.json(
        { error: "Customer not found for this organisation." },
        { status: 404 }
      );
    }

    let subtotalAmount = 0;
    let taxAmount = 0;
    let discountAmount = 0;
    let totalAmount = 0;

    const calculatedLines = lines.map((line) => {
      const description = String(line.description || "").trim();

      if (!description) {
        throw new Error("Each invoice line requires a description.");
      }

      const calculated = calculateLine(line);

      subtotalAmount += calculated.netAmount;
      taxAmount += calculated.taxAmount;
      discountAmount += calculated.discountAmount;
      totalAmount += calculated.lineTotal;

      return {
        ...line,
        description,
        calculated,
      };
    });

    subtotalAmount = Number(subtotalAmount.toFixed(2));
    taxAmount = Number(taxAmount.toFixed(2));
    discountAmount = Number(discountAmount.toFixed(2));
    totalAmount = Number(totalAmount.toFixed(2));

    const invoiceResult = await insertWithSchemaRetry({
      supabase,
      table: "sales_invoices",
      payload: {
        organisation_id: organisationId,
        accounting_period_id: accountingPeriodId,
        engagement_id: engagementId,
        customer_id: customerId,
        invoice_number: invoiceNumber,
        invoice_date: invoiceDate,
        due_date: dueDate,
        currency_code: currencyCode || organisation.base_currency_code,
        exchange_rate: exchangeRate,
        exchange_rate_date: exchangeRateDate,
        exchange_rate_source: exchangeRateSource,
        exchange_rate_is_locked: exchangeRateIsLocked,
        subtotal_amount: subtotalAmount,
        tax_amount: taxAmount,
        discount_amount: discountAmount,
        total_amount: totalAmount,
        amount_paid: 0,
        balance_due: totalAmount,
        status: "DRAFT",
        revenue_account_id: revenueAccountId,
        receivable_account_id: receivableAccountId,
        tax_account_id: taxAccountId,
        notes,
        internal_notes: internalNotes,
        created_by: user.id,
        updated_by: user.id,
      },
      selectColumns: "id",
    });

    const invoice = invoiceResult.data as unknown as { id: string };

    for (const line of calculatedLines) {
      await insertWithSchemaRetry({
        supabase,
        table: "sales_invoice_lines",
        payload: {
          sales_invoice_id: invoice.id,
          organisation_id: organisationId,
          product_service_id: line.product_service_id || null,
          description: line.description,
          quantity: line.calculated.quantity,
          unit_price: line.calculated.unitPrice,
          discount_amount: line.calculated.discountAmount,
          tax_rate: line.calculated.taxRate,
          tax_amount: line.calculated.taxAmount,
          line_total: line.calculated.lineTotal,
          revenue_account_id: line.revenue_account_id || revenueAccountId,
          tax_account_id: line.tax_account_id || taxAccountId,
        },
        selectColumns: "id",
      });
    }

    try {
      await supabase.from("audit_logs").insert({
        user_id: user.id,
        organisation_id: organisationId,
        engagement_id: engagementId,
        action: "SALES_INVOICE_CREATED_DRAFT",
        details: {
          sales_invoice_id: invoice.id,
          invoice_number: invoiceNumber,
          customer_id: customerId,
          customer_name: customer.customer_name,
          total_amount: totalAmount,
          currency_code: currencyCode || organisation.base_currency_code,
          exchange_rate: exchangeRate,
          exchange_rate_date: exchangeRateDate,
          exchange_rate_source: exchangeRateSource,
          exchange_rate_is_locked: exchangeRateIsLocked,
          status: "DRAFT",
          removed_invoice_columns: invoiceResult.removedColumns,
        },
      });
    } catch {
      // Audit logging should not block draft invoice creation.
    }

    return Response.json({
      success: true,
      salesInvoiceId: invoice.id,
      status: "DRAFT",
      totalAmount,
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create sales invoice.",
      },
      { status: 500 }
    );
  }
}