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

test.describe("Desktop Unified Main Search Bar", () => {
  test("prominent search input is visible in desktop header", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/");
    const searchInput = page.getByPlaceholder("جستجوی محصولات...");
    await expect(searchInput).toBeVisible();
  });

  test("focuses search input with ⌘K / Ctrl+K keyboard shortcut", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/");
    const searchInput = page.getByPlaceholder("جستجوی محصولات...");
    await expect(searchInput).toBeVisible();

    const modifier = process.platform === "darwin" ? "Meta" : "Control";
    await page.keyboard.press(`${modifier}+KeyK`);

    await expect(searchInput).toBeFocused();
  });

  test("typing in search input displays instant dropdown and navigates on click", async ({ page }) => {
    await page.goto("/");
    const searchInput = page.getByPlaceholder("جستجوی محصولات...");
    await expect(searchInput).toBeVisible();
    await searchInput.fill("VF 86");

    const dropdown = page.locator("#header-search-results");
    await expect(dropdown).toBeVisible({ timeout: 8000 });

    const option = dropdown.getByRole("option").first();
    await expect(option).toBeVisible();
    await option.click();

    await expect(page).toHaveURL(/\/product\/.*sku=/);
  });
});

test.describe("Search Results Page (/search)", () => {
  test("renders search results with category pills and variant cards", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/search?q=تک فاز");
    await expect(page.locator("h1, h2").first()).toBeVisible();
    await expect(page.getByText("فقط کالاهای موجود")).toBeVisible();
    await expect(page.getByRole("button", { name: "همه تجهیزات" })).toBeVisible();

    // Results cards should be displayed
    const cards = page.locator(".group.flex.flex-col");
    await expect(cards.first()).toBeVisible();
  });

  test("empty query results display fallback consultation and suggestion", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/search?q=unknownequipmentxyz999");
    await expect(page.getByText("محصولی با مشخصات مورد نظر یافت نشد")).toBeVisible();
    await expect(page.getByText("استعلام موجودی در واتس‌اپ")).toBeVisible();
  });
});

test.describe("Variant Deep Linking via SKU", () => {
  test("pre-selects variant matching SKU on product detail page", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/product/worm-gearbox-vf?sku=10000014");
    // Verify that the variant with SKU 10000014 is pre-selected and rendered
    await expect(page.locator('bdi:text("10000014")')).toBeVisible();
    // Verify the inquiry link strictly includes the SKU
    const whatsappLink = page.getByRole("link", { name: "ارتباط در واتساپ" });
    await expect(whatsappLink).toBeVisible();
    await expect(whatsappLink).toHaveAttribute("href", /10000014/);
  });
});

test.describe("Product Image Magnifier / Zoom Effect", () => {
  test("interactive inner lens zoom on desktop hover and fullscreen modal on click", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/product/cubic-gearbox-nmrv?sku=10000021");

    // If lead inquiry modal appears, dismiss it
    const leadClose = page.getByRole("button", { name: "بستن" });
    if (await leadClose.isVisible({ timeout: 1500 }).catch(() => false)) {
      await leadClose.click();
    }

    const zoomContainer = page.locator('[data-testid="product-image-zoom-container"]');
    await expect(zoomContainer).toBeVisible();

    // Hover to activate desktop inner lens
    await zoomContainer.hover();
    const zoomBadge = zoomContainer.getByText(/ذره‌بین|بزرگنمایی/);
    await expect(zoomBadge.first()).toBeVisible();

    // Click to open fullscreen zoom modal
    await zoomContainer.click();
    const modal = page.getByRole("dialog", { name: "بزرگنمایی تمام‌صفحه تصویر" });
    await expect(modal).toBeVisible();

    // Verify modal controls
    await expect(page.getByRole("button", { name: "افزایش بزرگنمایی" })).toBeVisible();
    await expect(page.getByRole("button", { name: "کاهش بزرگنمایی" })).toBeVisible();
    await expect(page.getByRole("button", { name: "بازنشانی بزرگنمایی" })).toBeVisible();

    // Close modal via close button
    const closeBtn = page.getByRole("button", { name: "بستن بزرگنمایی" });
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();
    await expect(modal).toHaveCount(0);
  });
});

test.describe("Mobile Search UX & Fullscreen Overlay", () => {
  test("tapping mobile search trigger opens full-screen overlay and searches", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    const mobileTrigger = page.getByRole("button", { name: "جستجوی سریع محصولات" }).first();
    await expect(mobileTrigger).toBeVisible();
    await mobileTrigger.click();

    // Verify full-screen overlay
    const overlay = page.getByRole("dialog", { name: "جستجوی سریع محصولات" });
    await expect(overlay).toBeVisible();

    // Input should be visible
    const input = overlay.getByPlaceholder("جستجوی محصولات...");
    await expect(input).toBeVisible();

    // Type query
    await input.fill("گیربکس");

    // Match items should appear
    const item = overlay.locator("[role='option']").first();
    await expect(item).toBeVisible({ timeout: 8000 });

    // Back button should close overlay
    const backBtn = overlay.getByRole("button", { name: "بستن جستجو" });
    await expect(backBtn).toBeVisible();
    await backBtn.click();
    await expect(overlay).toHaveCount(0);
  });
});
