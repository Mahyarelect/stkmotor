"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Compass,
  Plus,
  Search,
  ExternalLink,
  Edit2,
  Trash2,
  Eye,
  Loader2,
  CheckCircle2,
  XCircle,
  Image as ImageIcon,
  Save,
  X,
  Sparkles,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { SingleImageUploader } from "@/components/admin/CmsImageUploader";

interface LandingPageItem {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  bannerUrl: string;
  ctaText: string;
  ctaLink: string;
  content: string;
  featuredFamilySlugs: string;
  isActive: boolean;
  seoTitle: string;
  seoDescription: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface FamilyOption {
  id: string;
  slug: string;
  name: string;
  nameEn?: string;
  mainCategory: string;
  category?: string;
  brand?: string;
  imageUrl?: string;
  variantCount?: number;
}

export default function LandingPagesAdminPage() {
  const [pages, setPages] = useState<LandingPageItem[]>([]);
  const [availableFamilies, setAvailableFamilies] = useState<FamilyOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [ctaText, setCtaText] = useState("");
  const [ctaLink, setCtaLink] = useState("");
  const [content, setContent] = useState("");
  const [selectedFamilySlugs, setSelectedFamilySlugs] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);
  const [familyFilterQuery, setFamilyFilterQuery] = useState("");
  const [pickerCategoryFilter, setPickerCategoryFilter] = useState<string>("all");

  // Delete State
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      const [resPages, resFamilies] = await Promise.all([
        fetch("/api/admin/landing-pages"),
        fetch("/api/admin/families"),
      ]);

      if (resPages.ok) {
        const data = await resPages.json();
        setPages(data);
      }
      if (resFamilies.ok) {
        const famData = await resFamilies.json();
        setAvailableFamilies(
          famData.map((f: any) => ({
            id: f.id,
            slug: f.slug,
            name: f.name,
            nameEn: f.nameEn,
            mainCategory: f.mainCategory || "electromotor",
            category: f.category,
            brand: f.brand,
            imageUrl: f.imageUrl,
            variantCount: f._count?.variants || f.variants?.length || 0,
          }))
        );
      }
    } catch (err) {
      console.error("Failed to load landing pages:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function openCreateDialog() {
    setEditingId(null);
    setTitle("");
    setSlug("");
    setSubtitle("");
    setDescription("");
    setBannerUrl("");
    setCtaText("مشاهده محصولات و استعلام");
    setCtaLink("#products");
    setContent("");
    setSelectedFamilySlugs([]);
    setIsActive(true);
    setSortOrder(0);
    setError(null);
    setDialogOpen(true);
  }

  function openEditDialog(page: LandingPageItem) {
    setEditingId(page.id);
    setTitle(page.title);
    setSlug(page.slug);
    setSubtitle(page.subtitle || "");
    setDescription(page.description || "");
    setBannerUrl(page.bannerUrl || "");
    setCtaText(page.ctaText || "");
    setCtaLink(page.ctaLink || "");
    setContent(page.content || "");
    try {
      setSelectedFamilySlugs(JSON.parse(page.featuredFamilySlugs || "[]"));
    } catch {
      setSelectedFamilySlugs([]);
    }
    setIsActive(page.isActive);
    setSortOrder(page.sortOrder);
    setError(null);
    setDialogOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("لطفاً عنوان صفحه فرود را وارد کنید.");
      return;
    }
    if (!slug.trim()) {
      setError("لطفاً نامک (Slug) انگلیسی صفحه فرود را وارد کنید.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title,
        slug,
        subtitle,
        description,
        bannerUrl,
        ctaText,
        ctaLink,
        content,
        featuredFamilySlugs: selectedFamilySlugs,
        isActive,
        sortOrder: Number(sortOrder) || 0,
      };

      const url = editingId
        ? `/api/admin/landing-pages/${editingId}`
        : "/api/admin/landing-pages";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "خطا در ذخیره صفحه فرود");
      }

      setDialogOpen(false);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "عملیات ناموفق بود.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("آیا از حذف این صفحه فرود اطمینان دارید؟")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/landing-pages/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setPages((prev) => prev.filter((p) => p.id !== id));
      } else {
        const data = await res.json();
        alert(data.error || "حذف صفحه انجام نشد.");
      }
    } catch (err) {
      alert("خطا در برقراری ارتباط با سرور.");
    } finally {
      setDeletingId(null);
    }
  }

  async function toggleStatus(page: LandingPageItem) {
    try {
      const res = await fetch(`/api/admin/landing-pages/${page.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !page.isActive }),
      });
      if (res.ok) {
        setPages((prev) =>
          prev.map((p) => (p.id === page.id ? { ...p, isActive: !p.isActive } : p))
        );
      }
    } catch {
      // ignore
    }
  }

  const filteredPages = useMemo(() => {
    if (!searchQuery.trim()) return pages;
    const q = searchQuery.toLowerCase();
    return pages.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        p.subtitle.toLowerCase().includes(q)
    );
  }, [pages, searchQuery]);

  const filteredAvailableFamilies = useMemo(() => {
    return availableFamilies.filter((f) => {
      if (pickerCategoryFilter === "selected") {
        if (!selectedFamilySlugs.includes(f.slug)) return false;
      } else if (pickerCategoryFilter !== "all" && f.mainCategory !== pickerCategoryFilter) {
        return false;
      }

      if (!familyFilterQuery.trim()) return true;
      const q = familyFilterQuery.toLowerCase();
      return (
        f.name.toLowerCase().includes(q) ||
        f.slug.toLowerCase().includes(q) ||
        (f.brand && f.brand.toLowerCase().includes(q))
      );
    });
  }, [availableFamilies, familyFilterQuery, pickerCategoryFilter, selectedFamilySlugs]);

  return (
    <div className="space-y-6" dir="rtl">
      {/* ─── Top Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Compass size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              مدیریت صفحات فرود (Landing Pages)
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              ایجاد کمپین‌های فروش، معرفی گروه‌های خاص محصول و جشنواره‌ها با بنر اختصاصی
            </p>
          </div>
        </div>
        <Button
          onClick={openCreateDialog}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-10 px-4 rounded-xl gap-1.5"
        >
          <Plus size={16} />
          ایجاد صفحه فرود جدید
        </Button>
      </div>

      {/* ─── Filter & Search Bar ─── */}
      <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-200">
        <Search size={18} className="text-gray-400 mr-1 shrink-0" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="جستجو بر اساس عنوان یا نامک (slug)..."
          className="border-0 shadow-none text-xs focus-visible:ring-0 p-0"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* ─── Pages List Table ─── */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-16 text-gray-400">
            <Loader2 size={32} className="animate-spin text-blue-600 mb-2" />
            <p className="text-xs">در حال بارگذاری صفحات فرود...</p>
          </div>
        ) : filteredPages.length === 0 ? (
          <div className="text-center p-16">
            <Compass size={40} className="mx-auto text-gray-300 mb-3" />
            <h3 className="text-sm font-semibold text-gray-700">هیچ صفحه فرودی یافت نشد</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
              اولین صفحه فرود کمپین یا گروه ویژه محصولات خود را بسازید تا با لینک مستقیم در دسترس باشد.
            </p>
            <Button
              onClick={openCreateDialog}
              variant="outline"
              size="sm"
              className="mt-4 text-xs"
            >
              <Plus size={14} className="ml-1" />
              ایجاد اولین صفحه فرود
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-600">
                <tr>
                  <th className="py-3 px-4 font-semibold">بنر / تصویر</th>
                  <th className="py-3 px-4 font-semibold">عنوان و نامک</th>
                  <th className="py-3 px-4 font-semibold">تعداد محصولات</th>
                  <th className="py-3 px-4 font-semibold">وضعیت</th>
                  <th className="py-3 px-4 font-semibold">ترتیب</th>
                  <th className="py-3 px-4 font-semibold text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {filteredPages.map((page) => {
                  let famCount = 0;
                  try {
                    famCount = JSON.parse(page.featuredFamilySlugs || "[]").length;
                  } catch {}

                  return (
                    <tr key={page.id} className="hover:bg-gray-50/60 transition-colors">
                      {/* Banner thumbnail */}
                      <td className="py-3 px-4">
                        {page.bannerUrl ? (
                          <img
                            src={page.bannerUrl}
                            alt={page.title}
                            className="w-16 h-10 object-cover rounded-lg border border-gray-200"
                          />
                        ) : (
                          <div className="w-16 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 border border-gray-200">
                            <ImageIcon size={16} />
                          </div>
                        )}
                      </td>

                      {/* Title & Slug */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-gray-900 text-sm">
                          {page.title}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-blue-600 font-mono mt-0.5" dir="ltr">
                          <span>/landing/{page.slug}</span>
                        </div>
                        {page.subtitle && (
                          <div className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">
                            {page.subtitle}
                          </div>
                        )}
                      </td>

                      {/* Featured products count */}
                      <td className="py-3 px-4">
                        <Badge variant="secondary" className="text-[11px] font-normal">
                          <Package size={12} className="ml-1 text-gray-500" />
                          {famCount} محصول
                        </Badge>
                      </td>

                      {/* Status switch */}
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => toggleStatus(page)}
                          className="flex items-center gap-1.5 text-xs cursor-pointer focus:outline-none"
                        >
                          {page.isActive ? (
                            <span className="flex items-center gap-1 text-emerald-600 font-medium">
                              <CheckCircle2 size={15} />
                              فعال
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-gray-400">
                              <XCircle size={15} />
                              غیرفعال
                            </span>
                          )}
                        </button>
                      </td>

                      {/* Sort Order */}
                      <td className="py-3 px-4 text-gray-500">
                        {page.sortOrder}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <Link
                            href={`/landing/${encodeURIComponent(page.slug.trim())}`}
                            target="_blank"
                            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-blue-600 transition-colors"
                            title="مشاهده زنده صفحه فرود"
                          >
                            <ExternalLink size={15} />
                          </Link>
                          <button
                            type="button"
                            onClick={() => openEditDialog(page)}
                            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-amber-600 transition-colors"
                            title="ویرایش"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(page.id)}
                            disabled={deletingId === page.id}
                            className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                            title="حذف"
                          >
                            {deletingId === page.id ? (
                              <Loader2 size={15} className="animate-spin text-red-600" />
                            ) : (
                              <Trash2 size={15} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── Create / Edit Dialog ─── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-6" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Compass size={20} className="text-blue-600" />
              {editingId ? "ویرایش صفحه فرود" : "ایجاد صفحه فرود جدید"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-6 pt-2">
            {/* Main Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">عنوان اصلی صفحه فرود *</Label>
                <Input
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (!editingId && !slug) {
                      setSlug(
                        e.target.value
                          .trim()
                          .toLowerCase()
                          .replace(/\s+/g, "-")
                          .replace(/[^a-z0-9\u0600-\u06FF-]/g, "")
                      );
                    }
                  }}
                  placeholder="مثال: فروش ویژه الکتروموتورهای موتوژن"
                  className="text-xs h-9"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">نامک یکتا (Slug) *</Label>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="motogen-special-sale"
                  className="text-xs h-9 font-mono"
                  dir="ltr"
                  required
                />
                <p className="text-[10px] text-gray-400">آدرس: /landing/{slug || "example-slug"}</p>
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <Label className="text-xs font-semibold">زیرعنوان / پیام اصلی</Label>
                <Input
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="مثال: تخفیف ویژه به مدت محدود برای کارگاه‌ها و صنایع تولیدی"
                  className="text-xs h-9"
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <Label className="text-xs font-semibold">توضیح کوتاه معرفی</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="توضیحات کلی درباره این کمپین، گارانتی، شرایط ارسال یا ویژگی‌های خاص..."
                  className="text-xs min-h-[70px]"
                />
              </div>
            </div>

            {/* Banner Uploader */}
            <div className="border-t border-gray-200 pt-4">
              <SingleImageUploader
                slug={slug ? `landing-${slug}` : "landing"}
                value={bannerUrl}
                onChange={setBannerUrl}
                label="تصویر هدر / بنر صفحه فرود"
                description="تصویر جذاب و باکیفیت بنر اصلی صفحه (افقی نسبت ۲۱ به ۹)"
                aspectRatioClass="aspect-[21/9]"
              />
            </div>

            {/* CTA Settings */}
            <div className="border-t border-gray-200 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">متن دکمه اقدام (Call to Action)</Label>
                <Input
                  value={ctaText}
                  onChange={(e) => setCtaText(e.target.value)}
                  placeholder="مشاهده محصولات و استعلام قیمت"
                  className="text-xs h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">لینک دکمه اقدام</Label>
                <Input
                  value={ctaLink}
                  onChange={(e) => setCtaLink(e.target.value)}
                  placeholder="#products یا /electromotors"
                  className="text-xs h-9"
                  dir="ltr"
                />
              </div>
            </div>

            {/* Featured Product Families Picker */}
            <div className="border-t border-gray-200 pt-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <Label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                    <Package size={15} className="text-blue-600" />
                    محصولات و ویترین منتخب این صفحه
                  </Label>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    محصولاتی که می‌خواهید در ویترین این صفحه نمایش داده شوند را انتخاب کنید ({selectedFamilySlugs.length} محصول انتخاب شده).
                  </p>
                </div>
                {selectedFamilySlugs.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedFamilySlugs([])}
                    className="text-xs text-red-600 hover:text-red-700 hover:underline font-semibold cursor-pointer self-start sm:self-auto"
                  >
                    پاک کردن همه انتخاب‌ها ({selectedFamilySlugs.length})
                  </button>
                )}
              </div>

              {/* Selected items chips strip */}
              {selectedFamilySlugs.length > 0 && (
                <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/80 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-blue-900 font-bold">
                    <span>محصولات در حال حاضر انتخاب‌شده ({selectedFamilySlugs.length} مورد):</span>
                    <span className="text-[10px] text-blue-600 font-normal">جهت حذف، روی ✕ کلیک کنید</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pt-1">
                    {selectedFamilySlugs.map((slug) => {
                      const fam = availableFamilies.find((f) => f.slug === slug);
                      return (
                        <span
                          key={slug}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-blue-900 border border-blue-200 shadow-2xs"
                        >
                          <span className="max-w-[200px] truncate">{fam ? fam.name : slug}</span>
                          <button
                            type="button"
                            onClick={() => setSelectedFamilySlugs((prev) => prev.filter((s) => s !== slug))}
                            className="text-slate-400 hover:text-red-600 transition-colors cursor-pointer p-0.5"
                            title="حذف از انتخاب‌ها"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Search & Category Filter Pills */}
              <div className="space-y-2">
                <div className="relative">
                  <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input
                    value={familyFilterQuery}
                    onChange={(e) => setFamilyFilterQuery(e.target.value)}
                    placeholder="جستجو بر اساس نام کامل، برند یا کد محصول..."
                    className="pr-9 pl-8 text-xs h-9 bg-white"
                  />
                  {familyFilterQuery && (
                    <button
                      type="button"
                      onClick={() => setFamilyFilterQuery("")}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer p-1"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                {/* Category tabs */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { key: "all", label: `همه (${availableFamilies.length})` },
                    { key: "electromotor", label: `الکتروموتور (${availableFamilies.filter((f) => f.mainCategory === "electromotor").length})` },
                    { key: "gearbox", label: `گیربکس (${availableFamilies.filter((f) => f.mainCategory === "gearbox").length})` },
                    { key: "pump", label: `پمپ (${availableFamilies.filter((f) => f.mainCategory === "pump").length})` },
                    { key: "accessories", label: `لوازم جانبی (${availableFamilies.filter((f) => f.mainCategory === "accessories").length})` },
                    { key: "selected", label: `انتخاب‌شده (${selectedFamilySlugs.length})` },
                  ].map((tab) => {
                    const isActive = pickerCategoryFilter === tab.key;
                    return (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setPickerCategoryFilter(tab.key)}
                        className={`text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                          isActive
                            ? "bg-blue-600 text-white shadow-xs"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Products list with clear names, images and badges */}
              <div className="max-h-72 overflow-y-auto border border-gray-200 rounded-xl p-2 space-y-2 bg-slate-50/50">
                {filteredAvailableFamilies.length === 0 ? (
                  <div className="text-center py-8 text-xs text-gray-400">
                    هیچ محصولی با این فیلتر یا عبارت جستجو یافت نشد.
                  </div>
                ) : (
                  filteredAvailableFamilies.map((fam) => {
                    const isSelected = selectedFamilySlugs.includes(fam.slug);
                    const categoryPersian: Record<string, string> = {
                      electromotor: "الکتروموتور",
                      gearbox: "گیربکس",
                      pump: "پمپ",
                      accessories: "لوازم جانبی",
                    };

                    return (
                      <div
                        key={fam.slug}
                        onClick={() => {
                          setSelectedFamilySlugs((prev) =>
                            isSelected ? prev.filter((s) => s !== fam.slug) : [...prev, fam.slug]
                          );
                        }}
                        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
                          isSelected
                            ? "bg-blue-50/95 text-blue-950 border-blue-400 ring-1 ring-blue-400/30 shadow-xs"
                            : "bg-white hover:bg-slate-50/80 text-gray-800 border-gray-200/80 shadow-2xs"
                        }`}
                      >
                        {/* Checkbox */}
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}} // handled by parent div
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer shrink-0"
                        />

                        {/* Image Thumbnail */}
                        <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 p-1">
                          {fam.imageUrl ? (
                            <img
                              src={fam.imageUrl}
                              alt={fam.name}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <Package size={20} className="text-slate-400" />
                          )}
                        </div>

                        {/* Details - FULL NAME ALWAYS VISIBLE AND CLEAR */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-xs sm:text-sm text-slate-900 leading-snug break-words">
                            {fam.name}
                          </h4>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            <Badge variant="secondary" className="text-[10px] py-0 px-1.5 font-medium">
                              {categoryPersian[fam.mainCategory] || fam.mainCategory}
                            </Badge>
                            {fam.brand && (
                              <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-slate-300 text-slate-600">
                                {fam.brand}
                              </Badge>
                            )}
                            {fam.variantCount !== undefined && fam.variantCount > 0 && (
                              <span className="text-[10px] text-slate-500">
                                {fam.variantCount} مدل / واریانت
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400 font-mono" dir="ltr">
                              {fam.slug}
                            </span>
                          </div>
                        </div>

                        {/* Selected check badge */}
                        {isSelected && (
                          <div className="shrink-0 text-blue-600 font-bold text-xs flex items-center gap-1">
                            <CheckCircle2 size={16} className="text-blue-600" />
                            <span className="hidden sm:inline">انتخاب شد</span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Custom Content Area */}
            <div className="border-t border-gray-200 pt-4 space-y-1.5">
              <Label className="text-xs font-semibold">محتوای متنی / مزایا و نکات تکمیلی</Label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="متن کامل معرفی، شرایط گارانتی، راهنمای فنی یا هر بخش دلخواه دیگر..."
                className="text-xs min-h-[100px] leading-relaxed"
              />
              <p className="text-[10px] text-gray-400">
                می‌توانید پاراگراف‌ها یا نکات مهم را اینجا بنویسید تا زیر بخش بنر نمایش داده شود.
              </p>
            </div>

            {/* Active & Sort Order */}
            <div className="border-t border-gray-200 pt-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Switch
                  checked={isActive}
                  onCheckedChange={setIsActive}
                  id="active-switch"
                />
                <Label htmlFor="active-switch" className="text-xs font-semibold cursor-pointer">
                  صفحه فرود فعال باشد (نمایش در سایت)
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Label className="text-xs font-semibold">ترتیب نمایش:</Label>
                <Input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value))}
                  className="w-20 text-xs h-8 text-center"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600">
                {error}
              </div>
            )}

            <DialogFooter className="border-t border-gray-200 pt-4 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDialogOpen(false)}
                className="text-xs"
              >
                انصراف
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5"
              >
                {saving ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Save size={14} />
                )}
                {editingId ? "به‌روزرسانی صفحه فرود" : "ایجاد صفحه فرود"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
