import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { normalizeProductImageUrl } from "@/lib/product-image";

// GET /api/admin/families — list families with category & search filter
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const category = (searchParams.get("category") || "").trim().toLowerCase();
    const search = (searchParams.get("search") || "").trim();

    const where: Prisma.ProductFamilyWhereInput = {};

    if (category && category !== "all") {
      where.OR = [
        { mainCategory: category },
        { category: category },
        { categoryRef: { slug: category } },
      ];
    }

    if (search) {
      where.AND = [
        {
          OR: [
            { name: { contains: search } },
            { nameEn: { contains: search } },
            { slug: { contains: search } },
            { brand: { contains: search } },
            { description: { contains: search } },
            { variants: { some: { sku: { contains: search } } } },
          ],
        },
      ];
    }

    const families = await db.productFamily.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
      include: {
        categoryRef: {
          select: { id: true, slug: true, name: true, icon: true },
        },
        _count: { select: { variants: true } },
      },
    });

    return NextResponse.json(families);
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Admin families GET error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST /api/admin/families — create product family
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const {
      slug,
      name,
      nameEn,
      mainCategory,
      category,
      subCategory,
      phase,
      shellType,
      brand,
      level1Value,
      level2Value,
      description,
      imageUrl,
      specifications,
      sortOrder,
      categoryId,
    } = body;

    if (!slug || !name) {
      return NextResponse.json(
        { error: "نام محصول (name) و شناسه یکتا (slug) الزامی هستند" },
        { status: 400 }
      );
    }

    const cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9-_]/g, "-");
    const primaryCategory = (mainCategory || category || "electromotor").trim().toLowerCase();

    // Try linking categoryId if not explicitly provided
    let resolvedCategoryId = categoryId || null;
    if (!resolvedCategoryId) {
      const catRecord = await db.category.findUnique({ where: { slug: primaryCategory } });
      if (catRecord) {
        resolvedCategoryId = catRecord.id;
      }
    }

    const family = await db.productFamily.create({
      data: {
        slug: cleanSlug,
        name: name.trim(),
        nameEn: (nameEn || "").trim(),
        mainCategory: primaryCategory,
        category: (category || primaryCategory).trim(),
        subCategory: (subCategory || "").trim(),
        phase: (phase || "").trim(),
        shellType: (shellType || "").trim(),
        brand: (brand || "STK").trim(),
        level1Value: (level1Value || "").trim(),
        level2Value: (level2Value || "").trim(),
        description: (description || "").trim(),
        imageUrl: normalizeProductImageUrl(imageUrl) || "",
        specifications:
          typeof specifications === "string"
            ? specifications
            : JSON.stringify(specifications || {}),
        sortOrder: Number(sortOrder) || 0,
        categoryId: resolvedCategoryId,
      },
      include: {
        categoryRef: true,
        _count: { select: { variants: true } },
      },
    });

    return NextResponse.json(family, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (err instanceof Error && (err.message.includes("Unique") || err.message.includes("constraint"))) {
      return NextResponse.json(
        { error: "این شناسه انگلیسی (slug) قبلاً برای محصول دیگری ثبت شده است" },
        { status: 409 }
      );
    }
    console.error("Admin families POST error:", err);
    return NextResponse.json({ error: "خطا در ایجاد محصول" }, { status: 500 });
  }
}
