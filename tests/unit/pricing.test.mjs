import assert from "node:assert/strict";
import test from "node:test";
import { parseCsv, parsePrice, rowsToImportedPrices } from "../../src/lib/pricing.ts";

test("pricing parser accepts Persian digits and separators", () => {
  assert.equal(parsePrice("۱٬۲۵۰٬۰۰۰ تومان"), 1250000n);
  assert.equal(parsePrice("12,500"), 12500n);
  assert.equal(parsePrice("-1"), null);
  assert.equal(parsePrice("قیمت نامشخص"), null);
});

test("CSV parser handles quoted values, escaped quotes, and CRLF", () => {
  const rows = parseCsv('SKU,price,note\r\n"101,ABC","1,250","a ""quoted"" note"\r\n');
  assert.deepEqual(rows, [["SKU", "price", "note"], ["101,ABC", "1,250", 'a "quoted" note']]);
});

test("import rows support Persian headers and report invalid prices", () => {
  const result = rowsToImportedPrices([["کد کالا", "قیمت جدید"], ["۱۰۱۰۰۰۳", "۲۵۰۰۰"], ["bad", "-"]]);
  assert.deepEqual(result, [
    { row: 2, sku: "1010003", price: 25000n },
    { row: 3, sku: "bad", price: null },
  ]);
});

test("import rows reject files without required columns", () => {
  assert.throws(() => rowsToImportedPrices([["name", "value"], ["motor", "1"]]), /SKU/);
});
