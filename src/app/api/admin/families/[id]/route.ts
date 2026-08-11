import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { normalizeProductImageUrl } from "@/lib/product-image";

// GET /api/admin/families/[id] — single family with variants
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const family = await db.productFamily.findUnique({
      where: { id },
      include: {
        variants: { orderBy: { sortOrder: "asc" } },
      },
    });

    if (!family) {
      return NextResponse.json({ error: "یافت نشد" }, { status: 404 });
    }

    // Serialize BigInt
    const serialized = {
      ...family,
      variants: family.variants.map((v) => ({
        ...v,
        price: Number(v.price),
      })),
    };

    return NextResponse.json(serialized);
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PUT /api/admin/families/[id] — update family
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();

    const family = await db.productFamily.update({
      where: { id },
      data: {
        ...(body.slug !== undefined && { slug: body.slug }),
        ...(body.name !== undefined && { name: body.name }),
        ...(body.nameEn !== undefined && { nameEn: body.nameEn }),
        ...(body.category !== undefined && { category: body.category }),
        ...(body.phase !== undefined && { phase: body.phase }),
        ...(body.shellType !== undefined && { shellType: body.shellType }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.imageUrl !== undefined && { imageUrl: normalizeProductImageUrl(body.imageUrl) || "" }),
        ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
      },
    });

    return NextResponse.json(family);
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "خطا در بروزرسانی" }, { status: 500 });
  }
}

// DELETE /api/admin/families/[id] — delete family and its variants
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    await db.productFamily.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "خطا در حذف" }, { status: 500 });
  }
}
