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

test("gearbox variants with ratios are correctly grouped by ratio and sorted numerically", () => {
  const sampleVariants = [
    { id: "1", sku: "1001", size: "40", ratio: "100", inStock: true, price: 5000000 },
    { id: "2", sku: "1002", size: "40", ratio: "7.5", inStock: false, price: 4500000 },
    { id: "3", sku: "1003", size: "40", ratio: "7.5", inStock: true, price: 4600000 },
    { id: "4", sku: "1004", size: "40", ratio: "15", inStock: true, price: 4800000 },
    { id: "5", sku: "1005", size: "40", ratio: "5", inStock: true, price: 4300000 },
  ];

  const isRatioFamily = true;
  const byOption = new Map();
  for (const variant of sampleVariants) {
    const key = isRatioFamily ? (variant.ratio || variant.size || variant.id) : (variant.size || variant.id);
    const existing = byOption.get(key);
    if (!existing) {
      byOption.set(key, variant);
    } else if (!existing.inStock && variant.inStock) {
      byOption.set(key, variant);
    }
  }

  // Deduplication preserves unique ratios and picks inStock
  assert.equal(byOption.size, 4);
  assert.equal(byOption.get("7.5").sku, "1003"); // inStock prioritized

  const sortedOptions = [...byOption.keys()].sort((a, b) => Number.parseFloat(a) - Number.parseFloat(b));
  assert.deepEqual(sortedOptions, ["5", "7.5", "15", "100"]);
  assert.equal(`1:${sortedOptions[1]}`, "1:7.5");
});

test("all subcategories in catalog have valid default fallback images", () => {
  for (const cat of CATALOG_CATEGORIES) {
    for (const sub of cat.subCategories) {
      const img = getSubcategoryDefaultImage(cat.slug, sub.slug);
      assert.ok(img, `Subcategory ${sub.slug} in ${cat.slug} must have a fallback image`);
      assert.ok(img.startsWith("/media/"), `Image for ${sub.slug} should start with /media/`);
    }
  }
});

test("custom subcategory image resolution prioritizes custom and reverts on delete/empty", () => {
  const customImages = {
    worm: "/products/subcat-worm/test-image.webp",
    cubic: "",
  };

  const resolveSubImage = (categorySlug, subSlug) => {
    return customImages[subSlug] || getSubcategoryDefaultImage(categorySlug, subSlug);
  };

  // Custom image set -> returns custom image
  assert.equal(resolveSubImage("gearbox", "worm"), "/products/subcat-worm/test-image.webp");

  // Custom image empty / deleted -> reverts to default fallback
  assert.equal(resolveSubImage("gearbox", "cubic"), DEFAULT_CATEGORY_IMAGES.cubic);

  // Unconfigured subcategory -> returns default fallback
  assert.equal(resolveSubImage("pump", "surface-pump"), DEFAULT_CATEGORY_IMAGES["surface-pump"]);

  // Simulating delete action: setting worm to empty string
  customImages.worm = "";
  assert.equal(resolveSubImage("gearbox", "worm"), DEFAULT_CATEGORY_IMAGES.worm);
});

test("custom main category image resolution prioritizes custom and reverts on delete/empty", () => {
  let catImageUrl = "/products/category-electromotor/custom-motor.webp";
  const resolveCatImage = (slug, rawUrl) => rawUrl || getCategoryDefaultImage(slug);

  assert.equal(resolveCatImage("electromotor", catImageUrl), "/products/category-electromotor/custom-motor.webp");

  // Deleting / reverting main category image
  catImageUrl = "";
  assert.equal(resolveCatImage("electromotor", catImageUrl), DEFAULT_CATEGORY_IMAGES.electromotor);
});
