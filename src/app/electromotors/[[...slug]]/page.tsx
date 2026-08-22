import { Metadata } from "next";
import { getMotorCategoryByPath } from "@/data/motorCategories";
import { ElectromotorsClient } from "./ElectromotorsClient";

interface PageProps {
  params: Promise<{
    slug?: string[];
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { activeNode } = getMotorCategoryByPath(slug || []);

  return {
    title: `${activeNode.title} | STK Motors`,
    description: activeNode.description || "مشخصات فنی و استعلام قیمت انواع الکتروموتورهای صنعتی STK Motors",
    keywords: [
      activeNode.title,
      "الکتروموتور صنعتی",
      "الکتروموتور تک فاز",
      "الکتروموتور سه فاز",
      "پوسته چدنی",
      "پوسته آلومینیومی",
      "STK Motors",
    ],
  };
}

export default async function ElectromotorsPage({ params }: PageProps) {
  const { slug } = await params;
  return <ElectromotorsClient initialSlugs={slug || []} />;
}
