import { expect, test, type Page } from "@playwright/test";

const publicRoutes = [
  ["/", /تجهیزات صنعتی برای حرکت/],
  ["/electromotors", /الکتروموتور/],
  ["/category/gearbox", /کاتالوگ گیربکس/],
  ["/category/pump", /کاتالوگ پمپ/],
  ["/category/accessories", /کاتالوگ لوازم جانبی/],
  ["/product/worm-gearbox-vf", /گیربکس حلزونی سری VF/],
] as const;

function watchRuntimeErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") {
      const source = message.location().url;
      errors.push(source ? `${message.text()} (${source})` : message.text());
    }
  });
  return errors;
}

for (const [route, heading] of publicRoutes) {
  test(`renders ${route} without crashes or horizontal overflow`, async ({ page }) => {
    const errors = watchRuntimeErrors(page);
    const response = await page.goto(route);
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1:visible")).toContainText(heading);
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    expect(errors).toEqual([]);
  });
}

test("custom 404 keeps users inside the catalog", async ({ page }) => {
  const response = await page.goto("/this-route-does-not-exist");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: /صفحه مورد نظر پیدا نشد/ })).toBeVisible();
  await expect(page.getByRole("link", { name: "صفحه اصلی" })).toHaveAttribute("href", "/");
});

test("catalog filter is shareable and changes results", async ({ page }) => {
  await page.goto("/category/gearbox");
  await page.getByPlaceholder("جستجوی نام یا کد محصول").fill("NMRV");
  await expect(page).toHaveURL(/search=NMRV/);
  await expect(page.getByRole("heading", { name: /NMRV/ })).toBeVisible();
  await expect(page.getByLabel("فیلترهای فعال").getByText("NMRV", { exact: true })).toBeVisible();
});

test("catalog API failure shows a retryable error instead of an empty state", async ({ page }) => {
  await page.route("**/api/products?**", (route) =>
    route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ error: "database unavailable" }) })
  );
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "بارگذاری کاتالوگ انجام نشد" })).toBeVisible();
  await expect(page.getByRole("button", { name: "تلاش دوباره" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "محصولی با این مشخصات یافت نشد" })).toHaveCount(0);

  await page.unroute("**/api/products?**");
  await page.getByRole("button", { name: "تلاش دوباره" }).click();
  await expect(page.getByRole("heading", { name: /الکتروموتور تک‌فاز پوسته چدنی 1400 دور/ })).toBeVisible();
});

test("product variant selection updates the selected state", async ({ page }) => {
  await page.goto("/product/worm-gearbox-vf");
  await expect(page.getByRole("heading", { level: 1, name: /گیربکس حلزونی سری VF/ })).toBeVisible();
  const choices = page.locator('button[aria-pressed]');
  expect(await choices.count()).toBeGreaterThan(1);
  const target = choices.nth(1);
  await target.click();
  await expect(target).toHaveAttribute("aria-pressed", "true");
});

test("product detail renders its SKU image gallery and playable videos", async ({ page }) => {
  await page.goto("/product/single-phase-aluminum-1400");
  const gallery = page.getByRole("region", { name: /رسانه‌های/ });
  const primaryImage = gallery.locator("img").first();
  await expect(primaryImage).toBeVisible();
  await expect.poll(() => primaryImage.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
  const videoChoice = gallery.getByRole("button", { name: /ویدیو/ }).first();
  await expect(videoChoice).toBeVisible();
  await videoChoice.click();
  await expect(gallery.locator("video[controls]")).toBeVisible();
});

test("mobile navigation, filter drawer, and layouts remain usable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "منوی سایت" }).click();
  await expect(page.getByRole("link", { name: "گیربکس", exact: true }).last()).toBeVisible();

  await page.goto("/category/pump");
  await page.getByRole("button", { name: "فیلتر محصولات" }).click();
  const drawer = page.getByRole("dialog");
  await expect(drawer).toBeVisible();
  await drawer.getByPlaceholder("جستجوی نام یا کد محصول").fill("اسید");
  await expect(page).toHaveURL(/search=/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("admin login is reachable and protected APIs reject anonymous access", async ({ page, request }) => {
  await page.goto("/panel");
  await expect(page.getByRole("heading", { name: "پنل مدیریت" })).toBeVisible();
  const response = await request.get("/api/admin/families");
  expect(response.status()).toBe(401);
});

test("admin pricing preview and product image uploader are usable", async ({ page }) => {
  await page.goto("/panel");
  await page.getByLabel("نام کاربری").fill("admin");
  await page.getByLabel("رمز عبور").fill("Admin123456!");
  await page.getByRole("button", { name: "ورود به پنل" }).click();
  await expect(page).toHaveURL(/\/panel\/dashboard/);

  await page.getByRole("button", { name: "مدیریت قیمت‌ها" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "مدیریت قیمت‌ها" })).toBeVisible();
  await page.locator("select").first().selectOption("accessories");
  await page.locator('input[type="number"]').fill("1");
  await page.getByRole("button", { name: "ساخت پیش‌نمایش" }).click();
  await expect(page.getByText(/پیش‌نمایش \d+ تغییر از 94 محصول آماده شد/)).toBeVisible();
  await expect(page.getByRole("button", { name: "تأیید و ثبت" })).toBeVisible();

  const familyResponse = await page.request.get("/api/admin/families");
  const families = await familyResponse.json();
  await page.goto(`/panel/families/${families[0].id}`);
  await page.getByRole("button", { name: "ویرایش" }).click();
  await expect(page.getByRole("button", { name: /تصویر را بکشید و رها کنید/ })).toBeVisible();
  await expect(page.locator('input[type="file"][accept*="image/webp"]')).toHaveCount(1);
});
