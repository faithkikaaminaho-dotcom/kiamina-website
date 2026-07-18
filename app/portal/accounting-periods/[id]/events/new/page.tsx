import { redirect } from "next/navigation";
import { ArrowLeft, MessageSquareText } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import CreatePeriodEventForm from "./CreatePeriodEventForm";

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

function formatDate(value?: string | null) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString();
}

export default async function NewPeriodEventPage({
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

  if (!profile || !internalRoles.includes(profile.role)) {
    redirect("/portal");
  }

  const { data: period } = await supabase
    .from("accounting_periods")
    .select(
      `
      id,
      organisation_id,
      name,
      start_date,
      end_date,
      currency_code,
      organisations (
        id,
        legal_name,
        trading_name
      )
    `
    )
    .eq("id", id)
    .single();

  if (!period) {
    redirect("/portal/organisations");
  }

  const organisation = Array.isArray(period.organisations)
    ? period.organisations[0]
    : period.organisations;

  const organisationName =
    organisation?.trading_name || organisation?.legal_name || "Organisation";

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <section className="border-b border-[#D9E3F4] bg-white">
        <div className="mx-auto max-w-6xl px-6 py-8 lg:px-8">
          <a
            href={`/portal/accounting-periods/${period.id}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#073D7F]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to accounting period
          </a>

          <div className="mt-8 flex items-start gap-5">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F1F1F1] text-[#073D7F]">
              <MessageSquareText className="h-6 w-6" />
            </div>

            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                Period Event
              </div>

              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
                Add management context
              </h1>

              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                Capture what happened during {period.name} for{" "}
                {organisationName}. This context will later support management
                reporting, strategic advisory commentary, risk/control
                recommendations, and financial statement note considerations.
              </p>

              <p className="mt-3 text-sm font-semibold text-slate-600">
                Period: {formatDate(period.start_date)} to{" "}
                {formatDate(period.end_date)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10 lg:px-8">
        <CreatePeriodEventForm
          accountingPeriodId={period.id}
          defaultCurrency={period.currency_code}
        />
      </section>
    </main>
  );
}