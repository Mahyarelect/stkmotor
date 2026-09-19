import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ slug: string }> }
) {
  try {
    const rawSlug = (await props.params).slug || "";
    let decoded = rawSlug;
    try {
      decoded = decodeURIComponent(rawSlug);
    } catch {
      decoded = rawSlug;
    }
    const clean = decoded.trim();
    const lower = clean.toLowerCase();
    const rawLower = rawSlug.trim().toLowerCase();

    const session = await getSession();
    const isAdmin = session?.role === "admin";

    const landingPage = await db.landingPage.findFirst({
      where: {
        OR: [
          { slug: clean },
          { slug: rawSlug },
          { slug: lower },
          { slug: rawLower },
          { slug: { equals: clean, mode: "insensitive" } },
        ],
      },
    });

    if (!landingPage || (!landingPage.isActive && !isAdmin)) {
      return NextResponse.json(
        { error: "صفحه فرود مورد نظر یافت نشد یا غیرفعال است." },
        { status: 404 }
      );
    }

    let familySlugs: string[] = [];
    try {
      familySlugs = JSON.parse(landingPage.featuredFamilySlugs || "[]");
    } catch {
      familySlugs = [];
    }

    let families: any[] = [];
    if (familySlugs.length > 0) {
      const familyRecords = await db.productFamily.findMany({
        where: {
          slug: { in: familySlugs },
        },
        include: {
          variants: {
            select: {
              id: true,
              sku: true,
              name: true,
              price: true,
              inStock: true,
              power: true,
              speed: true,
              size: true,
            },
            orderBy: [{ inStock: "desc" }, { price: "asc" }],
          },
        },
      });

      // Preserve the order of familySlugs chosen by admin
      families = familySlugs
        .map((slug) => familyRecords.find((f) => f.slug === slug))
        .filter(Boolean)
        .map((f) => {
          const prices = f!.variants.map((v) => Number(v.price)).filter((p) => p > 0);
          const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
          const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
          const hasInStock = f!.variants.some((v) => v.inStock);

          return {
            id: f!.id,
            slug: f!.slug,
            name: f!.name,
            nameEn: f!.nameEn,
            mainCategory: f!.mainCategory,
            category: f!.category,
            brand: f!.brand,
            description: f!.description,
            imageUrl: f!.imageUrl,
            variantCount: f!.variants.length,
            minPrice,
            maxPrice,
            inStock: hasInStock,
          };
        });
    }

    return NextResponse.json(
      {
        landingPage,
        featuredFamilies: families,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/landing/[slug] error:", error);
    return NextResponse.json(
      { error: "خطا در دریافت اطلاعات صفحه فرود" },
      { status: 500 }
    );
  }
}
