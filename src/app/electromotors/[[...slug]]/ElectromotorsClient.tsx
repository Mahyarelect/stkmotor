"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Search,
  Zap,
  Phone,
  MessageCircle,
  X,
  Sparkles,
  SlidersHorizontal,
  RotateCcw,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { CategoryBreadcrumb } from "@/components/category/CategoryBreadcrumb";
import { CategorySelector } from "@/components/category/CategorySelector";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ProductFamilyData } from "@/components/product/ProductCard";
import {
  getMotorCategoryByPath,
  getMotorBreadcrumbs,
} from "@/data/motorCategories";
import { telHref, useSiteSettings, whatsappHref } from "@/hooks/use-site-settings";

interface CatalogMeta {
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

export function ElectromotorsClient({ initialSlugs = [] }: { initialSlugs: string[] }) {
  const siteSettings = useSiteSettings();
  const phoneLink = telHref(siteSettings.phone);
  const whatsappLink = whatsappHref(siteSettings.whatsapp);

  const { activeNode } = getMotorCategoryByPath(initialSlugs);
  const breadcrumbs = getMotorBreadcrumbs(initialSlugs);

  /* Filter & Search State */
  const [products, setProducts] = useState<ProductFamilyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [catalogMeta, setCatalogMeta] = useState<CatalogMeta>({
    total: 0,
    page: 1,
    totalPages: 1,
    hasMore: false,
  });

  const [speedFilter, setSpeedFilter] = useState("all");
  const [powerFilter, setPowerFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const requestSequence = useRef(0);

  // Debounce search query
  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchQuery.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  // Fetch products from database API with backend filtering
  const fetchProducts = useCallback(
    async (pageNumber = 1, append = false) => {
      const requestId = ++requestSequence.current;
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      try {
        const params = new URLSearchParams();

        // Apply category hierarchy filters
        if (activeNode.filter.phase) {
          params.set("phase", activeNode.filter.phase);
        }
        if (activeNode.filter.shellType) {
          params.set("shellType", activeNode.filter.shellType);
        }

        // Apply user-selected filters
        if (speedFilter !== "all") params.set("speed", speedFilter);
        if (powerFilter !== "all") params.set("powerRange", powerFilter);
        if (debouncedSearch) params.set("search", debouncedSearch);

        params.set("page", String(pageNumber));
        params.set("limit", "18");

        const res = await fetch(`/api/products?${params.toString()}`);
        if (!res.ok) throw new Error(`Products query error: ${res.status}`);

        const data = await res.json();
        if (requestId !== requestSequence.current) return;

        setProducts((prev) => (append ? [...prev, ...(data.products || [])] : data.products || []));
        setCatalogMeta({
          total: data.total || 0,
          page: data.page || pageNumber,
          totalPages: data.totalPages || 1,
          hasMore: Boolean(data.hasMore),
        });
      } catch (err) {
        if (requestId === requestSequence.current) {
          console.error("Failed to load products:", err);
          if (!append) setProducts([]);
        }
      } finally {
        if (requestId === requestSequence.current) {
          if (append) {
            setLoadingMore(false);
          } else {
            setLoading(false);
          }
        }
      }
    },
    [activeNode.filter.phase, activeNode.filter.shellType, speedFilter, powerFilter, debouncedSearch]
  );

  // Re-fetch when category node or filters change
  useEffect(() => {
    fetchProducts(1, false);
  }, [fetchProducts]);

  const hasActiveFilters = speedFilter !== "all" || powerFilter !== "all" || searchQuery !== "";

  const handleResetFilters = () => {
    setSpeedFilter("all");
    setPowerFilter("all");
    setSearchQuery("");
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col" dir="rtl">
      {/* ─── Site Navigation Header ─── */}
      <SiteHeader />

      {/* ─── Breadcrumb ─── */}
      <CategoryBreadcrumb breadcrumbs={breadcrumbs} />

      {/* ─── Hero / Category Header ─── */}
      <header className="bg-gradient-to-bl from-slate-900 via-blue-950 to-slate-900 text-white relative overflow-hidden border-b border-blue-900/40">
        {/* Subtle geometric background */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#60a5fa_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 py-10 sm:py-14">
          <div className="max-w-3xl">
            <Badge className="bg-blue-600/40 hover:bg-blue-600/50 text-blue-200 border-blue-400/30 text-xs mb-3.5 inline-flex items-center gap-1">
              <Zap size={12} className="text-blue-300" />
              کاتالوگ تخصصی محصولات STK
            </Badge>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-3 text-white">
              {activeNode.title}
            </h1>
            <p className="text-blue-100/80 text-sm sm:text-base leading-relaxed">
              {activeNode.description}
            </p>
          </div>
        </div>
      </header>

      {/* ─── Main Content Container ─── */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:py-12 w-full flex-1">
        {/* ─── Visual Category Cards (Only relevant children of current parent) ─── */}
        <CategorySelector slugs={initialSlugs} activeCategory={activeNode} />

        {/* ─── Products Catalog Section ─── */}
        <section aria-labelledby="products-catalog-heading">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 id="products-catalog-heading" className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
                محصولات {activeNode.title}
              </h2>
              <p className="text-xs sm:text-sm text-gray-500">
                بررسی مشخصات، سایزهای فریم و استعلام مشخصات فنی
              </p>
            </div>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="text-xs text-blue-700 hover:bg-blue-50 self-start sm:self-auto"
              >
                <RotateCcw size={13} className="ml-1" />
                حذف تمام فیلترها
              </Button>
            )}
          </div>

          {/* Filters Bar */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 mb-8 shadow-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* Search */}
              <div className="relative sm:col-span-2">
                <Search
                  size={16}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <Input
                  placeholder="جستجوی مدل، کد محصول یا مشخصه فنی..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10 bg-slate-50/50 border-gray-200 focus:bg-white text-sm h-10"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Power / HP Filter (Primary Filter) */}
              <div>
                <Select value={powerFilter} onValueChange={setPowerFilter}>
                  <SelectTrigger className="w-full bg-slate-50/50 border-gray-200 text-sm h-10">
                    <SelectValue placeholder="توان (اسب بخار / kW)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه توان‌ها (HP / kW)</SelectItem>
                    <SelectItem value="0-0.75">تا ۱ اسب (تا ۰.۷۵ kW)</SelectItem>
                    <SelectItem value="0.75-3">۱ تا ۴ اسب (۰.۷۵ تا ۳ kW)</SelectItem>
                    <SelectItem value="3-11">۴ تا ۱۵ اسب (۳ تا ۱۱ kW)</SelectItem>
                    <SelectItem value="11-45">۱۵ تا ۶۰ اسب (۱۱ تا ۴۵ kW)</SelectItem>
                    <SelectItem value="45-110">۶۰ تا ۱۵۰ اسب (۴۵ تا ۱۱۰ kW)</SelectItem>
                    <SelectItem value="110-999">بالای ۱۵۰ اسب (بالای ۱۱۰ kW)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Speed Filter */}
              <div>
                <Select value={speedFilter} onValueChange={setSpeedFilter}>
                  <SelectTrigger className="w-full bg-slate-50/50 border-gray-200 text-sm h-10">
                    <SelectValue placeholder="دور بر دقیقه" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه سرعت‌ها (RPM)</SelectItem>
                    <SelectItem value="750">۷۵۰ دور (RPM)</SelectItem>
                    <SelectItem value="1000">۱۰۰۰ دور (RPM)</SelectItem>
                    <SelectItem value="1400">۱۴۰۰ دور (RPM)</SelectItem>
                    <SelectItem value="3000">۳۰۰۰ دور (RPM)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Product Grid */}
          <ProductGrid
            products={products}
            loading={loading}
            total={catalogMeta.total}
            hasMore={catalogMeta.hasMore}
            loadingMore={loadingMore}
            onLoadMore={() => fetchProducts(catalogMeta.page + 1, true)}
            onResetFilters={hasActiveFilters ? handleResetFilters : undefined}
          />
        </section>

        {/* ─── Technical Consultation Section ─── */}
        <section className="mt-16 bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-lg">
          <div className="relative z-10 max-w-2xl">
            <h3 className="text-xl sm:text-2xl font-bold mb-3">
              به مشاوره تخصصی در انتخاب مدل نیاز دارید؟
            </h3>
            <p className="text-blue-100/80 text-xs sm:text-sm leading-relaxed mb-6">
              کارشناسان مهندسی STK با سال‌ها تجربه آماده راهنمایی شما در زمینه انتخاب مناسب‌ترین فریم، توان و مشخصات حرارتی الکتروموتور هستند.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href={phoneLink}>
                <Button className="bg-white text-blue-900 hover:bg-blue-50 font-bold px-6 shadow-sm">
                  <Phone size={15} className="ml-1.5" />
                  تماس مستقیم با کارشناس
                </Button>
              </a>
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                <Button
                  variant="outline"
                  className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white px-6"
                >
                  <MessageCircle size={15} className="ml-1.5" />
                  مشاوره در واتساپ
                </Button>
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* ─── Site Footer ─── */}
      <SiteFooter />
    </div>
  );
}
