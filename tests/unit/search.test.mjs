import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  normalizeDigits,
  normalizePersianText,
  tokenizePersianText,
  getCompoundVariations,
} from "../../src/lib/search/persian-normalizer.ts";
import { parseSearchQuery } from "../../src/lib/search/query-parser.ts";
import { executeSearch, getSearchSuggestions } from "../../src/lib/search/search-service.ts";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

describe("Persian Normalizer & Tokenizer", () => {
  test("converts Perso-Arabic digits to ASCII", () => {
    assert.equal(normalizeDigits("۱۴۰۰"), "1400");
    assert.equal(normalizeDigits("۳۰۰۰"), "3000");
    assert.equal(normalizeDigits("١٢٣٤٥٦٧٨٩٠"), "1234567890");
    assert.equal(normalizeDigits("۰.۷۵"), "0.75");
  });

  test("unifies Arabic characters into Persian equivalents", () => {
    assert.equal(normalizePersianText("موتور ياباني"), "موتور یابانی");
    assert.equal(normalizePersianText("كف‌كش"), "کفکش");
    assert.equal(normalizePersianText("قطعة غيار"), "قطعه غیار");
    assert.equal(normalizePersianText("پمپ آب"), "پمپ اب");
  });

  test("removes ZWNJ and canonicalizes compound terms", () => {
    assert.equal(normalizePersianText("الکتروموتور تک فاز"), "الکتروموتور تکفاز");
    assert.equal(normalizePersianText("الکتروموتور تک‌فاز"), "الکتروموتور تکفاز");
    assert.equal(normalizePersianText("الکتروموتور تکفاز"), "الکتروموتور تکفاز");
    assert.equal(normalizePersianText("پمپ کف کش"), "پمپ کفکش");
    assert.equal(normalizePersianText("پمپ کف‌کش"), "پمپ کفکش");
    assert.equal(normalizePersianText("لجن کش فلوتر دار"), "لجنکش فلوتردار");
    assert.equal(normalizePersianText("لجن‌کش فلوتردار"), "لجنکش فلوتردار");
  });

  test("preserves decimal numbers in power and dimensions", () => {
    assert.equal(normalizePersianText("1.5 اسب"), "1.5 اسب");
    assert.equal(normalizePersianText("0.75 kw"), "0.75 kw");
    assert.equal(normalizePersianText("2.2 کیلووات"), "2.2 کیلووات");
    assert.equal(normalizePersianText("۱٫۵ اسب"), "1.5 اسب");
  });

  test("generates compound variations for SQL matching", () => {
    const variations = getCompoundVariations("تک فاز");
    assert.ok(variations.includes("تکفاز"));
    assert.ok(variations.includes("تک‌فاز"));
    assert.ok(variations.includes("تک فاز"));

    const pumpVars = getCompoundVariations("کف کش");
    assert.ok(pumpVars.includes("کفکش"));
    assert.ok(pumpVars.includes("کف‌کش"));
  });

  test("tokenizes text and discards common stop words", () => {
    const tokens = tokenizePersianText("قیمت خرید الکتروموتور برای پمپ و گیربکس");
    assert.ok(tokens.includes("الکتروموتور"));
    assert.ok(tokens.includes("پمپ"));
    assert.ok(tokens.includes("گیربکس"));
    assert.ok(!tokens.includes("و"));
    assert.ok(!tokens.includes("برای"));
    assert.ok(!tokens.includes("قیمت"));
  });
});

describe("Parametric Query Parser", () => {
  test("extracts gearbox specs (model, size, category)", () => {
    const parsed = parseSearchQuery("گیربکس VF 86");
    assert.equal(parsed.category, "gearbox");
    assert.equal(parsed.modelType, "VF");
    assert.equal(parsed.gearboxSize, "86");

    const parsed2 = parseSearchQuery("گیربکس حلزونی تیپ 110");
    assert.equal(parsed2.category, "gearbox");
    assert.equal(parsed2.gearboxType, "حلزونی");
    assert.equal(parsed2.gearboxSize, "110");
  });

  test("extracts electromotor specs (power, speed, phase)", () => {
    const parsed = parseSearchQuery("الکتروموتور 1.5 اسب 1400 دور تک فاز");
    assert.equal(parsed.category, "electromotor");
    assert.equal(parsed.power, "1.5HP");
    assert.equal(parsed.speed, "1400");
    assert.equal(parsed.phase, "single-phase");

    const parsedPersian = parseSearchQuery("موتور ۳ اسب ۳۰۰۰ دور سه فاز پوسته چدن");
    assert.equal(parsedPersian.category, "electromotor");
    assert.equal(parsedPersian.power, "3HP");
    assert.equal(parsedPersian.speed, "3000");
    assert.equal(parsedPersian.phase, "three-phase");
    assert.equal(parsedPersian.shellType, "چدنی");
  });

  test("extracts pump specs (type, outlet size, head, floater)", () => {
    const parsed = parseSearchQuery("پمپ کف کش 2 اینچ 32 متری فلوتردار");
    assert.equal(parsed.category, "pump");
    assert.equal(parsed.pumpType, "کف‌کش");
    assert.equal(parsed.outletSize, "2");
    assert.equal(parsed.headMeter, 32);
    assert.equal(parsed.floater, "فلوتردار");
  });

  test("detects exact SKU code", () => {
    const parsed = parseSearchQuery("10000014");
    assert.equal(parsed.sku, "10000014");
  });
});

describe("Search Service Database Integration", () => {
  test("finds gearbox VF 86 variants and ranks them top", async () => {
    const res = await executeSearch({ query: "VF 86", limit: 5 });
    assert.ok(res.total > 0, "Should return results for VF 86");
    const top = res.items[0];
    assert.ok(top.name.includes("86") || top.specs.size === "86");
    assert.equal(top.mainCategory, "gearbox");
  });

  test("finds single-phase 1400 RPM electromotors", async () => {
    const res = await executeSearch({ query: "تک فاز 1400 دور", limit: 5 });
    assert.ok(res.total > 0, "Should return results for تک فاز 1400");
    for (const item of res.items) {
      assert.equal(item.mainCategory, "electromotor");
      if (item.specs.speed) {
        assert.equal(item.specs.speed, "1400");
      }
    }
  });

  test("finds pump variants for کف کش 2 اینچ", async () => {
    const res = await executeSearch({ query: "پمپ کف کش 2 اینچ", limit: 5 });
    assert.ok(res.total > 0, "Should return pump results");
    assert.equal(res.items[0].mainCategory, "pump");
    assert.ok(res.items[0].name.includes("کفکش") || res.items[0].name.includes("کف"));
  });

  test("finds exact product variant by SKU", async () => {
    const res = await executeSearch({ query: "10000014", limit: 1 });
    assert.ok(res.items.length > 0);
    assert.equal(res.items[0].sku, "10000014");
    assert.ok(res.items[0].score >= 1000, "SKU match should receive top score boost");
  });

  test("aggregates dynamic category and speed facets", async () => {
    const res = await executeSearch({ query: "1400" });
    assert.ok(res.facets.categories.length > 0);
    assert.ok(res.facets.speeds.some((s) => s.value === "1400"));
    assert.ok(res.facets.totalCount > 0);
  });

  test("returns zero results and suggestion for non-matching query", async () => {
    const res = await executeSearch({ query: "qwertyuiopasdfghjkl123456" });
    assert.equal(res.total, 0);
    assert.equal(res.items.length, 0);
    assert.ok(res.didYouMean, "Should provide didYouMean fallback suggestion");
  });

  test("getSearchSuggestions returns low-latency top items for autocomplete", async () => {
    const items = await getSearchSuggestions("VF 86", 4);
    assert.ok(items.length > 0);
    assert.ok(items.length <= 4);
    assert.ok(items[0].sku);
    assert.ok(typeof items[0].image === "string");
  });

  test("handles colloquial category query دینام returning all electromotors", async () => {
    const res = await executeSearch({ query: "دینام" });
    assert.equal(res.total, 265);
    assert.equal(res.items[0].mainCategory, "electromotor");
  });

  test("ranks Motogen products top for query دینام موتوژن", async () => {
    const res = await executeSearch({ query: "دینام موتوژن" });
    assert.ok(res.total > 0);
    assert.ok(res.items[0].name.includes("موتوژن"));
  });

  test("returns exactly 1 product when queried with full SKU", async () => {
    const res = await executeSearch({ query: "10000014" });
    assert.equal(res.total, 1);
    assert.equal(res.items.length, 1);
    assert.equal(res.items[0].sku, "10000014");
  });

  test("safely handles wildcard and symbol queries", async () => {
    const res = await executeSearch({ query: "%" });
    assert.equal(res.total, 0);
    assert.equal(res.items.length, 0);

    const res2 = await executeSearch({ query: "???" });
    assert.equal(res2.total, 0);
  });

  test("handles tatweel and guillemets properly in search", async () => {
    assert.equal(normalizePersianText("«الکـتروموتور»"), "الکتروموتور");
    const res = await executeSearch({ query: "«الکـتروموتور»" });
    assert.equal(res.total, 265);
  });
});
