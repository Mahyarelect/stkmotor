import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// PUT /api/admin/variants/[id] — update variant
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();

    const variant = await db.productVariant.update({
      where: { id },
      data: {
        ...(body.sku !== undefined && { sku: body.sku }),
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
      },
    });

    return NextResponse.json({ ...variant, price: Number(variant.price) });
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
