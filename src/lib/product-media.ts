import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const mediaManifest = require("../data/product-media.json");

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

/**
 * Parses variant attributes string or object and extracts custom media if present.
 */
export function parseVariantAttributesMedia(attributes?: string | null | Record<string, unknown>): ProductMedia | null {
  if (!attributes) return null;
  try {
    const parsed = typeof attributes === "string" ? JSON.parse(attributes) : attributes;
    if (parsed && typeof parsed === "object") {
      const mediaObj = parsed.media && typeof parsed.media === "object" ? parsed.media : parsed;
      const hasImages = Array.isArray(mediaObj.images);
      const hasVideos = Array.isArray(mediaObj.videos);

      if (hasImages || hasVideos) {
        const images = hasImages
          ? (mediaObj.images as unknown[])
              .filter((img): img is string => typeof img === "string" && img.trim().length > 0)
          : [];
        const videos = hasVideos
          ? (mediaObj.videos as unknown[])
              .filter((vid): vid is string => typeof vid === "string" && vid.trim().length > 0)
          : [];
        return { images, videos };
      }
    }
  } catch {
    // ignore json parse error
  }
  return null;
}

export function productMediaForSku(
  sku?: string | null,
  attributes?: string | null | Record<string, unknown>
): ProductMedia {
  const customMedia = parseVariantAttributesMedia(attributes);
  if (customMedia) {
    return customMedia;
  }
  if (!sku) return EMPTY_MEDIA;
  return manifest[sku] || EMPTY_MEDIA;
}

export function productImageForVariant(
  sku: string | null | undefined,
  mainCategory: string,
  familyImage?: string | null,
  phaseOrCategory?: string | null,
  attributes?: string | null | Record<string, unknown>
): string {
  const uploadedImage = productMediaForSku(sku, attributes).images[0];
  if (uploadedImage) return uploadedImage;
  if (familyImage?.trim()) return familyImage;
  const phase = String(phaseOrCategory || "").toLowerCase();
  const isThreePhaseElectromotor =
    mainCategory === "electromotor" &&
    (phase.includes("three") || phase.includes("سه"));
  if (!isThreePhaseElectromotor) return "";
  const value = [...String(sku || "")].reduce((sum, digit) => sum + Number(digit || 0), 0);
  return ELECTROMOTOR_FALLBACKS[value % ELECTROMOTOR_FALLBACKS.length];
}

export function resolvedProductMedia(
  sku: string | null | undefined,
  mainCategory: string,
  familyImage?: string | null,
  phaseOrCategory?: string | null,
  attributes?: string | null | Record<string, unknown>
): ProductMedia {
  const uploaded = productMediaForSku(sku, attributes);
  const primaryImage = productImageForVariant(sku, mainCategory, familyImage, phaseOrCategory, attributes);
  return {
    images: uploaded.images.length > 0 ? uploaded.images : primaryImage ? [primaryImage] : [],
    videos: uploaded.videos,
  };
}
