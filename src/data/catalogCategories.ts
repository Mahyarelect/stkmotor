import { type LucideIcon, Cog, Settings, Droplets, Wrench } from "lucide-react";

/* ─────────────────────────────────────────────────────────────
   Catalog category data — single source of truth for Navbar,
   Home page category grid, and Footer links.
   
   To add a new sub-category, simply push into the subCategories
   array. The UI renders dynamically from this data.
   ───────────────────────────────────────────────────────────── */

export interface SubCategory {
  /** Display name (Persian) */
  name: string;
  /** URL-friendly slug */
  slug: string;
  /** Target link */
  href: string;
}

export interface CatalogCategory {
  /** Display name (Persian) */
  name: string;
  /** URL-friendly slug */
  slug: string;
  /** Target link for the main category */
  href: string;
  /** Lucide icon component */
  icon: LucideIcon;
  /** Sub-categories shown in dropdown */
  subCategories: SubCategory[];
}

/**
 * Main product categories in the exact order they should appear.
 * DO NOT reorder — the sequence is specified by business requirement.
 */
export const CATALOG_CATEGORIES: CatalogCategory[] = [
  {
    name: "الکتروموتور",
    slug: "electromotor",
    href: "/electromotors",
    icon: Cog,
    subCategories: [
      { name: "الکتروموتور تک‌فاز", slug: "single-phase", href: "/electromotors/single-phase" },
      { name: "الکتروموتور سه‌فاز", slug: "three-phase", href: "/electromotors/three-phase" },
    ],
  },
  {
    name: "گیربکس",
    slug: "gearbox",
    href: "/category/gearbox",
    icon: Settings,
    subCategories: [
      { name: "گیربکس حلزونی", slug: "worm", href: "/category/gearbox/worm" },
      { name: "گیربکس شافت مستقیم", slug: "inline-shaft", href: "/category/gearbox/inline-shaft" },
      { name: "گیربکس مکعبی", slug: "cubic", href: "/category/gearbox/cubic" },
    ],
  },
  {
    name: "پمپ",
    slug: "pump",
    href: "/category/pump",
    icon: Droplets,
    subCategories: [
      { name: "الکتروپمپ", slug: "surface-pump", href: "/category/pump/surface-pump" },
      { name: "کف‌کش", slug: "submersible-sump", href: "/category/pump/submersible-sump" },
      { name: "لجن‌کش", slug: "sewage-pump", href: "/category/pump/sewage-pump" },
      { name: "شناور", slug: "submersible-pump", href: "/category/pump/submersible-pump" },
      { name: "پمپ دنده‌ای", slug: "gear-pump", href: "/category/pump/gear-pump" },
      { name: "پمپ اسید", slug: "acid-pump", href: "/category/pump/acid-pump" },
    ],
  },
  {
    name: "لوازم جانبی",
    slug: "accessories",
    href: "/category/accessories",
    icon: Wrench,
    subCategories: [
      { name: "فلنج الکتروموتور", slug: "motor-flange", href: "/category/accessories/motor-flange" },
      { name: "براکت عقب", slug: "rear-bracket", href: "/category/accessories/rear-bracket" },
      { name: "فلنج خروجی گیربکس", slug: "gearbox-flange", href: "/category/accessories/gearbox-flange" },
    ],
  },
];
