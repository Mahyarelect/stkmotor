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
      { name: "گیربکس حلزونی", slug: "helical", href: "/category/gearbox/helical" },
      { name: "گیربکس شافت مستقیم", slug: "inline-shaft", href: "/category/gearbox/inline-shaft" },
      { name: "گیربکس مکعبی", slug: "cubic", href: "/category/gearbox/cubic" },
      { name: "گیربکس ویترینی", slug: "showcase", href: "/category/gearbox/showcase" },
    ],
  },
  {
    name: "پمپ",
    slug: "pump",
    href: "/category/pump",
    icon: Droplets,
    subCategories: [],
  },
  {
    name: "لوازم جانبی",
    slug: "accessories",
    href: "/category/accessories",
    icon: Wrench,
    subCategories: [],
  },
];
