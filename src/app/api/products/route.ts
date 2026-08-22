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
  const category = (searchParams.get("category") || "").trim().toLowerCase();
  const phase = (searchParams.get("phase") || "").trim().toLowerCase();
  const shellType = (searchParams.get("shellType") || "").trim().toLowerCase();
  const subCategory = (searchParams.get("subCategory") || "").trim().toLowerCase();
  const level1 = (searchParams.get("level1") || "").trim();
  const level2 = (searchParams.get("level2") || "").trim();
  const speed = searchParams.get("speed") || "";
  const powerRange = searchParams.get("powerRange") || "";
  const search = (searchParams.get("search") || "").trim();
  const page = positiveInt(searchParams.get("page"), 1);
  const requestedLimit = positiveInt(searchParams.get("limit"), DEFAULT_PAGE_SIZE);
  const limit = Math.min(requestedLimit, MAX_PAGE_SIZE);

  const and: Prisma.ProductFamilyWhereInput[] = [];
  const variantFilters: Prisma.ProductVariantWhereInput[] = [];
  const subCategoryAliases: Record<string, string> = {
    "motor-flange": "flange",
    "rear-bracket": "bracket",
  };
  const normalizedSubCategory = subCategoryAliases[subCategory] || subCategory;

  if (normalizedSubCategory) {
    and.push({ OR: [{ category: normalizedSubCategory }, { subCategory: normalizedSubCategory }] });
  }

  if (level1) {
    if (category === "gearbox") variantFilters.push({ gearboxType: level1 });
    else if (category === "pump") variantFilters.push({ pumpType: level1 });
    else if (category === "accessories") variantFilters.push({ flangeType: level1 });
    else and.push({ OR: [{ level1Value: level1 }, { category: level1 }, { phase: level1 }] });
  }

  if (level2) {
    if (category === "gearbox") variantFilters.push({ inputType: level2 });
    else if (category === "accessories") variantFilters.push({ brand: level2 });
    else if (category === "electromotor") {
      if (level2.includes("چدن")) and.push({ OR: [{ shellType: { contains: "چدن" } }, { name: { contains: "چدن" } }] });
      else if (level2.includes("آلومینیوم") || level2.includes("الومینیوم")) {
        and.push({ OR: [{ shellType: { contains: "لومینیوم" } }, { name: { contains: "لومینیوم" } }] });
      }
    } else and.push({ OR: [{ level2Value: level2 }, { shellType: level2 }, { brand: level2 }] });
  }

  // Category & Phase filters
  if (category && category !== "all") {
    if (category === "single-phase" || category === "single") {
      and.push({
        OR: [
          { category: "single-phase" },
          { phase: { contains: "تک" } },
          { phase: "single-phase" },
        ],
      });
    } else if (category === "three-phase" || category === "three") {
      and.push({
        OR: [
          { category: "three-phase" },
          { phase: { contains: "سه" } },
          { phase: "three-phase" },
        ],
      });
    } else {
      and.push({
        OR: [
          { mainCategory: category },
          { category: category },
          { categoryRef: { slug: category } },
        ],
      });
    }
  }

  // Phase filter (explicit param)
  if (phase && phase !== "all" && phase !== category) {
    if (phase === "single" || phase === "single-phase" || phase.includes("تک")) {
      and.push({
        OR: [
          { category: "single-phase" },
          { phase: { contains: "تک" } },
          { phase: "single-phase" },
        ],
      });
    } else if (phase === "three" || phase === "three-phase" || phase.includes("سه")) {
      and.push({
        OR: [
          { category: "three-phase" },
          { phase: { contains: "سه" } },
          { phase: "three-phase" },
        ],
      });
    }
  }

  // Shell type filter (cast-iron vs aluminum)
  if (shellType && shellType !== "all") {
    if (shellType === "cast-iron" || shellType === "castiron" || shellType.includes("چدن")) {
      and.push({
        OR: [
          { shellType: "چدنی" },
          { shellType: "cast-iron" },
          { name: { contains: "چدنی" } },
        ],
      });
    } else if (shellType === "aluminum" || shellType === "aluminium" || shellType.includes("آلومینیوم") || shellType.includes("الومینیوم")) {
      and.push({
        OR: [
          { shellType: "آلومینیومی" },
          { shellType: "الومینیومی" },
          { shellType: "aluminum" },
          { name: { contains: "آلومینیوم" } },
        ],
      });
    }
  }

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
        mainCategory: true,
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
            mountingType: true,
            price: true,
            inStock: true,
            sortOrder: true,
            sku: true,
            gearboxType: true,
            modelType: true,
            ratio: true,
            inputFrame: true,
            pumpType: true,
            outletSize: true,
            headMeter: true,
            floater: true,
            brand: true,
            bodyMaterial: true,
            flangeType: true,
            flangeLength: true,
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
      mainCategory: family.mainCategory,
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
