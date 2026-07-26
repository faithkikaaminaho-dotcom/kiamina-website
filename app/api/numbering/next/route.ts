import { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import {
  getPreviewDocumentNumber,
  NumberDocumentType,
} from "@/lib/numbering";

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

const allowedDocumentTypes = [
  "SALES_INVOICE",
  "PURCHASE_BILL",
  "CUSTOMER_RECEIPT",
  "SUPPLIER_PAYMENT",
  "CAPITAL_CALL",
  "FUNDING_TRANSACTION",
];

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorised." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !internalRoles.includes(profile.role)) {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  const organisationId = request.nextUrl.searchParams.get("organisation_id");
  const documentType = request.nextUrl.searchParams.get("document_type");

  if (!organisationId || !documentType) {
    return Response.json(
      { error: "organisation_id and document_type are required." },
      { status: 400 }
    );
  }

  if (!allowedDocumentTypes.includes(documentType)) {
    return Response.json({ error: "Invalid document type." }, { status: 400 });
  }

  const nextNumber = await getPreviewDocumentNumber({
    supabase,
    organisationId,
    documentType: documentType as NumberDocumentType,
  });

  return Response.json({
    document_type: documentType,
    next_number: nextNumber,
  });
}