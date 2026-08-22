"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { DynamicCategoryFilter, CategoryFilterValue } from "@/components/category/DynamicCategoryFilter";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ProductFamilyData } from "@/components/product/ProductCard";

export function CategoryCatalogClient({ category, title, initialSlug }: { category: string; title: string; initialSlug: string }) {
  const searchParams = useSearchParams(); const router = useRouter(); const pathname = usePathname();
  const [filter, setFilter] = useState<CategoryFilterValue>(() => ({ search: searchParams.get("search") || "", level1: searchParams.get("level1") || "", level2: searchParams.get("level2") || "", speed: searchParams.get("speed") || "" }));
  const [products, setProducts] = useState<ProductFamilyData[]>([]); const [loading, setLoading] = useState(true); const [loadingMore, setLoadingMore] = useState(false); const [meta, setMeta] = useState({ total: 0, page: 1, hasMore: false }); const sequence = useRef(0);
  useEffect(() => { const p = new URLSearchParams(); Object.entries(filter).forEach(([k,v]) => v && p.set(k,v)); router.replace(`${pathname}${p.size ? `?${p}` : ""}`, { scroll: false }); }, [filter, pathname, router]);
  const load = useCallback(async (page = 1, append = false) => { const id = ++sequence.current; if (append) setLoadingMore(true); else setLoading(true); const p = new URLSearchParams({ category, page: String(page), limit: "18" }); if (initialSlug) p.set("subCategory", initialSlug); Object.entries(filter).forEach(([k,v]) => v && p.set(k,v)); try { const response = await fetch(`/api/products?${p}`); if (!response.ok) throw new Error(String(response.status)); const data = await response.json(); if (id !== sequence.current) return; setProducts(current => append ? [...current, ...data.products] : data.products); setMeta({ total: data.total, page: data.page, hasMore: data.hasMore }); } finally { if (id === sequence.current) { setLoading(false); setLoadingMore(false); } } }, [category, filter, initialSlug]);
  useEffect(() => { void load(); }, [load]);
  const reset = () => setFilter({ search: "", level1: "", level2: "", speed: "" });
  return <div className="min-h-screen bg-slate-50/60" dir="rtl"><SiteHeader /><div className="border-b bg-white"><div className="max-w-7xl mx-auto px-4 py-3 text-sm text-gray-500"><Link href="/">خانه</Link><ChevronLeft size={13} className="inline mx-2" /><span>{title}</span></div></div><header className="bg-gradient-to-bl from-slate-900 to-blue-950 text-white"><div className="max-w-7xl mx-auto px-4 py-12"><h1 className="text-3xl font-extrabold">کاتالوگ {title}</h1><p className="mt-3 text-blue-100/75">مشخصات فنی، مقایسه مدل‌ها و استعلام قیمت محصولات</p></div></header><main className="max-w-7xl mx-auto px-4 py-8"><div className="grid lg:grid-cols-[280px_1fr] gap-7"><div><DynamicCategoryFilter category={category} value={filter} onChange={setFilter} onReset={reset} /></div><section><ProductGrid products={products} loading={loading} total={meta.total} hasMore={meta.hasMore} loadingMore={loadingMore} onLoadMore={() => void load(meta.page + 1, true)} onResetFilters={reset} itemLabel={`مدل ${title}`} /></section></div></main><SiteFooter /></div>;
}
