import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  parseVariantAttributesMedia,
  productMediaForSku,
  productImageForVariant,
  resolvedProductMedia,
} from "../../src/lib/product-media.ts";

describe("Variant Media & Attributes Resolution", () => {
  test("parseVariantAttributesMedia handles null, empty, or invalid JSON safely", () => {
    assert.equal(parseVariantAttributesMedia(null), null);
    assert.equal(parseVariantAttributesMedia(undefined), null);
    assert.equal(parseVariantAttributesMedia(""), null);
    assert.equal(parseVariantAttributesMedia("{}"), null);
    assert.equal(parseVariantAttributesMedia("invalid-json{"), null);
    assert.equal(parseVariantAttributesMedia({ otherKey: 123 }), null);
  });

  test("parseVariantAttributesMedia extracts images and videos from { media: { images, videos } }", () => {
    const raw = JSON.stringify({
      media: {
        images: ["/products/v1.webp", "/products/v2.webp", ""],
        videos: ["/products/clip.mp4"],
      },
    });

    const parsed = parseVariantAttributesMedia(raw);
    assert.notEqual(parsed, null);
    assert.deepEqual(parsed.images, ["/products/v1.webp", "/products/v2.webp"]);
    assert.deepEqual(parsed.videos, ["/products/clip.mp4"]);
  });

  test("parseVariantAttributesMedia handles direct { images, videos } format", () => {
    const raw = JSON.stringify({
      images: ["/products/img1.webp"],
      videos: [],
    });

    const parsed = parseVariantAttributesMedia(raw);
    assert.notEqual(parsed, null);
    assert.deepEqual(parsed.images, ["/products/img1.webp"]);
    assert.deepEqual(parsed.videos, []);
  });

  test("productMediaForSku uses attributes when present and overrides static manifest", () => {
    const sku = "10000021"; // Existing SKU in manifest
    const defaultMedia = productMediaForSku(sku);
    assert.ok(defaultMedia.images.length > 0);

    const customAttributes = JSON.stringify({
      media: {
        images: ["/custom/new-primary.webp", "/custom/secondary.webp"],
        videos: ["/custom/test-video.mp4"],
      },
    });

    const overridden = productMediaForSku(sku, customAttributes);
    assert.deepEqual(overridden.images, ["/custom/new-primary.webp", "/custom/secondary.webp"]);
    assert.deepEqual(overridden.videos, ["/custom/test-video.mp4"]);
  });

  test("productImageForVariant designates index 0 as the primary image", () => {
    const sku = "10000021";
    const customAttributes = JSON.stringify({
      media: {
        images: ["/custom/designated-primary.webp", "/custom/other.webp"],
        videos: [],
      },
    });

    const primary = productImageForVariant(sku, "electromotor", "/family.webp", "single-phase", customAttributes);
    assert.equal(primary, "/custom/designated-primary.webp");
  });

  test("resolvedProductMedia synchronizes images, primary image, and video list", () => {
    const customAttributes = JSON.stringify({
      media: {
        images: ["/img/first.webp", "/img/second.webp"],
        videos: ["/vid/feature.mp4", "/vid/demo.webm"],
      },
    });

    const resolved = resolvedProductMedia("NON_EXISTENT_SKU", "gearbox", "/fam.webp", "", customAttributes);
    assert.deepEqual(resolved.images, ["/img/first.webp", "/img/second.webp"]);
    assert.deepEqual(resolved.videos, ["/vid/feature.mp4", "/vid/demo.webm"]);
  });
});
