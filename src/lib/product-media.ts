import mediaManifest from "@/data/product-media.json";

export interface ProductMedia {
  images: string[];
  videos: string[];
}

const EMPTY_MEDIA: ProductMedia = { images: [], videos: [] };
const ELECTROMOTOR_FALLBACKS = [
  "/media/products/fallback/electromotor-1.png",
  "/media/products/fallback/electromotor-2.png",
  "/media/products/fallback/electromotor-3.png",
];

const manifest = mediaManifest as Record<string, ProductMedia>;

export function productMediaForSku(sku?: string | null): ProductMedia {
  if (!sku) return EMPTY_MEDIA;
  return manifest[sku] || EMPTY_MEDIA;
}

export function productImageForVariant(
  sku: string | null | undefined,
  _mainCategory: string,
  familyImage?: string | null
): string {
  const uploadedImage = productMediaForSku(sku).images[0];
  if (uploadedImage) return uploadedImage;
  if (familyImage?.trim()) return familyImage;
  const value = [...String(sku || "")].reduce((sum, digit) => sum + Number(digit || 0), 0);
  return ELECTROMOTOR_FALLBACKS[value % ELECTROMOTOR_FALLBACKS.length];
}

export function resolvedProductMedia(
  sku: string | null | undefined,
  mainCategory: string,
  familyImage?: string | null
): ProductMedia {
  const uploaded = productMediaForSku(sku);
  const primaryImage = productImageForVariant(sku, mainCategory, familyImage);
  return {
    images: uploaded.images.length > 0 ? uploaded.images : primaryImage ? [primaryImage] : [],
    videos: uploaded.videos,
  };
}
