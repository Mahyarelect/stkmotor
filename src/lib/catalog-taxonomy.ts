export const CATALOG_TAXONOMY = [
  { slug: "electromotor", label: "الکتروموتور", children: [
    { slug: "single-phase", label: "الکتروموتور تک‌فاز" },
    { slug: "three-phase", label: "الکتروموتور سه‌فاز" },
  ] },
  { slug: "gearbox", label: "گیربکس", children: [
    { slug: "worm", label: "گیربکس حلزونی" }, { slug: "inline-shaft", label: "گیربکس شافت مستقیم" }, { slug: "cubic", label: "گیربکس مکعبی" },
  ] },
  { slug: "pump", label: "پمپ", children: [
    { slug: "surface-pump", label: "الکتروپمپ" }, { slug: "submersible-sump", label: "کف‌کش" }, { slug: "sewage-pump", label: "لجن‌کش" },
    { slug: "submersible-pump", label: "شناور" }, { slug: "gear-pump", label: "پمپ دنده‌ای" }, { slug: "acid-pump", label: "پمپ اسید" },
  ] },
  { slug: "accessories", label: "لوازم جانبی", children: [
    { slug: "motor-flange", label: "فلنج الکتروموتور" }, { slug: "rear-bracket", label: "براکت عقب" }, { slug: "gearbox-flange", label: "فلنج خروجی گیربکس" },
  ] },
] as const;

export function taxonomyCategory(slug: string) {
  return CATALOG_TAXONOMY.find((category) => category.slug === slug);
}

export function legacyCategory(mainCategory: string, subCategory: string) {
  return mainCategory === "electromotor" ? subCategory : subCategory || mainCategory;
}

export function phaseForCategory(mainCategory: string, subCategory: string) {
  if (mainCategory !== "electromotor") return "";
  return subCategory === "single-phase" ? "تک‌فاز" : subCategory === "three-phase" ? "سه‌فاز" : "";
}
