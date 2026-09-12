"use client";

import { Card } from "@/components/ui/card";

type SpecVariant = {
  power?: string;
  speed?: string;
  size?: string;
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
};

export function ProductSpecsTable({
  category,
  shellType,
  variant,
}: {
  category: string;
  shellType?: string;
  variant: SpecVariant;
}) {
  const rawRows: Array<[string, string | number | undefined]> =
    category === "gearbox"
      ? [
          ["تیپ / سایز", variant.size],
          ["نوع گیربکس", variant.gearboxType],
          ["مدل", variant.modelType],
          ["نسبت تبدیل", variant.ratio ? `1:${variant.ratio}` : undefined],
          ["فریم ورودی", variant.inputFrame],
          ["نوع ورودی", variant.inputType],
          ["نحوه نصب", variant.mountingType],
        ]
      : category === "pump"
      ? [
          ["نوع پمپ", variant.pumpType],
          ["توان", variant.power],
          ["سایز دهانه خروجی", variant.outletSize ? `${variant.outletSize} اینچ` : undefined],
          ["حداکثر ارتفاع (هد)", variant.headMeter ? `${variant.headMeter} متر` : undefined],
          ["فلوتر", variant.floater],
          ["جنس بدنه", variant.bodyMaterial],
        ]
      : category === "accessories"
      ? [
          ["نوع قطعه", variant.flangeType],
          ["برند سازگار", variant.brand],
          ["سایز متناسب", variant.size || variant.power],
          ["جنس بدنه", variant.bodyMaterial],
          ["طول فلنج", variant.flangeLength],
        ]
      : [
          ["توان", variant.power],
          ["دور موتور", variant.speed ? `${variant.speed} RPM` : undefined],
          ["سایز فریم", variant.size && variant.size !== variant.power ? variant.size : undefined],
          ["نحوه نصب", variant.mountingType],
          ["جنس پوسته", shellType || variant.bodyMaterial],
        ];

  // Only keep rows with meaningful values
  const activeRows = rawRows.filter(
    ([_, value]) =>
      value !== undefined &&
      value !== null &&
      String(value).trim() !== "" &&
      value !== 0 &&
      value !== "0"
  );

  const displayRows =
    activeRows.length > 0
      ? activeRows
      : rawRows.slice(0, 3).map(([label, val]) => [label, val || "-"] as [string, string]);

  return (
    <Card className="max-w-full overflow-hidden border-gray-200">
      <div className="max-w-full overflow-x-auto">
        <table className="w-full text-sm">
          <tbody>
            {displayRows.map(([label, value]) => (
              <tr key={label} className="border-b last:border-0 border-gray-100">
                <th className="w-2/5 bg-gray-50 px-4 py-3 text-right font-medium text-gray-500">
                  {label}
                </th>
                <td className="px-4 py-3 font-semibold text-gray-800 num-en">
                  {value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

