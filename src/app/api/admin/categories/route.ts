import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { CATALOG_CATEGORIES } from "@/data/catalogCategories";
import { DEFAULT_CATEGORY_IMAGES, getCategoryDefaultImage } from "@/data/categoryImages";

interface CategoryRecord {
  id: string;
  slug: string;
  name: string;
  nameEn: string;
  description: string;
  icon: string;
  imageUrl?: string;
  sortOrder: number;
  filterConfig: string;
}

// GET /api/admin/categories
export async function GET() {
  try {
    await requireAdmin();

    const rawCategories = await db.category.findMany({
      orderBy: { sortOrder: "asc" },
    });
    const categories = rawCategories as unknown as CategoryRecord[];

    // Subcategory image settings stored in siteSetting if any
    const subCatSetting = await db.siteSetting.findUnique({
      where: { key: "category_sub_images" },
    });
    let subCatImages: Record<string, string> = {};
    if (subCatSetting?.value) {
      try {
        subCatImages = JSON.parse(subCatSetting.value);
      } catch {
        subCatImages = {};
      }
    }

    const result = categories.map((cat) => {
      const catalogEntry = CATALOG_CATEGORIES.find((c) => c.slug === cat.slug);
      const subCategories = (catalogEntry?.subCategories || []).map((sub) => ({
        ...sub,
        imageUrl: subCatImages[sub.slug] || DEFAULT_CATEGORY_IMAGES[sub.slug] || "",
      }));

      const catImg = cat.imageUrl || "";

      return {
        id: cat.id,
        slug: cat.slug,
        name: cat.name,
        nameEn: cat.nameEn,
        description: cat.description,
        icon: cat.icon,
        imageUrl: catImg || getCategoryDefaultImage(cat.slug),
        rawImageUrl: catImg,
        sortOrder: cat.sortOrder,
        filterConfig: cat.filterConfig,
        subCategories,
      };
    });

    return NextResponse.json({ categories: result, subCatImages });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Admin categories GET error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PUT /api/admin/categories
export async function PUT(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { categories, subCatImages } = body;

    if (Array.isArray(categories)) {
      for (const item of categories) {
        if (!item.slug) continue;
        await db.category.updateMany({
          where: { slug: item.slug },
          data: {
            imageUrl: item.imageUrl ?? "",
            ...(item.description !== undefined ? { description: item.description } : {}),
            ...(item.filterConfig !== undefined ? { filterConfig: item.filterConfig } : {}),
          } as Record<string, unknown>,
        });
      }
    }

    if (subCatImages && typeof subCatImages === "object") {
      await db.siteSetting.upsert({
        where: { key: "category_sub_images" },
        update: { value: JSON.stringify(subCatImages) },
        create: {
          key: "category_sub_images",
          value: JSON.stringify(subCatImages),
          label: "تصاویر زیردسته‌بندی‌ها",
          group: "general",
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Admin categories PUT error:", err);
    return NextResponse.json({ error: "خطا در ذخیره اطلاعات دسته‌بندی‌ها" }, { status: 500 });
  }
}
