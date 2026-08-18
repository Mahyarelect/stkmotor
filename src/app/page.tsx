"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Search,
  Phone,
  Mail,
  MapPin,
  ChevronLeft,
  ChevronDown,
  ArrowUp,
  X,
  Menu,
  Instagram,
  Send,
  Cog,
  Zap,
  Gauge,
  ShieldCheck,
  Factory,
  Truck,
  Award,
  Timer,
  Headphones,
  CheckCircle2,
  MessageCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { ProductImage } from "@/components/ProductImage";
import { telHref, useSiteSettings, whatsappHref } from "@/hooks/use-site-settings";
import { CATALOG_CATEGORIES } from "@/data/catalogCategories";

/* ─────────────────────────── Types ─────────────────────────── */
interface Variant {
  id: string;
  sku: string;
  size: string;
  power: string;
  powerKw: number;
  speed: string;
  voltage: string;
  price: number;
  weight: string;
  dimensions: string;
  inStock: boolean;
  sortOrder: number;
}

interface ProductFamily {
  id: string;
  slug: string;
  name: string;
  nameEn: string;
  category: string;
  phase: string;
  shellType: string;
  imageUrl: string;
  sortOrder: number;
  variantCount: number;
  variants: Variant[];
}

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
}

/* ─────────────────────────── Helpers ─────────────────────────── */
function formatPrice(price: number): string {
  if (price === 0) return "تماس بگیرید";
  return new Intl.NumberFormat("fa-IR").format(price) + " تومان";
}

function faNum(n: number | string): string {
  return String(n).replace(/\d/g, (d) =>
    "\u06F0\u06F1\u06F2\u06F3\u06F4\u06F5\u06F6\u06F7\u06F8\u06F9"[
    parseInt(d)
    ]
  );
}

/* ─────────────────────────── MAIN PAGE ─────────────────────────── */
export default function HomePage() {
  const siteSettings = useSiteSettings();
  const phoneLink = telHref(siteSettings.phone);
  const whatsappLink = whatsappHref(siteSettings.whatsapp);

  /* State */
  const [products, setProducts] = useState<ProductFamily[]>([]);
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileExpandedCat, setMobileExpandedCat] = useState<string | null>(null);
  const dropdownTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const requestSequence = useRef(0);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchQuery.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  const fetchProducts = useCallback(
    async (pageNumber = 1, append = false) => {
      const requestId = ++requestSequence.current;
      append ? setLoadingMore(true) : setLoading(true);
      try {
        const params = new URLSearchParams();
        if (categoryFilter !== "all") params.set("category", categoryFilter);
        if (speedFilter !== "all") params.set("speed", speedFilter);
        if (powerFilter !== "all") params.set("powerRange", powerFilter);
        if (debouncedSearch) params.set("search", debouncedSearch);
        params.set("page", String(pageNumber));
        params.set("limit", "18");

        const res = await fetch(`/api/products?${params}`);
        if (!res.ok) throw new Error(`Catalog request failed: ${res.status}`);
        const data = await res.json();
        if (requestId !== requestSequence.current) return;

        setProducts((current) => append ? [...current, ...(data.products || [])] : data.products || []);
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
          append ? setLoadingMore(false) : setLoading(false);
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

  // Scroll-to-top visibility
  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const hasFilters =
    categoryFilter !== "all" ||
    speedFilter !== "all" ||
    powerFilter !== "all" ||
    searchQuery;

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      {/* ─── Top Bar ─── */}
      <div className="bg-blue-900 text-white text-xs py-2">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a
              href={phoneLink}
              className="flex items-center gap-1 hover:text-blue-200 transition-colors"
            >
              <Phone size={12} />
              <span className="num-en">{siteSettings.phone}</span>
            </a>
            <a
              href={`mailto:${siteSettings.email}`}
              className="flex items-center gap-1 hover:text-blue-200 transition-colors"
            >
              <Mail size={12} />
              <span className="num-en">{siteSettings.email}</span>
            </a>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={siteSettings.instagram || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-200 transition-colors"
              aria-label="Instagram"
            >
              <Instagram size={14} />
            </a>
            <a
              href={siteSettings.telegram || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-200 transition-colors"
              aria-label="Telegram"
            >
              <Send size={14} />
            </a>
          </div>
        </div>
      </div>

      {/* ─── Header ─── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center">
                <Cog size={22} className="text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-blue-900 tracking-tight">
                  {siteSettings.site_name}
                </h1>
                <p className="text-[10px] text-gray-400 -mt-0.5">
                  الکتروموتور پوسته چدنی
                </p>
              </div>
            </Link>

            {/* Desktop Nav — Product Categories */}
            <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-gray-600">
              {CATALOG_CATEGORIES.map((cat) => (
                <div
                  key={cat.slug}
                  className="relative"
                  onMouseEnter={() => {
                    if (dropdownTimeout.current) clearTimeout(dropdownTimeout.current);
                    setOpenDropdown(cat.slug);
                  }}
                  onMouseLeave={() => {
                    dropdownTimeout.current = setTimeout(() => setOpenDropdown(null), 150);
                  }}
                  onFocus={() => {
                    if (dropdownTimeout.current) clearTimeout(dropdownTimeout.current);
                    if (cat.subCategories.length > 0) setOpenDropdown(cat.slug);
                  }}
                  onBlur={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                      setOpenDropdown(null);
                    }
                  }}
                >
                  <a
                    href={cat.href}
                    className={`flex items-center gap-1 px-3 py-2 rounded-md transition-colors ${openDropdown === cat.slug
                        ? "text-blue-700 bg-blue-50"
                        : "hover:text-blue-700 hover:bg-gray-50"
                      }`}
                  >
                    {cat.name}
                    {cat.subCategories.length > 0 && (
                      <ChevronDown
                        size={13}
                        className={`transition-transform ${openDropdown === cat.slug ? "rotate-180" : ""
                          }`}
                      />
                    )}
                  </a>
                  {/* Dropdown */}
                  {openDropdown === cat.slug && cat.subCategories.length > 0 && (
                    <div className="absolute top-full right-0 mt-0 pt-1 z-50">
                      <div className="bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-[200px]">
                        {cat.subCategories.map((sub) => (
                          <a
                            key={sub.slug}
                            href={sub.href}
                            className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                          >
                            {sub.name}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </nav>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-3">
              <a href={phoneLink}>
                <Button
                  size="sm"
                  className="bg-blue-700 hover:bg-blue-800 text-white"
                >
                  <Phone size={14} className="ml-1.5" />
                  مشاوره رایگان
                </Button>
              </a>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              onClick={() => {
                setMobileMenuOpen(!mobileMenuOpen);
                setMobileExpandedCat(null);
              }}
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Nav — Product Categories Accordion */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1 max-h-[70vh] overflow-y-auto">
            <a
              href="/"
              className="block py-2.5 text-sm font-medium text-gray-700"
              onClick={() => setMobileMenuOpen(false)}
            >
              خانه
            </a>
            <Separator className="my-1" />
            {CATALOG_CATEGORIES.map((cat) => (
              <div key={cat.slug}>
                {cat.subCategories.length > 0 ? (
                  <>
                    <button
                      onClick={() =>
                        setMobileExpandedCat(
                          mobileExpandedCat === cat.slug ? null : cat.slug
                        )
                      }
                      className="flex items-center justify-between w-full py-2.5 text-sm font-medium text-gray-700"
                    >
                      <span>{cat.name}</span>
                      <ChevronDown
                        size={16}
                        className={`text-gray-400 transition-transform ${mobileExpandedCat === cat.slug ? "rotate-180" : ""
                          }`}
                      />
                    </button>
                    {mobileExpandedCat === cat.slug && (
                      <div className="pr-4 pb-1 space-y-0.5">
                        {cat.subCategories.map((sub) => (
                          <a
                            key={sub.slug}
                            href={sub.href}
                            className="block py-2 text-sm text-gray-600 hover:text-blue-700 transition-colors"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            {sub.name}
                          </a>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <a
                    href={cat.href}
                    className="block py-2.5 text-sm font-medium text-gray-700"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {cat.name}
                  </a>
                )}
              </div>
            ))}
            <Separator />
            <div className="flex gap-2 pt-1">
              <a href="#about" className="text-xs text-gray-500 hover:text-blue-600" onClick={() => setMobileMenuOpen(false)}>درباره ما</a>
              <span className="text-gray-300">|</span>
              <a href="#contact" className="text-xs text-gray-500 hover:text-blue-600" onClick={() => setMobileMenuOpen(false)}>تماس</a>
            </div>
            <a href={phoneLink} className="block pt-1">
              <Button className="w-full bg-blue-700 hover:bg-blue-800 text-white">
                <Phone size={14} className="ml-1.5" />
                تماس: <span className="num-en mr-1">{siteSettings.phone}</span>
              </Button>
            </a>
          </div>
        )}
      </header>

      {/* ─── Hero ─── */}
      <section
        id="home"
        className="relative bg-gradient-to-bl from-blue-900 via-blue-800 to-blue-950 text-white overflow-hidden"
      >
        {/* Decorative */}
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
            <h2 className="text-3xl md:text-5xl font-extrabold leading-tight mb-6">
              الکتروموتور پوسته چدنی
              <br />
              <span className="text-blue-300">تک‌فاز و سه‌فاز</span>
            </h2>
            <p className="text-blue-100/80 text-base md:text-lg leading-relaxed mb-8 max-w-xl">
              ارائه دهنده انواع الکتروموتورهای صنعتی پوسته چدنی با توان‌های
              مختلف. مشاوره فنی رایگان، اطلاعات فنی، مشاوره تخصصی و امکان استعلام برای هر مدل.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="#products">
                <Button
                  size="lg"
                  className="bg-white text-blue-900 hover:bg-blue-50 font-semibold px-8"
                >
                  مشاهده کاتالوگ
                  <ChevronLeft size={18} className="mr-1" />
                </Button>
              </a>
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener"
              >
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

          {/* Hero image placeholder */}
          <div className="hidden lg:block absolute left-8 top-1/2 -translate-y-1/2">
            <div className="w-80 h-80 bg-blue-700/30 rounded-2xl border border-blue-500/20 flex items-center justify-center">
              <div className="text-center">
                <Cog
                  size={64}
                  className="text-blue-400/60 mx-auto mb-3"
                />
                <p className="text-blue-400/40 text-sm">تصویر محصول</p>
              </div>
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
            محصولات اصلی شرکت در دسته‌بندی‌های زیر
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {CATALOG_CATEGORIES.map((cat) => {
            const IconComp = cat.icon;
            return (
              <a
                key={cat.slug}
                href={cat.href}
                className="group text-center rounded-xl p-5 border-2 border-gray-200 bg-white hover:border-blue-300 hover:shadow-md transition-all"
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
                <div className="mt-2 flex items-center justify-center gap-1 text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>مشاهده</span>
                  <ChevronLeft size={12} />
                </div>
              </a>
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
              کاتالوگ الکتروموتور STK
            </h3>
            <p className="text-gray-500 text-sm">
              {stats
                ? `${faNum(stats.families)} مدل الکتروموتور با ${faNum(stats.variants)} سایز مختلف`
                : "در حال بارگذاری..."}
            </p>
          </div>

          {/* Filters Bar */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-8 shadow-sm">
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
                  className="pr-9"
                />
              </div>
              {/* Speed Filter */}
              <Select value={speedFilter} onValueChange={setSpeedFilter}>
                <SelectTrigger className="w-full sm:w-40">
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
              {/* Power Filter */}
              <Select value={powerFilter} onValueChange={setPowerFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="محدوده توان" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه توان‌ها</SelectItem>
                  <SelectItem value="0-0.75">تا ۰.۷۵ kW</SelectItem>
                  <SelectItem value="0.75-3">۰.۷۵ تا ۳ kW</SelectItem>
                  <SelectItem value="3-11">۳ تا ۱۱ kW</SelectItem>
                  <SelectItem value="11-45">۱۱ تا ۴۵ kW</SelectItem>
                  <SelectItem value="45-110">۴۵ تا ۱۱۰ kW</SelectItem>
                  <SelectItem value="110-999">بالای ۱۱۰ kW</SelectItem>
                </SelectContent>
              </Select>
              {/* Reset */}
              {hasFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCategoryFilter("all");
                    setSpeedFilter("all");
                    setPowerFilter("all");
                    setSearchQuery("");
                  }}
                  className="text-gray-500"
                >
                  <X size={14} className="ml-1" />
                  پاک کردن
                </Button>
              )}
            </div>
          </div>

          {/* Product Grid — Family Cards */}
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-40 w-full" />
                  <CardContent className="p-5 space-y-3">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16">
              <Search size={40} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">محصولی یافت نشد</p>
              <p className="text-gray-400 text-sm mt-1">
                فیلترهای خود را تغییر دهید
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((family) => (
                <FamilyCard key={family.id} family={family} />
              ))}
            </div>
          )}

          {/* Count */}
          {!loading && products.length > 0 && (
            <div className="text-center mt-6">
              <p className="text-sm text-gray-400">
                نمایش {faNum(products.length)} از {faNum(catalogMeta.total)} مدل الکتروموتور
              </p>
            </div>
          )}

          {!loading && catalogMeta.hasMore && (
            <div className="mt-5 flex justify-center">
              <Button
                variant="outline"
                onClick={() => fetchProducts(catalogMeta.page + 1, true)}
                disabled={loadingMore}
                className="min-w-40 border-blue-200 bg-white text-blue-700 hover:bg-blue-50 hover:text-blue-800"
              >
                {loadingMore ? "در حال بارگذاری..." : "نمایش مدل‌های بیشتر"}
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* ─── About / Proof Section ─── */}
      <section id="about" className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              درباره STK Motors
            </h3>
            <p className="text-gray-600 leading-relaxed mb-6">
              شرکت STK Motors با بیش از ۱۵ سال سابقه در واردات و توزیع
              الکتروموتورهای صنعتی، مجموعه‌ای کامل از موتورهای تک‌فاز و
              سه‌فاز پوسته چدنی را در اختیار صنعتگران و کارخانجات سراسر ایران
              قرار می‌دهد. این وب‌سایت به‌عنوان کاتالوگ فنی محصولات طراحی شده است تا مدل‌ها، سایزها و مشخصات را به‌صورت ساختاریافته نمایش دهد و انتخاب مدل مناسب را ساده‌تر کند.
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
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-10 flex items-center justify-center min-h-[300px]">
            <div className="text-center">
              <Factory size={48} className="text-blue-300 mx-auto mb-3" />
              <p className="text-blue-400/60 text-sm">تصویر کارخانه / انبار</p>
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
            کارشناسان ما آماده ارائه مشاوره رایگان برای انتخاب بهترین
            الکتروموتور متناسب با نیاز شما هستند.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href={phoneLink}>
              <Button
                size="lg"
                className="bg-white text-blue-900 hover:bg-blue-50 font-semibold px-8"
              >
                <Phone size={16} className="ml-1.5" />
                تماس: <span className="num-en mr-1">{siteSettings.phone}</span>
              </Button>
            </a>
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener"
            >
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

      {/* ─── Footer ─── */}
      <footer className="bg-gray-900 text-gray-400">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center">
                  <Cog size={16} className="text-white" />
                </div>
                <span className="text-white font-bold">{siteSettings.site_name}</span>
              </div>
              <p className="text-sm leading-relaxed">
                ارائه دهنده انواع الکتروموتورهای تک‌فاز و سه‌فاز پوسته چدنی با
                بهترین کیفیت و قیمت.
              </p>
            </div>
            <div>
              <h5 className="text-white font-semibold mb-3">دسته‌بندی محصولات</h5>
              <div className="space-y-2 text-sm">
                {CATALOG_CATEGORIES.map((cat) => (
                  <a
                    key={cat.slug}
                    href={cat.href}
                    className="block hover:text-blue-400 transition-colors"
                  >
                    {cat.name}
                  </a>
                ))}
              </div>
              <h5 className="text-white font-semibold mb-3 mt-5">لینک‌های مفید</h5>
              <div className="space-y-2 text-sm">
                <a
                  href="/"
                  className="block hover:text-blue-400 transition-colors"
                >
                  خانه
                </a>
                <a
                  href="#about"
                  className="block hover:text-blue-400 transition-colors"
                >
                  درباره ما
                </a>
                <a
                  href="#contact"
                  className="block hover:text-blue-400 transition-colors"
                >
                  تماس با ما
                </a>
              </div>
            </div>
            <div>
              <h5 className="text-white font-semibold mb-3">تماس با ما</h5>
              <div className="space-y-2 text-sm">
                <p className="flex items-center gap-2">
                  <Phone size={13} />
                  <span className="num-en">{siteSettings.phone}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Mail size={13} />
                  <span className="num-en">{siteSettings.email}</span>
                </p>
                <p className="flex items-center gap-2">
                  <MapPin size={13} />
                  {siteSettings.address}
                </p>
              </div>
            </div>
          </div>
          <Separator className="bg-gray-800 my-6" />
          <p className="text-center text-xs text-gray-500">
            تمامی حقوق محفوظ است &copy; STK Motors {new Date().getFullYear()}
          </p>
        </div>
      </footer>

      {/* ─── Sticky Mobile Action Bar ─── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] safe-area-pb">
        <div className="grid grid-cols-3 divide-x divide-gray-200">
          <a
            href={phoneLink}
            className="flex flex-col items-center py-2.5 text-gray-600 active:bg-gray-50"
          >
            <Phone size={18} className="mb-0.5 text-blue-700" />
            <span className="text-[10px]">تماس</span>
          </a>
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener"
            className="flex flex-col items-center py-2.5 text-gray-600 active:bg-gray-50"
          >
            <Send size={18} className="mb-0.5 text-emerald-600" />
            <span className="text-[10px]">واتساپ</span>
          </a>
          <a
            href="#products"
            className="flex flex-col items-center py-2.5 text-gray-600 active:bg-gray-50"
          >
            <MessageCircle size={18} className="mb-0.5 text-orange-500" />
            <span className="text-[10px]">استعلام قیمت</span>
          </a>
        </div>
      </div>

      {/* ─── Floating Desktop Consultation Button ─── */}
      <a
        href={whatsappLink}
        target="_blank"
        rel="noopener"
        className="hidden md:flex fixed bottom-6 left-6 z-50 w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full items-center justify-center shadow-lg shadow-green-500/30 transition-all hover:scale-110"
        title="مشاوره در واتساپ"
      >
        <MessageCircle size={24} className="text-white" />
      </a>

      {/* ─── Scroll to Top ─── */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 z-50 w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-md hover:bg-gray-50 transition-colors md:bottom-6"
        >
          <ArrowUp size={16} className="text-gray-600" />
        </button>
      )}

      {/* Bottom padding for mobile action bar */}
      <div className="h-16 md:hidden" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   FAMILY CARD COMPONENT — Compact, Technical, Size-Selectable
   ═══════════════════════════════════════════════════════════════════ */
function FamilyCard({ family }: { family: ProductFamily }) {
  const variantsBySize = useMemo(() => {
    const map = new Map<string, Variant>();
    for (const variant of family.variants) {
      if (variant.size && !map.has(variant.size)) map.set(variant.size, variant);
    }
    return map;
  }, [family.variants]);

  const uniqueSizes = useMemo(
    () => [...variantsBySize.keys()].sort((a, b) => Number.parseInt(a) - Number.parseInt(b)),
    [variantsBySize]
  );

  const firstVariant = family.variants.find((variant) => variant.inStock) || family.variants[0];
  const [selectedSize, setSelectedSize] = useState(firstVariant?.size || "");
  const activeVariant = variantsBySize.get(selectedSize) || firstVariant || family.variants[0];
  const effectiveSelectedSize = activeVariant?.size || selectedSize;

  const uniqueSpeeds = useMemo(
    () => [...new Set(family.variants.map((v) => v.speed).filter(Boolean))].sort((a, b) => Number.parseInt(a) - Number.parseInt(b)),
    [family.variants]
  );

  // Size range string
  const sizeRange =
    uniqueSizes.length > 0
      ? `${faNum(uniqueSizes[0])} – ${faNum(uniqueSizes[uniqueSizes.length - 1])}`
      : "";

  return (
    <Card className="overflow-hidden border-gray-200 hover:shadow-lg hover:border-blue-200 transition-all group flex flex-col">
      {/* Product image. Local paths are resolved from /public. */}
      <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 h-36 flex items-center justify-center overflow-hidden">
        <ProductImage
          src={family.imageUrl}
          alt={family.name}
          className="h-full w-full object-contain p-3 transition-transform group-hover:scale-[1.03]"
          iconSize={36}
        />
        {/* Category badge */}
        <Badge
          className={`absolute top-3 right-3 text-[10px] px-2 py-0.5 ${family.category === "single-phase"
              ? "bg-amber-500 text-white"
              : "bg-blue-600 text-white"
            }`}
        >
          {family.phase}
        </Badge>
        {/* Variant count badge */}
        <Badge
          className="absolute top-3 left-3 text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500"
        >
          {faNum(uniqueSizes.length)} سایز
        </Badge>
      </div>

      <CardContent className="p-4 flex flex-col flex-1">
        {/* Short Systematic Name */}
        <Link href={`/product/${family.slug}`} className="block mb-0.5">
          <h4 className="font-bold text-gray-900 text-sm group-hover:text-blue-700 transition-colors">
            الکتروموتور {family.phase} STK
          </h4>
        </Link>

        {/* Subtitle: shell type + speed + size range */}
        <p className="text-xs text-gray-400 mb-3">
          پوسته {family.shellType}
          {uniqueSpeeds.length > 0 &&
            ` · ${faNum(uniqueSpeeds[0])} دور`}
          {sizeRange && ` · سایز ${sizeRange}`}
        </p>

        {/* ─── Size Selector Chips ─── */}
        {uniqueSizes.length > 0 && (
          <div className="mb-3">
            <p className="text-[10px] text-gray-500 mb-1.5 font-medium">
              انتخاب سایز
            </p>
            <div className="flex flex-wrap gap-1.5">
              {uniqueSizes.map((size) => {
                const sizeVariant = variantsBySize.get(size);
                const hasInStock = Boolean(sizeVariant?.inStock);
                const isSelected = effectiveSelectedSize === size;

                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    aria-pressed={isSelected}
                    className={`relative px-2.5 py-1 rounded-md text-xs font-medium num-en transition-all ${isSelected
                        ? "bg-blue-700 text-white shadow-sm ring-2 ring-blue-300"
                        : hasInStock
                          ? "bg-white border border-gray-200 text-gray-700 hover:border-blue-400 hover:text-blue-700 hover:shadow-sm"
                          : "bg-gray-50 border border-gray-200 text-gray-500 hover:border-orange-300 hover:text-orange-700"
                      }`}
                  >
                    {size}
                    {!hasInStock && (
                      <span className="absolute -top-1.5 -left-1.5 text-[7px] bg-orange-100 text-orange-600 px-1 rounded leading-none">
                        استعلام
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── Dynamic Specs (3 compact items) ─── */}
        <div className="grid grid-cols-3 gap-1.5 mb-3">
          <div className="bg-gray-50 rounded-lg px-2 py-1.5 text-center">
            <p className="text-[9px] text-gray-400">توان</p>
            <p className="text-[11px] font-semibold text-gray-800 num-en">
              {activeVariant?.power || "-"}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg px-2 py-1.5 text-center">
            <p className="text-[9px] text-gray-400">دور</p>
            <p className="text-[11px] font-semibold text-gray-800 num-en">
              {activeVariant?.speed
                ? `${faNum(activeVariant.speed)} RPM`
                : "-"}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg px-2 py-1.5 text-center">
            <p className="text-[9px] text-gray-400">ولتاژ</p>
            <p className="text-[11px] font-semibold text-gray-800 num-en">
              {activeVariant?.voltage || "-"}
            </p>
          </div>
        </div>

        {/* Stock Status */}
        <div className="mb-3">
          {activeVariant?.inStock ? (
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              <CheckCircle2 size={11} />
              موجود در کاتالوگ
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
              <X size={11} />
              استعلام قیمت
            </span>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Price */}
        <div className="mb-3">
          {activeVariant && activeVariant.price > 0 ? (
            <div className="text-base font-bold text-blue-800">
              {formatPrice(activeVariant.price)}
            </div>
          ) : (
            <div className="text-sm text-gray-500">تماس بگیرید</div>
          )}
        </div>

        {/* CTA */}
        <Link href={`/product/${family.slug}`} className="block">
          <Button className="w-full bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium h-9">
            مشاهده مشخصات کامل
            <ChevronLeft size={14} className="mr-1" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
