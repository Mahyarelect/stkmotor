"use client";

import { useState, useEffect } from "react";
import {
  FolderCog,
  Save,
  Loader2,
  Check,
  Image as ImageIcon,
  RotateCcw,
  Sparkles,
  Layers,
  ChevronDown,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ProductImageUploader } from "@/components/admin/ProductImageUploader";
import { DEFAULT_CATEGORY_IMAGES, getCategoryDefaultImage } from "@/data/categoryImages";

interface SubCategoryItem {
  name: string;
  slug: string;
  href: string;
  imageUrl?: string;
}

interface CategoryItem {
  id: string;
  slug: string;
  name: string;
  nameEn: string;
  description: string;
  icon: string;
  imageUrl: string;
  rawImageUrl: string;
  sortOrder: number;
  subCategories: SubCategoryItem[];
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [subCatImages, setSubCatImages] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("electromotor");

  async function fetchCategories() {
    try {
      const res = await fetch("/api/admin/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
        setSubCatImages(data.subCatImages || {});
      }
    } catch (err) {
      console.error("Failed to load categories:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    (async () => {
      await fetchCategories();
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleMainImageChange = (slug: string, url: string) => {
    setCategories((prev) =>
      prev.map((c) => (c.slug === slug ? { ...c, rawImageUrl: url, imageUrl: url || getCategoryDefaultImage(slug) } : c))
    );
  };

  const handleSubImageChange = (subSlug: string, url: string) => {
    setSubCatImages((prev) => ({
      ...prev,
      [subSlug]: url,
    }));
  };

  const handleDescriptionChange = (slug: string, desc: string) => {
    setCategories((prev) =>
      prev.map((c) => (c.slug === slug ? { ...c, description: desc } : c))
    );
  };

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const payload = {
        categories: categories.map((c) => ({
          slug: c.slug,
          imageUrl: c.rawImageUrl,
          description: c.description,
        })),
        subCatImages,
      };

      const res = await fetch("/api/admin/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3500);
      }
    } catch (err) {
      console.error("Save error:", err);
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  const selectedCategory = categories.find((c) => c.slug === activeTab) || categories[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <FolderCog className="text-blue-600" />
            مدیریت دسته‌بندی‌ها و تصاویر جنرال
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            تصاویر جنرال دسته‌بندی‌ها در صفحه اصلی، هدر کاتالوگ و هنگام ورود به بخش‌های تخصصی نمایش داده می‌شوند.
          </p>
        </div>

        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 text-white min-w-36 shadow-xs"
        >
          {saving ? (
            <>
              <Loader2 size={16} className="animate-spin ml-2" />
              در حال ذخیره...
            </>
          ) : saved ? (
            <>
              <Check size={16} className="ml-2 text-emerald-300" />
              ذخیره شد
            </>
          ) : (
            <>
              <Save size={16} className="ml-2" />
              ذخیره تغییرات
            </>
          )}
        </Button>
      </div>

      {saved && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-bold flex items-center gap-2 shadow-xs">
          <Check size={18} className="text-emerald-600" />
          تمام تغییرات تصاویر دسته‌ها و زیردسته‌ها با موفقیت در سیستم ذخیره شدند.
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {categories.map((cat) => {
          const isActive = cat.slug === activeTab;
          return (
            <button
              key={cat.slug}
              type="button"
              onClick={() => setActiveTab(cat.slug)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                isActive
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200"
              }`}
            >
              <span>{cat.name}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  isActive ? "bg-blue-700 text-blue-100" : "bg-slate-100 text-slate-500"
                }`}
              >
                {cat.subCategories.length} زیردسته
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected Category Management Area */}
      {selectedCategory && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Category Image & Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-slate-200">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>عکس جنرال دسته‌بندی اصلی ({selectedCategory.name})</span>
                  <Badge variant="outline" className="text-blue-600 border-blue-200">
                    اسلاگ: {selectedCategory.slug}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  این تصویر به عنوان تصویر شاخص دسته {selectedCategory.name} در صفحه اصلی و هدر صفحه کاتالوگ نمایش داده می‌شود.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Image Uploader */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-700">انتخاب یا آپلود تصویر شاخص</Label>
                  <ProductImageUploader
                    slug={`category-${selectedCategory.slug}`}
                    value={selectedCategory.rawImageUrl || ""}
                    onChange={(url) => handleMainImageChange(selectedCategory.slug, url)}
                  />
                  {selectedCategory.rawImageUrl ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleMainImageChange(selectedCategory.slug, "")}
                      className="text-xs font-bold text-red-600 border-red-200 bg-red-50 hover:bg-red-100 hover:text-red-700 cursor-pointer flex items-center gap-1.5"
                    >
                      <Trash2 size={13} className="text-red-600" />
                      حذف عکس شاخص (بازگشت به تصویر پیش‌فرض سیستم)
                    </Button>
                  ) : (
                    <p className="text-xs text-amber-600 font-medium">
                      در حال حاضر تصویر پیش‌فرض سیستم برای این دسته‌بندی فعال است.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`desc-${selectedCategory.slug}`} className="text-xs font-semibold text-slate-700">
                    توضیحات معرفی دسته‌بندی
                  </Label>
                  <Input
                    id={`desc-${selectedCategory.slug}`}
                    value={selectedCategory.description}
                    onChange={(e) => handleDescriptionChange(selectedCategory.slug, e.target.value)}
                    placeholder={`توضیحات کوتاه برای ${selectedCategory.name}...`}
                    className="text-sm"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Subcategories Section */}
            {selectedCategory.subCategories.length > 0 && (
              <Card className="border-slate-200">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Layers size={18} className="text-blue-600" />
                    تصاویر اختصاصی زیردسته‌ها
                  </CardTitle>
                  <CardDescription>
                    تصاویر هر زیردسته هنگام ورود به دسته‌بندی اصلی و انتخاب زیربخش‌ها نمایش داده می‌شوند.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    {selectedCategory.subCategories.map((sub) => {
                      const customUrl = subCatImages[sub.slug] || "";
                      const isCustom = Boolean(customUrl);
                      const currentImg = customUrl || DEFAULT_CATEGORY_IMAGES[sub.slug] || "";

                      return (
                        <div
                          key={sub.slug}
                          className={`p-4 rounded-xl border transition-all space-y-3 ${
                            isCustom ? "border-blue-200 bg-blue-50/25" : "border-slate-200 bg-slate-50/50"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-slate-800">{sub.name}</span>
                              <Badge
                                variant="secondary"
                                className={
                                  isCustom
                                    ? "bg-emerald-100 text-emerald-700 text-[10px] font-semibold border-emerald-200"
                                    : "text-[10px] text-slate-500"
                                }
                              >
                                {isCustom ? "تصویر اختصاصی" : "پیش‌فرض"}
                              </Badge>
                            </div>
                            <Badge variant="outline" className="text-[10px] text-slate-400 font-mono">
                              {sub.slug}
                            </Badge>
                          </div>

                          <div className="relative h-28 w-full bg-white rounded-lg border border-slate-200 overflow-hidden flex items-center justify-center p-2">
                            {currentImg ? (
                              <img
                                src={currentImg}
                                alt={sub.name}
                                className="h-full w-full object-contain"
                              />
                            ) : (
                              <ImageIcon size={28} className="text-slate-300" />
                            )}
                          </div>

                          <div className="space-y-2">
                            <ProductImageUploader
                              slug={`subcat-${sub.slug}`}
                              value={customUrl}
                              onChange={(url) => handleSubImageChange(sub.slug, url)}
                              compact
                            />

                            {/* Explicit Delete Button for Subcategory Image */}
                            {isCustom ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleSubImageChange(sub.slug, "")}
                                className="w-full h-8.5 text-xs font-bold text-red-600 border-red-200 bg-red-50/70 hover:bg-red-100 hover:text-red-700 hover:border-red-300 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                              >
                                <Trash2 size={13} className="text-red-600" />
                                حذف عکس (بازگشت به پیش‌فرض سیستم)
                              </Button>
                            ) : (
                              <div className="text-[11px] text-slate-400 text-center py-1.5 bg-slate-100/60 rounded-lg font-medium">
                                تصویر پیش‌فرض سیستم فعال است
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Live Preview Card */}
          <div className="space-y-6">
            <Card className="border-slate-200 sticky top-24">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles size={16} className="text-amber-500" />
                  پیش‌نمایش کارت در سایت
                </CardTitle>
                <CardDescription className="text-xs">
                  نمای زنده کارت دسته‌بندی در صفحه اصلی و کاتالوگ
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Preview Homepage Card */}
                <div>
                  <span className="text-xs font-semibold text-slate-500 mb-2 block">کارت صفحه اصلی:</span>
                  <div className="rounded-2xl border-2 border-blue-500/80 bg-white p-4 text-center shadow-lg transition-all overflow-hidden relative group">
                    <div className="relative h-32 w-full mb-3 rounded-xl bg-gradient-to-b from-slate-50 to-blue-50/40 flex items-center justify-center overflow-hidden border border-slate-100 p-2">
                      <img
                        src={selectedCategory.imageUrl}
                        alt={selectedCategory.name}
                        className="h-full w-full object-contain drop-shadow-sm"
                      />
                    </div>
                    <h4 className="font-bold text-sm text-slate-900 mb-1">{selectedCategory.name}</h4>
                    <p className="text-xs text-slate-400">
                      {selectedCategory.subCategories.length} زیردسته تخصصی
                    </p>
                    <div className="mt-2.5 flex items-center justify-center gap-1 text-xs text-blue-600 font-semibold">
                      <span>مشاهده کاتالوگ</span>
                      <span className="text-[10px]">←</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Subcategories quick pill preview */}
                <div>
                  <span className="text-xs font-semibold text-slate-500 mb-2 block">زیردسته‌های این بخش:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedCategory.subCategories.map((sub) => (
                      <Badge key={sub.slug} variant="secondary" className="text-xs py-1">
                        {sub.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
