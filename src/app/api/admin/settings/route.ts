import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// GET /api/admin/settings — all settings
export async function GET() {
  try {
    await requireAdmin();
    const settings = await db.siteSetting.findMany({ orderBy: { group: "asc" } });
    return NextResponse.json(settings);
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PUT /api/admin/settings — upsert settings (batch)
export async function PUT(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const settings: Array<{ key: string; value: string; label?: string; group?: string }> = body;

    for (const s of settings) {
      await db.siteSetting.upsert({
        where: { key: s.key },
        update: { value: s.value },
        create: {
          key: s.key,
          value: s.value,
          label: s.label || s.key,
          group: s.group || "general",
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "خطا در ذخیره تنظیمات" }, { status: 500 });
  }
}
