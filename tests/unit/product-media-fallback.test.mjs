import assert from "node:assert/strict";
import test from "node:test";
import { resolvedProductMedia } from "../../src/lib/product-media.ts";

const expected = [
  "/media/products/fallback/electromotor-1.png",
  "/media/products/fallback/electromotor-2.png",
  "/media/products/fallback/electromotor-3.png",
  "/media/products/fallback/electromotor-4.jpg",
];

test("three-phase products without pictures receive all four fallbacks in order", () => {
  assert.deepEqual(resolvedProductMedia("unmapped-sku", "electromotor", "", "سه‌فاز").images, expected);
});

test("products with their own or family picture do not receive fallback pictures", () => {
  assert.deepEqual(resolvedProductMedia("10100027", "electromotor", "", "سه‌فاز").images.length, 4);
  assert.deepEqual(resolvedProductMedia("unmapped-sku", "electromotor", "/own.jpg", "سه‌فاز").images, ["/own.jpg"]);
  assert.deepEqual(resolvedProductMedia("unmapped-sku", "pump", "", "").images, []);
});
