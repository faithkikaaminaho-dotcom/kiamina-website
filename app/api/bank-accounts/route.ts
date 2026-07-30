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

const allowedAccountTypes = [
  "CURRENT",
  "SAVINGS",
  "DOMICILIARY",
  "CASH",
  "MOBILE_MONEY",
  "PETTY_CASH",
  "OTHER",
];

function toNumber(value: unknown, fallback = 0) {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : fallback;
}

async function getInternalUser() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      supabase,
      user: null,
      profile: null,
      error: NextResponse.json({ error: "Not authenticated." }, { status: 401 }),
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !internalRoles.includes(profile.role)) {
    return {
      supabase,
      user,
      profile: null,
      error: NextResponse.json({ error: "Access denied." }, { status: 403 }),
    };
  }

  return {
    supabase,
    user,
    profile,
    error: null,
  };
}

export async function GET(request: Request) {
  try {
    const { supabase, error } = await getInternalUser();

    if (error) {
      return error;
    }

    const { searchParams } = new URL(request.url);
    const organisationId = searchParams.get("organisation_id");

    if (!organisationId) {
      return NextResponse.json(
        { error: "Organisation ID is required." },
        { status: 400 }
      );
    }

    const { data: bankAccounts, error: bankAccountsError } = await supabase
      .from("bank_accounts")
      .select(
        "id, organisation_id, account_name, bank_name, account_number, account_type, currency_code, gl_account_id, opening_balance, current_balance, is_active, notes, created_at"
      )
      .eq("organisation_id", organisationId)
      .order("account_name", { ascending: true });

    if (bankAccountsError) {
      return NextResponse.json(
        {
          error: "Unable to load bank accounts.",
          details: bankAccountsError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      bankAccounts: bankAccounts || [],
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load bank accounts.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, user, error } = await getInternalUser();

    if (error) {
      return error;
    }

    const body = await request.json();

    const organisationId = String(body.organisation_id || "").trim();
    const accountName = String(body.account_name || "").trim();
    const bankName = body.bank_name ? String(body.bank_name).trim() : null;
    const accountNumber = body.account_number
      ? String(body.account_number).trim()
      : null;

    const accountType = String(body.account_type || "CURRENT")
      .trim()
      .toUpperCase();

    const currencyCode = body.currency_code
      ? String(body.currency_code).trim().toUpperCase()
      : null;

    const glAccountId = body.gl_account_id
      ? String(body.gl_account_id).trim()
      : null;

    const openingBalance = toNumber(body.opening_balance, 0);
    const currentBalance = toNumber(body.current_balance, openingBalance);

    const notes = body.notes ? String(body.notes).trim() : null;

    if (!organisationId) {
      return NextResponse.json(
        { error: "Organisation is required." },
        { status: 400 }
      );
    }

    if (!accountName) {
      return NextResponse.json(
        { error: "Bank account name is required." },
        { status: 400 }
      );
    }

    if (!allowedAccountTypes.includes(accountType)) {
      return NextResponse.json(
        { error: "Invalid bank account type." },
        { status: 400 }
      );
    }

    const { data: organisation } = await supabase
      .from("organisations")
      .select("id, base_currency_code")
      .eq("id", organisationId)
      .single();

    if (!organisation) {
      return NextResponse.json(
        { error: "Organisation not found." },
        { status: 404 }
      );
    }

    if (glAccountId) {
      const { data: glAccount } = await supabase
        .from("chart_of_accounts")
        .select("id, account_type")
        .eq("id", glAccountId)
        .eq("organisation_id", organisationId)
        .eq("is_active", true)
        .single();

      if (!glAccount) {
        return NextResponse.json(
          {
            error:
              "Selected GL account is not an active account for this organisation.",
          },
          { status: 400 }
        );
      }
    }

    const { data: bankAccount, error: bankAccountError } = await supabase
      .from("bank_accounts")
      .insert({
        organisation_id: organisationId,
        account_name: accountName,
        bank_name: bankName,
        account_number: accountNumber,
        account_type: accountType,
        currency_code: currencyCode || organisation.base_currency_code,
        gl_account_id: glAccountId,
        opening_balance: openingBalance,
        current_balance: currentBalance,
        notes,
        created_by: user?.id,
        updated_by: user?.id,
      })
      .select("id")
      .single();

    if (bankAccountError || !bankAccount) {
      return NextResponse.json(
        {
          error: "Unable to create bank account.",
          details: bankAccountError?.message,
        },
        { status: 500 }
      );
    }

    try {
      await supabase.from("audit_logs").insert({
        user_id: user?.id,
        organisation_id: organisationId,
        action: "BANK_ACCOUNT_CREATED",
        details: {
          bank_account_id: bankAccount.id,
          account_name: accountName,
          bank_name: bankName,
          account_number: accountNumber,
          account_type: accountType,
          currency_code: currencyCode || organisation.base_currency_code,
          gl_account_id: glAccountId,
          opening_balance: openingBalance,
        },
      });
    } catch {
      // Audit logging should not block bank account creation.
    }

    return NextResponse.json({
      success: true,
      bankAccountId: bankAccount.id,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create bank account.",
      },
      { status: 500 }
    );
  }
}