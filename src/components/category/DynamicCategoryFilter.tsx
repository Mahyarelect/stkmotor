"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ActiveFilterBadges } from "./ActiveFilterBadges";

type Option = { value: string; label: string };
const FILTERS: Record<string, { level1: Option[]; level2: Record<string, Option[]> }> = {
  electromotor: {
    level1: [{ value: "تک‌فاز", label: "تک‌فاز" }, { value: "سه‌فاز", label: "سه‌فاز" }],
    level2: { "تک‌فاز": [{ value: "چدنی", label: "پوسته چدنی" }, { value: "آلومینیومی", label: "پوسته آلومینیومی" }], "سه‌فاز": [{ value: "چدنی", label: "پوسته چدنی" }, { value: "آلومینیومی", label: "پوسته آلومینیومی" }] },
  },
  gearbox: {
    level1: [{ value: "حلزونی", label: "حلزونی" }, { value: "مکعبی", label: "مکعبی" }, { value: "شافت مستقیم", label: "شافت مستقیم" }],
    level2: { "حلزونی": [{ value: "شافت‌دار", label: "VF شافت‌دار" }, { value: "فلنج‌دار (هالو شافت)", label: "MVF فلنج‌دار" }], "مکعبی": [], "شافت مستقیم": [] },
  },
  pump: {
    level1: [{ value: "الکتروپمپ", label: "الکتروپمپ" }, { value: "کف‌کش", label: "کف‌کش" }, { value: "لجن‌کش", label: "لجن‌کش" }, { value: "شناور", label: "شناور" }, { value: "پمپ دنده‌ای", label: "دنده‌ای" }, { value: "کله پمپ اسید", label: "پمپ اسید" }],
    level2: {},
  },
  accessories: {
    level1: [{ value: "فلنج", label: "فلنج" }, { value: "براکت عقب", label: "براکت عقب" }, { value: "فلنج خروجی", label: "فلنج خروجی" }],
    level2: { "فلنج": [{ value: "موتوژن", label: "موتوژن" }, { value: "الکتروژن", label: "الکتروژن" }, { value: "چینی", label: "چینی" }] },
  },
};

export interface CategoryFilterValue { search: string; level1: string; level2: string; speed: string; }

export function DynamicCategoryFilter({ category, value, onChange, onReset }: {
  category: string;
  value: CategoryFilterValue;
  onChange: (value: CategoryFilterValue) => void;
  onReset: () => void;
}) {
  const config = FILTERS[category] || FILTERS.electromotor;
  const level2Options = config.level2[value.level1] || [];
  const set = (key: keyof CategoryFilterValue, next: string) => onChange({
    ...value,
    [key]: next,
    ...(key === "level1" ? { level2: "" } : {}),
  });
  const controls = (
    <div className="grid gap-3">
      <div className="relative"><Search size={16} className="absolute right-3 top-3 text-gray-400" /><Input value={value.search} onChange={(e) => set("search", e.target.value)} placeholder="جستجوی نام یا کد محصول" className="pr-9" /></div>
      <Select value={value.level1 || "all"} onValueChange={(v) => set("level1", v === "all" ? "" : v)}><SelectTrigger><SelectValue placeholder="انتخاب نوع" /></SelectTrigger><SelectContent><SelectItem value="all">همه انواع</SelectItem>{config.level1.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select>
      {level2Options.length > 0 && <Select value={value.level2 || "all"} onValueChange={(v) => set("level2", v === "all" ? "" : v)}><SelectTrigger><SelectValue placeholder="انتخاب مشخصه دوم" /></SelectTrigger><SelectContent><SelectItem value="all">همه گزینه‌ها</SelectItem>{level2Options.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select>}
      {category === "electromotor" && <Select value={value.speed || "all"} onValueChange={(v) => set("speed", v === "all" ? "" : v)}><SelectTrigger><SelectValue placeholder="دور موتور" /></SelectTrigger><SelectContent><SelectItem value="all">همه دورها</SelectItem>{["750", "1000", "1400", "3000"].map(v => <SelectItem key={v} value={v}>{v} RPM</SelectItem>)}</SelectContent></Select>}
    </div>
  );
  const active: Array<{ key: string; label: string }> = (["level1", "level2", "speed"] as const).filter(k => value[k]).map(k => ({ key: k, label: value[k] }));
  if (value.search) active.unshift({ key: "search", label: value.search });
  return (
    <>
      <aside className="hidden lg:block sticky top-24 rounded-2xl border bg-white p-5 shadow-xs">{controls}</aside>
      <div className="lg:hidden"><Sheet><SheetTrigger asChild><Button variant="outline" className="w-full"><SlidersHorizontal size={16} className="ml-2" />فیلتر محصولات</Button></SheetTrigger><SheetContent side="bottom" className="rounded-t-3xl p-6"><SheetHeader><SheetTitle>فیلتر محصولات</SheetTitle><SheetDescription>نتایج را بر اساس نوع، مشخصات فنی یا نام محصول محدود کنید.</SheetDescription></SheetHeader><div className="mt-5">{controls}</div></SheetContent></Sheet></div>
      <div className="lg:col-span-2"><ActiveFilterBadges filters={active} onRemove={(key) => set(key as keyof CategoryFilterValue, "")} onReset={onReset} /></div>
    </>
  );
}
