"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";
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
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { ProductImage } from "@/components/ProductImage";
import { ProductImageZoom } from "@/components/product/ProductImageZoom";
import { ProductSpecsTable } from "@/components/product/ProductSpecsTable";
import { ProductCard, ProductFamilyData } from "@/components/product/ProductCard";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { telHref, useSiteSettings, whatsappHref } from "@/hooks/use-site-settings";
import {
  ProductLeadModal,
  ProductLeadFloatingButton,
  ProductLeadTriggerButton,
} from "@/components/product/ProductLeadModal";

/* ─────────────────────────── Types ─────────────────────────── */
interface Variant {
  id: string;
  sku: string;
  name?: string;
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
  media: {
    images: string[];
    videos: string[];
  };
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
  initialSku,
}: {
  params: Promise<{ slug: string }>;
  initialSku?: string;
}) {
  const siteSettings = useSiteSettings();
  const searchParams = useSearchParams();
  const currentSkuParam = searchParams.get("sku") || initialSku || "";
  const phoneLink = telHref(siteSettings.phone);
  const whatsappLink = whatsappHref(siteSettings.whatsapp);

  const [family, setFamily] = useState<ProductFamily | null>(null);
  const [loading, setLoading] = useState(true);
  const [userSelectedVariantId, setUserSelectedVariantId] = useState<string>("");
  const [prevSkuParam, setPrevSkuParam] = useState(currentSkuParam);
  const [relatedProducts, setRelatedProducts] = useState<ProductFamilyData[]>([]);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);

  const slugRef = useRef<string>("");

  // When SKU query param changes from external navigation, reset manual selection
  if (prevSkuParam !== currentSkuParam) {
    setPrevSkuParam(currentSkuParam);
    setUserSelectedVariantId("");
  }

  const matchedBySku = currentSkuParam && family?.variants
    ? family.variants.find((v: Variant) => v.sku === currentSkuParam)
    : null;

  const defaultVariant = family?.variants
    ? family.variants.find((v: Variant) => v.inStock && v.media.videos.length > 0) ||
      family.variants.find((v: Variant) => v.inStock && v.media.images[0]?.includes("/media/products/assets/")) ||
      family.variants.find((v: Variant) => v.media.videos.length > 0) ||
      family.variants.find((v: Variant) => v.inStock) ||
      family.variants[0]
    : null;

  const selectedVariantId =
    userSelectedVariantId ||
    (matchedBySku ? matchedBySku.id : null) ||
    defaultVariant?.id ||
    "";

  const setSelectedVariantId = (id: string) => {
    setUserSelectedVariantId(id);
  };

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
  interface TableColumn {
    id: string;
    label: string;
    align?: "right" | "center";
    render: (v: Variant) => React.ReactNode;
  }

  const tableTitle = useMemo(() => {
    if (!family) return "جدول مشخصات واریانت‌ها";
    switch (family.mainCategory) {
      case "gearbox":
        return "جدول مشخصات تیپ‌ها و نسبت‌های گیربکس";
      case "pump":
        return "جدول مشخصات و مدل‌های پمپ";
      case "accessories":
        return "جدول مشخصات قطعات و سایزها";
      default:
        return "جدول مشخصات تمامی سایزها و توان‌ها";
    }
  }, [family]);

  const quickSpecs = useMemo(() => {
    if (!selectedVariant || !family) return [];
    const cat = family.mainCategory;
    const v = selectedVariant;

    const candidates: Array<{ icon: any; label: string; value?: string }> = [];

    if (cat === "gearbox") {
      if (v.size) candidates.push({ icon: FileText, label: "تیپ / سایز", value: v.size });
      if (v.modelType) candidates.push({ icon: Cog, label: "مدل", value: v.modelType });
      if (v.ratio) candidates.push({ icon: Gauge, label: "نسبت تبدیل", value: `1:${v.ratio}` });
      if (v.inputFrame) candidates.push({ icon: Ruler, label: "فریم ورودی", value: v.inputFrame });
      if (v.inputType) candidates.push({ icon: Cog, label: "نوع ورودی", value: v.inputType });
      if (v.mountingType) candidates.push({ icon: FileText, label: "نحوه نصب", value: v.mountingType });
    } else if (cat === "pump") {
      if (v.pumpType) candidates.push({ icon: Cog, label: "نوع پمپ", value: v.pumpType });
      if (v.power) candidates.push({ icon: Zap, label: "توان", value: v.power });
      if (v.outletSize) candidates.push({ icon: Ruler, label: "دهانه خروجی", value: `${v.outletSize} اینچ` });
      if (v.headMeter) candidates.push({ icon: Gauge, label: "حداکثر هد", value: `${faNum(v.headMeter)} متر` });
      if (v.floater) candidates.push({ icon: ShieldCheck, label: "فلوتر", value: v.floater });
      if (v.bodyMaterial) candidates.push({ icon: FileText, label: "جنس بدنه", value: v.bodyMaterial });
    } else if (cat === "accessories") {
      if (v.flangeType) candidates.push({ icon: Cog, label: "نوع قطعه", value: v.flangeType });
      if (v.brand) candidates.push({ icon: ShieldCheck, label: "برند سازگار", value: v.brand });
      if (v.size || v.power) candidates.push({ icon: Ruler, label: "سایز متناسب", value: v.size || v.power });
      if (v.bodyMaterial) candidates.push({ icon: FileText, label: "جنس بدنه", value: v.bodyMaterial });
      if (v.flangeLength) candidates.push({ icon: FileText, label: "طول فلنج", value: v.flangeLength });
    } else {
      if (v.power) candidates.push({ icon: Zap, label: "توان", value: v.power });
      if (v.speed) candidates.push({ icon: Gauge, label: "دور موتور", value: `${faNum(v.speed)} RPM` });
      if (v.size && v.size !== v.power) candidates.push({ icon: Ruler, label: "سایز فریم", value: v.size });
      if (v.mountingType) candidates.push({ icon: FileText, label: "نحوه نصب", value: v.mountingType });
      if (family.shellType || v.bodyMaterial) {
        candidates.push({ icon: ShieldCheck, label: "جنس پوسته", value: family.shellType || v.bodyMaterial || "" });
      }
    }

    const filtered = candidates.filter(
      (item): item is { icon: any; label: string; value: string } =>
        Boolean(item.value && item.value.trim() !== "")
    );
    return filtered.slice(0, 4);
  }, [selectedVariant, family]);

  const tableColumns = useMemo<TableColumn[]>(() => {
    if (!family || !family.variants || family.variants.length === 0) return [];
    const cat = family.mainCategory;
    const variants = family.variants;

    const hasAny = (key: keyof Variant) =>
      variants.some((v) => {
        const val = v[key];
        return val !== undefined && val !== null && String(val).trim() !== "" && val !== 0 && val !== "0";
      });

    const cols: TableColumn[] = [];

    if (cat === "gearbox") {
      cols.push({
        id: "size",
        label: "تیپ / سایز",
        render: (v) => <span className="font-semibold text-gray-800 num-en">{v.size || "-"}</span>,
      });
      if (hasAny("modelType")) {
        cols.push({
          id: "modelType",
          label: "مدل",
          render: (v) => <span className="num-en font-medium text-gray-700">{v.modelType || "-"}</span>,
        });
      }
      if (hasAny("ratio")) {
        cols.push({
          id: "ratio",
          label: "نسبت تبدیل",
          render: (v) => <span className="num-en text-blue-700 font-medium">{v.ratio ? `1:${v.ratio}` : "-"}</span>,
        });
      }
      if (hasAny("inputFrame")) {
        cols.push({
          id: "inputFrame",
          label: "فریم ورودی",
          render: (v) => <span className="num-en text-gray-700">{v.inputFrame || "-"}</span>,
        });
      }
      if (hasAny("inputType")) {
        cols.push({
          id: "inputType",
          label: "نوع ورودی",
          render: (v) => <span className="text-gray-700">{v.inputType || "-"}</span>,
        });
      }
      if (hasAny("mountingType")) {
        cols.push({
          id: "mountingType",
          label: "نحوه نصب",
          render: (v) => <span className="text-gray-700">{v.mountingType || "-"}</span>,
        });
      }
    } else if (cat === "pump") {
      cols.push({
        id: "name",
        label: "مدل / مشخصه",
        render: (v) => <span className="font-semibold text-gray-800">{v.name || v.size}</span>,
      });
      if (hasAny("pumpType")) {
        cols.push({
          id: "pumpType",
          label: "نوع پمپ",
          render: (v) => <span className="text-gray-700">{v.pumpType || "-"}</span>,
        });
      }
      if (hasAny("power")) {
        cols.push({
          id: "power",
          label: "توان",
          render: (v) => <span className="num-en font-medium text-gray-800">{v.power || "-"}</span>,
        });
      }
      if (hasAny("outletSize")) {
        cols.push({
          id: "outletSize",
          label: "دهانه خروجی",
          render: (v) => <span className="num-en text-gray-700">{v.outletSize ? `${v.outletSize} اینچ` : "-"}</span>,
        });
      }
      if (hasAny("headMeter")) {
        cols.push({
          id: "headMeter",
          label: "حداکثر هد",
          render: (v) => <span className="num-en text-gray-700">{v.headMeter ? `${faNum(v.headMeter)} متر` : "-"}</span>,
        });
      }
      if (hasAny("floater")) {
        cols.push({
          id: "floater",
          label: "فلوتر",
          render: (v) => <span className="text-gray-700">{v.floater || "-"}</span>,
        });
      }
      if (hasAny("bodyMaterial")) {
        cols.push({
          id: "bodyMaterial",
          label: "جنس بدنه",
          render: (v) => <span className="text-gray-700">{v.bodyMaterial || "-"}</span>,
        });
      }
    } else if (cat === "accessories") {
      cols.push({
        id: "flangeType",
        label: "نوع قطعه",
        render: (v) => <span className="font-semibold text-gray-800">{v.flangeType || v.name || "-"}</span>,
      });
      if (hasAny("brand")) {
        cols.push({
          id: "brand",
          label: "برند سازگار",
          render: (v) => <span className="text-gray-700">{v.brand || "-"}</span>,
        });
      }
      cols.push({
        id: "size",
        label: "سایز متناسب",
        render: (v) => <span className="num-en font-medium text-gray-800">{v.size || v.power || "-"}</span>,
      });
      if (hasAny("bodyMaterial")) {
        cols.push({
          id: "bodyMaterial",
          label: "جنس بدنه",
          render: (v) => <span className="text-gray-700">{v.bodyMaterial || "-"}</span>,
        });
      }
      if (hasAny("flangeLength")) {
        cols.push({
          id: "flangeLength",
          label: "طول فلنج",
          render: (v) => <span className="text-gray-700">{v.flangeLength || "-"}</span>,
        });
      }
    } else {
      // Electromotor
      cols.push({
        id: "power",
        label: "توان",
        render: (v) => (
          <span className="font-semibold text-gray-800 num-en">
            {v.power || (v.powerKw ? `${v.powerKw} kW` : "-")}
          </span>
        ),
      });
      if (hasAny("speed")) {
        cols.push({
          id: "speed",
          label: "دور موتور",
          render: (v) => <span className="num-en text-gray-700">{v.speed ? `${faNum(v.speed)} RPM` : "-"}</span>,
        });
      }
      const hasDistinctSize = variants.some((v) => v.size && v.size !== v.power);
      if (hasDistinctSize) {
        cols.push({
          id: "size",
          label: "سایز فریم",
          render: (v) => <span className="num-en text-gray-700">{v.size || "-"}</span>,
        });
      }
      if (hasAny("mountingType")) {
        cols.push({
          id: "mountingType",
          label: "نحوه نصب",
          render: (v) => <span className="num-en text-gray-700">{v.mountingType || "-"}</span>,
        });
      }
      if (family.shellType || hasAny("bodyMaterial")) {
        cols.push({
          id: "shell",
          label: "جنس پوسته",
          render: (v) => <span>{v.bodyMaterial || family.shellType || "-"}</span>,
        });
      }
    }

    cols.push({
      id: "price",
      label: "قیمت",
      render: (v) => (
        <span className="font-semibold text-gray-900">
          {v.price > 0 ? formatPrice(v.price) : <span className="text-gray-400">تماس بگیرید</span>}
        </span>
      ),
    });

    cols.push({
      id: "status",
      label: "وضعیت",
      align: "center",
      render: (v) =>
        v.inStock ? (
          <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">موجود</Badge>
        ) : (
          <Badge className="bg-gray-100 text-gray-400 text-[10px]">استعلام</Badge>
        ),
    });

    cols.push({
      id: "sku",
      label: "کد کالا",
      align: "center",
      render: (v) => <span className="text-xs text-gray-400 num-en">{v.sku}</span>,
    });

    return cols;
  }, [family]);

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
            <div className="relative mb-6">
              <ProductMediaGallery
                key={selectedVariant?.sku || family.slug}
                name={family.name}
                sku={selectedVariant?.sku || ""}
                images={selectedVariant?.media.images || (family.imageUrl ? [family.imageUrl] : [])}
                videos={selectedVariant?.media.videos || []}
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
              <ProductLeadTriggerButton
                onClick={() => setIsLeadModalOpen(true)}
                className="px-6 rounded-xl"
              />
              <a href={phoneLink}>
                <Button size="lg" variant="outline" className="border-blue-200 text-blue-800 hover:bg-blue-50 font-semibold px-6 rounded-xl">
                  <Phone size={16} className="ml-1.5" />
                  تماس تلفنی
                </Button>
              </a>
              <a href={inquiryLink} target="_blank" rel="noopener" aria-label="استعلام در واتساپ">
                <Button size="lg" variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50 px-6 rounded-xl">
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
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">{tableTitle}</h3>
            <span className="text-xs text-gray-500 font-medium">
              {faNum(family.variants.length)} مدل / واریانت
            </span>
          </div>
          <Card className="overflow-hidden border-gray-200 shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-700 border-b border-gray-200">
                    {tableColumns.map((col) => (
                      <th
                        key={col.id}
                        className={`px-4 py-3.5 font-semibold text-xs ${
                          col.align === "center" ? "text-center" : "text-right"
                        }`}
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {family.variants.map((v) => (
                    <tr
                      key={v.id}
                      className={`cursor-pointer transition-colors ${
                        v.id === selectedVariantId ? "bg-blue-50/70" : "hover:bg-gray-50/80"
                      }`}
                      onClick={() => setSelectedVariantId(v.id)}
                    >
                      {tableColumns.map((col) => (
                        <td
                          key={col.id}
                          className={`px-4 py-3 ${
                            col.align === "center" ? "text-center" : "text-right"
                          }`}
                        >
                          {col.render(v)}
                        </td>
                      ))}
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

      {/* ─── Lead Capture Ad Popup & Floating Button ─── */}
      <ProductLeadModal
        productTitle={family.name}
        productSlug={family.slug}
        productSku={selectedVariant?.sku}
        variantDetails={
          selectedVariant
            ? [
                selectedVariant.power ? `توان: ${selectedVariant.power}` : null,
                selectedVariant.speed ? `دور: ${selectedVariant.speed} RPM` : null,
                selectedVariant.size ? `سایز فریم: ${selectedVariant.size}` : null,
                selectedVariant.mountingType ? `نحوه نصب: ${selectedVariant.mountingType}` : null,
              ]
                .filter(Boolean)
                .join(" | ")
            : ""
        }
        isOpen={isLeadModalOpen}
        onOpenChange={setIsLeadModalOpen}
        autoTriggerDelayMs={5000}
        enableExitIntent={true}
      />

      <ProductLeadFloatingButton onClick={() => setIsLeadModalOpen(true)} />

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

function ProductMediaGallery({
  name,
  sku,
  images,
  videos,
}: {
  name: string;
  sku: string;
  images: string[];
  videos: string[];
}) {
  const items = [
    ...images.map((src) => ({ src, type: "image" as const })),
    ...videos.map((src) => ({ src, type: "video" as const })),
  ];
  const [activeIndex, setActiveIndex] = useState(0);
  const active = items[activeIndex] || items[0];

  return (
    <section aria-label={`رسانه‌های ${name}`}>
      <div className="flex h-80 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 lg:h-[420px]">
        {active?.type === "video" ? (
          <video
            key={active.src}
            src={active.src}
            className="h-full w-full bg-slate-950 object-contain"
            controls
            playsInline
            preload="metadata"
            aria-label={`ویدیوی ${name} با کد ${sku}`}
          />
        ) : (
          <ProductImageZoom
            src={active?.src}
            alt={`${name}${sku ? ` - کد ${sku}` : ""}`}
            className="h-full w-full object-contain p-5 sm:p-6"
            iconSize={56}
            loading="eager"
            images={images}
            initialIndex={activeIndex}
            onThumbnailSelect={(idx) => setActiveIndex(idx)}
            allImages={images}
            activeIndex={activeIndex}
            onSelectImage={(idx) => setActiveIndex(idx)}
          />
        )}
      </div>

      {items.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-2" role="list" aria-label="انتخاب تصویر یا ویدیو">
          {items.map((item, index) => (
            <button
              key={`${item.type}-${item.src}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`${item.type === "image" ? "تصویر" : "ویدیو"} ${faNum(index + 1)} از ${faNum(items.length)}`}
              aria-pressed={activeIndex === index}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 bg-gray-50 transition-colors sm:h-20 sm:w-20 ${
                activeIndex === index ? "border-blue-600 ring-2 ring-blue-100" : "border-gray-200 hover:border-blue-300"
              }`}
            >
              {item.type === "image" ? (
                <ProductImage src={item.src} alt="" className="h-full w-full object-contain p-1" iconSize={18} />
              ) : (
                <span className="flex h-full w-full flex-col items-center justify-center bg-slate-900 text-white">
                  <Play size={20} fill="currentColor" />
                  <span className="mt-1 text-[9px]">ویدیو</span>
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}


