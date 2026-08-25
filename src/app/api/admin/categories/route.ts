import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// GET /api/admin/categories — list all categories with family counts
export async function GET() {
  try {
    await requireAdmin();

    const categories = await db.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        _count: { select: { families: true } },
      },
    });

    return NextResponse.json(categories);
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST /api/admin/categories — create a new category
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { slug, name, nameEn, description, icon, sortOrder, filterConfig } = body;

    if (!slug || !name) {
      return NextResponse.json(
        { error: "نام دسته (name) و شناسه انگلیسی (slug) الزامی هستند" },
        { status: 400 }
      );
    }

    const cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9-_]/g, "-");

    const category = await db.category.create({
      data: {
        slug: cleanSlug,
        name: name.trim(),
        nameEn: (nameEn || "").trim(),
        description: (description || "").trim(),
        icon: (icon || "Package").trim(),
        sortOrder: Number(sortOrder) || 0,
        filterConfig: typeof filterConfig === "string" ? filterConfig : JSON.stringify(filterConfig || {}),
      },
      include: {
        _count: { select: { families: true } },
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (err instanceof Error && (err.message.includes("Unique") || err.message.includes("constraint"))) {
      return NextResponse.json(
        { error: "این شناسه انگلیسی (slug) قبلاً برای دسته دیگری ثبت شده است" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "خطا در ایجاد دسته‌بندی" }, { status: 500 });
  }
}
