import { expect, test } from "@playwright/test";

test.describe("Search API Endpoints", () => {
  test("GET /api/search/suggest returns autocomplete items and category matches", async ({ request }) => {
    const res = await request.get("/api/search/suggest?q=VF 86");
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.query).toBe("VF 86");
    expect(data.items.length).toBeGreaterThan(0);
    expect(data.items[0]).toHaveProperty("sku");
    expect(data.items[0]).toHaveProperty("image");
    expect(data.categoryMatch).not.toBeNull();
    expect(data.categoryMatch.href).toBe("/category/gearbox");
  });

  test("GET /api/search returns ranked variants with facets and pagination", async ({ request }) => {
    const res = await request.get("/api/search?q=تک فاز 1400");
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.total).toBeGreaterThan(0);
    expect(data.items.length).toBeGreaterThan(0);
    expect(data.facets).toHaveProperty("categories");
    expect(data.facets).toHaveProperty("speeds");
    expect(data.facets.speeds.some((s: { value: string }) => s.value === "1400")).toBe(true);
  });

  test("GET /api/search with exact SKU matches the exact variant", async ({ request }) => {
    const res = await request.get("/api/search?q=10000014");
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.total).toBe(1);
    expect(data.items).toHaveLength(1);
    expect(data.items[0].sku).toBe("10000014");
    expect(data.items[0].score).toBeGreaterThanOrEqual(1000);
  });

  test("GET /api/search handles Persian colloquial category queries (دینام)", async ({ request }) => {
    const res = await request.get("/api/search?q=دینام");
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.total).toBe(265);
    expect(data.items.length).toBeGreaterThan(0);
    expect(data.items[0].mainCategory).toBe("electromotor");
  });

  test("GET /api/search strictly filters single-phase motors when specified in Persian", async ({ request }) => {
    const res = await request.get("/api/search?q=الکتروموتور تک فاز");
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.total).toBe(40);
    expect(data.items.length).toBeGreaterThan(0);
    for (const item of data.items) {
      expect(item.specs.phase).toContain("تک");
    }
  });

  test("GET /api/search safely handles special characters and wildcards", async ({ request }) => {
    const res = await request.get("/api/search?q=%25");
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.total).toBe(0);
    expect(data.items).toHaveLength(0);
    expect(data.didYouMean).toBeDefined();
  });

  test("GET /api/search returns didYouMean for unmatched queries", async ({ request }) => {
    const res = await request.get("/api/search?q=unknownindustrialproduct123");
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.total).toBe(0);
    expect(data.items).toHaveLength(0);
    expect(data.didYouMean).toBeDefined();
  });
});

test.describe("Global Search Dialog & Header UX", () => {
  test("opens search dialog on clicking desktop header search button", async ({ page }) => {
    await page.goto("/");
    const searchTrigger = page.getByRole("button", { name: "جستجوی سریع محصولات" });
    await expect(searchTrigger).toBeVisible();
    await searchTrigger.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(page.getByPlaceholder("جستجوی محصول، توان، دور، تیپ گیربکس یا کد SKU...")).toBeVisible();
  });

  test("opens search dialog with ⌘K / Ctrl+K keyboard shortcut", async ({ page }) => {
    await page.goto("/");
    const searchTrigger = page.getByRole("button", { name: "جستجوی سریع محصولات" });
    await expect(searchTrigger).toBeVisible();

    const modifier = process.platform === "darwin" ? "Meta" : "Control";
    await page.keyboard.press(`${modifier}+KeyK`);

    const dialog = page.getByRole("dialog");
    if (!await dialog.isVisible()) {
      await page.keyboard.press("Control+k");
    }
    await expect(dialog).toBeVisible();
  });

  test("typing in search dialog returns live suggestions and navigates on click", async ({ page }) => {
    await page.goto("/");
    const searchTrigger = page.getByRole("button", { name: "جستجوی سریع محصولات" });
    await searchTrigger.click();

    const searchInput = page.getByPlaceholder("جستجوی محصول، توان، دور، تیپ گیربکس یا کد SKU...");
    await expect(searchInput).toBeVisible();
    await searchInput.fill("VF 86");

    // Live results should appear
    const resultItem = page.locator("[cmdk-item]").first();
    await expect(resultItem).toBeVisible({ timeout: 8000 });
    await resultItem.click();

    // Navigates to product detail page with sku query parameter
    await expect(page).toHaveURL(/\/product\/.*sku=/);
  });
});

test.describe("Search Results Page (/search)", () => {
  test("renders search results with category pills and variant cards", async ({ page }) => {
    await page.goto("/search?q=تک فاز");
    await expect(page.locator("h1, h2").first()).toBeVisible();
    await expect(page.getByText("فقط کالاهای موجود")).toBeVisible();
    await expect(page.getByRole("button", { name: "همه تجهیزات" })).toBeVisible();

    // Results cards should be displayed
    const cards = page.locator(".group.flex.flex-col");
    await expect(cards.first()).toBeVisible();
  });

  test("empty query results display fallback consultation and suggestion", async ({ page }) => {
    await page.goto("/search?q=unknownequipmentxyz999");
    await expect(page.getByText("محصولی با مشخصات مورد نظر یافت نشد")).toBeVisible();
    await expect(page.getByText("استعلام موجودی در واتس‌اپ")).toBeVisible();
  });
});

test.describe("Variant Deep Linking via SKU", () => {
  test("pre-selects variant matching SKU on product detail page", async ({ page }) => {
    await page.goto("/product/worm-gearbox-vf?sku=10000014");
    // Verify that the variant with SKU 10000014 is pre-selected and rendered
    await expect(page.locator('bdi:text("10000014")')).toBeVisible();
    // Verify the inquiry link strictly includes the SKU
    const whatsappLink = page.getByRole("link", { name: "استعلام در واتساپ" }).first();
    await expect(whatsappLink).toBeVisible();
    await expect(whatsappLink).toHaveAttribute("href", /10000014/);
  });
});
