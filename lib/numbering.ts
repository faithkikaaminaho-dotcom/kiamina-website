import { SupabaseClient } from "@supabase/supabase-js";

export type NumberDocumentType =
  | "SALES_INVOICE"
  | "PURCHASE_BILL"
  | "CUSTOMER_RECEIPT"
  | "SUPPLIER_PAYMENT"
  | "CAPITAL_CALL"
  | "FUNDING_TRANSACTION"
  | "JOURNAL_ENTRY";

const defaultSequenceConfig: Record<
  NumberDocumentType,
  { prefix: string; padding: number }
> = {
  SALES_INVOICE: { prefix: "INV", padding: 4 },
  PURCHASE_BILL: { prefix: "BILL", padding: 4 },
  CUSTOMER_RECEIPT: { prefix: "RCPT", padding: 4 },
  SUPPLIER_PAYMENT: { prefix: "PAY", padding: 4 },
  CAPITAL_CALL: { prefix: "CAPCALL", padding: 4 },
  FUNDING_TRANSACTION: { prefix: "FUND", padding: 4 },
  JOURNAL_ENTRY: { prefix: "JE-", padding: 4 },
};

export function formatDocumentNumber(
  prefix: string,
  nextNumber: number,
  padding: number
) {
  return `${prefix}-${String(nextNumber).padStart(padding, "0")}`;
}

export async function getPreviewDocumentNumber({
  supabase,
  organisationId,
  documentType,
}: {
  supabase: SupabaseClient;
  organisationId: string;
  documentType: NumberDocumentType;
}) {
  const defaultConfig = defaultSequenceConfig[documentType];

  const { data: existingSequence, error: existingError } = await supabase
    .from("number_sequences")
    .select("prefix, next_number, padding")
    .eq("organisation_id", organisationId)
    .eq("document_type", documentType)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existingSequence) {
    return formatDocumentNumber(
      existingSequence.prefix,
      existingSequence.next_number,
      existingSequence.padding
    );
  }

  const { data: createdSequence, error: createError } = await supabase
    .from("number_sequences")
    .insert({
      organisation_id: organisationId,
      document_type: documentType,
      prefix: defaultConfig.prefix,
      next_number: 1,
      padding: defaultConfig.padding,
    })
    .select("prefix, next_number, padding")
    .single();

  if (createError) {
    throw createError;
  }

  return formatDocumentNumber(
    createdSequence.prefix,
    createdSequence.next_number,
    createdSequence.padding
  );
}

export async function reserveDocumentNumber({
  supabase,
  organisationId,
  documentType,
  providedNumber,
}: {
  supabase: SupabaseClient;
  organisationId: string;
  documentType: NumberDocumentType;
  providedNumber?: string | null;
}) {
  const trimmedProvidedNumber = providedNumber?.trim();

  const generatedNumber = await getPreviewDocumentNumber({
    supabase,
    organisationId,
    documentType,
  });

  const finalNumber = trimmedProvidedNumber || generatedNumber;

  const { data: sequence, error: sequenceError } = await supabase
    .from("number_sequences")
    .select("id, next_number")
    .eq("organisation_id", organisationId)
    .eq("document_type", documentType)
    .single();

  if (sequenceError) {
    throw sequenceError;
  }

  if (!trimmedProvidedNumber || trimmedProvidedNumber === generatedNumber) {
    const { error: updateError } = await supabase
      .from("number_sequences")
      .update({
        next_number: Number(sequence.next_number || 1) + 1,
      })
      .eq("id", sequence.id);

    if (updateError) {
      throw updateError;
    }
  }

  return finalNumber;
}