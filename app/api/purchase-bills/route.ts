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

type BillLineInput = {
  product_service_id?: string | null;
  description?: string | null;
  quantity?: number | string | null;
  unit_price?: number | string | null;
  discount_amount?: number | string | null;
  tax_rate?: number | string | null;
  expense_account_id?: string | null;
  tax_account_id?: string | null;
};

function toNumber(value: unknown, fallback = 0) {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function calculateLine(line: BillLineInput) {
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
    const supplierId = body.supplier_id ? String(body.supplier_id).trim() : null;
    const accountingPeriodId = body.accounting_period_id
      ? String(body.accounting_period_id).trim()
      : null;
    const engagementId = body.engagement_id
      ? String(body.engagement_id).trim()
      : null;

    const billNumber = await reserveDocumentNumber({
  supabase,
  organisationId,
  documentType: "PURCHASE_BILL",
  providedNumber: body.bill_number,
});
    const supplierInvoiceNumber = body.supplier_invoice_number
      ? String(body.supplier_invoice_number).trim()
      : null;
    const billDate = String(body.bill_date || "").trim();
    const dueDate = body.due_date ? String(body.due_date).trim() : null;

    const currencyCode = body.currency_code
      ? String(body.currency_code).trim().toUpperCase()
      : null;

    const exchangeRate = toNumber(body.exchange_rate, 1);

    const expenseAccountId = body.expense_account_id
      ? String(body.expense_account_id).trim()
      : null;

    const payableAccountId = body.payable_account_id
      ? String(body.payable_account_id).trim()
      : null;

    const taxAccountId = body.tax_account_id
      ? String(body.tax_account_id).trim()
      : null;

    const notes = body.notes ? String(body.notes).trim() : null;
    const internalNotes = body.internal_notes
      ? String(body.internal_notes).trim()
      : null;

    const lines: BillLineInput[] = Array.isArray(body.lines) ? body.lines : [];

    if (!organisationId) {
      return Response.json(
        { error: "Organisation is required." },
        { status: 400 }
      );
    }

    if (!supplierId) {
      return Response.json(
        { error: "Supplier is required." },
        { status: 400 }
      );
    }

    if (!billNumber) {
      return Response.json(
        { error: "Bill number is required." },
        { status: 400 }
      );
    }

    if (!billDate) {
      return Response.json(
        { error: "Bill date is required." },
        { status: 400 }
      );
    }

    if (lines.length < 1) {
      return Response.json(
        { error: "At least one bill line is required." },
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

    const { data: supplier, error: supplierError } = await supabase
      .from("suppliers")
      .select("id, supplier_name")
      .eq("id", supplierId)
      .eq("organisation_id", organisationId)
      .single();

    if (supplierError || !supplier) {
      return Response.json(
        { error: "Supplier not found for this organisation." },
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
        throw new Error("Each bill line requires a description.");
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

    const billResult = await insertWithSchemaRetry({
      supabase,
      table: "purchase_bills",
      payload: {
        organisation_id: organisationId,
        accounting_period_id: accountingPeriodId,
        engagement_id: engagementId,
        supplier_id: supplierId,
        bill_number: billNumber,
        supplier_invoice_number: supplierInvoiceNumber,
        bill_date: billDate,
        due_date: dueDate,
        currency_code: currencyCode || organisation.base_currency_code,
        exchange_rate: exchangeRate,
        subtotal_amount: subtotalAmount,
        tax_amount: taxAmount,
        discount_amount: discountAmount,
        total_amount: totalAmount,
        amount_paid: 0,
        balance_due: totalAmount,
        status: "DRAFT",
        expense_account_id: expenseAccountId,
        payable_account_id: payableAccountId,
        tax_account_id: taxAccountId,
        notes,
        internal_notes: internalNotes,
        created_by: user.id,
        updated_by: user.id,
      },
      selectColumns: "id",
    });

    const bill = billResult.data as unknown as { id: string };

    for (const line of calculatedLines) {
      await insertWithSchemaRetry({
        supabase,
        table: "purchase_bill_lines",
        payload: {
          purchase_bill_id: bill.id,
          organisation_id: organisationId,
          product_service_id: line.product_service_id || null,
          description: line.description,
          quantity: line.calculated.quantity,
          unit_price: line.calculated.unitPrice,
          discount_amount: line.calculated.discountAmount,
          tax_rate: line.calculated.taxRate,
          tax_amount: line.calculated.taxAmount,
          line_total: line.calculated.lineTotal,
          expense_account_id: line.expense_account_id || expenseAccountId,
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
        action: "PURCHASE_BILL_CREATED_DRAFT",
        details: {
          purchase_bill_id: bill.id,
          bill_number: billNumber,
          supplier_invoice_number: supplierInvoiceNumber,
          supplier_id: supplierId,
          supplier_name: supplier.supplier_name,
          total_amount: totalAmount,
          currency_code: currencyCode || organisation.base_currency_code,
          status: "DRAFT",
          removed_bill_columns: billResult.removedColumns,
        },
      });
    } catch {
      // Audit logging should not block draft bill creation.
    }

    return Response.json({
      success: true,
      purchaseBillId: bill.id,
      status: "DRAFT",
      totalAmount,
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create purchase bill.",
      },
      { status: 500 }
    );
  }
}