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
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const { paymentId } = await params;
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

    const { data: existingPayment } = await supabase
      .from("supplier_payments")
      .select("*")
      .eq("id", paymentId)
      .eq("organisation_id", organisationId)
      .single();

    if (!existingPayment) {
      return NextResponse.json(
        { error: "Supplier payment not found." },
        { status: 404 }
      );
    }

    if (
      existingPayment.status === "POSTED" ||
      existingPayment.posted_at ||
      !editableStatuses.includes(existingPayment.status || "")
    ) {
      return NextResponse.json(
        {
          error:
            "This supplier payment cannot be edited because it is posted or no longer in an editable review status.",
        },
        { status: 409 }
      );
    }

    const supplierId = body.supplier_id ? String(body.supplier_id).trim() : null;

    const purchaseBillId = body.purchase_bill_id
      ? String(body.purchase_bill_id).trim()
      : null;

    const paymentDate = String(body.payment_date || "").trim();

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

    const amountPaid = toNumber(body.amount_paid, 0);
    const bankCharges = toNumber(body.bank_charges, 0);
    const totalCashOutflow = Number((amountPaid + bankCharges).toFixed(2));

    const paymentMethod = body.payment_method
      ? String(body.payment_method).trim()
      : null;

    const bankAccountId = body.bank_account_id
      ? String(body.bank_account_id).trim()
      : null;

    const payableAccountId = body.payable_account_id
      ? String(body.payable_account_id).trim()
      : null;

    const expenseAccountId = body.expense_account_id
      ? String(body.expense_account_id).trim()
      : null;

    const referenceNumber = body.reference_number
      ? String(body.reference_number).trim()
      : null;

    const narration = body.narration ? String(body.narration).trim() : null;

    const internalNotes = body.internal_notes
      ? String(body.internal_notes).trim()
      : null;

    if (!supplierId) {
      return NextResponse.json({ error: "Supplier is required." }, { status: 400 });
    }

    if (!paymentDate) {
      return NextResponse.json(
        { error: "Payment date is required." },
        { status: 400 }
      );
    }

    if (amountPaid <= 0) {
      return NextResponse.json(
        { error: "Amount paid must be greater than zero." },
        { status: 400 }
      );
    }

    const { data: supplier } = await supabase
      .from("suppliers")
      .select("id")
      .eq("id", supplierId)
      .eq("organisation_id", organisationId)
      .single();

    if (!supplier) {
      return NextResponse.json(
        { error: "Supplier not found for this organisation." },
        { status: 404 }
      );
    }

    let billPayableAccountId: string | null = null;

    if (purchaseBillId) {
      const { data: bill } = await supabase
        .from("purchase_bills")
        .select("id, payable_account_id")
        .eq("id", purchaseBillId)
        .eq("organisation_id", organisationId)
        .single();

      if (!bill) {
        return NextResponse.json(
          { error: "Purchase bill not found for this organisation." },
          { status: 404 }
        );
      }

      billPayableAccountId = bill.payable_account_id || null;
    }

    if (!purchaseBillId && !expenseAccountId) {
      return NextResponse.json(
        {
          error:
            "Expense account is required when payment is not linked to a purchase bill.",
        },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabase
      .from("supplier_payments")
      .update({
        supplier_id: supplierId,
        purchase_bill_id: purchaseBillId,
        payment_date: paymentDate,
        currency_code: currencyCode || existingPayment.currency_code,
        exchange_rate: exchangeRate,
        exchange_rate_date: exchangeRateDate || paymentDate,
        exchange_rate_source: exchangeRateSource,
        exchange_rate_is_locked: exchangeRateIsLocked,
        amount_paid: amountPaid,
        bank_charges: bankCharges,
        total_cash_outflow: totalCashOutflow,
        payment_method: paymentMethod,
        bank_account_id: bankAccountId,
        payable_account_id: billPayableAccountId || payableAccountId,
        expense_account_id: purchaseBillId ? null : expenseAccountId,
        reference_number: referenceNumber,
        narration,
        internal_notes: internalNotes,
        updated_by: user.id,
      })
      .eq("id", paymentId)
      .eq("organisation_id", organisationId);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message || "Unable to update supplier payment." },
        { status: 500 }
      );
    }

    try {
      await supabase.from("audit_logs").insert({
        user_id: user.id,
        organisation_id: organisationId,
        action: "SUPPLIER_PAYMENT_DRAFT_UPDATED",
        details: {
          supplier_payment_id: paymentId,
          payment_number: existingPayment.payment_number,
          amount_paid: amountPaid,
          bank_charges: bankCharges,
          total_cash_outflow: totalCashOutflow,
          status: existingPayment.status,
        },
      });
    } catch {
      // Audit logging should not block edit.
    }

    return NextResponse.json({
      success: true,
      supplierPaymentId: paymentId,
      totalCashOutflow,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update supplier payment.",
      },
      { status: 500 }
    );
  }
}