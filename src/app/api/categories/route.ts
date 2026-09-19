import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCategoryDefaultImage } from "@/data/categoryImages";

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
  _count?: { families: number };
}

export async function GET() {
  try {
    const rawCategories = await db.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        _count: {
          select: { families: true },
        },
      },
    });

    const categories = rawCategories as unknown as CategoryRecord[];

    const enriched = categories.map((cat) => {
      const img = cat.imageUrl || getCategoryDefaultImage(cat.slug);
      return {
        id: cat.id,
        slug: cat.slug,
        name: cat.name,
        nameEn: cat.nameEn,
        description: cat.description,
        icon: cat.icon,
        imageUrl: img,
        hasCustomImage: Boolean(cat.imageUrl),
        sortOrder: cat.sortOrder,
        filterConfig: cat.filterConfig,
        _count: cat._count,
      };
    });

    return NextResponse.json({ categories: enriched });
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return NextResponse.json({ error: "خطا در دریافت دسته‌بندی‌ها" }, { status: 500 });
  }
}
