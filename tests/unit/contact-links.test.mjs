import assert from "node:assert/strict";
import test from "node:test";

function rubikaHref(account, text) {
  const value = account.trim();
  if (!value) return "";
  const normalized = value.replace(/^@/, "");
  const base = /^https?:\/\//i.test(normalized) ? normalized.replace(/\/$/, "") : `https://rubika.ir/${normalized.replace(/^rubika\.ir\//i, "")}`;
  return text ? `${base}${base.includes("?") ? "&" : "?"}text=${encodeURIComponent(text)}` : base;
}

test("Rubika contact links", async (t) => {
  await t.test("keeps an empty ID disabled until configured", () => assert.equal(rubikaHref(""), ""));
  await t.test("accepts a bare or @ username", () => {
    assert.equal(rubikaHref("@stkmotor"), "https://rubika.ir/stkmotor");
    assert.equal(rubikaHref("stkmotor"), "https://rubika.ir/stkmotor");
  });
  await t.test("adds a product inquiry message safely", () => assert.match(rubikaHref("stkmotor", "مدل 123"), /\?text=%D9%85%D8%AF%D9%84%20123$/));
});
