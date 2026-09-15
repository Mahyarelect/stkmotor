import test from "node:test";
import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

test("CMS - AboutPage Model & Data Integrity", async (t) => {
  await t.test("can fetch or create default about page", async () => {
    let about = await prisma.aboutPage.findFirst();
    if (!about) {
      about = await prisma.aboutPage.create({
        data: {},
      });
    }

    assert.ok(about, "AboutPage record should exist");
    assert.ok(about.title, "AboutPage should have a title");

    // Verify values JSON
    const values = JSON.parse(about.values || "[]");
    assert.ok(Array.isArray(values), "values should be an array");

    // Verify stats JSON
    const stats = JSON.parse(about.stats || "[]");
    assert.ok(Array.isArray(stats), "stats should be an array");

    // Verify gallery JSON
    const gallery = JSON.parse(about.gallery || "[]");
    assert.ok(Array.isArray(gallery), "gallery should be an array");
  });

  await t.test("can update about page story and values", async () => {
    let about = await prisma.aboutPage.findFirst();
    assert.ok(about);

    const testValue = [{ title: "تعهد به کیفیت", description: "تست", icon: "Award" }];
    const updated = await prisma.aboutPage.update({
      where: { id: about.id },
      data: {
        storyTitle: "داستان رشد STK",
        values: JSON.stringify(testValue),
      },
    });

    assert.strictEqual(updated.storyTitle, "داستان رشد STK");
    const parsed = JSON.parse(updated.values);
    assert.strictEqual(parsed[0].title, "تعهد به کیفیت");
  });
});

test("CMS - LandingPage Model & Slug Management", async (t) => {
  const testSlug = "test-campaign-" + Date.now();

  await t.test("can create, query and update a landing page", async () => {
    const page = await prisma.landingPage.create({
      data: {
        title: "جشنواره بهاره الکتروموتور",
        slug: testSlug,
        subtitle: "تخفیف‌های استثنایی برای همکاران",
        ctaText: "ثبت سفارش فوری",
        ctaLink: "/electromotors",
        featuredFamilySlugs: JSON.stringify(["motogen-three-phase-cast-iron", "motogen-single-phase-dual-cap"]),
        isActive: true,
      },
    });

    assert.strictEqual(page.slug, testSlug);
    assert.strictEqual(page.isActive, true);

    const queried = await prisma.landingPage.findUnique({
      where: { slug: testSlug },
    });
    assert.ok(queried);
    assert.strictEqual(queried.title, "جشنواره بهاره الکتروموتور");

    const families = JSON.parse(queried.featuredFamilySlugs);
    assert.strictEqual(families.length, 2);
  });

  await t.test("enforces unique slug constraint", async () => {
    await assert.rejects(
      async () => {
        await prisma.landingPage.create({
          data: {
            title: "تست تکراری",
            slug: testSlug,
          },
        });
      },
      /Unique constraint failed/
    );
  });

  await t.test("cleans up test landing page", async () => {
    await prisma.landingPage.deleteMany({
      where: { slug: testSlug },
    });

    const check = await prisma.landingPage.findUnique({
      where: { slug: testSlug },
    });
    assert.strictEqual(check, null);
  });
});

test.after(async () => {
  await prisma.$disconnect();
});
