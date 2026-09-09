import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// PUT /api/admin/variants/[id] — update product variant
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();

    const existing = await db.productVariant.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "واریانت یافت نشد" }, { status: 404 });
    }

    const cleanSku = body.sku ? String(body.sku).trim().toUpperCase() : existing.sku;
    const parsedPrice =
      body.price !== undefined
        ? BigInt(Math.max(0, Math.floor(Number(body.price) || 0)))
        : existing.price;

    const variant = await db.productVariant.update({
      where: { id },
      data: {
        ...(body.sku !== undefined && { sku: cleanSku }),
        ...(body.name !== undefined && { name: body.name.trim() }),
        ...(body.size !== undefined && { size: body.size.trim() }),
        ...(body.power !== undefined && { power: body.power.trim() }),
        ...(body.powerKw !== undefined && { powerKw: Number(body.powerKw) || 0 }),
        ...(body.speed !== undefined && { speed: body.speed.trim() }),
        ...(body.mountingType !== undefined && { mountingType: body.mountingType.trim() }),
        ...(body.gearboxType !== undefined && { gearboxType: body.gearboxType.trim() }),
        ...(body.modelType !== undefined && { modelType: body.modelType.trim() }),
        ...(body.ratio !== undefined && { ratio: body.ratio.trim() }),
        ...(body.inputFrame !== undefined && { inputFrame: body.inputFrame.trim() }),
        ...(body.inputType !== undefined && { inputType: body.inputType.trim() }),
        ...(body.pumpType !== undefined && { pumpType: body.pumpType.trim() }),
        ...(body.outletSize !== undefined && { outletSize: body.outletSize.trim() }),
        ...(body.headMeter !== undefined && { headMeter: Number(body.headMeter) || 0 }),
        ...(body.floater !== undefined && { floater: body.floater.trim() }),
        ...(body.brand !== undefined && { brand: body.brand.trim() }),
        ...(body.bodyMaterial !== undefined && { bodyMaterial: body.bodyMaterial.trim() }),
        ...(body.flangeType !== undefined && { flangeType: body.flangeType.trim() }),
        ...(body.flangeLength !== undefined && { flangeLength: body.flangeLength.trim() }),
        ...(body.price !== undefined && { price: parsedPrice }),
        ...(body.weight !== undefined && { weight: body.weight.trim() }),
        ...(body.dimensions !== undefined && { dimensions: body.dimensions.trim() }),
        ...(body.inStock !== undefined && { inStock: Boolean(body.inStock) }),
        ...(body.attributes !== undefined && {
          attributes:
            typeof body.attributes === "string"
              ? body.attributes
              : JSON.stringify(body.attributes || {}),
        }),
        ...(body.sortOrder !== undefined && { sortOrder: Number(body.sortOrder) }),
      },
    });

    return NextResponse.json({ ...variant, price: Number(variant.price) });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (err instanceof Error && (err.message.includes("Unique") || err.message.includes("constraint"))) {
      return NextResponse.json(
        { error: "این کد SKU قبلاً برای واریانت دیگری ثبت شده است" },
        { status: 409 }
      );
    }
    console.error("Admin variant PUT error:", err);
    return NextResponse.json({ error: "خطا در بروزرسانی واریانت" }, { status: 500 });
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

    const existing = await db.productVariant.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "واریانت یافت نشد" }, { status: 404 });
    }

    await db.productVariant.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "واریانت با موفقیت حذف شد" });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Admin variant DELETE error:", err);
    return NextResponse.json({ error: "خطا در حذف واریانت" }, { status: 500 });
  }
}
