"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  ArrowRight,
  Phone,
  CheckCircle2,
  Cog,
  Gauge,
  Zap,
  ShieldCheck,
  Truck,
  MessageCircle,
  ChevronLeft,
  Ruler,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { ProductImage } from "@/components/ProductImage";
import { ProductSpecsTable } from "@/components/product/ProductSpecsTable";
import { ProductCard, ProductFamilyData } from "@/components/product/ProductCard";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { telHref, useSiteSettings, whatsappHref } from "@/hooks/use-site-settings";

/* ─────────────────────────── Types ─────────────────────────── */
interface Variant {
  id: string;
  sku: string;
  size: string;
  power: string;
  powerKw: number;
  speed: string;
  mountingType?: string;
  voltage?: string;
  gearboxType?: string;
  modelType?: string;
  ratio?: string;
  inputFrame?: string;
  inputType?: string;
  pumpType?: string;
  outletSize?: string;
  headMeter?: number;
  floater?: string;
  brand?: string;
  bodyMaterial?: string;
  flangeType?: string;
  flangeLength?: string;
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
  mainCategory: string;
  category: string;
  phase: string;
  shellType: string;
  description: string;
  imageUrl: string;
  sortOrder: number;
  variants: Variant[];
}

/* ─────────────────────────── Helpers ─────────────────────────── */
function formatPrice(price: number): string {
  if (price === 0) return "تماس بگیرید";
  return new Intl.NumberFormat("fa-IR").format(price) + " تومان";
}

function faNum(n: number | string): string {
  return String(n).replace(/\d/g, (d) => "\u06F0\u06F1\u06F2\u06F3\u06F4\u06F5\u06F6\u06F7\u06F8\u06F9"[parseInt(d)]);
}

/* ─────────────────────────── COMPONENT ─────────────────────────── */
export default function ProductDetailClient({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const siteSettings = useSiteSettings();
  const phoneLink = telHref(siteSettings.phone);
  const whatsappLink = whatsappHref(siteSettings.whatsapp);

  const [family, setFamily] = useState<ProductFamily | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariantId, setSelectedVariantId] = useState<string>("");
  const [relatedProducts, setRelatedProducts] = useState<ProductFamilyData[]>([]);

  const slugRef = useRef<string>("");

  async function fetchProduct(slug: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${slug}`);
      if (!res.ok) return;
      const data = await res.json();
      setFamily(data);
      fetch(`/api/products?category=${encodeURIComponent(data.mainCategory)}&limit=4`)
        .then((response) => response.ok ? response.json() : { products: [] })
        .then((result) => setRelatedProducts((result.products || []).filter((item: ProductFamilyData) => item.slug !== data.slug).slice(0, 3)))
        .catch(() => setRelatedProducts([]));
      const first = data.variants.find((v: Variant) => v.inStock) || data.variants[0];
      if (first) setSelectedVariantId(first.id);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  // Resolve params
  useEffect(() => {
    params.then((p) => {
      slugRef.current = p.slug;
      fetchProduct(p.slug);
    });
  }, []);

  const selectedVariant = family?.variants.find((v) => v.id === selectedVariantId);

  const variantsBySize = useMemo(() => {
    const map = new Map<string, Variant[]>();
    for (const variant of family?.variants || []) {
      if (!variant.size) continue;
      const current = map.get(variant.size) || [];
      current.push(variant);
      map.set(variant.size, current);
    }
    return map;
  }, [family]);

  const uniqueSizes = useMemo(
    () => [...variantsBySize.keys()].sort((a, b) => Number.parseInt(a) - Number.parseInt(b)),
    [variantsBySize]
  );

  const uniqueSpeeds = useMemo(() => {
    const values = (family?.variants || [])
      .map((variant) => variant.speed)
      .filter((speed) => speed.length > 0);
    return Array.from(new Set<string>(values)).sort(
      (a, b) => Number.parseInt(a) - Number.parseInt(b)
    );
  }, [family]);

  const categoryInfo = family ? ({
    electromotor: { title: "الکتروموتورها", href: "/electromotors" },
    gearbox: { title: "گیربکس‌ها", href: "/category/gearbox" },
    pump: { title: "پمپ‌ها", href: "/category/pump" },
    accessories: { title: "لوازم جانبی", href: "/category/accessories" },
  }[family.mainCategory] || { title: "محصولات", href: "/" }) : { title: "محصولات", href: "/" };
  const inquiryLink = selectedVariant && family
    ? `${whatsappLink}?text=${encodeURIComponent(`سلام، برای ${family.name} با کد ${selectedVariant.sku} درخواست استعلام دارم.`)}`
    : whatsappLink;
  const quickSpecs = selectedVariant && family ? (
    family.mainCategory === "gearbox"
      ? [
          { icon: Cog, label: "مدل", value: selectedVariant.modelType || "-" },
          { icon: Gauge, label: "نسبت تبدیل", value: selectedVariant.ratio || "-" },
          { icon: Ruler, label: "فریم ورودی", value: selectedVariant.inputFrame || "-" },
          { icon: FileText, label: "سایز", value: selectedVariant.size || "-" },
        ]
      : family.mainCategory === "pump"
        ? [
            { icon: Cog, label: "نوع پمپ", value: selectedVariant.pumpType || "-" },
            { icon: Ruler, label: "دهانه خروجی", value: selectedVariant.outletSize || "-" },
            { icon: Gauge, label: "حداکثر هد", value: selectedVariant.headMeter ? `${faNum(selectedVariant.headMeter)} متر` : "-" },
            { icon: Zap, label: "توان", value: selectedVariant.power || "-" },
          ]
        : family.mainCategory === "accessories"
          ? [
              { icon: Cog, label: "نوع قطعه", value: selectedVariant.flangeType || "-" },
              { icon: ShieldCheck, label: "برند", value: selectedVariant.brand || "-" },
              { icon: Ruler, label: "سایز فریم", value: selectedVariant.size || "-" },
              { icon: FileText, label: "جنس", value: selectedVariant.bodyMaterial || "-" },
            ]
          : [
              { icon: Zap, label: "توان", value: selectedVariant.power || "-" },
              { icon: Gauge, label: "دور", value: selectedVariant.speed ? `${faNum(selectedVariant.speed)} RPM` : "-" },
              { icon: Ruler, label: "سایز فریم", value: selectedVariant.size || "-" },
              { icon: FileText, label: "نوع نصب", value: selectedVariant.mountingType || "-" },
            ]
  ) : [];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Skeleton className="h-4 w-32 mb-6" />
        <div className="grid md:grid-cols-2 gap-8">
          <Skeleton className="h-96 rounded-xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!family) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <Cog size={48} className="text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 font-medium">محصول یافت نشد</p>
        <Link href="/" className="text-blue-600 text-sm mt-2 inline-block hover:underline">
          بازگشت به صفحه اصلی
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col" dir="rtl">
      {/* ─── Header ─── */}
      <SiteHeader />

      {/* ─── Breadcrumb ─── */}
      <div className="bg-gray-50/80 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 flex-wrap">
            <Link href="/" className="hover:text-blue-600 transition-colors">خانه</Link>
            <ChevronLeft size={13} className="text-gray-400" />
            <Link href={categoryInfo.href} className="hover:text-blue-600 transition-colors">{categoryInfo.title}</Link>
            <ChevronLeft size={13} className="text-gray-400" />
            <span className="text-blue-950 font-semibold">{family.name}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl w-full mx-auto px-4 py-8 overflow-hidden">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold leading-relaxed text-gray-900">{family.name}</h1>
          <p className="mt-1 text-sm text-gray-500">{categoryInfo.title}</p>
        </div>
        <div className="grid lg:grid-cols-2 gap-10">
          {/* ─── LEFT: Image + Variant Selector ─── */}
          <div className="min-w-0">
            {/* Product image. Local image paths are served from /public. */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl h-80 lg:h-[420px] flex items-center justify-center mb-6 relative overflow-hidden">
              <ProductImage
                src={family.imageUrl}
                alt={family.name}
                className="h-full w-full object-contain p-6"
                iconSize={56}
              />
              <Badge
                className={`absolute top-4 right-4 ${
                  family.mainCategory === "electromotor" && family.category === "single-phase"
                    ? "bg-amber-500 text-white"
                    : "bg-blue-600 text-white"
                }`}
              >
                {family.phase || categoryInfo.title}
              </Badge>
            </div>

            {/* Variant Selector — All sizes as chips */}
            {uniqueSizes.length > 0 && (
              <Card className="border-gray-200">
                <CardContent className="p-4">
                  <p className="text-sm font-semibold text-gray-700 mb-3">انتخاب سایز فریم</p>
                  <div className="flex flex-wrap gap-2">
                    {uniqueSizes.map((size) => {
                      const variantsForSize = variantsBySize.get(size) || [];
                      const hasInStock = variantsForSize.some((v) => v.inStock);
                      const isSelected = selectedVariant?.size === size;

                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() => {
                            const nextVariant = variantsForSize.find((variant) => variant.inStock) || variantsForSize[0];
                            if (nextVariant) setSelectedVariantId(nextVariant.id);
                          }}
                          aria-pressed={isSelected}
                          className={`relative min-h-11 min-w-11 px-4 py-2.5 rounded-lg text-sm font-medium num-en transition-all ${
                            isSelected
                              ? "bg-blue-700 text-white shadow-md shadow-blue-200 ring-2 ring-blue-300"
                              : hasInStock
                                ? "bg-white border border-gray-200 text-gray-700 hover:border-blue-400 hover:text-blue-700 hover:shadow-sm"
                                : "bg-gray-50 border border-gray-200 text-gray-500 hover:border-orange-300 hover:text-orange-700"
                          }`}
                        >
                          {size}
                          {!hasInStock && (
                            <span className="absolute -top-1.5 -left-1.5 text-[8px] bg-orange-100 text-orange-600 px-1 rounded">
                              استعلام
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* ─── RIGHT: Product Info ─── */}
          <div className="min-w-0">
            <p className="text-gray-500 mb-6">{family.mainCategory === "electromotor" ? `پوسته ${family.shellType} · ${uniqueSpeeds.length === 1 ? `${faNum(uniqueSpeeds[0])} دور بر دقیقه` : `${faNum(uniqueSpeeds.length)} سرعت مختلف`}` : "مشخصات فنی و وضعیت مدل انتخاب‌شده"}</p>

            {/* Quick Specs */}
            {selectedVariant && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {quickSpecs.map((spec) => <QuickSpec key={spec.label} icon={spec.icon} label={spec.label} value={String(spec.value)} />)}
              </div>
            )}

            {/* Stock */}
            {selectedVariant && (
              <div className="mb-6">
                {selectedVariant.inStock ? (
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
                    <CheckCircle2 size={14} />
                    موجود در کاتالوگ
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-orange-600 bg-orange-50 px-3 py-1.5 rounded-full">
                    نیازمند استعلام
                  </span>
                )}
                <span className="text-xs text-gray-400 mr-3">
                  کد: <bdi className="num-en">{selectedVariant.sku}</bdi>
                </span>
              </div>
            )}

            <Separator className="my-6" />

            {/* Price */}
            <div className="mb-6">
              {selectedVariant?.price && selectedVariant.price > 0 ? (
                <>
                  <p className="text-xs text-gray-400 mb-1">قیمت</p>
                  <p className="text-3xl font-extrabold text-blue-800">
                    {formatPrice(selectedVariant.price)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">قیمت ثبت‌شده برای این مشخصات</p>
                </>
              ) : (
                <>
                  <p className="text-xs text-gray-400 mb-1">قیمت</p>
                  <p className="text-xl font-semibold text-gray-600">استعلام قیمت</p>
                  <p className="text-xs text-gray-400 mt-1">برای این سایز، لطفاً تماس بگیرید</p>
                </>
              )}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-3 mb-8">
              <a href={phoneLink}>
                <Button size="lg" className="bg-blue-700 hover:bg-blue-800 text-white font-semibold px-8">
                  <Phone size={16} className="ml-1.5" />
                  تماس برای مشاوره
                </Button>
              </a>
              <a href={inquiryLink} target="_blank" rel="noopener">
                <Button size="lg" variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50 px-8">
                  <MessageCircle size={16} className="ml-1.5" />
                  واتساپ
                </Button>
              </a>
            </div>

            {/* Description */}
            {family.description && (
              <Card className="border-gray-200 mb-6">
                <CardContent className="p-4">
                  <h4 className="font-semibold text-gray-800 mb-2">درباره این محصول</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">{family.description}</p>
                </CardContent>
              </Card>
            )}

            {selectedVariant && (
              <div className="mb-6">
                <h2 className="font-semibold text-gray-800 mb-3">مشخصات فنی انتخاب‌شده</h2>
                <ProductSpecsTable category={family.mainCategory} shellType={family.shellType} variant={selectedVariant} />
              </div>
            )}

            {/* Features */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                { icon: ShieldCheck, label: "گارانتی اصالت", desc: "تضمین کیفیت" },
                { icon: Truck, label: "ارسال سریع", desc: "به سراسر ایران" },
                { icon: Cog, label: "ساخت صنعتی", desc: "مقاوم و بادوام" },
                { icon: Zap, label: "انتخاب تخصصی", desc: "متناسب با کاربرد" },
              ].map((f) => (
                <div key={f.label} className="flex items-center gap-2.5 bg-gray-50 rounded-lg px-3 py-2.5">
                  <f.icon size={16} className="text-blue-600 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-gray-800">{f.label}</p>
                    <p className="text-[10px] text-gray-400">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── Full Specs Table ─── */}
        <div className="mt-12">
          <h3 className="text-xl font-bold text-gray-900 mb-6">جدول مشخصات تمامی سایزها</h3>
          <Card className="overflow-hidden border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-600">
                    <th className="text-right px-4 py-3 font-medium">سایز فریم</th>
                    <th className="text-right px-4 py-3 font-medium">توان</th>
                    <th className="text-right px-4 py-3 font-medium">دور</th>
                    <th className="text-right px-4 py-3 font-medium">نحوه نصب</th>
                    <th className="text-right px-4 py-3 font-medium">قیمت</th>
                    <th className="text-center px-4 py-3 font-medium">وضعیت</th>
                    <th className="text-center px-4 py-3 font-medium">کد SKU</th>
                  </tr>
                </thead>
                <tbody>
                  {family.variants.map((v, i) => (
                    <tr
                      key={v.id}
                      className={`border-t border-gray-100 cursor-pointer transition-colors ${
                        v.id === selectedVariantId ? "bg-blue-50" : "hover:bg-gray-50"
                      }`}
                      onClick={() => setSelectedVariantId(v.id)}
                    >
                      <td className="px-4 py-3 font-medium num-en">{v.size}</td>
                      <td className="px-4 py-3 num-en">{v.power || "-"}</td>
                      <td className="px-4 py-3 num-en">{v.speed ? `${faNum(v.speed)} RPM` : "-"}</td>
                      <td className="px-4 py-3 num-en">{v.mountingType || "-"}</td>
                      <td className="px-4 py-3 font-semibold">
                        {v.price > 0 ? formatPrice(v.price) : <span className="text-gray-400">تماس بگیرید</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {v.inStock ? (
                          <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">موجود</Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-400 text-[10px]">استعلام</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-gray-400 num-en">{v.sku}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* ─── Catalog inquiry block ─── */}
        <div className="mt-12">
          <Card className="border-blue-200 bg-blue-50/50 overflow-hidden">
            <CardContent className="p-6 md:p-8">
              <h3 className="text-lg font-bold text-gray-900 mb-1">استعلام و مشاوره فنی</h3>
              <p className="text-sm text-gray-600 mb-5">
                این وب‌سایت کاتالوگ محصولات است. برای دریافت اطلاعات تکمیلی یا استعلام این مدل، از تماس یا واتساپ استفاده کنید.
              </p>
              <div className="flex flex-wrap gap-3">
                <a href={phoneLink}>
                  <Button className="bg-blue-700 hover:bg-blue-800 text-white">
                    <Phone size={16} className="ml-1.5" />
                    تماس با کارشناس
                  </Button>
                </a>
                <a href={inquiryLink} target="_blank" rel="noopener">
                  <Button variant="outline" className="border-blue-200 bg-white text-blue-700 hover:bg-blue-50 hover:text-blue-800">
                    <MessageCircle size={16} className="ml-1.5" />
                    استعلام در واتساپ
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>

        {relatedProducts.length > 0 && <section className="mt-12" aria-labelledby="related-products"><h2 id="related-products" className="text-xl font-bold text-gray-900 mb-6">محصولات مرتبط</h2><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">{relatedProducts.map(product => <ProductCard key={product.id} family={product} />)}</div></section>}

        {/* Back link */}
        <div className="mt-8 text-center">
          <Link href={categoryInfo.href} className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 transition-colors font-medium">
            <ArrowRight size={14} />
            بازگشت به کاتالوگ {categoryInfo.title}
          </Link>
        </div>
      </div>

      {/* ─── Footer ─── */}
      <SiteFooter />
    </div>
  );
}

/* ─────────────────────────── QUICK SPEC ─────────────────────────── */
function QuickSpec({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-xl px-4 py-3 text-center">
      <Icon size={16} className="text-blue-500 mx-auto mb-1.5" />
      <p className="text-[10px] text-gray-400">{label}</p>
      <p className="text-sm font-bold text-gray-800 num-en">{value}</p>
    </div>
  );
}


