import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// GET /api/admin/categories/[id] — get single category
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const category = await db.category.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        families: {
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            slug: true,
            name: true,
            nameEn: true,
            imageUrl: true,
            sortOrder: true,
            _count: { select: { variants: true } },
          },
        },
        _count: { select: { families: true } },
      },
    });

    if (!category) {
      return NextResponse.json({ error: "دسته‌بندی یافت نشد" }, { status: 404 });
    }

    return NextResponse.json(category);
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PUT /api/admin/categories/[id] — update category
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const body = await request.json();
    const { slug, name, nameEn, description, icon, sortOrder, filterConfig } = body;

    const existing = await db.category.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "دسته‌بندی یافت نشد" }, { status: 404 });
    }

    const cleanSlug = slug ? slug.trim().toLowerCase().replace(/[^a-z0-9-_]/g, "-") : existing.slug;

    const updated = await db.category.update({
      where: { id },
      data: {
        slug: cleanSlug,
        name: name !== undefined ? name.trim() : existing.name,
        nameEn: nameEn !== undefined ? nameEn.trim() : existing.nameEn,
        description: description !== undefined ? description.trim() : existing.description,
        icon: icon !== undefined ? icon.trim() : existing.icon,
        sortOrder: sortOrder !== undefined ? Number(sortOrder) : existing.sortOrder,
        filterConfig:
          filterConfig !== undefined
            ? typeof filterConfig === "string"
              ? filterConfig
              : JSON.stringify(filterConfig)
            : existing.filterConfig,
      },
      include: {
        _count: { select: { families: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (err instanceof Error && (err.message.includes("Unique") || err.message.includes("constraint"))) {
      return NextResponse.json(
        { error: "این شناسه انگلیسی (slug) برای دسته دیگری استفاده شده است" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "خطا در به‌روزرسانی دسته‌بندی" }, { status: 500 });
  }
}

// DELETE /api/admin/categories/[id] — delete category
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const category = await db.category.findUnique({
      where: { id },
      include: {
        _count: { select: { families: true } },
      },
    });

    if (!category) {
      return NextResponse.json({ error: "دسته‌بندی یافت نشد" }, { status: 404 });
    }

    // Disconnect any associated families first
    await db.productFamily.updateMany({
      where: { categoryId: id },
      data: { categoryId: null },
    });

    await db.category.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "دسته‌بندی با موفقیت حذف شد" });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "خطا در حذف دسته‌بندی" }, { status: 500 });
  }
}
