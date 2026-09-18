import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolvedProductMedia } from "@/lib/product-media";

const SLUG_ALIASES: Record<string, string> = {
  "worm-gearbox-vf": "worm-gearbox",
  "worm-gearbox-mvf": "worm-gearbox",
  "worm-gearbox-combined-vf": "worm-gearbox",
  "worm-gearbox-combined-mvf": "worm-gearbox",
  "cubic-gearbox-nmrv": "cubic-gearbox-nmrv-30",
};

// GET /api/products/[slug] — single product family with all variants
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const targetSlug = SLUG_ALIASES[slug] || slug;

  const family = await db.productFamily.findUnique({
    where: { slug: targetSlug },
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
    media: resolvedProductMedia(
      v.sku,
      family.mainCategory,
      family.imageUrl,
      `${family.category} ${family.phase}`,
      v.attributes
    ),
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
