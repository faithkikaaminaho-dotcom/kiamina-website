import { headers } from "next/headers";

export const dynamic = "force-dynamic";

function normalizeCountryCode(value: string | null) {
  if (!value) return null;

  const code = value.trim().toUpperCase();

  if (!code || code === "XX" || code === "UNKNOWN") {
    return null;
  }

  if (code === "UK") {
    return "GB";
  }

  return code;
}

export async function GET() {
  const headerList = await headers();

  const countryCode =
    normalizeCountryCode(headerList.get("x-vercel-ip-country")) ||
    normalizeCountryCode(headerList.get("cf-ipcountry")) ||
    normalizeCountryCode(headerList.get("x-country-code")) ||
    normalizeCountryCode(headerList.get("x-appengine-country")) ||
    null;

  return Response.json({
    countryCode,
  });
}