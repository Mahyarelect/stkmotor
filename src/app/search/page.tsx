import { Suspense } from "react";
import { Metadata } from "next";
import { SearchResultsClient } from "./SearchResultsClient";

export const metadata: Metadata = {
  title: "جستجوی هوشمند تجهیزات صنعتی | STK Motor",
  description:
    "موتور جستجوی تخصصی الکتروموتورهای تک‌فاز و سه‌فاز، گیربکس‌های صنعتی، پمپ‌های کشاورزی و قطعات جانبی با تفکیک مشخصات فنی و استعلام قیمت آنلاین",
};

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    query?: string;
    category?: string;
    speed?: string;
    inStock?: string;
    sortBy?: string;
    page?: string;
  }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolved = await searchParams;
  const initialQuery = resolved.q || resolved.query || "";
  const initialCategory = resolved.category || "all";
  const initialSpeed = resolved.speed || "all";
  const initialInStock = resolved.inStock === "true";
  const initialSortBy = resolved.sortBy || "relevance";
  const initialPage = Number.parseInt(resolved.page || "1", 10) || 1;

  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center text-sm text-gray-500">در حال بارگذاری صفحه جستجو...</div>}>
      <SearchResultsClient
        initialQuery={initialQuery}
        initialCategory={initialCategory}
        initialSpeed={initialSpeed}
        initialInStock={initialInStock}
        initialSortBy={initialSortBy}
        initialPage={initialPage}
      />
    </Suspense>
  );
}
