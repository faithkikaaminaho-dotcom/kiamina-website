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

    const supplierId = body.supplier_id
      ? String(body.supplier_id).trim()
      : null;

    const purchaseBillId = body.purchase_bill_id
      ? String(body.purchase_bill_id).trim()
      : null;

    const accountingPeriodId = body.accounting_period_id
      ? String(body.accounting_period_id).trim()
      : null;

    const engagementId = body.engagement_id
      ? String(body.engagement_id).trim()
      : null;

    const paymentNumber = await reserveDocumentNumber({
      supabase,
      organisationId,
      documentType: "SUPPLIER_PAYMENT",
      providedNumber: body.payment_number,
    });

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

    if (!paymentNumber) {
      return Response.json(
        { error: "Payment number is required." },
        { status: 400 }
      );
    }

    if (!paymentDate) {
      return Response.json(
        { error: "Payment date is required." },
        { status: 400 }
      );
    }

    if (amountPaid <= 0) {
      return Response.json(
        { error: "Amount paid must be greater than zero." },
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

    const { data: supplier } = await supabase
      .from("suppliers")
      .select("id, supplier_name")
      .eq("id", supplierId)
      .eq("organisation_id", organisationId)
      .single();

    if (!supplier) {
      return Response.json(
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
        return Response.json(
          { error: "Purchase bill not found for this organisation." },
          { status: 404 }
        );
      }

      billPayableAccountId = bill.payable_account_id || null;
    }

    if (!purchaseBillId && !expenseAccountId) {
      return Response.json(
        {
          error:
            "Expense account is required when payment is not linked to a purchase bill.",
        },
        { status: 400 }
      );
    }

    const { data: payment, error: paymentError } = await supabase
      .from("supplier_payments")
      .insert({
        organisation_id: organisationId,
        accounting_period_id: accountingPeriodId,
        engagement_id: engagementId,
        supplier_id: supplierId,
        purchase_bill_id: purchaseBillId,
        payment_number: paymentNumber,
        payment_date: paymentDate,
        currency_code: currencyCode || organisation.base_currency_code,
        exchange_rate: exchangeRate,
        exchange_rate_date: exchangeRateDate,
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
        status: "DRAFT",
        created_by: user.id,
        updated_by: user.id,
      })
      .select("id")
      .single();

    if (paymentError || !payment) {
      return Response.json(
        { error: paymentError?.message || "Unable to create supplier payment." },
        { status: 500 }
      );
    }

    try {
      await supabase.from("audit_logs").insert({
        user_id: user.id,
        organisation_id: organisationId,
        engagement_id: engagementId,
        action: "SUPPLIER_PAYMENT_CREATED_DRAFT",
        details: {
          supplier_payment_id: payment.id,
          payment_number: paymentNumber,
          supplier_id: supplierId,
          supplier_name: supplier.supplier_name,
          purchase_bill_id: purchaseBillId,
          payable_account_id: billPayableAccountId || payableAccountId,
          expense_account_id: purchaseBillId ? null : expenseAccountId,
          amount_paid: amountPaid,
          bank_charges: bankCharges,
          total_cash_outflow: totalCashOutflow,
          currency_code: currencyCode || organisation.base_currency_code,
          exchange_rate: exchangeRate,
          exchange_rate_date: exchangeRateDate,
          exchange_rate_source: exchangeRateSource,
          exchange_rate_is_locked: exchangeRateIsLocked,
          status: "DRAFT",
        },
      });
    } catch {
      // Audit logging should not block supplier payment creation.
    }

    return Response.json({
      success: true,
      supplierPaymentId: payment.id,
      status: "DRAFT",
      totalCashOutflow,
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create supplier payment.",
      },
      { status: 500 }
    );
  }
}