import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { ArrowLeft, MapPinned } from "lucide-react";
import TrackingOptionsManager from "./TrackingOptionsManager";

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

const standardCategories = [
  {
    category_code: "DEPARTMENT",
    category_name: "Departments",
    description: "Business department, unit, or function.",
  },
  {
    category_code: "LOCATION",
    category_name: "Locations",
    description: "Branch, city, country, warehouse, office, or operating location.",
  },
  {
    category_code: "PROJECT",
    category_name: "Projects",
    description: "Project, contract, assignment, or client delivery workstream.",
  },
  {
    category_code: "COST_CENTRE",
    category_name: "Cost Centres",
    description: "Internal cost centre for responsibility reporting.",
  },
  {
    category_code: "CLASS",
    category_name: "Classes",
    description: "Management reporting class or segment.",
  },
  {
    category_code: "FUND_GRANT",
    category_name: "Funds / Grants",
    description: "Restricted fund, donor grant, programme, or funding stream.",
  },
  {
    category_code: "SERVICE_LINE",
    category_name: "Service Lines",
    description: "Service line, product line, or revenue stream.",
  },
];

export default async function TrackingDimensionsPage({
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

  const role = profile?.role as string | undefined;

  if (!role || !internalRoles.includes(role)) {
    redirect("/portal");
  }

  const { data: organisation } = await supabase
    .from("organisations")
    .select("id, legal_name, trading_name, base_currency_code, reporting_framework_code")
    .eq("id", id)
    .single();

  if (!organisation) {
    redirect("/portal/organisations");
  }

  const { data: existingCategories } = await supabase
    .from("tracking_categories")
    .select(
      "id, organisation_id, category_code, category_name, description, is_system_default, is_required, is_active"
    )
    .eq("organisation_id", id)
    .order("category_code", { ascending: true });

  const existingCodes = new Set(
    (existingCategories || []).map((category) => category.category_code)
  );

  const missingCategories = standardCategories.filter(
    (category) => !existingCodes.has(category.category_code)
  );

  if (missingCategories.length > 0) {
    await supabase.from("tracking_categories").insert(
      missingCategories.map((category) => ({
        organisation_id: id,
        category_code: category.category_code,
        category_name: category.category_name,
        description: category.description,
        is_system_default: true,
        is_required: false,
        is_active: true,
        created_by: user.id,
        updated_by: user.id,
      }))
    );
  }

  const { data: categories } = await supabase
    .from("tracking_categories")
    .select(
      "id, organisation_id, category_code, category_name, description, is_system_default, is_required, is_active"
    )
    .eq("organisation_id", id)
    .eq("is_active", true)
    .order("category_code", { ascending: true });

  const { data: options } = await supabase
    .from("tracking_options")
    .select(
      "id, organisation_id, tracking_category_id, option_code, option_name, description, is_active"
    )
    .eq("organisation_id", id)
    .eq("is_active", true)
    .order("option_name", { ascending: true });

  const organisationName =
    organisation.trading_name || organisation.legal_name || "Organisation";

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <section className="border-b border-[#D9E3F4] bg-white">
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          <a
            href={`/portal/organisations/${id}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#073D7F]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to organisation workspace
          </a>

          <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="inline-flex rounded-full bg-[#F1F1F1] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#073D7F]">
                Core Accounting Setup
              </div>

              <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-950">
                Tracking Dimensions
              </h1>

              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                {organisationName}
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-[#F8FAFC] p-5">
              <div className="flex items-center gap-3">
                <MapPinned className="h-5 w-5 text-[#073D7F]" />
                <div>
                  <div className="text-sm font-semibold text-slate-950">
                    Dimension Categories
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    {categories?.length || 0} categories · {options?.length || 0} options
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <TrackingOptionsManager
          organisationId={id}
          categories={categories || []}
          options={options || []}
        />
      </section>
    </main>
  );
}