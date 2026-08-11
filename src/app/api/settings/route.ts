import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const PUBLIC_SETTING_KEYS = [
  "site_name",
  "site_description",
  "phone",
  "mobile",
  "email",
  "address",
  "instagram",
  "telegram",
  "whatsapp",
] as const;

export async function GET() {
  const rows = await db.siteSetting.findMany({
    where: { key: { in: [...PUBLIC_SETTING_KEYS] } },
    select: { key: true, value: true },
  });

  const settings = Object.fromEntries(rows.map((row) => [row.key, row.value]));
  return NextResponse.json(settings, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
  });
}
