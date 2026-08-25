import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/categories — public list of categories with product family counts
export async function GET() {
  try {
    const categories = await db.category.findMany({
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        slug: true,
        name: true,
        nameEn: true,
        description: true,
        icon: true,
        sortOrder: true,
        filterConfig: true,
        _count: { select: { families: true } },
      },
    });

    return NextResponse.json(categories, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
    });
  } catch (err) {
    console.error("Failed to load categories:", err);
    return NextResponse.json({ error: "Failed to load categories" }, { status: 500 });
  }
}
