"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Sliders,
  Layers,
  Cog,
  Settings,
  Droplets,
  Wrench,
  Package,
  Box,
  Zap,
  Gauge,
  FolderTree,
  Cpu,
  ShieldCheck,
  Truck,
  Flame,
  Check,
  X,
  Loader2,
  AlertTriangle,
  Code,
  Sparkles,
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
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";

/* ─────────────────────────────────────────────────────────────
 * Icon Map & Available Lucide Icons
 * ───────────────────────────────────────────────────────────── */
const ICON_COMPONENTS: Record<string, React.ElementType> = {
  Cog,
  Settings,
  Droplets,
  Wrench,
  Package,
  Box,
  Layers,
  Zap,
  Gauge,
  FolderTree,
  Sliders,
  Cpu,
  ShieldCheck,
  Truck,
  Flame,
};

const AVAILABLE_ICONS = [
  { name: "Cog", label: "چرخ‌دنده / موتور", icon: Cog },
  { name: "Settings", label: "تنظیمات / گیربکس", icon: Settings },
  { name: "Droplets", label: "قطرات / پمپ آب", icon: Droplets },
  { name: "Wrench", label: "آچار / قطعات و لوازم", icon: Wrench },
  { name: "Package", label: "بسته / محصول", icon: Package },
  { name: "Box", label: "جعبه صنعتی", icon: Box },
  { name: "Layers", label: "لایه‌ها / دسته‌بندی", icon: Layers },
  { name: "Zap", label: "برق / توان", icon: Zap },
  { name: "Gauge", label: "گیج فشار / سرعت", icon: Gauge },
  { name: "FolderTree", label: "درخت دسته‌ها", icon: FolderTree },
  { name: "Sliders", label: "اسلایدر / فیلترها", icon: Sliders },
  { name: "Cpu", label: "الکترونیک / پردازنده", icon: Cpu },
  { name: "ShieldCheck", label: "گارانتی / ایمنی", icon: ShieldCheck },
  { name: "Flame", label: "حرارت / قدرت", icon: Flame },
];

/* ─────────────────────────────────────────────────────────────
 * Standard Technical Facets Definition
 * ───────────────────────────────────────────────────────────── */
const STANDARD_FACETS = [
  { key: "speed", label: "سرعت و دور اسمی (RPM)", category: "موتور" },
  { key: "power", label: "توان خروجی (HP / kW)", category: "موتور" },
  { key: "size", label: "سایز فریم بدنه", category: "عمومی" },
  { key: "mountingType", label: "نوع نصب (B3, B35, B34)", category: "موتور" },
  { key: "gearboxType", label: "نوع گیربکس (حلزونی / مکعبی / شافت مستقیم)", category: "گیربکس" },
  { key: "ratio", label: "نسبت تبدیل گیربکس (Ratio)", category: "گیربکس" },
  { key: "inputFrame", label: "سایز فریم ورودی گیربکس", category: "گیربکس" },
  { key: "inputType", label: "مدل ورودی گیربکس (شافت‌دار / فلنج‌دار)", category: "گیربکس" },
  { key: "headMeter", label: "حداکثر ارتفاع / هد پمپ (متر)", category: "پمپ" },
  { key: "outletSize", label: "سایز دهانه خروجی پمپ (اینچ)", category: "پمپ" },
  { key: "floater", label: "سیستم فلوتر (فلوتردار / ساده)", category: "پمپ" },
  { key: "bodyMaterial", label: "جنس بدنه و پوسته (چدن / آلومینیوم / استیل)", category: "عمومی" },
  { key: "flangeType", label: "نوع قطعه (فلنج / نیم‌فلنج / براکت عقب / درب ترمینال)", category: "لوازم جانبی" },
  { key: "flangeLength", label: "طول فلنج خروجی (استاندارد / بلند / کوتاه)", category: "لوازم جانبی" },
];

/* ─────────────────────────────────────────────────────────────
 * Types
 * ───────────────────────────────────────────────────────────── */
interface FilterSchema {
  level1Title?: string;
  level1Options?: string[];
  level2Title?: string;
  level2Options?: string[];
  activeFacets?: string[];
  customAttributes?: { key: string; label: string }[];
}

interface Category {
  id: string;
  slug: string;
  name: string;
  nameEn: string;
  description: string;
  icon: string;
  sortOrder: number;
  filterConfig: string;
  _count?: { families: number };
  createdAt?: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Create / Edit modal state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [form, setForm] = useState({
    name: "",
    nameEn: "",
    slug: "",
    icon: "Package",
    sortOrder: 0,
    description: "",
  });

  // Filter Schema Builder state
  const [schemaDialogOpen, setSchemaDialogOpen] = useState(false);
  const [schemaCategory, setSchemaCategory] = useState<Category | null>(null);
  const [schemaData, setSchemaData] = useState<FilterSchema>({
    level1Title: "",
    level1Options: [],
    level2Title: "",
    level2Options: [],
    activeFacets: [],
  });
  const [newLevel1Tag, setNewLevel1Tag] = useState("");
  const [newLevel2Tag, setNewLevel2Tag] = useState("");
  const [jsonMode, setJsonMode] = useState(false);
  const [jsonText, setJsonText] = useState("");

  // Delete modal state
  const [deleteConfirm, setDeleteConfirm] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function fetchCategories() {
    try {
      const res = await fetch("/api/admin/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (err) {
      console.error("Failed to load categories:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchCategories();
  }, []);

  // Filtered categories by search
  const filteredCategories = useMemo(() => {
    if (!search.trim()) return categories;
    const q = search.trim().toLowerCase();
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.nameEn.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
    );
  }, [categories, search]);

  // Open Create Dialog
  function handleOpenCreate() {
    setEditingCategory(null);
    setForm({
      name: "",
      nameEn: "",
      slug: "",
      icon: "Package",
      sortOrder: (categories.length + 1) * 10,
      description: "",
    });
    setDialogOpen(true);
  }

  // Open Edit Dialog
  function handleOpenEdit(cat: Category) {
    setEditingCategory(cat);
    setForm({
      name: cat.name,
      nameEn: cat.nameEn,
      slug: cat.slug,
      icon: cat.icon || "Package",
      sortOrder: cat.sortOrder,
      description: cat.description || "",
    });
    setDialogOpen(true);
  }

  // Save Category (Create / Update)
  async function handleSaveCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.slug.trim()) {
      alert("لطفاً نام و شناسه انگلیسی (slug) را وارد کنید.");
      return;
    }

    setSaving(true);
    try {
      const url = editingCategory
        ? `/api/admin/categories/${editingCategory.id}`
        : "/api/admin/categories";
      const method = editingCategory ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          sortOrder: Number(form.sortOrder) || 0,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "خطا در ذخیره‌سازی");
        setSaving(false);
        return;
      }

      await fetchCategories();
      setDialogOpen(false);
    } catch (err) {
      console.error(err);
      alert("خطای ارتباط با سرور");
    }
    setSaving(false);
  }

  // Open Filter Schema Builder
  function handleOpenSchemaBuilder(cat: Category) {
    setSchemaCategory(cat);
    let parsed: FilterSchema = {};
    try {
      parsed = JSON.parse(cat.filterConfig || "{}");
    } catch {
      parsed = {};
    }

    const initialSchema: FilterSchema = {
      level1Title: parsed.level1Title || "",
      level1Options: Array.isArray(parsed.level1Options) ? parsed.level1Options : [],
      level2Title: parsed.level2Title || "",
      level2Options: Array.isArray(parsed.level2Options) ? parsed.level2Options : [],
      activeFacets: Array.isArray(parsed.activeFacets) ? parsed.activeFacets : [],
    };

    setSchemaData(initialSchema);
    setJsonText(JSON.stringify(initialSchema, null, 2));
    setJsonMode(false);
    setSchemaDialogOpen(true);
  }

  // Save Filter Schema
  async function handleSaveSchema() {
    if (!schemaCategory) return;
    setSaving(true);

    let configToSave = schemaData;
    if (jsonMode) {
      try {
        configToSave = JSON.parse(jsonText);
      } catch {
        alert("فرمت JSON وارد شده نامعتبر است.");
        setSaving(false);
        return;
      }
    }

    try {
      const res = await fetch(`/api/admin/categories/${schemaCategory.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filterConfig: JSON.stringify(configToSave),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "خطا در ذخیره‌سازی فیلترها");
        setSaving(false);
        return;
      }

      await fetchCategories();
      setSchemaDialogOpen(false);
    } catch (err) {
      console.error(err);
      alert("خطا در برقراری ارتباط با سرور");
    }
    setSaving(false);
  }

  // Add Tag Helper for Schema Builder
  function handleAddLevel1Tag() {
    const val = newLevel1Tag.trim();
    if (!val) return;
    if (!schemaData.level1Options?.includes(val)) {
      const updated = {
        ...schemaData,
        level1Options: [...(schemaData.level1Options || []), val],
      };
      setSchemaData(updated);
      setJsonText(JSON.stringify(updated, null, 2));
    }
    setNewLevel1Tag("");
  }

  function handleRemoveLevel1Tag(tag: string) {
    const updated = {
      ...schemaData,
      level1Options: (schemaData.level1Options || []).filter((t) => t !== tag),
    };
    setSchemaData(updated);
    setJsonText(JSON.stringify(updated, null, 2));
  }

  function handleAddLevel2Tag() {
    const val = newLevel2Tag.trim();
    if (!val) return;
    if (!schemaData.level2Options?.includes(val)) {
      const updated = {
        ...schemaData,
        level2Options: [...(schemaData.level2Options || []), val],
      };
      setSchemaData(updated);
      setJsonText(JSON.stringify(updated, null, 2));
    }
    setNewLevel2Tag("");
  }

  function handleRemoveLevel2Tag(tag: string) {
    const updated = {
      ...schemaData,
      level2Options: (schemaData.level2Options || []).filter((t) => t !== tag),
    };
    setSchemaData(updated);
    setJsonText(JSON.stringify(updated, null, 2));
  }

  function toggleFacet(facetKey: string) {
    const active = schemaData.activeFacets || [];
    const exists = active.includes(facetKey);
    const updated = {
      ...schemaData,
      activeFacets: exists ? active.filter((k) => k !== facetKey) : [...active, facetKey],
    };
    setSchemaData(updated);
    setJsonText(JSON.stringify(updated, null, 2));
  }

  // Delete Category
  async function handleDeleteCategory() {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/categories/${deleteConfirm.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchCategories();
        setDeleteConfirm(null);
      } else {
        const data = await res.json();
        alert(data.error || "خطا در حذف دسته‌بندی");
      }
    } catch (err) {
      console.error(err);
      alert("خطا در برقراری ارتباط با سرور");
    }
    setDeleting(false);
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2.5">
            <Layers className="text-blue-600" size={24} />
            مدیریت دسته‌بندی‌ها و فیلترهای داینامیک
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            پیکربندی دسته‌های اصلی، آیکون‌ها، اولویت‌ها و ساختار سلسله‌مراتبی فیلترها بدون نیاز به کدنویسی
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white gap-2 h-10 px-4 rounded-xl shadow-xs self-start sm:self-auto"
        >
          <Plus size={18} />
          دسته‌بندی جدید
        </Button>
      </div>

      {/* ─── Search & Stats Bar ─── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-3">
          <div className="relative">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجو در نام فارسی، نام انگلیسی یا اسلاگ دسته‌ها..."
              className="pr-10 h-11 bg-white rounded-xl border-gray-200 focus-visible:ring-blue-500"
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
        </div>

        <div className="bg-white rounded-xl border border-gray-200 px-4 py-2 flex items-center justify-between shadow-xs">
          <span className="text-xs text-gray-500 font-medium">تعداد کل دسته‌ها:</span>
          <Badge variant="secondary" className="bg-blue-50 text-blue-700 text-sm font-bold num-en">
            {categories.length}
          </Badge>
        </div>
      </div>

      {/* ─── Categories List ─── */}
      {loading ? (
        <div className="py-20 text-center bg-white rounded-2xl border border-gray-100">
          <Loader2 size={32} className="animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500">در حال بارگذاری دسته‌بندی‌ها...</p>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-dashed border-gray-300 p-8">
          <Layers size={40} className="text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-800 mb-1">دسته‌بندی‌ای یافت نشد</h3>
          <p className="text-xs text-gray-400 mb-4">
            {search ? "با عبارت جستجو شده هیچ دسته‌ای مطابقت نداشت." : "هنوز هیچ دسته‌ای ثبت نشده است."}
          </p>
          {search ? (
            <Button variant="outline" size="sm" onClick={() => setSearch("")}>
              پاک کردن فیلتر جستجو
            </Button>
          ) : (
            <Button onClick={handleOpenCreate} size="sm" className="bg-blue-600 text-white">
              <Plus size={16} className="ml-1" />
              افزودن اولین دسته
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCategories.map((cat) => {
            const IconComp = ICON_COMPONENTS[cat.icon] || Package;
            let filterSummary = { level1: "", level2: "", facetsCount: 0 };
            try {
              const conf = JSON.parse(cat.filterConfig || "{}");
              filterSummary = {
                level1: conf.level1Title || "",
                level2: conf.level2Title || "",
                facetsCount: Array.isArray(conf.activeFacets) ? conf.activeFacets.length : 0,
              };
            } catch {
              // fallback
            }

            return (
              <Card
                key={cat.id}
                className="bg-white border-gray-200/90 hover:border-blue-300 hover:shadow-md transition-all rounded-2xl overflow-hidden"
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 shadow-xs">
                      <IconComp size={24} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="font-bold text-gray-900 text-base truncate">{cat.name}</h3>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Badge variant="outline" className="text-[10px] text-gray-500 num-en">
                            اولویت: {cat.sortOrder}
                          </Badge>
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                            {cat._count?.families || 0} خانواده محصول
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                        <span className="font-medium text-gray-700">{cat.nameEn || "-"}</span>
                        <span>·</span>
                        <code className="text-[11px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded num-en">
                          slug: {cat.slug}
                        </code>
                      </div>

                      {cat.description && (
                        <p className="text-xs text-gray-500 line-clamp-2 mb-3 bg-gray-50/60 p-2 rounded-lg border border-gray-100">
                          {cat.description}
                        </p>
                      )}

                      {/* Filter Schema Status */}
                      <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-2.5 mb-4 text-xs">
                        <div className="flex items-center justify-between text-slate-700 mb-1 font-medium">
                          <span className="flex items-center gap-1">
                            <Sliders size={13} className="text-blue-500" />
                            پیکربندی فیلترها:
                          </span>
                          <span className="text-[11px] text-blue-600 num-en">
                            {filterSummary.facetsCount} ویژگی فعال
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex flex-wrap gap-x-3 gap-y-1">
                          {filterSummary.level1 && <span>سطح ۱: {filterSummary.level1}</span>}
                          {filterSummary.level2 && <span>سطح ۲: {filterSummary.level2}</span>}
                          {!filterSummary.level1 && !filterSummary.level2 && (
                            <span className="text-amber-600">فیلترهای پیش‌فرض عمومی</span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenSchemaBuilder(cat)}
                          className="h-8 text-xs text-slate-700 border-slate-200 hover:bg-slate-50 gap-1.5 rounded-lg"
                        >
                          <Sliders size={13} className="text-blue-600" />
                          تنظیم فیلترها
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEdit(cat)}
                          className="h-8 text-xs text-gray-700 hover:bg-gray-50 gap-1.5 rounded-lg"
                        >
                          <Pencil size={13} />
                          ویرایش
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteConfirm(cat)}
                          className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 gap-1 rounded-lg"
                        >
                          <Trash2 size={13} />
                          حذف
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ─── ADD / EDIT CATEGORY MODAL ─── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Layers className="text-blue-600" size={18} />
              {editingCategory ? "ویرایش دسته‌بندی" : "افزودن دسته‌بندی جدید"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveCategory} className="space-y-4 mt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">نام فارسی دسته‌بندی *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="مثال: گیربکس صنعتی"
                  required
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">نام انگلیسی (Name En)</Label>
                <Input
                  value={form.nameEn}
                  onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
                  placeholder="e.g. Industrial Gearbox"
                  className="h-9 text-sm text-left num-en"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">شناسه یکتا در آدرس (Slug) *</Label>
                <Input
                  value={form.slug}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      slug: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, "-"),
                    })
                  }
                  placeholder="e.g. gearbox"
                  required
                  className="h-9 text-sm text-left num-en"
                />
                <p className="text-[10px] text-gray-400">فقط حروف کوچک انگلیسی، خط تیره و عدد</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">اولویت ترتیب نمایش (Sort Order)</Label>
                <Input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
                  className="h-9 text-sm num-en"
                />
              </div>
            </div>

            {/* Icon Picker */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold">انتخاب آیکون نمایشی</Label>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 max-h-36 overflow-y-auto p-2 bg-gray-50 rounded-xl border border-gray-200">
                {AVAILABLE_ICONS.map((item) => {
                  const Icon = item.icon;
                  const isSelected = form.icon === item.name;
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => setForm({ ...form, icon: item.name })}
                      title={item.label}
                      className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all text-xs ${
                        isSelected
                          ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                          : "bg-white text-gray-600 border-gray-200 hover:border-blue-400 hover:bg-blue-50/50"
                      }`}
                    >
                      <Icon size={18} />
                      <span className="text-[9px] mt-1 truncate max-w-full">{item.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">توضیحات دسته‌بندی</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="توضیحات کوتاه برای نمایش در سئو و بالای کاتالوگ..."
                rows={3}
                className="text-xs"
              />
            </div>

            <Separator className="my-3" />

            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDialogOpen(false)}
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
                {editingCategory ? "ذخیره تغییرات" : "ایجاد دسته‌بندی"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── FILTER SCHEMA BUILDER MODAL (Sub-task 7.4) ─── */}
      <Dialog open={schemaDialogOpen} onOpenChange={setSchemaDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Sliders className="text-blue-600" size={18} />
                پیکربندی فیلترهای داینامیک: {schemaCategory?.name}
              </DialogTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setJsonMode(!jsonMode)}
                className="text-xs h-7 gap-1"
              >
                <Code size={12} />
                {jsonMode ? "حالت ویژوال" : "ویرایش خام JSON"}
              </Button>
            </div>
          </DialogHeader>

          {jsonMode ? (
            <div className="space-y-3 mt-3">
              <p className="text-xs text-gray-500">
                می‌توانید پیکربندی JSON فیلترها را مستقیماً ویرایش نمایید:
              </p>
              <Textarea
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                rows={14}
                className="font-mono text-xs num-en text-left bg-slate-900 text-emerald-400"
              />
            </div>
          ) : (
            <div className="space-y-5 mt-3">
              {/* Level 1 Facet */}
              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-3">
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-600 text-white text-[11px]">سطح ۱</Badge>
                  <h4 className="text-xs font-bold text-gray-800">فیلتر اولیه سلسله‌مراتبی</h4>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">عنوان فیلتر سطح ۱ (مانند «نوع فاز» یا «نوع گیربکس»)</Label>
                  <Input
                    value={schemaData.level1Title}
                    onChange={(e) => {
                      const updated = { ...schemaData, level1Title: e.target.value };
                      setSchemaData(updated);
                      setJsonText(JSON.stringify(updated, null, 2));
                    }}
                    placeholder="مثال: نوع فاز"
                    className="h-8 text-xs bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">گزینه‌های سطح ۱</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newLevel1Tag}
                      onChange={(e) => setNewLevel1Tag(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddLevel1Tag())}
                      placeholder="گزینه جدید (مثلاً تک‌فاز) و Enter..."
                      className="h-8 text-xs bg-white flex-1"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddLevel1Tag}
                      className="h-8 text-xs bg-blue-600 text-white px-3"
                    >
                      افزودن
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {(schemaData.level1Options || []).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 text-xs bg-white border border-blue-200 text-blue-700 px-2.5 py-1 rounded-lg shadow-2xs"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveLevel1Tag(tag)}
                          className="text-gray-400 hover:text-red-500 mr-1"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                    {(schemaData.level1Options || []).length === 0 && (
                      <span className="text-[11px] text-gray-400 italic">هنوز گزینه‌ای اضافه نشده است.</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Level 2 Facet */}
              <div className="bg-emerald-50/40 p-4 rounded-xl border border-emerald-100 space-y-3">
                <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-600 text-white text-[11px]">سطح ۲</Badge>
                  <h4 className="text-xs font-bold text-gray-800">فیلتر ثانویه سلسله‌مراتبی</h4>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">عنوان فیلتر سطح ۲ (مانند «جنس پوسته» یا «مدل ورودی»)</Label>
                  <Input
                    value={schemaData.level2Title}
                    onChange={(e) => {
                      const updated = { ...schemaData, level2Title: e.target.value };
                      setSchemaData(updated);
                      setJsonText(JSON.stringify(updated, null, 2));
                    }}
                    placeholder="مثال: جنس پوسته"
                    className="h-8 text-xs bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">گزینه‌های سطح ۲</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newLevel2Tag}
                      onChange={(e) => setNewLevel2Tag(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddLevel2Tag())}
                      placeholder="گزینه جدید (مثلاً چدنی) و Enter..."
                      className="h-8 text-xs bg-white flex-1"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddLevel2Tag}
                      className="h-8 text-xs bg-emerald-600 text-white px-3"
                    >
                      افزودن
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {(schemaData.level2Options || []).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 text-xs bg-white border border-emerald-200 text-emerald-700 px-2.5 py-1 rounded-lg shadow-2xs"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveLevel2Tag(tag)}
                          className="text-gray-400 hover:text-red-500 mr-1"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                    {(schemaData.level2Options || []).length === 0 && (
                      <span className="text-[11px] text-gray-400 italic">هنوز گزینه‌ای اضافه نشده است.</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Technical Spec Facets (Checkboxes) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-amber-500" />
                    انتخاب مشخصات فنی فعال در فیلترهای این دسته
                  </h4>
                  <span className="text-[11px] text-gray-400 num-en">
                    {(schemaData.activeFacets || []).length} مورد انتخاب شده
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200 max-h-48 overflow-y-auto">
                  {STANDARD_FACETS.map((facet) => {
                    const isChecked = (schemaData.activeFacets || []).includes(facet.key);
                    return (
                      <label
                        key={facet.key}
                        className={`flex items-start gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                          isChecked
                            ? "bg-white border-blue-300 text-blue-900 shadow-2xs"
                            : "border-transparent text-gray-600 hover:bg-white hover:border-gray-200"
                        }`}
                      >
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => toggleFacet(facet.key)}
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{facet.label}</p>
                          <span className="text-[10px] text-gray-400">گروه: {facet.category}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <Separator className="my-3" />

          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSchemaDialogOpen(false)}
              disabled={saving}
            >
              انصراف
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSaveSchema}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
              disabled={saving}
            >
              {saving && <Loader2 size={14} className="animate-spin ml-1" />}
              <Check size={14} />
              ذخیره پیکربندی فیلترها
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── DELETE CONFIRMATION MODAL ─── */}
      <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-red-600 flex items-center gap-2">
              <AlertTriangle size={18} />
              تایید حذف دسته‌بندی
            </DialogTitle>
          </DialogHeader>

          <div className="py-3 space-y-2">
            <p className="text-sm text-gray-700">
              آیا از حذف دسته‌بندی <strong>«{deleteConfirm?.name}»</strong> اطمینان دارید؟
            </p>
            {deleteConfirm?._count?.families ? (
              <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                ⚠️ این دسته شامل <strong>{deleteConfirm._count.families}</strong> خانواده محصول است. با حذف
                دسته، ارتباط محصولات با این دسته‌بندی قطع خواهد شد.
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
              onClick={handleDeleteCategory}
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
