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

const editableStatuses = ["DRAFT", "READY_FOR_REVIEW", "UNDER_REVIEW", "REVIEWED"];

type InvoiceLineInput = {
  id?: string | null;
  product_service_id?: string | null;
  description?: string | null;
  quantity?: number | string | null;
  unit_price?: number | string | null;
  discount_amount?: number | string | null;
  tax_rate?: number | string | null;
  revenue_account_id?: string | null;
  tax_account_id?: string | null;
  department_id?: string | null;
  location_id?: string | null;
  project_id?: string | null;
  cost_centre_id?: string | null;
  class_id?: string | null;
  fund_grant_id?: string | null;
  service_line_id?: string | null;
  tracking_data?: Record<string, unknown> | null;
};

function toNumber(value: unknown, fallback = 0) {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function cleanId(value: unknown) {
  const text = value ? String(value).trim() : "";
  return text.length > 0 ? text : null;
}

function cleanText(value: unknown) {
  const text = value ? String(value).trim() : "";
  return text.length > 0 ? text : null;
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

function buildTrackingData(line: InvoiceLineInput) {
  const trackingData: Record<string, string> = {};

  const fields = [
    "department_id",
    "location_id",
    "project_id",
    "cost_centre_id",
    "class_id",
    "fund_grant_id",
    "service_line_id",
  ] as const;

  for (const field of fields) {
    const value = cleanId(line[field]);

    if (value) {
      trackingData[field] = value;
    }
  }

  return Object.keys(trackingData).length > 0 ? trackingData : null;
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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  try {
    const { invoiceId } = await params;

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
    const customerId = cleanId(body.customer_id);

    const invoiceNumber = body.invoice_number
      ? await reserveDocumentNumber({
          supabase,
          organisationId,
          documentType: "SALES_INVOICE",
          providedNumber: body.invoice_number,
        })
      : null;

    const invoiceDate = String(body.invoice_date || "").trim();
    const dueDate = cleanId(body.due_date);

    const currencyCode = body.currency_code
      ? String(body.currency_code).trim().toUpperCase()
      : null;

    const exchangeRate = toNumber(body.exchange_rate, 1);
    const exchangeRateDate = cleanId(body.exchange_rate_date);
    const exchangeRateSource = cleanId(body.exchange_rate_source);
    const exchangeRateIsLocked = Boolean(body.exchange_rate_is_locked);

    const revenueAccountId = cleanId(body.revenue_account_id);
    const receivableAccountId = cleanId(body.receivable_account_id);
    const taxAccountId = cleanId(body.tax_account_id);

    const notes = cleanText(body.notes);
    const internalNotes = cleanText(body.internal_notes);

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

    const { data: invoice, error: invoiceError } = await supabase
      .from("sales_invoices")
      .select("id, organisation_id, status, posted_at, invoice_number")
      .eq("id", invoiceId)
      .eq("organisation_id", organisationId)
      .single();

    if (invoiceError || !invoice) {
      return Response.json(
        { error: "Sales invoice not found." },
        { status: 404 }
      );
    }

    const invoiceStatus = String(invoice.status || "DRAFT").toUpperCase();

    if (invoice.posted_at || !editableStatuses.includes(invoiceStatus)) {
      return Response.json(
        {
          error:
            "This sales invoice cannot be edited because it has already been posted or is no longer editable.",
        },
        { status: 409 }
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

    const { error: updateError } = await supabase
      .from("sales_invoices")
      .update({
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
        balance_due: totalAmount,
        revenue_account_id: revenueAccountId,
        receivable_account_id: receivableAccountId,
        tax_account_id: taxAccountId,
        notes,
        internal_notes: internalNotes,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", invoiceId)
      .eq("organisation_id", organisationId);

    if (updateError) {
      return Response.json(
        { error: updateError.message || "Unable to update sales invoice." },
        { status: 400 }
      );
    }

    const { error: deleteLinesError } = await supabase
      .from("sales_invoice_lines")
      .delete()
      .eq("sales_invoice_id", invoiceId)
      .eq("organisation_id", organisationId);

    if (deleteLinesError) {
      return Response.json(
        {
          error:
            deleteLinesError.message ||
            "Unable to replace existing sales invoice lines.",
        },
        { status: 400 }
      );
    }

    const removedLineColumns = new Set<string>();

    for (const line of calculatedLines) {
      const lineResult = await insertWithSchemaRetry({
        supabase,
        table: "sales_invoice_lines",
        payload: {
          sales_invoice_id: invoiceId,
          organisation_id: organisationId,
          product_service_id: cleanId(line.product_service_id),
          description: line.description,
          quantity: line.calculated.quantity,
          unit_price: line.calculated.unitPrice,
          discount_amount: line.calculated.discountAmount,
          tax_rate: line.calculated.taxRate,
          tax_amount: line.calculated.taxAmount,
          line_total: line.calculated.lineTotal,
          revenue_account_id: cleanId(line.revenue_account_id) || revenueAccountId,
          tax_account_id: cleanId(line.tax_account_id) || taxAccountId,
          department_id: cleanId(line.department_id),
          location_id: cleanId(line.location_id),
          project_id: cleanId(line.project_id),
          cost_centre_id: cleanId(line.cost_centre_id),
          class_id: cleanId(line.class_id),
          fund_grant_id: cleanId(line.fund_grant_id),
          service_line_id: cleanId(line.service_line_id),
          tracking_data: line.tracking_data || buildTrackingData(line),
        },
        selectColumns: "id",
      });

      for (const removedColumn of lineResult.removedColumns) {
        removedLineColumns.add(removedColumn);
      }
    }

    try {
      await supabase.from("audit_logs").insert({
        user_id: user.id,
        organisation_id: organisationId,
        action: "SALES_INVOICE_UPDATED_DRAFT",
        details: {
          sales_invoice_id: invoiceId,
          previous_invoice_number: invoice.invoice_number,
          invoice_number: invoiceNumber,
          customer_id: customerId,
          customer_name: customer.customer_name,
          total_amount: totalAmount,
          currency_code: currencyCode || organisation.base_currency_code,
          exchange_rate: exchangeRate,
          exchange_rate_date: exchangeRateDate,
          exchange_rate_source: exchangeRateSource,
          exchange_rate_is_locked: exchangeRateIsLocked,
          status: invoiceStatus,
          line_dimensions_captured: true,
          removed_line_columns: Array.from(removedLineColumns),
        },
      });
    } catch {
      // Audit logging should not block draft invoice update.
    }

    return Response.json({
      success: true,
      salesInvoiceId: invoiceId,
      status: invoiceStatus,
      totalAmount,
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update sales invoice.",
      },
      { status: 500 }
    );
  }
}