import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Boxes } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import CreateProductServiceForm from "./CreateProductServiceForm";

export const dynamic = "force-dynamic";

const internalRoles = [
  "SUPER_ADMIN",
  "ADMIN",
  "STAFF",
  "IT_ADMIN",
  "ACCOUNTANT_ADMIN",
  "ACCOUNTANT_USER",
  "CUSTOMER_SUPPORT",
  "COMPLIANCE_ADMIN",
  "OPERATIONS_ADMIN",
];

type AccountRecord = {
  id: string;
  account_code: string | null;
  account_name: string | null;
  account_type: string | null;
};

function isTaxAccount(account: AccountRecord) {
  const searchableText = [
    account.account_code,
    account.account_name,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return [
    "tax",
    "vat",
    "gst",
    "wht",
    "withholding",
    "sales tax",
  ].some((keyword) => searchableText.includes(keyword));
}

export default async function NewProductServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  if (
    !profile ||
    !internalRoles.includes(String(profile.role))
  ) {
    redirect("/portal");
  }

  const { data: organisation } = await supabase
    .from("organisations")
    .select(
      "id, legal_name, trading_name, base_currency_code"
    )
    .eq("id", id)
    .single();

  if (!organisation) {
    redirect("/portal/organisations");
  }

  const {
    data: incomeAccounts,
    error: incomeAccountsError,
  } = await supabase
    .from("chart_of_accounts")
    .select(
      "id, account_code, account_name, account_type"
    )
    .eq("organisation_id", id)
    .eq("is_active", true)
    .eq("account_type", "INCOME")
    .order("account_code", {
      ascending: true,
    });

  if (incomeAccountsError) {
    throw new Error(incomeAccountsError.message);
  }

  const {
    data: expenseAccounts,
    error: expenseAccountsError,
  } = await supabase
    .from("chart_of_accounts")
    .select(
      "id, account_code, account_name, account_type"
    )
    .eq("organisation_id", id)
    .eq("is_active", true)
    .eq("account_type", "EXPENSE")
    .order("account_code", {
      ascending: true,
    });

  if (expenseAccountsError) {
    throw new Error(expenseAccountsError.message);
  }

  const {
    data: possibleTaxAccounts,
    error: taxAccountsError,
  } = await supabase
    .from("chart_of_accounts")
    .select(
      "id, account_code, account_name, account_type"
    )
    .eq("organisation_id", id)
    .eq("is_active", true)
    .in("account_type", ["ASSET", "LIABILITY"])
    .order("account_code", {
      ascending: true,
    });

  if (taxAccountsError) {
    throw new Error(taxAccountsError.message);
  }

  const assetAndLiabilityAccounts =
    (possibleTaxAccounts || []) as AccountRecord[];

  const filteredTaxAccounts =
    assetAndLiabilityAccounts.filter(isTaxAccount);

  /*
   * If tax-specific account names cannot be identified,
   * show active asset and liability accounts instead of
   * leaving the dropdown empty.
   */
  const taxAccounts =
    filteredTaxAccounts.length > 0
      ? filteredTaxAccounts
      : assetAndLiabilityAccounts;

  const organisationName =
    organisation.trading_name ||
    organisation.legal_name ||
    "Organisation";

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <section className="border-b border-[#D9E3F4] bg-white">
        <div className="mx-auto max-w-6xl px-6 py-8 lg:px-8">
          <Link
            href={`/portal/organisations/${organisation.id}/products-services`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#073D7F]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Products / Services
          </Link>

          <div className="mt-8 flex items-start gap-5">
            <div className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#F1F1F1] text-[#073D7F]">
              <Boxes className="h-6 w-6" />
            </div>

            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                Products / Services Master Data
              </div>

              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
                Create product or service
              </h1>

              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                Add a product or service for{" "}
                {organisationName}. This supports
                invoices, bills, revenue mapping, tax
                treatment, sales analysis and
                management reporting.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10 lg:px-8">
        <CreateProductServiceForm
          organisationId={organisation.id}
          defaultCurrency={
            organisation.base_currency_code
          }
          incomeAccounts={
            (incomeAccounts || []) as AccountRecord[]
          }
          expenseAccounts={
            (expenseAccounts || []) as AccountRecord[]
          }
          taxAccounts={taxAccounts}
        />
      </section>
    </main>
  );
}