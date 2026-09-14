import assert from "node:assert/strict";
import test from "node:test";
import { catalogSearchSpellings, catalogSearchTerms, normalizeCatalogSearch } from "../../src/lib/catalog-search.ts";

test("catalog search normalizes Persian and Arabic letters, digits, and joiners", () => {
  assert.equal(normalizeCatalogSearch("  كف‌كش ۱۲۳  "), "کف کش 123");
  assert.equal(normalizeCatalogSearch("موتورِ سه‌فاز"), "موتور سه فاز");
});

test("catalog search uses multi-word terms and limits pathological queries", () => {
  assert.deepEqual(catalogSearchTerms("فلنج موتوژن ۱۶۰"), ["فلنج", "موتوژن", "160"]);
  assert.equal(catalogSearchTerms("1 2 3 4 5 6 7 8 9 10").length, 8);
});

test("catalog search checks Persian and Arabic database spellings", () => {
  assert.deepEqual(catalogSearchSpellings("کفی"), ["کفی", "كفي"]);
});
