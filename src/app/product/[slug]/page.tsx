import { Metadata } from "next";
import ProductDetailClient from "./ProductDetailClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  // Dynamic metadata would be ideal here, but for now keep it simple
  return {
    title: `الکتروموتور | STK Motors`,
    description: "مشخصات کامل الکتروموتور پوسته چدنی STK - مشاهده جزئیات فنی و استعلام قیمت",
  };
}

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return <ProductDetailClient params={params} />;
}
