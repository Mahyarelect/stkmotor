import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolvedProductMedia } from "@/lib/product-media";

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
  const variants = family.variants.map((v) => ({
    ...v,
    price: Number(v.price),
    media: resolvedProductMedia(v.sku, family.mainCategory, family.imageUrl),
  }));
  const serialized = {
    ...family,
    imageUrl:
      variants.find((variant) => variant.media.images[0]?.includes("/media/products/assets/"))?.media.images[0] ||
      variants.find((variant) => variant.media.images[0])?.media.images[0] ||
      family.imageUrl,
    variants,
  };

  return NextResponse.json(serialized);
}
