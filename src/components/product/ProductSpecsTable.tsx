"use client";

import { Card } from "@/components/ui/card";

type SpecVariant = {
  power?: string; speed?: string; size?: string; mountingType?: string;
  gearboxType?: string; modelType?: string; ratio?: string; inputFrame?: string; inputType?: string;
  pumpType?: string; outletSize?: string; headMeter?: number; floater?: string;
  brand?: string; bodyMaterial?: string; flangeType?: string; flangeLength?: string;
};

export function ProductSpecsTable({ category, shellType, variant }: { category: string; shellType?: string; variant: SpecVariant }) {
  const rows: Array<[string, string | number | undefined]> = category === "gearbox"
    ? [["نوع گیربکس", variant.gearboxType], ["مدل", variant.modelType], ["نسبت تبدیل", variant.ratio], ["فریم ورودی", variant.inputFrame], ["نوع ورودی", variant.inputType]]
    : category === "pump"
      ? [["نوع پمپ", variant.pumpType], ["سایز دهانه خروجی", variant.outletSize], ["حداکثر هد", variant.headMeter ? `${variant.headMeter} متر` : ""], ["فلوتر", variant.floater], ["جنس بدنه", variant.bodyMaterial]]
      : category === "accessories"
        ? [["نوع قطعه", variant.flangeType], ["برند سازگار", variant.brand], ["سایز فریم", variant.size], ["طول فلنج", variant.flangeLength], ["جنس", variant.bodyMaterial]]
        : [["توان", variant.power], ["دور موتور", variant.speed ? `${variant.speed} RPM` : ""], ["سایز فریم", variant.size], ["نوع نصب", variant.mountingType], ["جنس پوسته", shellType]];
  return <Card className="max-w-full overflow-hidden border-gray-200"><div className="max-w-full overflow-x-auto"><table className="w-full text-sm"><tbody>{rows.map(([label, value]) => <tr key={label} className="border-b last:border-0 border-gray-100"><th className="w-2/5 bg-gray-50 px-4 py-3 text-right font-medium text-gray-500">{label}</th><td className="px-4 py-3 font-semibold text-gray-800 num-en">{value || "-"}</td></tr>)}</tbody></table></div></Card>;
}
