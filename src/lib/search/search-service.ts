import { db } from "../db.ts";
import { productImageForVariant } from "../product-media.ts";
import { normalizePersianText, getCompoundVariations } from "./persian-normalizer.ts";
import { parseSearchQuery, type ParsedSearchQuery } from "./query-parser.ts";
import { POPULAR_SEARCH_SUGGESTIONS } from "./taxonomy-dictionary.ts";

export interface SearchOptions {
  query: string;
  category?: string; // "all", "electromotor", "gearbox", "pump", "accessories"
  phase?: string; // "single-phase", "three-phase"
  speed?: string; // "1400", "3000", etc.
  inStockOnly?: boolean;
  sortBy?: "relevance" | "price_asc" | "price_desc";
  page?: number;
  limit?: number;
}

export interface SearchResultItem {
  id: string;
  sku: string;
  name: string;
  familySlug: string;
  familyName: string;
  mainCategory: string;
  categoryName: string;
  price: number;
  inStock: boolean;
  image: string;
  score: number;
  specs: {
    power?: string;
    speed?: string;
    gearboxType?: string;
    modelType?: string;
    size?: string;
    ratio?: string;
    pumpType?: string;
    outletSize?: string;
    headMeter?: number;
    floater?: string;
    flangeType?: string;
    phase?: string;
    shellType?: string;
  };
}

export interface SearchFacetItem {
  slug: string;
  name: string;
  count: number;
}

export interface SearchFacets {
  categories: SearchFacetItem[];
  speeds: { value: string; label: string; count: number }[];
  inStockCount: number;
  totalCount: number;
}

export interface SearchResponse {
  query: string;
  parsed: ParsedSearchQuery;
  items: SearchResultItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  facets: SearchFacets;
  didYouMean?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  electromotor: "الکتروموتور",
  gearbox: "گیربکس",
  pump: "پمپ",
  accessories: "لوازم جانبی",
};

/**
 * Escapes characters for SQL string literal safety.
 */
function escapeSqlString(str: string): string {
  if (!str) return "";
  return str.replace(/'/g, "''").replace(/\\/g, "\\\\");
}

/**
 * Escapes SQL LIKE wildcards % and _
 */
function escapeLikeString(str: string): string {
  if (!str) return "";
  return escapeSqlString(str).replace(/[%_]/g, "\\$&");
}

export async function executeSearch(options: SearchOptions): Promise<SearchResponse> {
  const rawQuery = (options.query || "").trim();
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(60, Math.max(1, options.limit || 18));
  const offset = (page - 1) * limit;

  const parsed = parseSearchQuery(rawQuery);
  const normalizedQuery = parsed.normalizedQuery;

  // Handle queries that contain only punctuation or invalid characters
  if (rawQuery && !normalizedQuery) {
    return {
      query: rawQuery,
      parsed,
      items: [],
      total: 0,
      page: 1,
      limit,
      totalPages: 0,
      facets: {
        categories: [],
        speeds: [],
        inStockCount: 0,
        totalCount: 0,
      },
      didYouMean: computeDidYouMean(rawQuery),
    };
  }

  const escapedQuery = escapeLikeString(normalizedQuery);
  const safeSku = escapeSqlString(parsed.sku || "");
  const safeModelType = escapeSqlString(parsed.modelType || "");
  const safeGearboxSize = escapeSqlString(parsed.gearboxSize || "");
  const safeSpeed = escapeSqlString(options.speed && options.speed !== "all" ? options.speed : parsed.speed || "");
  const safePumpType = escapeSqlString(parsed.pumpType || "");
  const safeOutletSize = escapeSqlString(parsed.outletSize || "");

  // Determine active category filter
  const filterCategory =
    options.category && options.category !== "all"
      ? options.category
      : parsed.category || "";
  const safeFilterCategory = escapeSqlString(filterCategory);

  // WHERE conditions
  const whereClauses: string[] = ["1=1"];

  if (safeFilterCategory) {
    whereClauses.push(`f."mainCategory" = '${safeFilterCategory}'`);
  }

  if (options.inStockOnly) {
    whereClauses.push(`v."inStock" = true`);
  }

  if (parsed.sku) {
    whereClauses.push(`v.sku = '${safeSku}'`);
  } else {
    // Phase filter (from options or query)
    const activePhase = options.phase && options.phase !== "all" ? options.phase : parsed.phase || "";
    if (activePhase === "single" || activePhase === "single-phase") {
      whereClauses.push(`f.phase LIKE '%تک%'`);
    } else if (activePhase === "three" || activePhase === "three-phase") {
      whereClauses.push(`f.phase LIKE '%سه%'`);
    }

    // Speed filter (from options or query)
    if (safeSpeed) {
      whereClauses.push(`v.speed = '${safeSpeed}'`);
    }

    // Power filter
    if (parsed.power) {
      const safePower = escapeLikeString(parsed.power);
      whereClauses.push(`(v.power = '${safePower}' OR v.size = '${safePower}' OR v.name ILIKE '%${safePower}%')`);
    }

    // Gearbox model & size
    if (safeModelType && safeGearboxSize) {
      whereClauses.push(`(v."modelType" ILIKE '%${safeModelType}%' AND v.size = '${safeGearboxSize}')`);
    } else if (safeModelType) {
      whereClauses.push(`v."modelType" ILIKE '%${safeModelType}%'`);
    } else if (safeGearboxSize) {
      whereClauses.push(`v.size = '${safeGearboxSize}'`);
    }

    // Pump specs
    if (safePumpType) {
      whereClauses.push(`(v."pumpType" LIKE '%${safePumpType}%' OR v.name LIKE '%${safePumpType}%')`);
    }
    if (safeOutletSize) {
      whereClauses.push(`v."outletSize" = '${safeOutletSize}'`);
    }
    if (parsed.headMeter && parsed.headMeter > 0) {
      whereClauses.push(`v."headMeter" = ${parsed.headMeter}`);
    }
    if (parsed.floater) {
      whereClauses.push(`v.floater = '${escapeSqlString(parsed.floater)}'`);
    }

    // Residual tokens (e.g. brand "موتوژن", "استریم", specific keywords)
    if (!parsed.isCategoryOnly && parsed.residualTokens.length > 0) {
      for (const tok of parsed.residualTokens) {
        const esc = escapeLikeString(tok);
        whereClauses.push(`(v.name ILIKE '%${esc}%' OR v.brand ILIKE '%${esc}%' OR f.name ILIKE '%${esc}%')`);
      }
    } else if (!parsed.isCategoryOnly && !safeModelType && !safePumpType && !safeSpeed && !parsed.phase && !parsed.power && normalizedQuery) {
      // General free-text query with no structured specs extracted
      const variations = getCompoundVariations(normalizedQuery);
      const likeClauses = variations.map((v) => {
        const esc = escapeLikeString(v);
        return `v.name ILIKE '%${esc}%' OR f.name ILIKE '%${esc}%'`;
      });
      whereClauses.push(`(${likeClauses.join(" OR ")} OR similarity(v.name, '${escapedQuery}') > 0.15 OR similarity(f.name, '${escapedQuery}') > 0.15)`);
    }
  }

  const whereSql = whereClauses.join(" AND ");

  // Residual token score bonus
  const tokenScores = parsed.residualTokens.map((tok) => {
    const esc = escapeLikeString(tok);
    return `CASE WHEN (v.name ILIKE '%${esc}%' OR v.brand ILIKE '%${esc}%' OR f.name ILIKE '%${esc}%') THEN 300 ELSE 0 END`;
  });
  const tokenScoreSql = tokenScores.length > 0 ? tokenScores.join(" + ") : "0";

  // Prioritized scoring formula
  const scoreSql = `
    (
      -- Exact SKU match (+1000)
      CASE WHEN v.sku = '${safeSku}' THEN 1000 ELSE 0 END +
      
      -- Exact modelType and size match (+400)
      CASE 
        WHEN '${safeModelType}' <> '' AND '${safeGearboxSize}' <> '' 
             AND v."modelType" ILIKE '%${safeModelType}%' AND v.size = '${safeGearboxSize}' THEN 400
        WHEN '${safeModelType}' <> '' AND v."modelType" ILIKE '%${safeModelType}%' THEN 250
        WHEN '${safeGearboxSize}' <> '' AND v.size = '${safeGearboxSize}' THEN 150
        ELSE 0 
      END +

      -- Token / Brand match (+300 each)
      ${tokenScoreSql} +

      -- Speed match (+200)
      CASE WHEN '${safeSpeed}' <> '' AND v.speed = '${safeSpeed}' THEN 200 ELSE 0 END +

      -- Power match (+200)
      CASE WHEN '${escapeSqlString(parsed.power || "")}' <> '' AND (v.power = '${escapeSqlString(parsed.power || "")}' OR v.size = '${escapeSqlString(parsed.power || "")}') THEN 200 ELSE 0 END +

      -- Pump type match (+300)
      CASE WHEN '${safePumpType}' <> '' AND (v."pumpType" LIKE '%${safePumpType}%' OR v.name LIKE '%${safePumpType}%') THEN 300 ELSE 0 END +

      -- Pump outlet size match (+150)
      CASE WHEN '${safeOutletSize}' <> '' AND v."outletSize" = '${safeOutletSize}' THEN 150 ELSE 0 END +

      -- Phase match (+200)
      CASE 
        WHEN '${parsed.phase || ""}' = 'single-phase' AND f.phase LIKE '%تک%' THEN 200
        WHEN '${parsed.phase || ""}' = 'three-phase' AND f.phase LIKE '%سه%' THEN 200
        ELSE 0 
      END +

      -- Category match (+100)
      CASE WHEN '${safeFilterCategory}' <> '' AND f."mainCategory" = '${safeFilterCategory}' THEN 100 ELSE 0 END +

      -- Substring match in variant name (+150)
      CASE WHEN '${escapedQuery}' <> '' AND v.name ILIKE '%${escapedQuery}%' THEN 150 ELSE 0 END +

      -- Trigram similarity (+0 to 100)
      CASE WHEN '${escapedQuery}' <> '' AND '${safeSku}' = '' THEN
        COALESCE(similarity(v.name, '${escapedQuery}'), 0) * 100 +
        COALESCE(similarity(f.name, '${escapedQuery}'), 0) * 50
      ELSE 0 END +

      -- In stock boost (+50)
      CASE WHEN v."inStock" = true THEN 50 ELSE 0 END
    )
  `;

  // Sort clause
  let orderSql = `ORDER BY score DESC, v."inStock" DESC, v."sortOrder" ASC, v.id ASC`;
  if (options.sortBy === "price_asc") {
    orderSql = `ORDER BY v.price ASC, score DESC`;
  } else if (options.sortBy === "price_desc") {
    orderSql = `ORDER BY v.price DESC, score DESC`;
  }

  // Execute items query & total count
  const querySql = `
    SELECT 
      v.id,
      v.sku,
      v.name,
      v.size,
      v.power,
      v."powerKw",
      v.speed,
      v."gearboxType",
      v."modelType",
      v.ratio,
      v."pumpType",
      v."outletSize",
      v."headMeter",
      v.floater,
      v."flangeType",
      v.price,
      v."inStock",
      v."sortOrder",
      f.slug AS "familySlug",
      f.name AS "familyName",
      f."mainCategory",
      f.phase AS "familyPhase",
      f."shellType" AS "familyShellType",
      f."imageUrl" AS "familyImageUrl",
      ${scoreSql} AS score
    FROM "ProductVariant" v
    JOIN "ProductFamily" f ON v."familyId" = f.id
    WHERE ${whereSql}
    ${orderSql}
    LIMIT ${limit} OFFSET ${offset};
  `;

  const countSql = `
    SELECT COUNT(*)::int AS count
    FROM "ProductVariant" v
    JOIN "ProductFamily" f ON v."familyId" = f.id
    WHERE ${whereSql};
  `;

  // Facet query across the filtered set
  const facetsSql = `
    SELECT 
      f."mainCategory",
      v.speed,
      v."inStock",
      COUNT(*)::int AS count
    FROM "ProductVariant" v
    JOIN "ProductFamily" f ON v."familyId" = f.id
    WHERE ${normalizedQuery ? whereSql : "1=1"}
    GROUP BY f."mainCategory", v.speed, v."inStock";
  `;

  try {
    const [rawItems, countResult, rawFacets] = await Promise.all([
      db.$queryRawUnsafe<any[]>(querySql),
      db.$queryRawUnsafe<{ count: number }[]>(countSql),
      db.$queryRawUnsafe<any[]>(facetsSql),
    ]);

    const total = countResult[0]?.count || 0;

    const items: SearchResultItem[] = rawItems.map((row) => ({
      id: row.id,
      sku: row.sku,
      name: row.name || row.familyName,
      familySlug: row.familySlug,
      familyName: row.familyName,
      mainCategory: row.mainCategory,
      categoryName: CATEGORY_LABELS[row.mainCategory] || row.mainCategory,
      price: Number(row.price),
      inStock: Boolean(row.inStock),
      image: productImageForVariant(row.sku, row.mainCategory, row.familyImageUrl, row.familyPhase),
      score: Math.round(Number(row.score) * 10) / 10,
      specs: {
        power: row.power || undefined,
        speed: row.speed || undefined,
        gearboxType: row.gearboxType || undefined,
        modelType: row.modelType || undefined,
        size: row.size || undefined,
        ratio: row.ratio || undefined,
        pumpType: row.pumpType || undefined,
        outletSize: row.outletSize || undefined,
        headMeter: row.headMeter ? Number(row.headMeter) : undefined,
        floater: row.floater || undefined,
        flangeType: row.flangeType || undefined,
        phase: row.familyPhase || undefined,
        shellType: row.familyShellType || undefined,
      },
    }));

    // Aggregate facets
    const categoryCounts: Record<string, number> = {
      electromotor: 0,
      gearbox: 0,
      pump: 0,
      accessories: 0,
    };
    const speedCounts: Record<string, number> = {
      "3000": 0,
      "1400": 0,
      "1000": 0,
      "750": 0,
    };
    let inStockTotal = 0;
    let grandTotal = 0;

    for (const f of rawFacets) {
      const c = Number(f.count) || 0;
      grandTotal += c;
      if (f.mainCategory && categoryCounts[f.mainCategory] !== undefined) {
        categoryCounts[f.mainCategory] += c;
      }
      if (f.speed && speedCounts[f.speed] !== undefined) {
        speedCounts[f.speed] += c;
      }
      if (f.inStock) {
        inStockTotal += c;
      }
    }

    const facets: SearchFacets = {
      categories: Object.entries(categoryCounts).map(([slug, count]) => ({
        slug,
        name: CATEGORY_LABELS[slug] || slug,
        count,
      })),
      speeds: [
        { value: "3000", label: "۳۰۰۰ دور (۲ پل)", count: speedCounts["3000"] || 0 },
        { value: "1400", label: "۱۴۰۰ دور (۴ پل)", count: speedCounts["1400"] || 0 },
        { value: "1000", label: "۱۰۰۰ دور (۶ پل)", count: speedCounts["1000"] || 0 },
        { value: "750", label: "۷۵۰ دور (۸ پل)", count: speedCounts["750"] || 0 },
      ],
      inStockCount: inStockTotal,
      totalCount: grandTotal,
    };

    // Calculate Did-You-Mean if empty results
    let didYouMean: string | undefined;
    if (total === 0 && rawQuery) {
      didYouMean = computeDidYouMean(rawQuery);
    }

    // Fire-and-forget log search
    if (rawQuery.length >= 2) {
      logSearchQuery(rawQuery, total, filterCategory).catch(() => {});
    }

    return {
      query: rawQuery,
      parsed,
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      facets,
      didYouMean,
    };
  } catch (error) {
    console.error("[search-service] Search error:", error);
    return {
      query: rawQuery,
      parsed,
      items: [],
      total: 0,
      page: 1,
      limit,
      totalPages: 0,
      facets: {
        categories: [],
        speeds: [],
        inStockCount: 0,
        totalCount: 0,
      },
    };
  }
}

/**
 * Fast suggestion query for Omnibox autocomplete.
 */
export async function getSearchSuggestions(query: string, limit = 5): Promise<SearchResultItem[]> {
  const result = await executeSearch({
    query,
    limit,
  });
  return result.items;
}

/**
 * Suggests alternative query based on popular terms when 0 results found.
 */
function computeDidYouMean(query: string): string | undefined {
  const norm = normalizePersianText(query);
  for (const suggestion of POPULAR_SEARCH_SUGGESTIONS) {
    const sugNorm = normalizePersianText(suggestion);
    if (sugNorm.includes(norm) || norm.includes(sugNorm)) {
      return suggestion;
    }
  }
  // Default to most popular category search
  if (norm.includes("موتور") || norm.includes("دینام")) return "الکتروموتور تک‌فاز";
  if (norm.includes("گیربکس") || norm.includes("vf") || norm.includes("mvf")) return "گیربکس حلزونی VF 86";
  if (norm.includes("پمپ") || norm.includes("کف") || norm.includes("لجن")) return "پمپ کف‌کش ۲ اینچ";
  return POPULAR_SEARCH_SUGGESTIONS[0];
}

/**
 * Asynchronously logs search query to SearchLog model.
 */
async function logSearchQuery(query: string, resultCount: number, category: string) {
  try {
    await db.searchLog.create({
      data: {
        query: query.slice(0, 255),
        resultCount,
        category: category.slice(0, 50),
      },
    });
  } catch {
    // Ignore logging errors to keep search reliable
  }
}
