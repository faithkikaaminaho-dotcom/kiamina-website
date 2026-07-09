export const runtime = "nodejs";

import { createAdminClient } from "@/utils/supabase/admin";

function formatFramework(code: string) {
  const labels: Record<string, string> = {
    IFRS: "IFRS",
    US_GAAP: "US GAAP",
    IFRS_SME: "IFRS for SMEs",
  };

  return labels[code] || code;
}

export async function GET() {
  try {
    const supabase = createAdminClient();

    const { data: jurisdictions, error } = await supabase
      .from("jurisdictions")
      .select(
        "code, name, reporting_framework_code, currency_code, primary_tax_authority, corporate_registry, financial_reporting_regulator, payroll_authority, is_active"
      )
      .eq("is_active", true)
      .order("name");

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({
      jurisdictions:
        jurisdictions?.map((item) => ({
          code: item.code,
          country: item.name,
          framework: formatFramework(item.reporting_framework_code),
          currency: item.currency_code,
          taxAuthority: item.primary_tax_authority,
          corporateRegistry: item.corporate_registry,
          financialReportingRegulator: item.financial_reporting_regulator,
          payrollAuthority: item.payroll_authority,
          flagCode: item.code.toLowerCase(),
        })) || [],
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load jurisdictions.",
      },
      { status: 500 }
    );
  }
}