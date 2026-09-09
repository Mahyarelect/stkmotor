"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Package,
  ArrowLeft,
  AlertTriangle,
  X,
  Check,
  Loader2,
  Cog,
  Settings,
  Droplets,
  Wrench,
  Layers,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProductImage } from "@/components/ProductImage";

/* ─────────────────────────────────────────────────────────────
 * Types
 * ───────────────────────────────────────────────────────────── */
interface Family {
  id: string;
  slug: string;
  name: string;
  nameEn: string;
  mainCategory: string;
  category: string;
  subCategory: string;
  phase: string;
  shellType: string;
  brand: string;
  level1Value: string;
  level2Value: string;
  description: string;
  imageUrl: string;
  sortOrder: number;
  createdAt: string;
  categoryRef?: { id: string; slug: string; name: string; icon: string };
  _count: { variants: number };
}

const CATEGORY_TABS = [
  { id: "all", label: "همه محصولات", icon: Layers },
  { id: "electromotor", label: "الکتروموتور", icon: Cog },
  { id: "gearbox", label: "گیربکس صنعتی", icon: Settings },
  { id: "pump", label: "پمپ و الکتروپمپ", icon: Droplets },
  { id: "accessories", label: "لوازم جانبی و فلنج", icon: Wrench },
];

export default function FamiliesPage() {
  const router = useRouter();
  const [families, setFamilies] = useState<Family[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Family | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Create Form State
  const [form, setForm] = useState({
    name: "",
    nameEn: "",
    slug: "",
    mainCategory: "electromotor",
    category: "single-phase",
    subCategory: "",
    phase: "تک‌فاز",
    shellType: "چدنی",
    brand: "STK",
    level1Value: "",
    level2Value: "",
    description: "",
    imageUrl: "",
    sortOrder: 0,
  });

  async function fetchFamilies() {
    try {
      const res = await fetch("/api/admin/families");
      if (res.ok) {
        const data = await res.json();
        setFamilies(data);
      }
    } catch (err) {
      console.error("Failed to load families:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchFamilies();
  }, []);

  // Filtered list
  const filteredFamilies = useMemo(() => {
    return families.filter((f) => {
      // Category filter
      if (selectedCategory !== "all") {
        const matchesMain = (f.mainCategory || "").toLowerCase() === selectedCategory;
        const matchesCategory = (f.category || "").toLowerCase() === selectedCategory;
        if (!matchesMain && !matchesCategory) return false;
      }

      // Search filter
      if (!search.trim()) return true;
      const q = search.trim().toLowerCase();
      return (
        f.name.toLowerCase().includes(q) ||
        (f.nameEn || "").toLowerCase().includes(q) ||
        f.slug.toLowerCase().includes(q) ||
        (f.brand || "").toLowerCase().includes(q) ||
        (f.level1Value || "").toLowerCase().includes(q) ||
        (f.level2Value || "").toLowerCase().includes(q)
      );
    });
  }, [families, selectedCategory, search]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: families.length,
      electromotor: 0,
      gearbox: 0,
      pump: 0,
      accessories: 0,
    };
    families.forEach((f) => {
      const cat = (f.mainCategory || f.category || "").toLowerCase();
      if (cat in counts) {
        counts[cat]++;
      }
    });
    return counts;
  }, [families]);

  function handleOpenCreate() {
    setForm({
      name: "",
      nameEn: "",
      slug: "",
      mainCategory: selectedCategory !== "all" ? selectedCategory : "electromotor",
      category: selectedCategory !== "all" ? selectedCategory : "single-phase",
      subCategory: "",
      phase: "تک‌فاز",
      shellType: "چدنی",
      brand: "STK",
      level1Value: "",
      level2Value: "",
      description: "",
      imageUrl: "",
      sortOrder: (families.length + 1) * 10,
    });
    setShowCreateDialog(true);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.slug.trim()) {
      alert("نام محصول و شناسه یکتای slug الزامی هستند.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/families", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "خطا در ایجاد خانواده محصول");
        setSaving(false);
        return;
      }

      setShowCreateDialog(false);
      await fetchFamilies();
    } catch {
      alert("خطا در ارتباط با سرور");
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/families/${deleteConfirm.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDeleteConfirm(null);
        await fetchFamilies();
      } else {
        const data = await res.json();
        alert(data.error || "خطا در حذف محصول");
      }
    } catch {
      alert("خطا در ارتباط با سرور");
    }
    setDeleting(false);
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2.5">
            <Package className="text-blue-600" size={24} />
            مدیریت محصولات و واریانت‌ها
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            مدیریت دسته‌ها، خانواده محصولات، مشخصات فنی، سایزها، قیمت‌ها و موجودی تمامی ۴ دسته کاتالوگ
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white gap-2 h-10 px-4 rounded-xl shadow-xs self-start sm:self-auto"
        >
          <Plus size={18} />
          محصول جدید
        </Button>
      </div>

      {/* ─── Category Filter Tabs ─── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORY_TABS.map((tab) => {
          const Icon = tab.icon;
          const isSelected = selectedCategory === tab.id;
          const count = categoryCounts[tab.id] || 0;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                isSelected
                  ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon size={16} />
              {tab.label}
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full num-en ${
                  isSelected ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ─── Search & Count ─── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجو در نام، اسلاگ، برند یا مشخصات..."
            className="pr-10 h-10 bg-white rounded-xl border-gray-200 focus-visible:ring-blue-500 text-xs"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <span className="text-xs text-gray-400 self-end sm:self-auto num-en">
          نمایش {filteredFamilies.length} از {families.length} خانواده محصول
        </span>
      </div>

      {/* ─── Families Grid ─── */}
      {loading ? (
        <div className="py-20 text-center bg-white rounded-2xl border border-gray-100">
          <Loader2 size={32} className="animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500">در حال بارگذاری محصولات...</p>
        </div>
      ) : filteredFamilies.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-dashed border-gray-300 p-8">
          <Package size={40} className="text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-800 mb-1">محصولی یافت نشد</h3>
          <p className="text-xs text-gray-400 mb-4">
            {search
              ? "هیچ محصولی با مشخصات جستجو شده یافت نشد."
              : "هنوز محصولی در این دسته‌بندی ثبت نشده است."}
          </p>
          {search ? (
            <Button variant="outline" size="sm" onClick={() => setSearch("")}>
              پاک کردن فیلتر جستجو
            </Button>
          ) : (
            <Button onClick={handleOpenCreate} size="sm" className="bg-blue-600 text-white">
              <Plus size={16} className="ml-1" />
              افزودن محصول جدید
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFamilies.map((family) => {
            const categoryLabel =
              family.mainCategory === "electromotor"
                ? "الکتروموتور"
                : family.mainCategory === "gearbox"
                ? "گیربکس"
                : family.mainCategory === "pump"
                ? "پمپ"
                : family.mainCategory === "accessories"
                ? "لوازم جانبی"
                : family.category;

            return (
              <Card
                key={family.id}
                className="bg-white border-gray-200 hover:border-blue-300 hover:shadow-md transition-all rounded-2xl overflow-hidden flex flex-col justify-between"
              >
                <CardContent className="p-4 space-y-3">
                  {/* Top info */}
                  <div className="flex items-start gap-3">
                    <div className="w-16 h-16 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center p-1.5 shrink-0 overflow-hidden">
                      <ProductImage
                        src={family.imageUrl}
                        alt={family.name}
                        className="object-contain w-full h-full"
                        iconSize={24}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                          {categoryLabel}
                        </Badge>
                        {family.brand && (
                          <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-600">
                            {family.brand}
                          </Badge>
                        )}
                        {family.phase && (
                          <Badge variant="outline" className="text-[10px] text-gray-500">
                            {family.phase}
                          </Badge>
                        )}
                      </div>

                      <h3 className="font-bold text-gray-900 text-sm truncate" title={family.name}>
                        {family.name}
                      </h3>
                      <p className="text-[11px] text-gray-400 truncate num-en">
                        {family.nameEn || family.slug}
                      </p>
                    </div>
                  </div>

                  {/* Badges / Specs row */}
                  <div className="flex items-center justify-between bg-gray-50/70 p-2 rounded-xl text-xs text-gray-500 border border-gray-100">
                    <span className="flex items-center gap-1 text-[11px]">
                      <Package size={13} className="text-blue-600" />
                      تعداد واریانت‌ها:
                    </span>
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-bold num-en">
                      {family._count?.variants || 0} سایز / مدل
                    </Badge>
                  </div>

                  {family.description && (
                    <p className="text-xs text-gray-500 line-clamp-2 bg-slate-50/50 p-2 rounded-lg border border-slate-100/70">
                      {family.description}
                    </p>
                  )}

                  {/* Actions footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm(family)}
                      className="text-xs text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                      title="حذف خانواده محصول"
                    >
                      <Trash2 size={15} />
                    </button>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/panel/families/${family.id}`)}
                        className="h-8 text-xs text-blue-700 border-blue-200 hover:bg-blue-50 gap-1 rounded-lg"
                      >
                        <Pencil size={13} />
                        ویرایش و واریانت‌ها
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/product/${family.slug}`)}
                        className="h-8 text-xs text-gray-500 hover:text-gray-700 p-1.5 rounded-lg"
                        title="مشاهده صفحه در سایت"
                      >
                        <ExternalLink size={14} />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ─── CREATE FAMILY MODAL ─── */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Package className="text-blue-600" size={18} />
              افزودن خانواده محصول جدید
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4 mt-2">
            {/* Category Select */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">دسته‌بندی اصلی *</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: "electromotor", label: "الکتروموتور", icon: Cog },
                  { id: "gearbox", label: "گیربکس", icon: Settings },
                  { id: "pump", label: "پمپ", icon: Droplets },
                  { id: "accessories", label: "لوازم جانبی", icon: Wrench },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSel = form.mainCategory === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() =>
                        setForm({
                          ...form,
                          mainCategory: item.id,
                          category: item.id === "electromotor" ? "single-phase" : item.id,
                        })
                      }
                      className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs transition-all ${
                        isSel
                          ? "bg-blue-50 border-blue-600 text-blue-700 font-bold"
                          : "border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <Icon size={18} className="mb-1" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Names & Slug */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">نام فارسی محصول *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="مثال: الکتروموتور تک‌فاز چدنی 1400 دور"
                  required
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">نام انگلیسی (Name En)</Label>
                <Input
                  value={form.nameEn}
                  onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
                  placeholder="e.g. Single Phase Cast Iron Motor"
                  className="h-9 text-xs text-left num-en"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">شناسه یکتای آدرس (Slug) *</Label>
                <Input
                  value={form.slug}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      slug: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, "-"),
                    })
                  }
                  placeholder="e.g. single-phase-cast-iron-1400"
                  required
                  className="h-9 text-xs text-left num-en"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">برند محصول</Label>
                <Input
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                  placeholder="مثال: STK, موتوژن, الکتروژن"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            {/* Category-specific fields */}
            {form.mainCategory === "electromotor" && (
              <div className="grid grid-cols-2 gap-3 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">تعداد فاز</Label>
                  <select
                    value={form.phase}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        phase: e.target.value,
                        category: e.target.value === "تک‌فاز" ? "single-phase" : "three-phase",
                      })
                    }
                    className="w-full h-9 rounded-md border border-input bg-white px-3 py-1 text-xs"
                  >
                    <option value="تک‌فاز">تک‌فاز (Single Phase)</option>
                    <option value="سه‌فاز">سه‌فاز (Three Phase)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">جنس پوسته بدنه</Label>
                  <select
                    value={form.shellType}
                    onChange={(e) => setForm({ ...form, shellType: e.target.value })}
                    className="w-full h-9 rounded-md border border-input bg-white px-3 py-1 text-xs"
                  >
                    <option value="چدنی">پوسته چدنی</option>
                    <option value="آلومینیومی">پوسته آلومینیومی</option>
                  </select>
                </div>
              </div>
            )}

            {form.mainCategory === "gearbox" && (
              <div className="grid grid-cols-2 gap-3 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">نوع گیربکس</Label>
                  <Input
                    value={form.level1Value}
                    onChange={(e) => setForm({ ...form, level1Value: e.target.value })}
                    placeholder="مثال: حلزونی, مکعبی, شافت مستقیم"
                    className="h-9 text-xs bg-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">سری / مدل ورودی</Label>
                  <Input
                    value={form.level2Value}
                    onChange={(e) => setForm({ ...form, level2Value: e.target.value })}
                    placeholder="مثال: VF, MVF, NMRV"
                    className="h-9 text-xs bg-white"
                  />
                </div>
              </div>
            )}

            {form.mainCategory === "pump" && (
              <div className="grid grid-cols-2 gap-3 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">نوع پمپ</Label>
                  <Input
                    value={form.level1Value}
                    onChange={(e) => setForm({ ...form, level1Value: e.target.value })}
                    placeholder="مثال: کف‌کش, لجن‌کش, شناور, بشقابی"
                    className="h-9 text-xs bg-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">کاربری / مشخصه</Label>
                  <Input
                    value={form.level2Value}
                    onChange={(e) => setForm({ ...form, level2Value: e.target.value })}
                    placeholder="مثال: آب تمیز, فاضلابی, استیل"
                    className="h-9 text-xs bg-white"
                  />
                </div>
              </div>
            )}

            {form.mainCategory === "accessories" && (
              <div className="grid grid-cols-2 gap-3 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">نوع قطعه / فلنج</Label>
                  <Input
                    value={form.level1Value}
                    onChange={(e) => setForm({ ...form, level1Value: e.target.value })}
                    placeholder="مثال: فلنج, براکت عقب, درب ترمینال"
                    className="h-9 text-xs bg-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">سازگاری با موتور / گیربکس</Label>
                  <Input
                    value={form.level2Value}
                    onChange={(e) => setForm({ ...form, level2Value: e.target.value })}
                    placeholder="مثال: موتوژن, الکتروژن, چینی"
                    className="h-9 text-xs bg-white"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">آدرس تصویر محصول (Image URL)</Label>
                <Input
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  placeholder="/images/stk-cast-iron-motor.png"
                  className="h-9 text-xs text-left num-en"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">اولویت نمایش (Sort Order)</Label>
                <Input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
                  className="h-9 text-xs num-en"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">توضیحات محصول</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="توضیحات کوتاه فنی برای نمایش در صفحه محصول و سئو..."
                rows={3}
                className="text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowCreateDialog(false)}
                disabled={saving}
              >
                انصراف
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={saving}
              >
                {saving && <Loader2 size={14} className="animate-spin ml-1.5" />}
                ایجاد محصول
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── DELETE CONFIRMATION MODAL ─── */}
      <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-red-600 flex items-center gap-2">
              <AlertTriangle size={18} />
              تایید حذف محصول
            </DialogTitle>
          </DialogHeader>

          <div className="py-3 space-y-2">
            <p className="text-sm text-gray-700">
              آیا از حذف محصول <strong>«{deleteConfirm?.name}»</strong> اطمینان دارید؟
            </p>
            {deleteConfirm?._count?.variants ? (
              <p className="text-xs text-red-700 bg-red-50 p-2.5 rounded-lg border border-red-200">
                ⚠️ تمامی <strong>{deleteConfirm._count.variants}</strong> واریانت و قیمت‌های این محصول نیز
                به همراه آن حذف خواهند شد.
              </p>
            ) : null}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteConfirm(null)}
              disabled={deleting}
            >
              انصراف
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting && <Loader2 size={14} className="animate-spin ml-1.5" />}
              حذف قطعی
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
