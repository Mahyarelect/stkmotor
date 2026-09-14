import { NextRequest, NextResponse } from "next/server";
import { executeSearch } from "@/lib/search/search-service";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get("q") || searchParams.get("query") || "";
  const category = searchParams.get("category") || "all";
  const phase = searchParams.get("phase") || "all";
  const speed = searchParams.get("speed") || "all";
  const inStock = searchParams.get("inStock") === "true" || searchParams.get("inStock") === "1";
  const sortBy = (searchParams.get("sortBy") || "relevance") as "relevance" | "price_asc" | "price_desc";
  const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10) || 1);
  const limit = Math.min(48, Math.max(1, Number.parseInt(searchParams.get("limit") || "18", 10) || 18));

  const result = await executeSearch({
    query: q,
    category,
    phase,
    speed,
    inStockOnly: inStock,
    sortBy,
    page,
    limit,
  });

  return NextResponse.json(result, {
    headers: {
      "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
    },
  });
}
