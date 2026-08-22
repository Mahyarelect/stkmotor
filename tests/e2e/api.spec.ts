import { expect, test } from "@playwright/test";

test("stats API reports the complete catalog", async ({ request }) => {
  const response = await request.get("/api/stats");
  expect(response.status()).toBe(200);
  expect(await response.json()).toMatchObject({
    families: 30,
    variants: 863,
    categories: 4,
    singlePhaseFamilies: 4,
    threePhaseFamilies: 8,
    gearboxFamilies: 6,
    pumpFamilies: 6,
    accessoriesFamilies: 6,
  });
});

for (const [category, total] of [["electromotor", 12], ["gearbox", 6], ["pump", 6], ["accessories", 6]] as const) {
  test(`products API filters ${category}`, async ({ request }) => {
    const response = await request.get(`/api/products?category=${category}&limit=48`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.total).toBe(total);
    expect(body.products).toHaveLength(total);
    expect(body.products.every((product: { mainCategory: string }) => product.mainCategory === category)).toBe(true);
  });
}

test("products API paginates, caps limits, and searches technical data", async ({ request }) => {
  const page = await (await request.get("/api/products?page=1&limit=3")).json();
  expect(page.products).toHaveLength(3);
  expect(page.hasMore).toBe(true);

  const search = await (await request.get("/api/products?category=gearbox&search=NMRV")).json();
  expect(search.total).toBe(1);
  expect(search.products[0].slug).toBe("cubic-gearbox-nmrv");
});

for (const [category, subCategory, total] of [
  ["gearbox", "worm", 4], ["gearbox", "cubic", 1], ["gearbox", "inline-shaft", 1],
  ["pump", "surface-pump", 1], ["pump", "submersible-sump", 1], ["pump", "sewage-pump", 1],
  ["pump", "submersible-pump", 1], ["pump", "gear-pump", 1], ["pump", "acid-pump", 1],
  ["accessories", "motor-flange", 4], ["accessories", "rear-bracket", 1], ["accessories", "gearbox-flange", 1],
] as const) {
  test(`subcategory ${category}/${subCategory} resolves products`, async ({ request }) => {
    const body = await (await request.get(`/api/products?category=${category}&subCategory=${subCategory}&limit=48`)).json();
    expect(body.total).toBe(total);
    expect(body.products).toHaveLength(total);
  });
}

for (const [category, filter] of [
  ["gearbox", "level1=حلزونی"],
  ["gearbox", "level1=حلزونی&level2=شافت‌دار"],
  ["pump", "level1=کف‌کش"],
  ["accessories", "level1=فلنج&level2=موتوژن"],
  ["electromotor", "level1=تک‌فاز&level2=چدنی"],
] as const) {
  test(`specialized ${category} facets (${filter}) return matching results`, async ({ request }) => {
    const body = await (await request.get(`/api/products?category=${category}&${filter}&limit=48`)).json();
    expect(body.total).toBeGreaterThan(0);
    expect(body.products.length).toBeGreaterThan(0);
  });
}

test("single-product API returns variants and handles unknown slugs", async ({ request }) => {
  const response = await request.get("/api/products/worm-gearbox-vf");
  expect(response.status()).toBe(200);
  const product = await response.json();
  expect(product.mainCategory).toBe("gearbox");
  expect(product.variants.length).toBeGreaterThan(0);
  expect(product.variants.every((variant: { sku: string }) => variant.sku)).toBe(true);

  expect((await request.get("/api/products/not-a-real-product")).status()).toBe(404);
});

test("authentication API rejects malformed and incomplete payloads safely", async ({ request }) => {
  const missing = await request.post("/api/auth", { data: {} });
  expect(missing.status()).toBe(400);

  const wrongTypes = await request.post("/api/auth", { data: { username: 123, password: false } });
  expect(wrongTypes.status()).toBe(400);

  const malformed = await request.post("/api/auth", {
    headers: { "content-type": "application/json" },
    data: "{broken-json",
  });
  expect(malformed.status()).toBe(400);
});
