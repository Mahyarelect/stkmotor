import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// POST /api/admin/variants — create a product variant
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const {
      familyId,
      sku,
      name,
      size,
      power,
      powerKw,
      speed,
      mountingType,
      gearboxType,
      modelType,
      ratio,
      inputFrame,
      inputType,
      pumpType,
      outletSize,
      headMeter,
      floater,
      brand,
      bodyMaterial,
      flangeType,
      flangeLength,
      price,
      weight,
      dimensions,
      inStock,
      attributes,
      sortOrder,
    } = body;

    if (!familyId || !sku) {
      return NextResponse.json(
        { error: "شناسه خانواده محصول (familyId) و کد محصول (sku) الزامی هستند" },
        { status: 400 }
      );
    }

    const cleanSku = String(sku).trim().toUpperCase();

    // Verify family exists
    const family = await db.productFamily.findUnique({ where: { id: familyId } });
    if (!family) {
      return NextResponse.json({ error: "خانواده محصول یافت نشد" }, { status: 404 });
    }

    const parsedPrice = typeof price === "number" ? Math.max(0, Math.floor(price)) : Number(price) || 0;

    const variant = await db.productVariant.create({
      data: {
        familyId,
        sku: cleanSku,
        name: (name || "").trim(),
        size: (size || "").trim(),
        power: (power || "").trim(),
        powerKw: Number(powerKw) || 0,
        speed: (speed || "").trim(),
        mountingType: (mountingType || "").trim(),
        gearboxType: (gearboxType || "").trim(),
        modelType: (modelType || "").trim(),
        ratio: (ratio || "").trim(),
        inputFrame: (inputFrame || "").trim(),
        inputType: (inputType || "").trim(),
        pumpType: (pumpType || "").trim(),
        outletSize: (outletSize || "").trim(),
        headMeter: Number(headMeter) || 0,
        floater: (floater || "").trim(),
        brand: (brand || family.brand || "").trim(),
        bodyMaterial: (bodyMaterial || "").trim(),
        flangeType: (flangeType || "").trim(),
        flangeLength: (flangeLength || "").trim(),
        price: BigInt(parsedPrice),
        weight: (weight || "").trim(),
        dimensions: (dimensions || "").trim(),
        inStock: inStock !== undefined ? Boolean(inStock) : true,
        attributes: typeof attributes === "string" ? attributes : JSON.stringify(attributes || {}),
        sortOrder: Number(sortOrder) || 0,
      },
    });

    return NextResponse.json({ ...variant, price: Number(variant.price) }, { status: 201 });
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
    console.error("Admin variant POST error:", err);
    return NextResponse.json({ error: "خطا در ایجاد واریانت" }, { status: 500 });
  }
}
