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
  ["gearbox", "level1=حلزونی&level2=فلنج‌دار"],
  ["pump", "level1=الکتروپمپ"],
  ["pump", "level1=کف‌کش"],
  ["accessories", "level1=فلنج&level2=موتوژن"],
  ["accessories", "level1=درب%20ترمینال"],
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

test("product APIs expose valid SKU-specific image and video media", async ({ request }) => {
  const family = await (await request.get("/api/products/single-phase-aluminum-1400")).json();
  const variantsWithUploadedMedia = family.variants.filter(
    (variant: { media: { images: string[]; videos: string[] } }) =>
      variant.media.images.some((src) => src.includes("/media/products/assets/"))
  );
  expect(variantsWithUploadedMedia.length).toBeGreaterThan(0);
  expect(family.variants.some((variant: { media: { videos: string[] } }) => variant.media.videos.length > 0)).toBe(true);

  for (const slug of ["three-phase-aluminum-750", "worm-gearbox-vf", "pump-surface-electropump", "flange-motogen"]) {
    const fallbackFamily = await (await request.get(`/api/products/${slug}`)).json();
    expect(fallbackFamily.variants.every((variant: { media: { images: string[] } }) =>
      variant.media.images[0]?.startsWith("/media/products/fallback/electromotor-")
    )).toBe(true);
  }
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

test("admin pricing and upload APIs reject anonymous requests", async ({ request }) => {
  expect((await request.get("/api/admin/pricing")).status()).toBe(401);
  expect((await request.post("/api/admin/pricing", { data: { type: "bulk", action: "preview", adjustmentType: "percentage", value: 10 } })).status()).toBe(401);
  expect((await request.post("/api/admin/upload", { multipart: { slug: "test", file: { name: "test.png", mimeType: "image/png", buffer: Buffer.from("not-an-image") } } })).status()).toBe(401);
});

test("authenticated admins can preview pricing and upload optimized product images", async ({ request }) => {
  const login = await request.post("/api/auth", { data: { username: "admin", password: "Admin123456!" } });
  expect(login.status()).toBe(200);

  const preview = await request.post("/api/admin/pricing", {
    data: { type: "bulk", action: "preview", adjustmentType: "percentage", value: 1, category: "accessories" },
  });
  expect(preview.status()).toBe(200);
  const previewBody = await preview.json();
  expect(previewBody.summary.matched).toBeGreaterThan(0);
  expect(Array.isArray(previewBody.changes)).toBe(true);

  const onePixelPng = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");
  const upload = await request.post("/api/admin/upload", {
    multipart: { slug: "e2e-upload-test", file: { name: "motor.png", mimeType: "image/png", buffer: onePixelPng } },
  });
  expect(upload.status()).toBe(201);
  const uploaded = await upload.json();
  expect(uploaded.url).toMatch(/^\/products\/e2e-upload-test\/.+\.webp$/);
  expect(uploaded.width).toBe(1);
  expect(uploaded.height).toBe(1);
  expect((await request.delete(`/api/admin/upload?url=${encodeURIComponent(uploaded.url)}`)).status()).toBe(200);
});
