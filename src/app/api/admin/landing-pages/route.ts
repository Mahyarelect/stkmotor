import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";

function unauthorized(error: unknown) {
  return error instanceof Error && error.message === "Unauthorized";
}

function sanitizeSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET() {
  try {
    await requireAdmin();
    const landingPages = await db.landingPage.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
    return NextResponse.json(landingPages);
  } catch (error) {
    if (unauthorized(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/admin/landing-pages error:", error);
    return NextResponse.json(
      { error: "خطا در دریافت لیست صفحات فرود" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();

    const title = String(body.title || "").trim();
    const rawSlug = String(body.slug || "").trim();
    const slug = sanitizeSlug(rawSlug);

    if (!title) {
      return NextResponse.json(
        { error: "عنوان صفحه فرود الزامی است." },
        { status: 400 }
      );
    }
    if (!slug) {
      return NextResponse.json(
        { error: "نامک (Slug) انگلیسی یا استاندارد الزامی است." },
        { status: 400 }
      );
    }

    const existing = await db.landingPage.findUnique({
      where: { slug },
    });
    if (existing) {
      return NextResponse.json(
        { error: `صفحه فرود دیگری با نامک «${slug}» قبلاً ثبت شده است.` },
        { status: 409 }
      );
    }

    const featuredFamilySlugs = Array.isArray(body.featuredFamilySlugs)
      ? JSON.stringify(body.featuredFamilySlugs)
      : typeof body.featuredFamilySlugs === "string"
      ? body.featuredFamilySlugs
      : "[]";

    const newPage = await db.landingPage.create({
      data: {
        title,
        slug,
        subtitle: String(body.subtitle || "").trim(),
        description: String(body.description || "").trim(),
        bannerUrl: String(body.bannerUrl || "").trim(),
        ctaText: String(body.ctaText || "").trim(),
        ctaLink: String(body.ctaLink || "").trim(),
        content: String(body.content || "").trim(),
        featuredFamilySlugs,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
        seoTitle: String(body.seoTitle || "").trim(),
        seoDescription: String(body.seoDescription || "").trim(),
        sortOrder: Number(body.sortOrder) || 0,
      },
    });

    return NextResponse.json(newPage, { status: 201 });
  } catch (error) {
    if (unauthorized(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("POST /api/admin/landing-pages error:", error);
    return NextResponse.json(
      { error: "خطا در ایجاد صفحه فرود جدید" },
      { status: 500 }
    );
  }
}
