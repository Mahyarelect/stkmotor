import { notFound } from "next/navigation";
import { CATALOG_CATEGORIES } from "@/data/catalogCategories";
import { CategoryCatalogClient } from "./CategoryCatalogClient";

export async function generateMetadata({ params }: { params: Promise<{ category: string; slug?: string[] }> }) {
  const { category } = await params;
  const entry = CATALOG_CATEGORIES.find((item) => item.slug === category);
  return { title: entry ? `${entry.name} | STK Motors` : "کاتالوگ محصولات | STK Motors", description: entry ? `کاتالوگ، مشخصات فنی و استعلام قیمت ${entry.name}` : "کاتالوگ محصولات صنعتی" };
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string; slug?: string[] }> }) {
  const { category, slug = [] } = await params;
  const entry = CATALOG_CATEGORIES.find((item) => item.slug === category);
  if (!entry || category === "electromotor") notFound();
  return <CategoryCatalogClient category={entry.slug} title={entry.name} initialSlug={slug[0] || ""} />;
}
