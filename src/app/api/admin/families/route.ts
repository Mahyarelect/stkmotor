import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { normalizeProductImageUrl } from "@/lib/product-image";

// GET /api/admin/families — list all families
export async function GET() {
  try {
    await requireAdmin();

    const families = await db.productFamily.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        _count: { select: { variants: true } },
      },
    });

    return NextResponse.json(families);
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST /api/admin/families — create family
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { slug, name, nameEn, category, phase, shellType, description, imageUrl, sortOrder } = body;

    if (!slug || !name || !category) {
      return NextResponse.json(
        { error: "slug, name و category الزامی هستند" },
        { status: 400 }
      );
    }

    const family = await db.productFamily.create({
      data: {
        slug,
        name,
        nameEn: nameEn || "",
        category,
        phase: phase || "",
        shellType: shellType || "چدنی",
        description: description || "",
        imageUrl: normalizeProductImageUrl(imageUrl) || "",
        sortOrder: sortOrder || 0,
      },
    });

    return NextResponse.json(family, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (err instanceof Error && err.message.includes("Unique")) {
      return NextResponse.json(
        { error: "این slug قبلاً ثبت شده است" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "خطا در ایجاد محصول" }, { status: 500 });
  }
}
