"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { CheckCircle2, ChevronLeft, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductImage } from "@/components/ProductImage";

export interface Variant {
  id: string;
  sku: string;
  size: string;
  power: string;
  powerKw: number;
  speed: string;
  price: number;
  inStock: boolean;
  sortOrder: number;
  mountingType?: string;
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
  media?: {
    images: string[];
    videos: string[];
  };
}

export interface ProductFamilyData {
  id: string;
  slug: string;
  name: string;
  nameEn: string;
  mainCategory: string;
  category: string;
  phase: string;
  shellType: string;
  imageUrl: string;
  sortOrder: number;
  variantCount: number;
  variants: Variant[];
}

function formatPrice(price: number): string {
  if (price === 0) return "تماس بگیرید";
  return new Intl.NumberFormat("fa-IR").format(price) + " تومان";
}

function faNum(n: number | string): string {
  return String(n).replace(/\d/g, (d) =>
    "\u06F0\u06F1\u06F2\u06F3\u06F4\u06F5\u06F6\u06F7\u06F8\u06F9"[parseInt(d)]
  );
}

export function ProductCard({ family }: { family: ProductFamilyData }) {
  const isRatioSelectable = useMemo(() => {
    if (family.mainCategory !== "gearbox" && family.category !== "cubic") return false;
    const ratios = new Set(family.variants.map((v) => v.ratio).filter(Boolean));
    const sizes = new Set(
      family.variants
        .map((v) => v.size)
        .filter((s) => typeof s === "string" && s.trim().length > 0)
    );
    return ratios.size > 1 && sizes.size <= 1;
  }, [family.mainCategory, family.category, family.variants]);

  const variantsByOption = useMemo(() => {
    const map = new Map<string, Variant>();
    for (const variant of family.variants) {
      const key = isRatioSelectable ? variant.ratio : variant.size;
      if (key && (!map.has(key) || (variant.inStock && !map.get(key)?.inStock))) {
        map.set(key, variant);
      }
    }
    return map;
  }, [family.variants, isRatioSelectable]);

  const uniqueOptions = useMemo(() => {
    const keys = [...variantsByOption.keys()];
    return keys.sort((a, b) => Number.parseFloat(a) - Number.parseFloat(b));
  }, [variantsByOption]);

  const firstVariant =
    family.variants.find((variant) => variant.inStock && variant.media?.images[0]?.includes("/media/products/assets/")) ||
    family.variants.find((variant) => variant.media?.images[0]?.includes("/media/products/assets/")) ||
    family.variants.find((variant) => variant.inStock) ||
    family.variants[0];

  const defaultOption = isRatioSelectable
    ? firstVariant?.ratio || uniqueOptions[0] || ""
    : firstVariant?.size || uniqueOptions[0] || "";

  const [selectedOption, setSelectedOption] = useState(defaultOption);
  const activeVariant =
    variantsByOption.get(selectedOption) || firstVariant || family.variants[0];
  const effectiveSelectedOption = isRatioSelectable
    ? activeVariant?.ratio || selectedOption
    : activeVariant?.size || selectedOption;

  const uniqueSpeeds = useMemo(
    () =>
      [...new Set(family.variants.map((v) => v.speed).filter(Boolean))].sort(
        (a, b) => Number.parseInt(a) - Number.parseInt(b)
      ),
    [family.variants]
  );

  const sizeRange = useMemo(() => {
    if (isRatioSelectable) {
      return activeVariant?.size ? `تیپ ${activeVariant.size}` : "";
    }
    return uniqueOptions.length > 0
      ? `${faNum(uniqueOptions[0])} – ${faNum(uniqueOptions[uniqueOptions.length - 1])}`
      : "";
  }, [isRatioSelectable, activeVariant, uniqueOptions]);

  const visibleOptions = isRatioSelectable ? uniqueOptions : uniqueOptions.slice(0, 6);
  const hiddenOptionCount = isRatioSelectable ? 0 : Math.max(0, uniqueOptions.length - visibleOptions.length);

  const productUrl = activeVariant?.sku
    ? `/product/${family.slug}?sku=${activeVariant.sku}`
    : `/product/${family.slug}`;

  const categoryLabel = {
    electromotor: family.phase || "الکتروموتور",
    gearbox: "گیربکس",
    pump: "پمپ",
    accessories: "لوازم جانبی",
  }[family.mainCategory] || family.phase || "محصول صنعتی";

  const specs = useMemo(() => {
    const list: Array<[string, string | undefined]> = [];
    if (family.mainCategory === "gearbox") {
      if (activeVariant?.modelType) list.push(["مدل", activeVariant.modelType]);
      if (activeVariant?.ratio) list.push(["نسبت", `1:${activeVariant.ratio}`]);
      if (activeVariant?.inputFrame) list.push(["فریم ورودی", activeVariant.inputFrame]);
      if (activeVariant?.inputType) list.push(["نوع ورودی", activeVariant.inputType]);
      if (activeVariant?.mountingType) list.push(["نصب", activeVariant.mountingType]);
    } else if (family.mainCategory === "pump") {
      if (activeVariant?.pumpType) list.push(["نوع پمپ", activeVariant.pumpType]);
      if (activeVariant?.power) list.push(["توان", activeVariant.power]);
      if (activeVariant?.outletSize) list.push(["دهانه", `${activeVariant.outletSize} اینچ`]);
      if (activeVariant?.headMeter) list.push(["حداکثر هد", `${activeVariant.headMeter} متر`]);
      if (activeVariant?.floater) list.push(["فلوتر", activeVariant.floater]);
    } else if (family.mainCategory === "accessories") {
      if (activeVariant?.flangeType) list.push(["نوع قطعه", activeVariant.flangeType]);
      if (activeVariant?.brand) list.push(["برند", activeVariant.brand]);
      if (activeVariant?.size || activeVariant?.power) list.push(["سایز", activeVariant?.size || activeVariant?.power]);
      if (activeVariant?.bodyMaterial) list.push(["جنس", activeVariant.bodyMaterial]);
    } else {
      if (activeVariant?.power) list.push(["توان", activeVariant.power]);
      if (activeVariant?.speed) list.push(["سرعت", `${faNum(activeVariant.speed)} RPM`]);
      if (activeVariant?.size) list.push(["سایز فریم", activeVariant.size]);
    }
    const filtered = list.filter(([_, val]) => val && val.trim() !== "");
    return filtered.slice(0, 3);
  }, [family, activeVariant]);

  return (
    <Card className="overflow-hidden border border-slate-200/90 rounded-2xl hover:shadow-2xl hover:border-blue-400/80 hover:-translate-y-1 transition-all duration-300 group flex flex-col bg-white">
      {/* Product Image Header (Showcase Room) */}
      <Link
        href={productUrl}
        className="relative bg-gradient-to-b from-slate-50/90 via-white to-slate-100/70 h-56 sm:h-64 flex items-center justify-center overflow-hidden border-b border-slate-100 p-4 block group/img"
      >
        {/* Subtle radial glow to make machinery pop */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-slate-50/50 to-slate-100/60 pointer-events-none" />

        <ProductImage
          src={activeVariant?.media?.images[0] || firstVariant?.media?.images[0] || family.imageUrl}
          alt={family.name}
          className="relative z-10 h-full w-full object-contain drop-shadow-md group-hover:drop-shadow-xl transition-all duration-300 group-hover:scale-105"
          iconSize={48}
        />

        {/* Category badge */}
        <span
          className={`absolute top-3.5 right-3.5 z-20 text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-xs border ${
            family.category === "single-phase"
              ? "bg-amber-500/90 text-white border-amber-400/50"
              : "bg-blue-600/90 text-white border-blue-400/50"
          }`}
        >
          {categoryLabel}
        </span>

        {/* Variant count badge */}
        <span className="absolute top-3.5 left-3.5 z-20 text-[11px] font-semibold px-2.5 py-1 bg-white/95 backdrop-blur-xs text-slate-700 border border-slate-200/90 rounded-lg shadow-xs">
          {faNum(uniqueOptions.length || family.variantCount)} تنوع
        </span>

        {/* Hover hint */}
        <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <span className="bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-medium px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-1">
            مشاهده جزئیات
          </span>
        </div>
      </Link>

      <CardContent className="p-4 sm:p-5 flex flex-col flex-1">
        {/* Systematic Name */}
        <Link href={productUrl} className="block mb-1">
          <h4 className="font-bold text-slate-900 text-base sm:text-lg group-hover:text-blue-700 transition-colors line-clamp-1">
            {family.name}
          </h4>
        </Link>

        {/* Subtitle: Shell Type + Speed + Size Range */}
        <p className="text-xs text-slate-500 mb-3.5 font-medium flex items-center gap-1.5 flex-wrap">
          <span>{family.mainCategory === "electromotor" ? `پوسته ${family.shellType}` : categoryLabel}</span>
          {uniqueSpeeds.length > 0 && <span>· {faNum(uniqueSpeeds[0])} دور</span>}
          {sizeRange && <span>· {sizeRange}</span>}
        </p>

        {/* Variant Selector Chips (Size or Ratio) */}
        {uniqueOptions.length > 0 && (
          <div className="mb-3.5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] text-slate-500 font-medium">
                {isRatioSelectable ? "انتخاب نسبت تبدیل:" : "انتخاب مدل / سایز:"}
              </span>
              {effectiveSelectedOption && (
                <span className="text-[11px] font-bold text-blue-700 num-en">
                  {isRatioSelectable ? `1:${effectiveSelectedOption}` : effectiveSelectedOption}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {visibleOptions.map((opt) => {
                const optVariant = variantsByOption.get(opt);
                const hasInStock = Boolean(optVariant?.inStock);
                const isSelected = effectiveSelectedOption === opt;

                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setSelectedOption(opt)}
                    aria-pressed={isSelected}
                    className={`relative min-h-9 min-w-9 px-2.5 py-1 rounded-lg text-xs font-bold num-en transition-all duration-150 ${
                      isSelected
                        ? "bg-blue-600 text-white shadow-sm ring-2 ring-blue-300 scale-[1.02]"
                        : hasInStock
                        ? "bg-slate-50 hover:bg-white border border-slate-200 text-slate-700 hover:border-blue-400 hover:text-blue-700"
                        : "bg-slate-50 border border-dashed border-slate-200 text-slate-400 hover:border-amber-300 hover:text-amber-700"
                    }`}
                  >
                    {isRatioSelectable ? `1:${opt}` : opt}
                    {!hasInStock && (
                      <span className="absolute -top-1.5 -left-1.5 text-[7px] bg-amber-100 text-amber-700 font-medium px-1 rounded leading-none border border-amber-200">
                        استعلام
                      </span>
                    )}
                  </button>
                );
              })}
              {hiddenOptionCount > 0 && (
                <Link
                  href={`/product/${family.slug}`}
                  className="inline-flex min-h-9 items-center rounded-lg border border-dashed border-slate-300 hover:border-blue-400 hover:text-blue-700 px-2.5 text-xs font-semibold text-slate-500 num-en transition-colors"
                  title={`${hiddenOptionCount} ${isRatioSelectable ? "نسبت" : "سایز"} دیگر`}
                >
                  +{faNum(hiddenOptionCount)}
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Dynamic Specs (3 compact items) */}
        {specs.length > 0 && (
          <div className="grid grid-cols-3 gap-1.5 mb-3.5">
            {specs.map(([label, value]) => (
              <div
                key={label as string}
                className="bg-slate-50/90 border border-slate-100 rounded-xl px-2 py-2 text-center"
              >
                <p className="text-[10px] text-slate-400 font-medium mb-0.5">{label}</p>
                <p className="text-[11px] font-bold text-slate-800 num-en line-clamp-1">{value || "-"}</p>
              </div>
            ))}
          </div>
        )}

        {/* Stock Status */}
        <div className="mb-3">
          {activeVariant?.inStock ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
              <CheckCircle2 size={12} className="text-emerald-600" />
              موجود در انبار
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-100">
              <X size={12} className="text-amber-600" />
              نیازمند استعلام
            </span>
          )}
          {activeVariant?.sku && (
            <span className="text-[11px] text-slate-400 mr-2 num-en font-mono">
              کد: {activeVariant.sku}
            </span>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Price & CTA */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between mb-3">
          <span className="text-xs text-slate-400 font-medium">قیمت:</span>
          {activeVariant && activeVariant.price > 0 ? (
            <div className="text-base sm:text-lg font-extrabold text-blue-900 num-en">
              {formatPrice(activeVariant.price)}
            </div>
          ) : (
            <div className="text-xs font-bold text-slate-500">تماس بگیرید</div>
          )}
        </div>

        {/* CTA */}
        <Link href={productUrl} className="block">
          <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold h-10 rounded-xl shadow-xs transition-all duration-200">
            مشاهده مشخصات و خرید
            <ChevronLeft size={15} className="mr-1" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
