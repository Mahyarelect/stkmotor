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
  pumpType?: string;
  outletSize?: string;
  headMeter?: number;
  floater?: string;
  brand?: string;
  bodyMaterial?: string;
  flangeType?: string;
  flangeLength?: string;
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
  const variantsBySize = useMemo(() => {
    const map = new Map<string, Variant>();
    for (const variant of family.variants) {
      if (variant.size && !map.has(variant.size)) map.set(variant.size, variant);
    }
    return map;
  }, [family.variants]);

  const uniqueSizes = useMemo(
    () =>
      [...variantsBySize.keys()].sort(
        (a, b) => Number.parseInt(a) - Number.parseInt(b)
      ),
    [variantsBySize]
  );

  const firstVariant =
    family.variants.find((variant) => variant.inStock) || family.variants[0];
  const [selectedSize, setSelectedSize] = useState(firstVariant?.size || "");
  const activeVariant =
    variantsBySize.get(selectedSize) || firstVariant || family.variants[0];
  const effectiveSelectedSize = activeVariant?.size || selectedSize;

  const uniqueSpeeds = useMemo(
    () =>
      [...new Set(family.variants.map((v) => v.speed).filter(Boolean))].sort(
        (a, b) => Number.parseInt(a) - Number.parseInt(b)
      ),
    [family.variants]
  );

  const sizeRange =
    uniqueSizes.length > 0
      ? `${faNum(uniqueSizes[0])} – ${faNum(uniqueSizes[uniqueSizes.length - 1])}`
      : "";
  const visibleSizes = uniqueSizes.slice(0, 6);
  const hiddenSizeCount = Math.max(0, uniqueSizes.length - visibleSizes.length);

  const categoryLabel = {
    electromotor: family.phase || "الکتروموتور",
    gearbox: "گیربکس",
    pump: "پمپ",
    accessories: "لوازم جانبی",
  }[family.mainCategory] || family.phase || "محصول صنعتی";

  const specs = family.mainCategory === "gearbox"
    ? [["مدل", activeVariant?.modelType], ["نسبت", activeVariant?.ratio], ["فریم ورودی", activeVariant?.inputFrame]]
    : family.mainCategory === "pump"
      ? [["نوع", activeVariant?.pumpType], ["دهانه", activeVariant?.outletSize], ["هد", activeVariant?.headMeter ? `${activeVariant.headMeter} m` : ""]]
      : family.mainCategory === "accessories"
        ? [["نوع قطعه", activeVariant?.flangeType], ["برند", activeVariant?.brand], ["سایز", activeVariant?.size]]
        : [["توان", activeVariant?.power], ["سرعت", activeVariant?.speed ? `${faNum(activeVariant.speed)} RPM` : ""], ["پوسته / بدنه", family.shellType]];

  return (
    <Card className="overflow-hidden border-gray-200 hover:shadow-xl hover:border-blue-300 transition-all group flex flex-col bg-white">
      {/* Product Image Header */}
      <div className="relative bg-gradient-to-br from-gray-50 to-slate-100 h-40 sm:h-44 flex items-center justify-center overflow-hidden border-b border-gray-100">
        <ProductImage
          src={family.imageUrl}
          alt={family.name}
          className="h-full w-full object-contain p-3 transition-transform duration-300 group-hover:scale-[1.04]"
          iconSize={40}
        />
        {/* Category badge */}
        <Badge
          className={`absolute top-3 right-3 text-[10px] px-2 py-0.5 shadow-xs ${
            family.category === "single-phase"
              ? "bg-amber-500 hover:bg-amber-600 text-white"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          {categoryLabel}
        </Badge>
        {/* Variant count badge */}
        <Badge className="absolute top-3 left-3 text-[10px] px-2 py-0.5 bg-white/90 text-gray-600 border border-gray-200/80 shadow-xs">
          {faNum(uniqueSizes.length || family.variantCount)} سایز
        </Badge>
      </div>

      <CardContent className="p-4 sm:p-5 flex flex-col flex-1">
        {/* Systematic Name */}
        <Link href={`/product/${family.slug}`} className="block mb-1">
          <h4 className="font-bold text-gray-900 text-base group-hover:text-blue-700 transition-colors line-clamp-1">
            {family.name}
          </h4>
        </Link>

        {/* Subtitle: Shell Type + Speed + Size Range */}
        <p className="text-xs text-gray-400 mb-3.5">
          {family.mainCategory === "electromotor" ? `پوسته ${family.shellType}` : categoryLabel}
          {uniqueSpeeds.length > 0 && ` · ${faNum(uniqueSpeeds[0])} دور`}
          {sizeRange && ` · سایز ${sizeRange}`}
        </p>

        {/* Size Selector Chips */}
        {uniqueSizes.length > 0 && (
          <div className="mb-3.5">
            <p className="text-[10px] text-gray-500 mb-1.5 font-medium">
              انتخاب توان / سایز:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {visibleSizes.map((size) => {
                const sizeVariant = variantsBySize.get(size);
                const hasInStock = Boolean(sizeVariant?.inStock);
                const isSelected = effectiveSelectedSize === size;

                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    aria-pressed={isSelected}
                    className={`relative min-h-10 min-w-10 px-2.5 py-1 rounded-md text-xs font-semibold num-en transition-all ${
                      isSelected
                        ? "bg-blue-700 text-white shadow-xs ring-2 ring-blue-300"
                        : hasInStock
                        ? "bg-white border border-gray-200 text-gray-700 hover:border-blue-400 hover:text-blue-700"
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
              {hiddenSizeCount > 0 && (
                <span className="inline-flex min-h-10 items-center rounded-md border border-dashed border-gray-300 px-2.5 text-xs font-semibold text-gray-500 num-en" title={`${hiddenSizeCount} سایز دیگر`}>
                  +{faNum(hiddenSizeCount)}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Dynamic Specs (3 compact items) */}
        <div className="grid grid-cols-3 gap-1.5 mb-3.5">
          {specs.map(([label, value]) => (
            <div key={label as string} className="bg-gray-50/80 border border-gray-100 rounded-lg px-2 py-1.5 text-center">
              <p className="text-[9px] text-gray-400 font-medium">{label}</p>
              <p className="text-[11px] font-bold text-gray-800 num-en">{value || "-"}</p>
            </div>
          ))}
        </div>

        {/* Stock Status */}
        <div className="mb-3">
          {activeVariant?.inStock ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
              <CheckCircle2 size={12} />
              موجود در کاتالوگ
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-orange-700 bg-orange-50 px-2 py-0.5 rounded-md">
              <X size={12} />
              استعلام قیمت
            </span>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Price */}
        <div className="mb-3.5 pt-2 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-400">قیمت:</span>
          {activeVariant && activeVariant.price > 0 ? (
            <div className="text-sm sm:text-base font-extrabold text-blue-900">
              {formatPrice(activeVariant.price)}
            </div>
          ) : (
            <div className="text-xs font-semibold text-gray-500">تماس بگیرید</div>
          )}
        </div>

        {/* CTA */}
        <Link href={`/product/${family.slug}`} className="block">
          <Button className="w-full bg-blue-700 hover:bg-blue-800 text-white text-xs sm:text-sm font-semibold h-9 shadow-xs">
            مشاهده مشخصات کامل
            <ChevronLeft size={14} className="mr-1" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
