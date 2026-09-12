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
      const text = message.text();
      // Ignore transient third-party external resource connection failures (e.g. Google Fonts)
      if (text.includes("fonts.googleapis.com") || text.includes("fonts.gstatic.com")) {
        return;
      }
      const source = message.location().url;
      errors.push(source ? `${text} (${source})` : text);
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

test("product page displays lead capture popup form and accepts inquiries", async ({ page }) => {
  await page.goto("/product/worm-gearbox-vf");

  // Verify the trigger button is visible in the CTA section
  const triggerBtn = page.getByRole("button", { name: /استعلام آنلاین قیمت و پیش‌فاکتور/ });
  await expect(triggerBtn).toBeVisible();

  // Verify floating button is visible
  const floatingBtn = page.getByRole("button", { name: /استعلام فوری قیمت و پیش فاکتور/ });
  await expect(floatingBtn).toBeVisible();

  // Click trigger to open modal
  await triggerBtn.click();

  // Modal dialog should appear
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("heading", { name: "دریافت پیش‌فاکتور رسمی و بهترین قیمت روز" })).toBeVisible();

  // Fill in the form
  await page.getByLabel(/نام و نام خانوادگی/).fill("مهدی تستی");
  await page.getByLabel(/شماره همراه/).fill("09121111111");
  await page.getByLabel(/نام شرکت/).fill("کارگاه تولیدی تست");
  await page.getByLabel(/توضیحات/).fill("درخواست پیش‌فاکتور ۲ دستگاه");

  // Mock /api/leads so e2e test doesn't depend on external network latency
  await page.route("**/api/leads", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        message: "درخواست شما با موفقیت در سیستم ثبت شد!",
        contactId: "mock-contact-id",
        dealId: "mock-deal-id",
      }),
    });
  });

  // Submit the form
  await page.getByRole("button", { name: /ثبت درخواست و تماس کارشناس/ }).click();

  // Verify success confirmation view is shown
  await expect(page.getByRole("heading", { name: "درخواست شما با موفقیت در سیستم ثبت شد!" })).toBeVisible();
  await expect(page.getByRole("button", { name: "بستن پنجره" })).toBeVisible();

  // Verify reset/new inquiry button is available on success screen
  const newInquiryBtn = page.getByRole("button", { name: /ثبت استعلام جدید یا محصول دیگر/ });
  await expect(newInquiryBtn).toBeVisible();
  await newInquiryBtn.click();

  // After clicking reset, the form is visible again
  await expect(page.getByRole("button", { name: /ثبت درخواست و تماس کارشناس/ })).toBeVisible();

  // Close modal via close button
  await page.getByRole("button", { name: "بستن" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

