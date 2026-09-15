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

export async function GET(
  _request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await props.params;
    const page = await db.landingPage.findUnique({
      where: { id },
    });
    if (!page) {
      return NextResponse.json(
        { error: "صفحه فرود مورد نظر یافت نشد." },
        { status: 404 }
      );
    }
    return NextResponse.json(page);
  } catch (error) {
    if (unauthorized(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/admin/landing-pages/[id] error:", error);
    return NextResponse.json(
      { error: "خطا در دریافت اطلاعات صفحه فرود" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await props.params;
    const body = await request.json();

    const existing = await db.landingPage.findUnique({
      where: { id },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "صفحه فرود مورد نظر یافت نشد." },
        { status: 404 }
      );
    }

    const title = body.title !== undefined ? String(body.title).trim() : existing.title;
    let slug = existing.slug;
    if (body.slug !== undefined) {
      slug = sanitizeSlug(String(body.slug));
      if (!slug) {
        return NextResponse.json(
          { error: "نامک (Slug) نمی‌تواند خالی باشد." },
          { status: 400 }
        );
      }
      if (slug !== existing.slug) {
        const slugExists = await db.landingPage.findUnique({
          where: { slug },
        });
        if (slugExists) {
          return NextResponse.json(
            { error: `صفحه فرود دیگری با نامک «${slug}» قبلاً ثبت شده است.` },
            { status: 409 }
          );
        }
      }
    }

    const featuredFamilySlugs = body.featuredFamilySlugs !== undefined
      ? Array.isArray(body.featuredFamilySlugs)
        ? JSON.stringify(body.featuredFamilySlugs)
        : typeof body.featuredFamilySlugs === "string"
        ? body.featuredFamilySlugs
        : "[]"
      : existing.featuredFamilySlugs;

    const updated = await db.landingPage.update({
      where: { id },
      data: {
        title,
        slug,
        subtitle: body.subtitle !== undefined ? String(body.subtitle).trim() : existing.subtitle,
        description: body.description !== undefined ? String(body.description).trim() : existing.description,
        bannerUrl: body.bannerUrl !== undefined ? String(body.bannerUrl).trim() : existing.bannerUrl,
        ctaText: body.ctaText !== undefined ? String(body.ctaText).trim() : existing.ctaText,
        ctaLink: body.ctaLink !== undefined ? String(body.ctaLink).trim() : existing.ctaLink,
        content: body.content !== undefined ? String(body.content).trim() : existing.content,
        featuredFamilySlugs,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : existing.isActive,
        seoTitle: body.seoTitle !== undefined ? String(body.seoTitle).trim() : existing.seoTitle,
        seoDescription: body.seoDescription !== undefined ? String(body.seoDescription).trim() : existing.seoDescription,
        sortOrder: body.sortOrder !== undefined ? Number(body.sortOrder) || 0 : existing.sortOrder,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (unauthorized(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("PUT /api/admin/landing-pages/[id] error:", error);
    return NextResponse.json(
      { error: "خطا در به‌روزرسانی صفحه فرود" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await props.params;

    const existing = await db.landingPage.findUnique({
      where: { id },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "صفحه فرود مورد نظر یافت نشد." },
        { status: 404 }
      );
    }

    await db.landingPage.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "صفحه فرود با موفقیت حذف شد." });
  } catch (error) {
    if (unauthorized(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("DELETE /api/admin/landing-pages/[id] error:", error);
    return NextResponse.json(
      { error: "خطا در حذف صفحه فرود" },
      { status: 500 }
    );
  }
}
