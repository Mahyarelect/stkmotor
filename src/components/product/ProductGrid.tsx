"use client";

import { Search, RotateCcw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ProductCard, ProductFamilyData } from "./ProductCard";

interface ProductGridProps {
  products: ProductFamilyData[];
  loading: boolean;
  total: number;
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  onResetFilters?: () => void;
  itemLabel?: string;
}

function faNum(n: number | string): string {
  return String(n).replace(/\d/g, (d) =>
    "\u06F0\u06F1\u06F2\u06F3\u06F4\u06F5\u06F6\u06F7\u06F8\u06F9"[parseInt(d)]
  );
}

export function ProductGrid({
  products,
  loading,
  total,
  hasMore,
  loadingMore,
  onLoadMore,
  onResetFilters,
  itemLabel = "محصول",
}: ProductGridProps) {
  if (loading) {
    return (
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="overflow-hidden border-gray-200">
            <Skeleton className="h-44 w-full" />
            <CardContent className="p-5 space-y-3">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-9 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-16 px-4 bg-white rounded-2xl border border-gray-200 shadow-xs">
        <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
          <Search size={28} />
        </div>
        <h4 className="text-lg font-bold text-gray-900 mb-2">
          محصولی با این مشخصات یافت نشد
        </h4>
        <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">
          فیلترهای انتخابی یا عبارت جستجو را تغییر دهید تا نتایج متناسب نمایش داده شوند.
        </p>
        {onResetFilters && (
          <Button
            variant="outline"
            onClick={onResetFilters}
            className="border-blue-200 text-blue-700 hover:bg-blue-50"
          >
            <RotateCcw size={14} className="ml-1.5" />
            پاک کردن فیلترها
          </Button>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((family) => (
          <ProductCard key={family.id} family={family} />
        ))}
      </div>

      {/* Catalog Counter */}
      <div className="text-center mt-8">
        <p className="text-xs sm:text-sm text-gray-500">
          نمایش <span className="font-bold text-gray-800 num-en">{faNum(products.length)}</span> از{" "}
          <span className="font-bold text-gray-800 num-en">{faNum(total)}</span> {itemLabel}
        </p>
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="mt-6 flex justify-center">
          <Button
            variant="outline"
            onClick={onLoadMore}
            disabled={loadingMore}
            className="min-w-44 border-blue-300 bg-white text-blue-700 hover:bg-blue-50 hover:text-blue-800 shadow-xs h-10 font-semibold"
          >
            {loadingMore ? "در حال بارگذاری..." : "نمایش مدل‌های بیشتر"}
          </Button>
        </div>
      )}
    </div>
  );
}
