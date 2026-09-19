import assert from "node:assert/strict";
import test from "node:test";
import { getCategoryDefaultImage, getSubcategoryDefaultImage, DEFAULT_CATEGORY_IMAGES } from "../../src/data/categoryImages.ts";
import { CATALOG_CATEGORIES } from "../../src/data/catalogCategories.ts";

test("category images dictionary contains images for all main categories", () => {
  for (const cat of CATALOG_CATEGORIES) {
    const img = getCategoryDefaultImage(cat.slug);
    assert.ok(img, `Image should exist for category ${cat.slug}`);
    assert.ok(img.startsWith("/media/"), `Image path should start with /media/ for ${cat.slug}`);
  }
});

test("subcategory images dictionary provides fallback images for cubic and worm gearboxes", () => {
  const cubicImg = getSubcategoryDefaultImage("gearbox", "cubic");
  assert.ok(cubicImg, "Image should exist for cubic gearbox");
  assert.equal(cubicImg, DEFAULT_CATEGORY_IMAGES.cubic);

  const wormImg = getSubcategoryDefaultImage("gearbox", "worm");
  assert.ok(wormImg, "Image should exist for worm gearbox");
  assert.equal(wormImg, DEFAULT_CATEGORY_IMAGES.worm);
});
