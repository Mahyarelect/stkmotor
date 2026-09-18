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

  const persianSku = await (await request.get(`/api/products?search=${encodeURIComponent("۱۰۱۰۰۰۵۵")}`)).json();
  expect(persianSku.total).toBe(1);
  expect(persianSku.products[0].slug).toBe("single-phase-cast-iron-1400");

  const normalizedPersian = await (await request.get(`/api/products?search=${encodeURIComponent("كف كش")}`)).json();
  expect(normalizedPersian.products.some((product: { slug: string }) => product.slug === "pump-submersible-sump")).toBe(true);

  const technical = await (await request.get(`/api/products?search=${encodeURIComponent("فلنج موتوژن 160")}`)).json();
  expect(technical.products.some((product: { slug: string }) => product.slug === "flange-motogen")).toBe(true);
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

  const threePhaseFallback = await (await request.get("/api/products/three-phase-aluminum-750")).json();
  expect(threePhaseFallback.variants.every((variant: { media: { images: string[] } }) =>
    variant.media.images[0]?.startsWith("/media/products/fallback/electromotor-")
  )).toBe(true);

  for (const slug of ["worm-gearbox-vf", "pump-surface-electropump", "flange-motogen"]) {
    const unrelatedFamily = await (await request.get(`/api/products/${slug}`)).json();
    expect(unrelatedFamily.variants.every((variant: { media: { images: string[] } }) =>
      !variant.media.images.some((image) => image.includes("/fallback/electromotor-"))
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

test("authenticated admins can upload and assign multiple images/videos and reorder variant media", async ({ request }) => {
  const login = await request.post("/api/auth", { data: { username: "admin", password: "Admin123456!" } });
  expect(login.status()).toBe(200);

  // 1. Fetch families to get a test variant
  const familiesRes = await request.get("/api/admin/families");
  expect(familiesRes.status()).toBe(200);
  const families = await familiesRes.json();
  expect(families.length).toBeGreaterThan(0);

  const familyDetailRes = await request.get(`/api/admin/families/${families[0].id}`);
  expect(familyDetailRes.status()).toBe(200);
  const family = await familyDetailRes.json();
  const variant = family.variants[0];
  expect(variant).toBeDefined();

  // 2. Upload an image for the variant
  const onePixelPng = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");
  const imgUpload = await request.post("/api/admin/upload", {
    multipart: { slug: family.slug, file: { name: "variant-photo.png", mimeType: "image/png", buffer: onePixelPng } },
  });
  expect(imgUpload.status()).toBe(201);
  const uploadedImg = await imgUpload.json();

  // 3. Upload a sample video
  const sampleVideo = Buffer.from("fake-mp4-video-content-header-ftypisom");
  const vidUpload = await request.post("/api/admin/upload", {
    multipart: { slug: family.slug, file: { name: "variant-clip.mp4", mimeType: "video/mp4", buffer: sampleVideo } },
  });
  expect(vidUpload.status()).toBe(201);
  const uploadedVid = await vidUpload.json();

  // 4. Update variant with assigned media: 2 images (first is primary) and 1 video
  const secondImg = "/media/products/assets/895dff27ba068dccd40a.webp";
  const updateRes = await request.put(`/api/admin/variants/${variant.id}`, {
    data: {
      media: {
        images: [uploadedImg.url, secondImg],
        videos: [uploadedVid.url],
      },
    },
  });
  expect(updateRes.status()).toBe(200);
  const updatedVariant = await updateRes.json();
  expect(updatedVariant.media.images).toEqual([uploadedImg.url, secondImg]);
  expect(updatedVariant.media.videos).toEqual([uploadedVid.url]);

  // 5. Test reordering: swap image positions to make secondImg the primary image
  const reorderRes = await request.put(`/api/admin/variants/${variant.id}`, {
    data: {
      media: {
        images: [secondImg, uploadedImg.url],
        videos: [uploadedVid.url],
      },
    },
  });
  expect(reorderRes.status()).toBe(200);
  const reorderedVariant = await reorderRes.json();
  expect(reorderedVariant.media.images[0]).toBe(secondImg);
  expect(reorderedVariant.media.images[1]).toBe(uploadedImg.url);

  // 6. Verify public product detail API immediately reflects the database changes
  const publicRes = await request.get(`/api/products/${family.slug}`);
  expect(publicRes.status()).toBe(200);
  const publicFamily = await publicRes.json();
  const matchedPublicVariant = publicFamily.variants.find((v: { id: string }) => v.id === variant.id);
  expect(matchedPublicVariant).toBeDefined();
  expect(matchedPublicVariant.media.images[0]).toBe(secondImg);
  expect(matchedPublicVariant.media.videos).toContain(uploadedVid.url);

  // 7. Cleanup uploaded files
  await request.delete(`/api/admin/upload?url=${encodeURIComponent(uploadedImg.url)}`);
  await request.delete(`/api/admin/upload?url=${encodeURIComponent(uploadedVid.url)}`);
});

test("leads API validates input and accepts product inquiries for Didar CRM", async ({ request }) => {
  // Test invalid phone
  const badPhone = await request.post("/api/leads", {
    data: {
      fullName: "تست آزمایشی",
      phone: "12345",
    },
  });
  expect(badPhone.status()).toBe(400);
  const badPhoneBody = await badPhone.json();
  expect(badPhoneBody.success).toBe(false);

  // Test missing name
  const badName = await request.post("/api/leads", {
    data: {
      fullName: "",
      phone: "09121111111",
    },
  });
  expect(badName.status()).toBe(400);

  // Test valid lead submission with Persian digits and punctuation
  const valid = await request.post("/api/leads", {
    data: {
      fullName: "مهدی تستی",
      phone: "۰۹۹۹.۹۹۹.۹۹۹۹",
      company: "شرکت تست",
      message: "تست ارسال استعلام به CRM با اعداد فارسی و نقطه",
      productTitle: "الکتروموتور تست STK",
      productSku: "STK-TEST",
      productUrl: "http://localhost:3000/product/test",
      variantDetails: "توان: 5.5kW",
    },
  });
  expect(valid.status()).toBe(200);
  const validBody = await valid.json();
  expect(validBody.success).toBe(true);
  expect(validBody.contactId).toBeTruthy();
});

