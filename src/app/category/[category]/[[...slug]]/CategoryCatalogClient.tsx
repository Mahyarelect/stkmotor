"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Layers, SlidersHorizontal, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { DynamicCategoryFilter, CategoryFilterValue } from "@/components/category/DynamicCategoryFilter";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ProductFamilyData } from "@/components/product/ProductCard";
import { CATALOG_CATEGORIES } from "@/data/catalogCategories";
import { useCategories } from "@/hooks/use-categories";
import { CategoryCard } from "@/components/category/CategoryCard";

const CUBIC_TYPES = [
  { value: "", label: "همه تیپ‌ها" },
  { value: "25", label: "تیپ ۲۵" },
  { value: "30", label: "تیپ ۳۰" },
  { value: "40", label: "تیپ ۴۰" },
  { value: "50", label: "تیپ ۵۰" },
  { value: "63", label: "تیپ ۶۳" },
  { value: "75", label: "تیپ ۷۵" },
  { value: "90", label: "تیپ ۹۰" },
  { value: "110", label: "تیپ ۱۱۰" },
  { value: "130", label: "تیپ ۱۳۰" },
  { value: "150", label: "تیپ ۱۵۰" },
];

export function CategoryCatalogClient({
  category,
  title,
  initialSlug,
}: {
  category: string;
  title: string;
  initialSlug: string;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { getCategoryImage, getSubcategoryDefaultImage } = useCategories();

  const [filter, setFilter] = useState<CategoryFilterValue>(() => ({
    search: searchParams.get("search") || "",
    level1: searchParams.get("level1") || (initialSlug === "cubic" ? "مکعبی" : initialSlug === "worm" ? "حلزونی" : ""),
    level2: searchParams.get("level2") || "",
    speed: searchParams.get("speed") || "",
  }));

  const [products, setProducts] = useState<ProductFamilyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [meta, setMeta] = useState({ total: 0, page: 1, hasMore: false });
  const sequence = useRef(0);

  useEffect(() => {
    const p = new URLSearchParams();
    Object.entries(filter).forEach(([k, v]) => v && p.set(k, v));
    router.replace(`${pathname}${p.size ? `?${p}` : ""}`, { scroll: false });
  }, [filter, pathname, router]);

  const load = useCallback(
    async (page = 1, append = false) => {
      const id = ++sequence.current;
      if (append) setLoadingMore(true);
      else setLoading(true);

      const p = new URLSearchParams({ category, page: String(page), limit: "18" });
      if (initialSlug) p.set("subCategory", initialSlug);
      Object.entries(filter).forEach(([k, v]) => v && p.set(k, v));

      try {
        const response = await fetch(`/api/products?${p}`);
        if (!response.ok) throw new Error(String(response.status));
        const data = await response.json();
        if (id !== sequence.current) return;

        setProducts((current) => (append ? [...current, ...data.products] : data.products));
        setMeta({ total: data.total, page: data.page, hasMore: data.hasMore });
      } finally {
        if (id === sequence.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [category, filter, initialSlug]
  );

  useEffect(() => {
    void load();
  }, [load]);

  const reset = () => setFilter({ search: "", level1: "", level2: "", speed: "" });

  const catalogCategoryData = useMemo(
    () => CATALOG_CATEGORIES.find((c) => c.slug === category),
    [category]
  );

  const isCubicActive =
    category === "gearbox" && (initialSlug === "cubic" || filter.level1 === "مکعبی");

  const categoryHeroImage = getCategoryImage(category);

  return (
    <div className="min-h-screen bg-slate-50/60 flex flex-col" dir="rtl">
      <SiteHeader />

      {/* Breadcrumbs */}
      <div className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 py-3 text-sm text-gray-500 flex items-center gap-1.5 flex-wrap">
          <Link href="/" className="hover:text-blue-600 transition-colors">
            خانه
          </Link>
          <ChevronLeft size={13} className="text-gray-400" />
          <Link href={`/category/${category}`} className="hover:text-blue-600 transition-colors">
            {title}
          </Link>
          {initialSlug && (
            <>
              <ChevronLeft size={13} className="text-gray-400" />
              <span className="text-blue-900 font-semibold">
                {catalogCategoryData?.subCategories.find((s) => s.slug === initialSlug)?.name || initialSlug}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Hero Showcase with Category General Image */}
      <header className="bg-gradient-to-bl from-slate-900 via-blue-950 to-slate-900 text-white relative overflow-hidden border-b border-blue-900/40">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#60a5fa_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="max-w-7xl mx-auto px-4 py-10 sm:py-12 relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30 mb-3">
              <Sparkles size={13} className="text-blue-300" />
              کاتالوگ تخصصی تجهیزات صنعتی STK
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white mb-2">
              کاتالوگ {title}
              {initialSlug && (
                <span className="text-blue-300 text-xl sm:text-2xl font-bold mr-2">
                  (
                  {catalogCategoryData?.subCategories.find((s) => s.slug === initialSlug)?.name ||
                    initialSlug}
                  )
                </span>
              )}
            </h1>
            <p className="mt-2 text-blue-100/75 text-sm sm:text-base leading-relaxed">
              مشخصات فنی، مقایسه دقیق مدل‌ها و استعلام قیمت انواع {title} با گارانتی سلامت کالا.
            </p>
          </div>

          {/* General Image Display Badge */}
          {categoryHeroImage && (
            <div className="shrink-0 w-36 h-36 sm:w-44 sm:h-44 rounded-2xl bg-white/10 backdrop-blur-md p-3 border border-white/20 shadow-2xl flex items-center justify-center">
              <img
                src={categoryHeroImage}
                alt={title}
                className="w-full h-full object-contain drop-shadow-lg"
              />
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 w-full flex-1">
        {/* ─── Visual Subcategory Entry Cards (When on main category page) ─── */}
        {!initialSlug && catalogCategoryData && catalogCategoryData.subCategories.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-6 bg-blue-600 rounded-full" />
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                  انتخاب زیردسته {title}
                </h2>
              </div>
              <span className="text-xs text-gray-400 hidden sm:inline">
                جهت محدود کردن محصولات، زیردسته مورد نظر را انتخاب نمایید
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {catalogCategoryData.subCategories.map((sub) => {
                const subImage = getSubcategoryDefaultImage(category, sub.slug);
                return (
                  <CategoryCard
                    key={sub.slug}
                    title={sub.name}
                    href={sub.href}
                    image={subImage}
                    description={`مشاهده کاتالوگ و مدل‌های ${sub.name}`}
                  />
                );
              })}
            </div>
          </section>
        )}

        {/* ─── Special Cubic Gearbox Type Selector Bar (تیپ‌های گیربکس مکعبی) ─── */}
        {isCubicActive && (
          <section className="mb-8 p-5 rounded-2xl bg-white border border-blue-200 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <Layers size={18} className="text-blue-600" />
                <h3 className="font-bold text-base text-slate-900">
                  تفکیک گیربکس‌های مکعبی بر اساس تیپ (سایز NMRV):
                </h3>
              </div>
              <span className="text-xs text-slate-400">
                با انتخاب هر تیپ، می‌توانید نسبت تبدیل دلخواه را از روی کارت محصول انتخاب فرمایید
              </span>
            </div>

            {/* Type Pills */}
            <div className="flex flex-wrap gap-2">
              {CUBIC_TYPES.map((type) => {
                const isSelected = (filter.level2 || "") === type.value;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => {
                      setFilter((prev) => ({
                        ...prev,
                        level1: "مکعبی",
                        level2: type.value,
                      }));
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isSelected
                        ? "bg-blue-600 text-white shadow-sm ring-2 ring-blue-300"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                    }`}
                  >
                    {type.label}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Catalog Grid & Filters */}
        <div className="grid lg:grid-cols-[280px_1fr] gap-7">
          <div>
            <DynamicCategoryFilter
              category={category}
              value={filter}
              onChange={setFilter}
              onReset={reset}
            />
          </div>
          <section>
            <ProductGrid
              products={products}
              loading={loading}
              total={meta.total}
              hasMore={meta.hasMore}
              loadingMore={loadingMore}
              onLoadMore={() => void load(meta.page + 1, true)}
              onResetFilters={reset}
              itemLabel={`مدل ${title}`}
            />
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
