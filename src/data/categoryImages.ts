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
  pump: "",
  accessories: "",

  // Subcategories - Electromotor
  "single-phase": "/media/products/fallback/electromotor-2.png",
  "three-phase": "/media/products/fallback/electromotor-1.png",
  "cast-iron": "/media/products/assets/cc81acf240d59a17f0bf.webp",
  aluminum: "/media/products/assets/301b008b3ab032205493.webp",

  // Subcategories - Gearbox
  cubic: "/media/products/assets/895dff27ba068dccd40a.webp",
  worm: "/media/products/assets/005f2619a912f49197d5.webp",
  "inline-shaft": "/media/products/assets/cb599e3a10692260e20d.webp",

  // Subcategories - Pump (No defaults; images must be uploaded by admin)
  "surface-pump": "",
  "submersible-sump": "",
  "sewage-pump": "",
  "submersible-pump": "",
  "gear-pump": "",
  "acid-pump": "",

  // Subcategories - Accessories (No defaults; images must be uploaded by admin)
  "motor-flange": "",
  "rear-bracket": "",
  "gearbox-flange": "",
};

export function getCategoryDefaultImage(slug: string): string {
  if (slug === "pump" || slug === "accessories") {
    return "";
  }
  return DEFAULT_CATEGORY_IMAGES[slug] || "";
}

export function getSubcategoryDefaultImage(categorySlug: string, subCategorySlug: string): string {
  if (categorySlug === "pump" || categorySlug === "accessories") {
    return DEFAULT_CATEGORY_IMAGES[subCategorySlug] || "";
  }
  return (
    DEFAULT_CATEGORY_IMAGES[subCategorySlug] ||
    DEFAULT_CATEGORY_IMAGES[categorySlug] ||
    ""
  );
}
