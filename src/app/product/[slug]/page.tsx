import { Suspense } from "react";
import { Metadata } from "next";
import ProductDetailClient from "./ProductDetailClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `تجهیزات صنعتی | STK Motors`,
    description: "مشخصات کامل تجهیزات صنعتی STK - مشاهده جزئیات فنی و استعلام قیمت",
  };
}

export default async function ProductDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ sku?: string }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center text-sm text-gray-500">در حال بارگذاری مشخصات محصول...</div>}>
      <ProductDetailClient params={params} initialSku={resolvedSearchParams?.sku} />
    </Suspense>
  );
}
