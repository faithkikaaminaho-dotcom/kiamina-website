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

function toNumber(value: unknown, fallback = 0) {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : fallback;
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

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !internalRoles.includes(profile.role)) {
      return Response.json({ error: "Access denied." }, { status: 403 });
    }

    const body = await request.json();

    const organisationId = String(body.organisation_id || "").trim();

    const customerId = body.customer_id
      ? String(body.customer_id).trim()
      : null;

    const salesInvoiceId = body.sales_invoice_id
      ? String(body.sales_invoice_id).trim()
      : null;

    const accountingPeriodId = body.accounting_period_id
      ? String(body.accounting_period_id).trim()
      : null;

    const engagementId = body.engagement_id
      ? String(body.engagement_id).trim()
      : null;

    const receiptNumber = await reserveDocumentNumber({
      supabase,
      organisationId,
      documentType: "CUSTOMER_RECEIPT",
      providedNumber: body.receipt_number,
    });

    const receiptDate = String(body.receipt_date || "").trim();

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

    const amountReceived = toNumber(body.amount_received, 0);
    const bankCharges = toNumber(body.bank_charges, 0);
    const netAmount = Number(
      Math.max(amountReceived - bankCharges, 0).toFixed(2)
    );

    const paymentMethod = body.payment_method
      ? String(body.payment_method).trim()
      : null;

    const bankAccountId = body.bank_account_id
      ? String(body.bank_account_id).trim()
      : null;

    const receivableAccountId = body.receivable_account_id
      ? String(body.receivable_account_id).trim()
      : null;

    const incomeAccountId = body.income_account_id
      ? String(body.income_account_id).trim()
      : null;

    const referenceNumber = body.reference_number
      ? String(body.reference_number).trim()
      : null;

    const narration = body.narration ? String(body.narration).trim() : null;

    const internalNotes = body.internal_notes
      ? String(body.internal_notes).trim()
      : null;

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

    if (!receiptNumber) {
      return Response.json(
        { error: "Receipt number is required." },
        { status: 400 }
      );
    }

    if (!receiptDate) {
      return Response.json(
        { error: "Receipt date is required." },
        { status: 400 }
      );
    }

    if (amountReceived <= 0) {
      return Response.json(
        { error: "Amount received must be greater than zero." },
        { status: 400 }
      );
    }

    const { data: organisation } = await supabase
      .from("organisations")
      .select("id, base_currency_code")
      .eq("id", organisationId)
      .single();

    if (!organisation) {
      return Response.json(
        { error: "Organisation not found." },
        { status: 404 }
      );
    }

    const { data: customer } = await supabase
      .from("customers")
      .select("id, customer_name")
      .eq("id", customerId)
      .eq("organisation_id", organisationId)
      .single();

    if (!customer) {
      return Response.json(
        { error: "Customer not found for this organisation." },
        { status: 404 }
      );
    }

    let invoiceReceivableAccountId: string | null = null;

    if (salesInvoiceId) {
      const { data: invoice } = await supabase
        .from("sales_invoices")
        .select("id, receivable_account_id")
        .eq("id", salesInvoiceId)
        .eq("organisation_id", organisationId)
        .single();

      if (!invoice) {
        return Response.json(
          { error: "Sales invoice not found for this organisation." },
          { status: 404 }
        );
      }

      invoiceReceivableAccountId = invoice.receivable_account_id || null;
    }

    if (!salesInvoiceId && !incomeAccountId) {
      return Response.json(
        {
          error:
            "Income account is required when receipt is not linked to a sales invoice.",
        },
        { status: 400 }
      );
    }

    const { data: receipt, error: receiptError } = await supabase
      .from("customer_receipts")
      .insert({
        organisation_id: organisationId,
        accounting_period_id: accountingPeriodId,
        engagement_id: engagementId,
        customer_id: customerId,
        sales_invoice_id: salesInvoiceId,
        receipt_number: receiptNumber,
        receipt_date: receiptDate,
        currency_code: currencyCode || organisation.base_currency_code,
        exchange_rate: exchangeRate,
        exchange_rate_date: exchangeRateDate,
        exchange_rate_source: exchangeRateSource,
        exchange_rate_is_locked: exchangeRateIsLocked,
        amount_received: amountReceived,
        bank_charges: bankCharges,
        net_amount: netAmount,
        payment_method: paymentMethod,
        bank_account_id: bankAccountId,
        receivable_account_id: invoiceReceivableAccountId || receivableAccountId,
        income_account_id: salesInvoiceId ? null : incomeAccountId,
        reference_number: referenceNumber,
        narration,
        internal_notes: internalNotes,
        status: "DRAFT",
        created_by: user.id,
        updated_by: user.id,
      })
      .select("id")
      .single();

    if (receiptError || !receipt) {
      return Response.json(
        { error: receiptError?.message || "Unable to create receipt." },
        { status: 500 }
      );
    }

    try {
      await supabase.from("audit_logs").insert({
        user_id: user.id,
        organisation_id: organisationId,
        engagement_id: engagementId,
        action: "CUSTOMER_RECEIPT_CREATED_DRAFT",
        details: {
          customer_receipt_id: receipt.id,
          receipt_number: receiptNumber,
          customer_id: customerId,
          customer_name: customer.customer_name,
          sales_invoice_id: salesInvoiceId,
          receivable_account_id:
            invoiceReceivableAccountId || receivableAccountId,
          income_account_id: salesInvoiceId ? null : incomeAccountId,
          amount_received: amountReceived,
          bank_charges: bankCharges,
          net_amount: netAmount,
          currency_code: currencyCode || organisation.base_currency_code,
          exchange_rate: exchangeRate,
          exchange_rate_date: exchangeRateDate,
          exchange_rate_source: exchangeRateSource,
          exchange_rate_is_locked: exchangeRateIsLocked,
          status: "DRAFT",
        },
      });
    } catch {
      // Audit logging should not block receipt creation.
    }

    return Response.json({
      success: true,
      customerReceiptId: receipt.id,
      status: "DRAFT",
      netAmount,
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create customer receipt.",
      },
      { status: 500 }
    );
  }
}