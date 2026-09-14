"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Filter,
  ArrowUpDown,
  CheckCircle2,
  AlertCircle,
  Phone,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Sparkles,
  Zap,
  Gauge,
  Layers,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { telHref, useSiteSettings, whatsappHref } from "@/hooks/use-site-settings";
import { SearchResponse, SearchResultItem } from "@/lib/search/search-service";

function formatPrice(price: number): string {
  if (!price || price === 0) return "تماس بگیرید";
  return new Intl.NumberFormat("fa-IR").format(price) + " تومان";
}

function faNum(val: number | string): string {
  return String(val).replace(/\d/g, (d) => "\u06F0\u06F1\u06F2\u06F3\u06F4\u06F5\u06F6\u06F7\u06F8\u06F9"[parseInt(d)]);
}

interface SearchResultsClientProps {
  initialQuery?: string;
  initialCategory?: string;
  initialSpeed?: string;
  initialInStock?: boolean;
  initialSortBy?: string;
  initialPage?: number;
}

export function SearchResultsClient({
  initialQuery = "",
  initialCategory = "all",
  initialSpeed = "all",
  initialInStock = false,
  initialSortBy = "relevance",
  initialPage = 1,
}: SearchResultsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const siteSettings = useSiteSettings();
  const phoneLink = telHref(siteSettings.phone);

  const [queryInput, setQueryInput] = useState(initialQuery);
  const [activeQuery, setActiveQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [speed, setSpeed] = useState(initialSpeed);
  const [inStockOnly, setInStockOnly] = useState(initialInStock);
  const [sortBy, setSortBy] = useState(initialSortBy);
  const [page, setPage] = useState(initialPage);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SearchResponse | null>(null);

  // Sync state with URL search params
  useEffect(() => {
    const q = searchParams.get("q") || searchParams.get("query") || "";
    const cat = searchParams.get("category") || "all";
    const sp = searchParams.get("speed") || "all";
    const instock = searchParams.get("inStock") === "true";
    const sort = searchParams.get("sortBy") || "relevance";
    const p = Number.parseInt(searchParams.get("page") || "1", 10) || 1;

    setQueryInput(q);
    setActiveQuery(q);
    setCategory(cat);
    setSpeed(sp);
    setInStockOnly(instock);
    setSortBy(sort);
    setPage(p);
  }, [searchParams]);

  // Fetch search results
  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeQuery) params.set("q", activeQuery);
      if (category && category !== "all") params.set("category", category);
      if (speed && speed !== "all") params.set("speed", speed);
      if (inStockOnly) params.set("inStock", "true");
      if (sortBy && sortBy !== "relevance") params.set("sortBy", sortBy);
      if (page > 1) params.set("page", String(page));

      const res = await fetch(`/api/search?${params.toString()}`);
      if (res.ok) {
        const result: SearchResponse = await res.json();
        setData(result);
      } else {
        setData(null);
      }
    } catch (err) {
      console.error("Search fetch error:", err);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [activeQuery, category, speed, inStockOnly, sortBy, page]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  // Update URL search parameters
  const updateUrl = (overrides: {
    q?: string;
    category?: string;
    speed?: string;
    inStock?: boolean;
    sortBy?: string;
    page?: number;
  }) => {
    const params = new URLSearchParams();
    const newQ = overrides.q !== undefined ? overrides.q : activeQuery;
    const newCat = overrides.category !== undefined ? overrides.category : category;
    const newSpeed = overrides.speed !== undefined ? overrides.speed : speed;
    const newInStock = overrides.inStock !== undefined ? overrides.inStock : inStockOnly;
    const newSort = overrides.sortBy !== undefined ? overrides.sortBy : sortBy;
    const newPage = overrides.page !== undefined ? overrides.page : 1;

    if (newQ) params.set("q", newQ);
    if (newCat && newCat !== "all") params.set("category", newCat);
    if (newSpeed && newSpeed !== "all") params.set("speed", newSpeed);
    if (newInStock) params.set("inStock", "true");
    if (newSort && newSort !== "relevance") params.set("sortBy", newSort);
    if (newPage > 1) params.set("page", String(newPage));

    router.push(`/search?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = queryInput.trim();
    setActiveQuery(trimmed);
    setPage(1);
    updateUrl({ q: trimmed, page: 1 });
  };

  const handleCategoryChange = (catSlug: string) => {
    setCategory(catSlug);
    setPage(1);
    updateUrl({ category: catSlug, page: 1 });
  };

  const handleSpeedChange = (sp: string) => {
    setSpeed(sp);
    setPage(1);
    updateUrl({ speed: sp, page: 1 });
  };

  const handleInStockToggle = (checked: boolean) => {
    setInStockOnly(checked);
    setPage(1);
    updateUrl({ inStock: checked, page: 1 });
  };

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort);
    setPage(1);
    updateUrl({ sortBy: newSort, page: 1 });
  };

  // WhatsApp consultation link pre-filled with the query
  const missingProductWhatsAppMessage = `سلام، وقت بخیر. من دنبال محصول «${activeQuery || queryInput || "مورد نظرم"}» می‌گردم اما در جستجوی سایت پیدا نشد. آیا این محصول موجود هست یا معادل آن را پیشنهاد می‌دهید؟`;
  const whatsappUrl = whatsappHref(siteSettings.whatsapp, missingProductWhatsAppMessage);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans" dir="rtl">
      <SiteHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-xs text-gray-500 mb-4">
          <Link href="/" className="hover:text-blue-700 transition-colors">
            خانه
          </Link>
          <span>/</span>
          <span className="text-gray-800 font-medium">جستجوی هوشمند محصولات</span>
        </nav>

        {/* Search Header Banner */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 md:p-6 mb-6">
          <form onSubmit={handleSearchSubmit} className="relative max-w-3xl mx-auto">
            <div className="relative flex items-center">
              <Search className="absolute right-4 w-5 h-5 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                placeholder="جستجو بر اساس نام محصول، توان (اسب/کیلووات)، دور، تیپ گیربکس یا کد SKU..."
                className="w-full pl-28 pr-12 py-3.5 bg-gray-50 hover:bg-gray-100/70 focus:bg-white text-sm text-gray-900 placeholder:text-gray-400 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl transition-all outline-none"
              />
              <Button
                type="submit"
                size="sm"
                className="absolute left-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg px-4 py-2 text-xs font-semibold"
              >
                جستجو
              </Button>
            </div>
          </form>

          {/* Search Meta Status */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500 border-t border-gray-100 pt-3">
            <div>
              {loading ? (
                <span className="text-gray-400">در حال جستجو و ارزیابی مشخصات فنی...</span>
              ) : activeQuery ? (
                <span>
                  نمایش نتایج برای عبارت «<strong className="text-blue-900">{activeQuery}</strong>»
                  {data && ` (${faNum(data.total)} نتیجه پیدا شد)`}
                </span>
              ) : (
                <span>نمایش تمامی تجهیزات صنعتی ({data ? faNum(data.total) : "..."} محصول)</span>
              )}
            </div>

            {/* In-Stock Fast Toggle */}
            <div className="flex items-center gap-2">
              <label htmlFor="instock-toggle" className="text-xs text-gray-600 font-medium cursor-pointer">
                فقط کالاهای موجود
              </label>
              <Switch
                id="instock-toggle"
                checked={inStockOnly}
                onCheckedChange={handleInStockToggle}
              />
            </div>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 no-scrollbar">
          <button
            type="button"
            onClick={() => handleCategoryChange("all")}
            className={`px-4 py-2 rounded-xl text-xs font-medium shrink-0 transition-all cursor-pointer ${
              category === "all"
                ? "bg-blue-700 text-white shadow-xs font-semibold"
                : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            همه تجهیزات
            {data && <span className="mr-1.5 opacity-80">({faNum(data.facets.totalCount)})</span>}
          </button>
          {data?.facets.categories.map((cat) => (
            <button
              key={cat.slug}
              type="button"
              onClick={() => handleCategoryChange(cat.slug)}
              className={`px-4 py-2 rounded-xl text-xs font-medium shrink-0 transition-all cursor-pointer ${
                category === cat.slug
                  ? "bg-blue-700 text-white shadow-xs font-semibold"
                  : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {cat.name}
              <span className="mr-1.5 opacity-80">({faNum(cat.count)})</span>
            </button>
          ))}
        </div>

        {/* Controls Bar: Sort & Speed Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-3 mb-6 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Speed Filters for motors */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-gray-400 font-medium ml-1">دور موتور:</span>
            <button
              type="button"
              onClick={() => handleSpeedChange("all")}
              className={`px-2.5 py-1 rounded-lg border text-xs transition-colors cursor-pointer ${
                speed === "all"
                  ? "border-blue-600 bg-blue-50 text-blue-700 font-semibold"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              همه دورها
            </button>
            {data?.facets.speeds.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => handleSpeedChange(s.value)}
                className={`px-2.5 py-1 rounded-lg border text-xs transition-colors cursor-pointer ${
                  speed === s.value
                    ? "border-blue-600 bg-blue-50 text-blue-700 font-semibold"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {s.label} ({faNum(s.count)})
              </button>
            ))}
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-500">مرتب‌سازی:</span>
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1 text-xs text-gray-800 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="relevance">مرتبط‌ترین نتایج</option>
              <option value="price_asc">ارزان‌ترین</option>
              <option value="price_desc">گران‌ترین</option>
            </select>
          </div>
        </div>

        {/* Results Area */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="overflow-hidden border border-gray-200 bg-white">
                <Skeleton className="h-48 w-full" />
                <CardContent className="p-4 space-y-3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <div className="flex justify-between items-center pt-2">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : data && data.items.length > 0 ? (
          <>
            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {data.items.map((item) => (
                <Card
                  key={item.sku}
                  className="group flex flex-col justify-between overflow-hidden border border-gray-200 bg-white hover:border-blue-300 hover:shadow-md transition-all rounded-xl"
                >
                  <div className="p-4">
                    {/* Top Badges */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <Badge
                        variant="secondary"
                        className="text-[11px] bg-blue-50 text-blue-800 hover:bg-blue-100 border-none"
                      >
                        {item.categoryName}
                      </Badge>
                      <span className="font-mono text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                        کد: {item.sku}
                      </span>
                    </div>

                    {/* Image */}
                    <Link
                      href={`/product/${item.familySlug}?sku=${item.sku}`}
                      className="relative block w-full h-44 bg-gray-50/50 rounded-lg overflow-hidden mb-3"
                    >
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                      />
                    </Link>

                    {/* Product Name */}
                    <Link href={`/product/${item.familySlug}?sku=${item.sku}`}>
                      <h2 className="text-sm font-bold text-gray-900 group-hover:text-blue-700 transition-colors line-clamp-2 leading-snug">
                        {item.name}
                      </h2>
                    </Link>

                    {/* Technical Specs Tags */}
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {item.specs.power && (
                        <span className="text-[11px] text-gray-600 bg-gray-100/90 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Zap size={11} className="text-amber-500" />
                          {item.specs.power}
                        </span>
                      )}
                      {item.specs.speed && (
                        <span className="text-[11px] text-gray-600 bg-gray-100/90 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Gauge size={11} className="text-blue-500" />
                          {item.specs.speed} دور
                        </span>
                      )}
                      {item.specs.modelType && (
                        <span className="text-[11px] text-gray-600 bg-gray-100/90 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Layers size={11} className="text-purple-500" />
                          تیپ {item.specs.modelType}
                        </span>
                      )}
                      {item.specs.size && (
                        <span className="text-[11px] text-gray-600 bg-gray-100/90 px-2 py-0.5 rounded-md">
                          سایز {item.specs.size}
                        </span>
                      )}
                      {item.specs.outletSize && (
                        <span className="text-[11px] text-gray-600 bg-gray-100/90 px-2 py-0.5 rounded-md">
                          خروجی {item.specs.outletSize} اینچ
                        </span>
                      )}
                      {item.specs.headMeter && item.specs.headMeter > 0 && (
                        <span className="text-[11px] text-gray-600 bg-gray-100/90 px-2 py-0.5 rounded-md">
                          ارتفاع {item.specs.headMeter} متر
                        </span>
                      )}
                      {item.specs.floater && (
                        <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                          {item.specs.floater}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Bottom: Price and CTA */}
                  <div className="p-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] text-gray-400">قیمت فروش:</div>
                      <div className="text-sm font-bold text-blue-900">
                        {formatPrice(item.price)}
                      </div>
                    </div>

                    <Link href={`/product/${item.familySlug}?sku=${item.sku}`}>
                      <Button
                        size="sm"
                        className="bg-blue-700 hover:bg-blue-800 text-white text-xs px-3 shadow-xs"
                      >
                        مشخصات فنی
                        <ChevronLeft size={14} className="mr-1" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {data.totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => {
                    setPage((p) => p - 1);
                    updateUrl({ page: page - 1 });
                  }}
                  className="text-xs"
                >
                  <ChevronRight size={14} className="ml-1" />
                  صفحه قبل
                </Button>
                <div className="text-xs text-gray-600 px-3">
                  صفحه {faNum(page)} از {faNum(data.totalPages)}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= data.totalPages}
                  onClick={() => {
                    setPage((p) => p + 1);
                    updateUrl({ page: page + 1 });
                  }}
                  className="text-xs"
                >
                  صفحه بعد
                  <ChevronLeft size={14} className="mr-1" />
                </Button>
              </div>
            )}
          </>
        ) : (
          /* Empty State */
          <div className="bg-white rounded-2xl border border-gray-200 p-8 md:p-12 text-center max-w-2xl mx-auto shadow-sm">
            <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto text-amber-600 mb-4">
              <AlertCircle size={32} />
            </div>

            <h2 className="text-lg font-bold text-gray-900 mb-2">
              محصولی با مشخصات مورد نظر یافت نشد
            </h2>
            <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
              متأسفانه برای عبارت «{activeQuery}» نتیجه‌ای در کاتالوگ یافت نشد. ممکن است محصول با مشخصات خاص مدنظر شما در انبار موجود باشد یا کد متفاوتی داشته باشد.
            </p>

            {/* Did You Mean Suggestion */}
            {data?.didYouMean && (
              <div className="mb-6 p-3 bg-blue-50/70 border border-blue-100 rounded-xl inline-flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="text-xs text-gray-700">آیا منظور شما این بود؟</span>
                <button
                  type="button"
                  onClick={() => {
                    setQueryInput(data.didYouMean!);
                    setActiveQuery(data.didYouMean!);
                    updateUrl({ q: data.didYouMean!, page: 1 });
                  }}
                  className="text-xs font-bold text-blue-700 hover:underline cursor-pointer"
                >
                  «{data.didYouMean}»
                </button>
              </div>
            )}

            {/* Quick CTAs for Support */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto"
              >
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-2">
                  <MessageCircle size={16} />
                  استعلام موجودی در واتس‌اپ
                </Button>
              </a>
              <a href={phoneLink} className="w-full sm:w-auto">
                <Button variant="outline" className="w-full text-xs gap-2 border-gray-300">
                  <Phone size={16} />
                  تماس با کارشناس فروش
                </Button>
              </a>
            </div>

            {/* Fallback to Categories */}
            <div className="mt-8 border-t border-gray-100 pt-6">
              <p className="text-xs text-gray-400 mb-3">یا دسته‌بندی‌های اصلی کاتالوگ را بررسی کنید:</p>
              <div className="flex flex-wrap justify-center gap-2">
                <Link href="/electromotors" className="text-xs text-blue-700 hover:underline bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                  الکتروموتورها
                </Link>
                <Link href="/category/gearbox" className="text-xs text-blue-700 hover:underline bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                  گیربکس‌های صنعتی
                </Link>
                <Link href="/category/pump" className="text-xs text-blue-700 hover:underline bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                  انواع پمپ
                </Link>
                <Link href="/category/accessories" className="text-xs text-blue-700 hover:underline bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                  لوازم جانبی
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
