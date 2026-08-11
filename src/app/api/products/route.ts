import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

const DEFAULT_PAGE_SIZE = 18;
const MAX_PAGE_SIZE = 48;

function positiveInt(value: string | null, fallback: number) {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const category = searchParams.get("category") || "";
  const speed = searchParams.get("speed") || "";
  const powerRange = searchParams.get("powerRange") || "";
  const search = (searchParams.get("search") || "").trim();
  const page = positiveInt(searchParams.get("page"), 1);
  const requestedLimit = positiveInt(searchParams.get("limit"), DEFAULT_PAGE_SIZE);
  const limit = Math.min(requestedLimit, MAX_PAGE_SIZE);

  const and: Prisma.ProductFamilyWhereInput[] = [];
  if (category && category !== "all") and.push({ category });

  const variantFilters: Prisma.ProductVariantWhereInput[] = [];
  if (speed && speed !== "all") variantFilters.push({ speed });
  if (powerRange && powerRange !== "all") {
    const [min, max] = powerRange.split("-").map(Number);
    if (Number.isFinite(min) && Number.isFinite(max)) {
      variantFilters.push({ powerKw: { gte: min, lte: max } });
    }
  }
  if (variantFilters.length) and.push({ variants: { some: { AND: variantFilters } } });

  if (search) {
    and.push({
      OR: [
        { name: { contains: search } },
        { nameEn: { contains: search } },
        { description: { contains: search } },
        { variants: { some: { sku: { contains: search } } } },
      ],
    });
  }

  const where: Prisma.ProductFamilyWhereInput = and.length ? { AND: and } : {};
  const [families, total] = await Promise.all([
    db.productFamily.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      select: {
        id: true,
        slug: true,
        name: true,
        nameEn: true,
        category: true,
        phase: true,
        shellType: true,
        imageUrl: true,
        sortOrder: true,
        _count: { select: { variants: true } },
        variants: {
          ...(variantFilters.length ? { where: { AND: variantFilters } } : {}),
          orderBy: [{ inStock: "desc" }, { sortOrder: "asc" }],
          select: {
            id: true,
            size: true,
            power: true,
            powerKw: true,
            speed: true,
            voltage: true,
            price: true,
            inStock: true,
            sortOrder: true,
          },
        },
      },
    }),
    db.productFamily.count({ where }),
  ]);

  const products = families.map((family) => {
    const bySize = new Map<string, (typeof family.variants)[number]>();
    for (const variant of family.variants) {
      const key = variant.size || variant.id;
      if (!bySize.has(key)) bySize.set(key, variant);
    }
    return {
      id: family.id,
      slug: family.slug,
      name: family.name,
      nameEn: family.nameEn,
      category: family.category,
      phase: family.phase,
      shellType: family.shellType,
      imageUrl: family.imageUrl,
      sortOrder: family.sortOrder,
      variantCount: family._count.variants,
      variants: Array.from(bySize.values()).map((variant) => ({
        ...variant,
        price: Number(variant.price),
      })),
    };
  });

  return NextResponse.json(
    {
      products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
  );
}
