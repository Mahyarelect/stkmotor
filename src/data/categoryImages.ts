/**
 * Default Curated Images for Product Categories and Subcategories
 * Used as high-quality fallbacks when custom images are not yet uploaded in admin panel.
 */

export interface CategoryImageEntry {
  slug: string;
  name: string;
  defaultImage: string;
}

export const DEFAULT_CATEGORY_IMAGES: Record<string, string> = {
  // Main Categories
  electromotor: "/media/products/fallback/electromotor-1.png",
  gearbox: "/media/products/assets/895dff27ba068dccd40a.webp",
  pump: "/media/products/fallback/electromotor-3.png",
  accessories: "/media/products/fallback/electromotor-4.jpg",

  // Subcategories - Electromotor
  "single-phase": "/media/products/fallback/electromotor-2.png",
  "three-phase": "/media/products/fallback/electromotor-1.png",
  "cast-iron": "/media/products/assets/cc81acf240d59a17f0bf.webp",
  aluminum: "/media/products/assets/301b008b3ab032205493.webp",

  // Subcategories - Gearbox
  cubic: "/media/products/assets/895dff27ba068dccd40a.webp",
  worm: "/media/products/assets/005f2619a912f49197d5.webp",
  "inline-shaft": "/media/products/assets/cb599e3a10692260e20d.webp",

  // Subcategories - Pump
  "surface-pump": "/media/products/fallback/electromotor-3.png",
  "submersible-sump": "/media/products/fallback/electromotor-3.png",
  "sewage-pump": "/media/products/fallback/electromotor-3.png",
  "submersible-pump": "/media/products/fallback/electromotor-3.png",
  "gear-pump": "/media/products/assets/895dff27ba068dccd40a.webp",
  "acid-pump": "/media/products/fallback/electromotor-3.png",

  // Subcategories - Accessories
  "motor-flange": "/media/products/fallback/electromotor-4.jpg",
  "rear-bracket": "/media/products/fallback/electromotor-4.jpg",
  "gearbox-flange": "/media/products/assets/895dff27ba068dccd40a.webp",
};

export function getCategoryDefaultImage(slug: string): string {
  return DEFAULT_CATEGORY_IMAGES[slug] || "/media/products/fallback/electromotor-1.png";
}

export function getSubcategoryDefaultImage(categorySlug: string, subCategorySlug: string): string {
  return (
    DEFAULT_CATEGORY_IMAGES[subCategorySlug] ||
    DEFAULT_CATEGORY_IMAGES[categorySlug] ||
    "/media/products/fallback/electromotor-1.png"
  );
}
