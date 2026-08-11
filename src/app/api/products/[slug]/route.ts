import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/products/[slug] — single product family with all variants
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const family = await db.productFamily.findUnique({
    where: { slug },
    include: {
      variants: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!family) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
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
}
