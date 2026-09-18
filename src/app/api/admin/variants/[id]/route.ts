import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { resolvedProductMedia } from "@/lib/product-media";

// GET /api/admin/variants/[id] — get single variant with media
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const variant = await db.productVariant.findUnique({
      where: { id },
      include: { family: true },
    });

    if (!variant) {
      return NextResponse.json({ error: "یافت نشد" }, { status: 404 });
    }

    const media = resolvedProductMedia(
      variant.sku,
      variant.family.mainCategory,
      variant.family.imageUrl,
      `${variant.family.category} ${variant.family.phase}`,
      variant.attributes
    );

    return NextResponse.json({
      ...variant,
      price: Number(variant.price),
      media,
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "خطا در بازیابی" }, { status: 500 });
  }
}

// PUT /api/admin/variants/[id] — update variant
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();

    let attributesUpdate = body.attributes;
    if (body.media !== undefined) {
      let existingAttributes: Record<string, unknown> = {};
      const current = await db.productVariant.findUnique({
        where: { id },
        select: { attributes: true },
      });
      try {
        if (current?.attributes) {
          existingAttributes = JSON.parse(current.attributes);
        }
      } catch {
        existingAttributes = {};
      }
      existingAttributes.media = {
        images: Array.isArray(body.media?.images)
          ? body.media.images.filter((img: unknown) => typeof img === "string" && img.trim().length > 0)
          : [],
        videos: Array.isArray(body.media?.videos)
          ? body.media.videos.filter((vid: unknown) => typeof vid === "string" && vid.trim().length > 0)
          : [],
      };
      attributesUpdate = JSON.stringify(existingAttributes);
    }

    const variant = await db.productVariant.update({
      where: { id },
      data: {
        ...(body.sku !== undefined && { sku: body.sku }),
        ...(body.name !== undefined && { name: body.name }),
        ...(body.size !== undefined && { size: body.size }),
        ...(body.power !== undefined && { power: body.power }),
        ...(body.powerKw !== undefined && { powerKw: body.powerKw }),
        ...(body.speed !== undefined && { speed: body.speed }),
        ...(body.mountingType !== undefined && { mountingType: body.mountingType }),
        ...(body.price !== undefined && { price: BigInt(body.price) }),
        ...(body.weight !== undefined && { weight: body.weight }),
        ...(body.dimensions !== undefined && { dimensions: body.dimensions }),
        ...(body.inStock !== undefined && { inStock: body.inStock }),
        ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
        ...(attributesUpdate !== undefined && { attributes: attributesUpdate }),
      },
      include: { family: true },
    });

    const media = resolvedProductMedia(
      variant.sku,
      variant.family.mainCategory,
      variant.family.imageUrl,
      `${variant.family.category} ${variant.family.phase}`,
      variant.attributes
    );

    return NextResponse.json({
      ...variant,
      price: Number(variant.price),
      media,
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "خطا در بروزرسانی" }, { status: 500 });
  }
}

// DELETE /api/admin/variants/[id] — delete variant
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    await db.productVariant.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "خطا در حذف" }, { status: 500 });
  }
}
