import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";

const root = process.cwd();
const seed = JSON.parse(await readFile(resolve(root, "prisma/seed-data.json"), "utf8"));
const packageJson = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"));
const databasePath = resolve(root, "db/custom.db").replaceAll("\\", "/");
process.env.DATABASE_URL = `file:${databasePath}`;

const expectedCategoryCounts = {
  electromotor: 265,
  gearbox: 323,
  pump: 181,
  accessories: 94,
};

describe("catalog seed integrity", () => {
  test("local development prepares required environment variables", () => {
    assert.match(packageJson.scripts.dev, /prepare-local-env\.mjs/);
  });

  test("cleaned source CSV totals match the canonical seed", async () => {
    const files = {
      electromotor: "data/csv/electromotor/all_electromotors_clean.csv",
      gearbox: "data/csv/gearbox/worm_gearbox_clean.csv",
      pump: "data/csv/pump/all_pumps_clean.csv",
      accessories: "data/csv/accessories/all_flanges_clean.csv",
    };
    const counts = {};
    for (const [category, file] of Object.entries(files)) {
      const text = await readFile(resolve(root, file), "utf8");
      counts[category] = text.trim().split(/\r?\n/).length - 1;
    }
    // Gearbox data is split across three canonical files.
    for (const file of ["data/csv/gearbox/cubic_gearbox_clean.csv", "data/csv/gearbox/direct_shaft_gearbox_clean.csv"]) {
      const text = await readFile(resolve(root, file), "utf8");
      counts.gearbox += text.trim().split(/\r?\n/).length - 1;
    }
    assert.deepEqual(counts, expectedCategoryCounts);
  });

  test("contains the four public categories in business order", () => {
    assert.deepEqual(seed.categories.map((category) => category.slug), [
      "electromotor",
      "gearbox",
      "pump",
      "accessories",
    ]);
  });

  test("contains the expected 30 families and 863 variants", () => {
    assert.equal(seed.families.length, 30);
    assert.equal(seed.variants.length, 863);
  });

  test("has unique family slugs and variant SKUs", () => {
    assert.equal(new Set(seed.families.map((family) => family.slug)).size, seed.families.length);
    assert.equal(new Set(seed.variants.map((variant) => variant.sku)).size, seed.variants.length);
  });

  test("every variant references an existing family", () => {
    const familySlugs = new Set(seed.families.map((family) => family.slug));
    const missing = seed.variants.filter((variant) => !familySlugs.has(variant.familySlug));
    assert.deepEqual(missing, []);
  });

  test("category totals match the cleaned source files", () => {
    const families = new Map(seed.families.map((family) => [family.slug, family]));
    const counts = Object.fromEntries(Object.keys(expectedCategoryCounts).map((key) => [key, 0]));
    for (const variant of seed.variants) counts[families.get(variant.familySlug).mainCategory] += 1;
    assert.deepEqual(counts, expectedCategoryCounts);
  });

  test("all records have usable identifiers and valid numeric values", () => {
    for (const family of seed.families) {
      assert.match(family.slug, /^[a-z0-9-]+$/);
      assert.ok(family.name.trim().length > 0);
    }
    for (const variant of seed.variants) {
      assert.ok(String(variant.sku).trim().length > 0);
      assert.ok(Number.isFinite(variant.powerKw) && variant.powerKw >= 0);
      assert.ok(Number.isSafeInteger(variant.price) && variant.price >= 0);
      assert.equal(typeof variant.inStock, "boolean");
    }
  });
});

describe("runtime database integrity", () => {
  let db;
  before(() => { db = new PrismaClient(); });
  after(async () => { await db.$disconnect(); });

  test("database totals stay synchronized with the seed", async () => {
    const [families, variants, categories] = await Promise.all([
      db.productFamily.count(),
      db.productVariant.count(),
      db.category.count(),
    ]);
    assert.deepEqual({ families, variants, categories }, { families: 30, variants: 863, categories: 4 });
  });

  test("database has no orphaned variants", async () => {
    const rows = await db.$queryRawUnsafe("SELECT COUNT(*) AS count FROM ProductVariant v LEFT JOIN ProductFamily f ON f.id = v.familyId WHERE f.id IS NULL");
    assert.equal(Number(rows[0].count), 0);
  });
});
