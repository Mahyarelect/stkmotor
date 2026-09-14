import { NextRequest, NextResponse } from "next/server";
import { getSearchSuggestions } from "@/lib/search/search-service";
import { parseSearchQuery } from "@/lib/search/query-parser";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") || "";
  if (!q.trim()) {
    return NextResponse.json({
      query: "",
      items: [],
      categoryMatch: null,
    });
  }

  const parsed = parseSearchQuery(q);
  const items = await getSearchSuggestions(q, 6);

  let categoryMatch: { title: string; href: string } | null = null;
  if (parsed.category) {
    const categoryLabels: Record<string, { title: string; href: string }> = {
      electromotor: { title: "دسته‌بندی الکتروموتورها", href: "/electromotors" },
      gearbox: { title: "دسته‌بندی انواع گیربکس", href: "/category/gearbox" },
      pump: { title: "دسته‌بندی انواع پمپ", href: "/category/pump" },
      accessories: { title: "دسته‌بندی لوازم جانبی", href: "/category/accessories" },
    };
    categoryMatch = categoryLabels[parsed.category] || null;
  }

  return NextResponse.json(
    {
      query: q,
      items,
      categoryMatch,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
      },
    }
  );
}
