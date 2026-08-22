import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// POST /api/admin/variants — create a variant
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { familyId, sku, size, power, powerKw, speed, mountingType, price, weight, dimensions, inStock, sortOrder } = body;

    if (!familyId || !sku) {
      return NextResponse.json(
        { error: "familyId و sku الزامی هستند" },
        { status: 400 }
      );
    }

    const variant = await db.productVariant.create({
      data: {
        familyId,
        sku,
        size: size || "",
        power: power || "",
        powerKw: powerKw || 0,
        speed: speed || "",
        mountingType: mountingType || "",
        price: price || 0,
        weight: weight || "",
        dimensions: dimensions || "",
        inStock: inStock !== undefined ? inStock : true,
        sortOrder: sortOrder || 0,
      },
    });

    return NextResponse.json({ ...variant, price: Number(variant.price) }, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (err instanceof Error && err.message.includes("Unique")) {
      return NextResponse.json(
        { error: "این کد SKU قبلاً ثبت شده است" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "خطا در ایجاد واریانت" }, { status: 500 });
  }
}
