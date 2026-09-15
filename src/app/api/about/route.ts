import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    let about = await db.aboutPage.findFirst();
    if (!about) {
      about = await db.aboutPage.create({
        data: {},
      });
    }

    return NextResponse.json(about, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("GET /api/about error:", error);
    return NextResponse.json(
      { error: "خطا در دریافت اطلاعات صفحه درباره ما" },
      { status: 500 }
    );
  }
}
