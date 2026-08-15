import { redirect } from "next/navigation";
import { ArrowLeft, ListTree } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import CreateChartAccountForm, {
  type FsLineItemOption,
} from "./CreateChartAccountForm";

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

export default async function NewChartAccountPage({
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

  if (!profile || !internalRoles.includes(String(profile.role))) {
    redirect("/portal");
  }

  const { data: organisation } = await supabase
    .from("organisations")
    .select(
      "id, legal_name, trading_name, country_code, reporting_framework_code"
    )
    .eq("id", id)
    .single();

  if (!organisation) {
    redirect("/portal/organisations");
  }

  const frameworkCode = String(
    organisation.reporting_framework_code || ""
  ).trim();

  if (!frameworkCode) {
    throw new Error(
      "Set the organisation reporting framework before creating a chart account."
    );
  }

  if (
    frameworkCode === "US_GAAP" &&
    organisation.country_code !== "US"
  ) {
    throw new Error(
      "US GAAP can only be used by a United States organisation."
    );
  }

  const { data: fsLineItems, error: fsLineItemsError } = await supabase
    .from("financial_statement_line_items")
    .select(
      "id, framework_code, statement_code, line_item_code, line_item_name, account_type, account_subtype, presentation_category, normal_balance, cash_flow_default_category"
    )
    .eq("framework_code", frameworkCode)
    .eq("is_active", true)
    .eq("is_postable", true)
    .order("display_order", { ascending: true })
    .order("line_item_name", { ascending: true });

  if (fsLineItemsError) {
    throw new Error(fsLineItemsError.message);
  }

  const organisationName =
    organisation.trading_name ||
    organisation.legal_name ||
    "Organisation";

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <section className="border-b border-[#D9E3F4] bg-white">
        <div className="mx-auto max-w-6xl px-6 py-8 lg:px-8">
          <a
            href={`/portal/organisations/${organisation.id}/chart-of-accounts`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#073D7F]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Chart of Accounts
          </a>

          <div className="mt-8 flex items-start gap-5">
            <div className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#F1F1F1] text-[#073D7F]">
              <ListTree className="h-6 w-6" />
            </div>

            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                Chart of Accounts · {frameworkCode}
              </div>

              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
                Create account
              </h1>

              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                Add an account for {organisationName}. Financial statement line
                items are controlled by the organisation&apos;s reporting framework.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10 lg:px-8">
        <CreateChartAccountForm
          organisationId={organisation.id}
          frameworkCode={frameworkCode}
          countryCode={organisation.country_code}
          lineItems={(fsLineItems || []) as FsLineItemOption[]}
        />
      </section>
    </main>
  );
}
