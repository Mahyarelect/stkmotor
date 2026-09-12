import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeDigits,
  normalizeIranianMobile,
  splitFullName,
} from "../../src/lib/didar.ts";

test("normalizeDigits converts Persian and Arabic numerals to ASCII", () => {
  assert.equal(normalizeDigits("۰۱۲۳۴۵۶۷۸۹"), "0123456789");
  assert.equal(normalizeDigits("٠١٢٣٤٥٦٧٨٩"), "0123456789");
  assert.equal(normalizeDigits("تلفن: ۰۹۱۲-۳۴۵-۶۷۸۹"), "تلفن: 0912-345-6789");
  assert.equal(normalizeDigits("12345"), "12345");
  assert.equal(normalizeDigits(""), "");
});

test("normalizeIranianMobile handles various valid formats", () => {
  // Standard 11-digit format
  assert.equal(normalizeIranianMobile("09123456789"), "09123456789");

  // With hyphens and spaces
  assert.equal(normalizeIranianMobile("0912 345 6789"), "09123456789");
  assert.equal(normalizeIranianMobile("0912-345-6789"), "09123456789");
  assert.equal(normalizeIranianMobile("(0912) 345 6789"), "09123456789");

  // International format +98
  assert.equal(normalizeIranianMobile("+989123456789"), "09123456789");

  // International format 0098
  assert.equal(normalizeIranianMobile("00989123456789"), "09123456789");

  // Format 989... (12 digits)
  assert.equal(normalizeIranianMobile("989123456789"), "09123456789");

  // 10 digits without leading 0
  assert.equal(normalizeIranianMobile("9123456789"), "09123456789");

  // Dot and slash separators
  assert.equal(normalizeIranianMobile("0912.345.6789"), "09123456789");
  assert.equal(normalizeIranianMobile("0912/345/6789"), "09123456789");

  // International format with optional zero +98 (0) 912...
  assert.equal(normalizeIranianMobile("+98 (0) 912 345 6789"), "09123456789");
  assert.equal(normalizeIranianMobile("+98 (912) 345 6789"), "09123456789");

  // Persian numerals
  assert.equal(normalizeIranianMobile("۰۹۱۲۳۴۵۶۷۸۹"), "09123456789");
  assert.equal(normalizeIranianMobile("۰۹۱۲-۳۴۵-۶۷۸۹"), "09123456789");
  assert.equal(normalizeIranianMobile("۰۹۱۲.۳۴۵.۶۷۸۹"), "09123456789");
  assert.equal(normalizeIranianMobile("+۹۸۹۱۲۳۴۵۶۷۸۹"), "09123456789");
});

test("normalizeIranianMobile rejects invalid phone numbers", () => {
  assert.equal(normalizeIranianMobile(""), null);
  assert.equal(normalizeIranianMobile("02188888888"), null); // landline
  assert.equal(normalizeIranianMobile("0912345"), null); // too short
  assert.equal(normalizeIranianMobile("091234567890"), null); // too long
  assert.equal(normalizeIranianMobile("0912abc6789"), null); // contains letters
  assert.equal(normalizeIranianMobile("۰۹۱۲تست۶۷۸۹"), null); // contains Persian letters
  assert.equal(normalizeIranianMobile("abcd"), null);
  assert.equal(normalizeIranianMobile("+1234567890"), null); // foreign number
});

test("splitFullName properly extracts firstName and lastName", () => {
  // Single word
  assert.deepEqual(splitFullName("رضایی"), { firstName: "", lastName: "رضایی" });

  // Two words
  assert.deepEqual(splitFullName("علی رضایی"), { firstName: "علی", lastName: "رضایی" });

  // Multi words (compound names or prefix)
  assert.deepEqual(splitFullName("سید مهدی حسینی"), {
    firstName: "سید مهدی",
    lastName: "حسینی",
  });

  assert.deepEqual(splitFullName("محمد علی اصغر زاده"), {
    firstName: "محمد علی اصغر",
    lastName: "زاده",
  });

  // Whitespace trimming
  assert.deepEqual(splitFullName("  احمد   نوری  "), {
    firstName: "احمد",
    lastName: "نوری",
  });

  // Empty string fallback
  assert.deepEqual(splitFullName(""), {
    firstName: "",
    lastName: "کاربر وب‌سایت",
  });
});
