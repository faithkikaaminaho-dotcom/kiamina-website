import { NextResponse } from "next/server";
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

const editableStatuses = ["DRAFT", "READY_FOR_REVIEW", "REVIEWED", "UNDER_REVIEW"];

function toNumber(value: unknown, fallback = 0) {
  if (value === null || value === undefined || value === "") return fallback;

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ receiptId: string }> }
) {
  try {
    const { receiptId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !internalRoles.includes(profile.role)) {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }

    const body = await request.json();

    const organisationId = String(body.organisation_id || "").trim();

    if (!organisationId) {
      return NextResponse.json(
        { error: "Organisation is required." },
        { status: 400 }
      );
    }

    const { data: existingReceipt } = await supabase
      .from("customer_receipts")
      .select("*")
      .eq("id", receiptId)
      .eq("organisation_id", organisationId)
      .single();

    if (!existingReceipt) {
      return NextResponse.json(
        { error: "Customer receipt not found." },
        { status: 404 }
      );
    }

    if (
      existingReceipt.status === "POSTED" ||
      existingReceipt.posted_at ||
      !editableStatuses.includes(existingReceipt.status || "")
    ) {
      return NextResponse.json(
        {
          error:
            "This customer receipt cannot be edited because it is posted or no longer in an editable review status.",
        },
        { status: 409 }
      );
    }

    const customerId = body.customer_id ? String(body.customer_id).trim() : null;
    const salesInvoiceId = body.sales_invoice_id
      ? String(body.sales_invoice_id).trim()
      : null;

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
    const netAmount = Number(Math.max(amountReceived - bankCharges, 0).toFixed(2));

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

    if (!customerId) {
      return NextResponse.json({ error: "Customer is required." }, { status: 400 });
    }

    if (!receiptDate) {
      return NextResponse.json(
        { error: "Receipt date is required." },
        { status: 400 }
      );
    }

    if (amountReceived <= 0) {
      return NextResponse.json(
        { error: "Amount received must be greater than zero." },
        { status: 400 }
      );
    }

    const { data: customer } = await supabase
      .from("customers")
      .select("id")
      .eq("id", customerId)
      .eq("organisation_id", organisationId)
      .single();

    if (!customer) {
      return NextResponse.json(
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
        return NextResponse.json(
          { error: "Sales invoice not found for this organisation." },
          { status: 404 }
        );
      }

      invoiceReceivableAccountId = invoice.receivable_account_id || null;
    }

    if (!salesInvoiceId && !incomeAccountId) {
      return NextResponse.json(
        {
          error:
            "Income account is required when receipt is not linked to a sales invoice.",
        },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabase
      .from("customer_receipts")
      .update({
        customer_id: customerId,
        sales_invoice_id: salesInvoiceId,
        receipt_date: receiptDate,
        currency_code: currencyCode || existingReceipt.currency_code,
        exchange_rate: exchangeRate,
        exchange_rate_date: exchangeRateDate || receiptDate,
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
        updated_by: user.id,
      })
      .eq("id", receiptId)
      .eq("organisation_id", organisationId);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message || "Unable to update customer receipt." },
        { status: 500 }
      );
    }

    try {
      await supabase.from("audit_logs").insert({
        user_id: user.id,
        organisation_id: organisationId,
        action: "CUSTOMER_RECEIPT_DRAFT_UPDATED",
        details: {
          customer_receipt_id: receiptId,
          receipt_number: existingReceipt.receipt_number,
          amount_received: amountReceived,
          bank_charges: bankCharges,
          net_amount: netAmount,
          status: existingReceipt.status,
        },
      });
    } catch {
      // Audit logging should not block edit.
    }

    return NextResponse.json({
      success: true,
      customerReceiptId: receiptId,
      netAmount,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update customer receipt.",
      },
      { status: 500 }
    );
  }
}