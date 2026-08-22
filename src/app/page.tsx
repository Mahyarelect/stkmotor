"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Search,
  ChevronLeft,
  X,
  Zap,
  ShieldCheck,
  Factory,
  Truck,
  Award,
  Timer,
  Headphones,
  MessageCircle,
  Phone,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ProductFamilyData } from "@/components/product/ProductCard";
import { telHref, useSiteSettings, whatsappHref } from "@/hooks/use-site-settings";
import { CATALOG_CATEGORIES } from "@/data/catalogCategories";

interface CatalogMeta {
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

interface SiteStats {
  families: number;
  variants: number;
  singlePhaseFamilies: number;
  threePhaseFamilies: number;
  speeds: string[];
  sizes: string[];
  powerRanges: string[];
  gearboxFamilies: number;
  pumpFamilies: number;
  accessoriesFamilies: number;
}

function faNum(n: number | string): string {
  return String(n).replace(/\d/g, (d) =>
    "\u06F0\u06F1\u06F2\u06F3\u06F4\u06F5\u06F6\u06F7\u06F8\u06F9"[parseInt(d)]
  );
}

export default function HomePage() {
  const siteSettings = useSiteSettings();
  const phoneLink = telHref(siteSettings.phone);
  const whatsappLink = whatsappHref(siteSettings.whatsapp);

  /* State */
  const [products, setProducts] = useState<ProductFamilyData[]>([]);
  const [stats, setStats] = useState<SiteStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [catalogMeta, setCatalogMeta] = useState<CatalogMeta>({
    total: 0,
    page: 1,
    totalPages: 1,
    hasMore: false,
  });

  const [categoryFilter, setCategoryFilter] = useState("all");
  const [speedFilter, setSpeedFilter] = useState("all");
  const [powerFilter, setPowerFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const requestSequence = useRef(0);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchQuery.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  const fetchProducts = useCallback(
    async (pageNumber = 1, append = false) => {
      const requestId = ++requestSequence.current;
      if (append) setLoadingMore(true);
      else setLoading(true);
      try {
        const params = new URLSearchParams();
        if (categoryFilter !== "all") params.set("category", categoryFilter);
        if (speedFilter !== "all") params.set("speed", speedFilter);
        if (powerFilter !== "all") params.set("powerRange", powerFilter);
        if (debouncedSearch) params.set("search", debouncedSearch);
        params.set("page", String(pageNumber));
        params.set("limit", "18");

        const res = await fetch(`/api/products?${params.toString()}`);
        if (!res.ok) throw new Error(`Catalog request failed: ${res.status}`);
        const data = await res.json();
        if (requestId !== requestSequence.current) return;

        setProducts((current) => (append ? [...current, ...(data.products || [])] : data.products || []));
        setCatalogMeta({
          total: data.total || 0,
          page: data.page || pageNumber,
          totalPages: data.totalPages || 1,
          hasMore: Boolean(data.hasMore),
        });
      } catch (err) {
        if (requestId === requestSequence.current) {
          console.error("Failed to fetch products:", err);
          if (!append) setProducts([]);
        }
      } finally {
        if (requestId === requestSequence.current) {
          if (append) setLoadingMore(false);
          else setLoading(false);
        }
      }
    },
    [categoryFilter, speedFilter, powerFilter, debouncedSearch]
  );

  useEffect(() => {
    fetchProducts(1, false);
  }, [fetchProducts]);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(console.error);
  }, []);

  const hasFilters =
    categoryFilter !== "all" ||
    speedFilter !== "all" ||
    powerFilter !== "all" ||
    searchQuery !== "";

  const handleResetFilters = () => {
    setCategoryFilter("all");
    setSpeedFilter("all");
    setPowerFilter("all");
    setSearchQuery("");
  };

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      {/* ─── Shared Site Header ─── */}
      <SiteHeader />

      {/* ─── Hero Section ─── */}
      <section
        id="home"
        className="relative bg-gradient-to-bl from-blue-900 via-blue-800 to-blue-950 text-white overflow-hidden"
      >
        {/* Decorative background glow */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-20 w-96 h-96 bg-blue-400 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 py-20 md:py-28">
          <div className="max-w-2xl">
            <Badge className="bg-blue-600/50 text-blue-100 mb-4 text-sm">
              <Zap size={12} className="ml-1" />
              نماینده رسمی STK Motors
            </Badge>
            <h1 className="text-3xl md:text-5xl font-extrabold leading-tight mb-6">
              تجهیزات صنعتی برای حرکت، انتقال و سیالات
              <br />
              <span className="text-blue-300">الکتروموتور، گیربکس، پمپ و قطعات جانبی</span>
            </h1>
            <p className="text-blue-100/80 text-base md:text-lg leading-relaxed mb-8 max-w-xl">
              مجموعه یکپارچه تجهیزات صنعتی با مشخصات فنی دقیق، مدل‌های متنوع و امکان استعلام مستقیم از کارشناسان STK Motors.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="#products">
                <Button
                  size="lg"
                  className="bg-white text-blue-900 hover:bg-blue-50 font-semibold px-8 shadow-sm"
                >
                  مشاهده همه محصولات
                  <ChevronLeft size={18} className="mr-1" />
                </Button>
              </Link>
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white px-8"
                >
                  <MessageCircle size={16} className="ml-1.5" />
                  استعلام قیمت
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Category Entry Points ─── */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            دسته‌بندی محصولات
          </h3>
          <p className="text-gray-500 text-sm">
            جهت مشاهده کاتالوگ تخصصی هر بخش، دسته مورد نظر را انتخاب کنید
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {CATALOG_CATEGORIES.map((cat) => {
            const IconComp = cat.icon;
            return (
              <Link
                key={cat.slug}
                href={cat.href}
                className="group text-center rounded-xl p-5 border-2 border-gray-200 bg-white hover:border-blue-500 hover:shadow-lg transition-all"
              >
                <div className="w-12 h-12 mx-auto mb-3 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-700 transition-colors">
                  <IconComp
                    size={22}
                    className="text-blue-700 group-hover:text-white transition-colors"
                  />
                </div>
                <h4 className="font-bold text-sm text-gray-900 mb-1">
                  {cat.name}
                </h4>
                {cat.subCategories.length > 0 && (
                  <p className="text-xs text-gray-400">
                    {faNum(cat.subCategories.length)} زیردسته
                  </p>
                )}
                <div className="mt-2 flex items-center justify-center gap-1 text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity font-semibold">
                  <span>مشاهده کاتالوگ</span>
                  <ChevronLeft size={12} />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ─── Products Catalog ─── */}
      <section id="products" className="bg-gray-50/70">
        <div className="max-w-7xl mx-auto px-4 py-12">
          {/* Section Header */}
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              کاتالوگ محصولات STK
            </h3>
            <p className="text-gray-500 text-sm">
              {stats
                ? `${faNum(stats.families)} خانواده محصول با ${faNum(stats.variants)} مدل و واریانت`
                : "در حال بارگذاری..."}
            </p>
          </div>

          {/* Filters Bar */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-8 shadow-xs">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <Input
                  placeholder="جستجوی نام، کد محصول..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-9 text-sm"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-44 text-sm"><SelectValue placeholder="دسته محصول" /></SelectTrigger>
                <SelectContent><SelectItem value="all">همه دسته‌ها</SelectItem>{CATALOG_CATEGORIES.map(cat => <SelectItem key={cat.slug} value={cat.slug}>{cat.name}</SelectItem>)}</SelectContent>
              </Select>
              {/* Power / HP Filter (Primary Filter) */}
              <Select value={powerFilter} onValueChange={setPowerFilter}>
                <SelectTrigger className="w-full sm:w-44 text-sm">
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
              {/* Speed Filter */}
              <Select value={speedFilter} onValueChange={setSpeedFilter}>
                <SelectTrigger className="w-full sm:w-36 text-sm">
                  <SelectValue placeholder="دور بر دقیقه" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه سرعت‌ها</SelectItem>
                  <SelectItem value="750">۷۵۰ RPM</SelectItem>
                  <SelectItem value="1000">۱۰۰۰ RPM</SelectItem>
                  <SelectItem value="1400">۱۴۰۰ RPM</SelectItem>
                  <SelectItem value="3000">۳۰۰۰ RPM</SelectItem>
                </SelectContent>
              </Select>
              {/* Reset */}
              {hasFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetFilters}
                  className="text-gray-500 hover:text-blue-700"
                >
                  <X size={14} className="ml-1" />
                  پاک کردن
                </Button>
              )}
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
            onResetFilters={hasFilters ? handleResetFilters : undefined}
            itemLabel="خانواده محصول"
          />
        </div>
      </section>

      {/* ─── About Section ─── */}
      <section id="about" className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              درباره STK Motors
            </h3>
            <p className="text-gray-600 leading-relaxed mb-6">
              شرکت STK Motors با بیش از ۱۵ سال سابقه در واردات و توزیع الکتروموتورهای صنعتی، مجموعه‌ای کامل از موتورهای تک‌فاز و سه‌فاز پوسته چدنی و آلومینیومی را در اختیار صنعتگران و کارخانجات سراسر ایران قرار می‌دهد.
            </p>
            <div className="grid grid-cols-3 gap-4">
              {[
                { value: "+15", label: "سال تجربه" },
                {
                  value: faNum(stats?.variants ?? 0),
                  label: "سایز در دسترس",
                },
                { value: "100%", label: "اصالت کالا" },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <div className="text-2xl font-extrabold text-blue-700 num-en">
                    {s.value}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-10 flex items-center justify-center min-h-[280px]">
            <div className="text-center">
              <Factory size={48} className="text-blue-400 mx-auto mb-3" />
              <p className="text-blue-900/60 font-semibold text-sm">مرکز توزیع و پشتیبانی فنی STK Motors</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA Section ─── */}
      <section
        id="contact"
        className="bg-gradient-to-bl from-blue-800 to-blue-950 text-white"
      >
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <Award size={40} className="text-blue-300 mx-auto mb-4" />
          <h3 className="text-2xl md:text-3xl font-bold mb-4">
            نیاز به مشاوره فنی دارید؟
          </h3>
          <p className="text-blue-100/70 mb-8 max-w-xl mx-auto">
            کارشناسان ما آماده ارائه مشاوره رایگان برای انتخاب بهترین الکتروموتور متناسب با نیاز شما هستند.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href={phoneLink}>
              <Button
                size="lg"
                className="bg-white text-blue-900 hover:bg-blue-50 font-semibold px-8 shadow-sm"
              >
                <Phone size={16} className="ml-1.5" />
                تماس: <span className="num-en mr-1">{siteSettings.phone}</span>
              </Button>
            </a>
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
              <Button
                size="lg"
                variant="outline"
                className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white px-8"
              >
                <MessageCircle size={16} className="ml-1.5" />
                ارتباط در واتساپ
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* ─── Trust Strip ─── */}
      <section className="bg-slate-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                icon: Timer,
                label: "بیش از ۱۵ سال تجربه",
                sub: "در صنعت الکتروموتور",
              },
              {
                icon: Truck,
                label: "ارسال به سراسر ایران",
                sub: "تحویل سریع و مطمئن",
              },
              {
                icon: ShieldCheck,
                label: "گارانتی اصالت کالا",
                sub: "تضمین کیفیت محصول",
              },
              {
                icon: Headphones,
                label: "مشاوره فنی رایگان",
                sub: "پشتیبانی تخصصی",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-3.5 p-4 rounded-xl bg-white border border-gray-200/80 shadow-xs hover:shadow-sm transition-shadow"
              >
                <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center shrink-0 text-blue-700">
                  <item.icon size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800">
                    {item.label}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Shared Site Footer ─── */}
      <SiteFooter />
    </div>
  );
}
