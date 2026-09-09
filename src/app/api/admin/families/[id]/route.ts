import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { normalizeProductImageUrl } from "@/lib/product-image";

// GET /api/admin/families/[id] — single family with variants & category info
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const family = await db.productFamily.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        categoryRef: true,
        variants: {
          orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
        },
      },
    });

    if (!family) {
      return NextResponse.json({ error: "خانواده محصول یافت نشد" }, { status: 404 });
    }

    // Serialize BigInt for variants
    const serialized = {
      ...family,
      variants: family.variants.map((v) => ({
        ...v,
        price: Number(v.price),
      })),
    };

    return NextResponse.json(serialized);
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Admin family GET error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PUT /api/admin/families/[id] — update family
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();

    const existing = await db.productFamily.findFirst({
      where: { OR: [{ id }, { slug: id }] },
    });

    if (!existing) {
      return NextResponse.json({ error: "محصول یافت نشد" }, { status: 404 });
    }

    const cleanSlug = body.slug
      ? body.slug.trim().toLowerCase().replace(/[^a-z0-9-_]/g, "-")
      : existing.slug;

    const updated = await db.productFamily.update({
      where: { id: existing.id },
      data: {
        ...(body.slug !== undefined && { slug: cleanSlug }),
        ...(body.name !== undefined && { name: body.name.trim() }),
        ...(body.nameEn !== undefined && { nameEn: (body.nameEn || "").trim() }),
        ...(body.mainCategory !== undefined && { mainCategory: body.mainCategory.trim() }),
        ...(body.category !== undefined && { category: body.category.trim() }),
        ...(body.subCategory !== undefined && { subCategory: (body.subCategory || "").trim() }),
        ...(body.phase !== undefined && { phase: (body.phase || "").trim() }),
        ...(body.shellType !== undefined && { shellType: (body.shellType || "").trim() }),
        ...(body.brand !== undefined && { brand: (body.brand || "").trim() }),
        ...(body.level1Value !== undefined && { level1Value: (body.level1Value || "").trim() }),
        ...(body.level2Value !== undefined && { level2Value: (body.level2Value || "").trim() }),
        ...(body.description !== undefined && { description: (body.description || "").trim() }),
        ...(body.imageUrl !== undefined && {
          imageUrl: normalizeProductImageUrl(body.imageUrl) || "",
        }),
        ...(body.specifications !== undefined && {
          specifications:
            typeof body.specifications === "string"
              ? body.specifications
            : JSON.stringify(body.specifications || {}),
        }),
        ...(body.sortOrder !== undefined && { sortOrder: Number(body.sortOrder) }),
        ...(body.categoryId !== undefined && { categoryId: body.categoryId || null }),
      },
      include: {
        categoryRef: true,
      },
    });

    return NextResponse.json(updated);
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (err instanceof Error && (err.message.includes("Unique") || err.message.includes("constraint"))) {
      return NextResponse.json(
        { error: "این شناسه انگلیسی (slug) قبلاً ثبت شده است" },
        { status: 409 }
      );
    }
    console.error("Admin family PUT error:", err);
    return NextResponse.json({ error: "خطا در بروزرسانی محصول" }, { status: 500 });
  }
}

// DELETE /api/admin/families/[id] — delete family and cascade delete its variants
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const existing = await db.productFamily.findFirst({
      where: { OR: [{ id }, { slug: id }] },
    });

    if (!existing) {
      return NextResponse.json({ error: "محصول یافت نشد" }, { status: 404 });
    }

    await db.productFamily.delete({ where: { id: existing.id } });

    return NextResponse.json({ success: true, message: "خانواده محصول و واریانت‌ها با موفقیت حذف شدند" });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Admin family DELETE error:", err);
    return NextResponse.json({ error: "خطا در حذف محصول" }, { status: 500 });
  }
}
