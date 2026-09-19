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
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMainImageChange(selectedCategory.slug, "")}
                      className="text-xs text-slate-500 hover:text-red-600"
                    >
                      <RotateCcw size={12} className="ml-1" />
                      بازگشت به تصویر پیش‌فرض سیستم
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
                      const currentImg = subCatImages[sub.slug] || DEFAULT_CATEGORY_IMAGES[sub.slug] || "";
                      const isCustom = Boolean(subCatImages[sub.slug]);

                      return (
                        <div
                          key={sub.slug}
                          className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-slate-800">{sub.name}</span>
                            <Badge variant="secondary" className="text-[10px]">
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

                          <div className="space-y-1.5">
                            <Input
                              type="text"
                              value={subCatImages[sub.slug] || ""}
                              onChange={(e) => handleSubImageChange(sub.slug, e.target.value)}
                              placeholder="آدرس تصویر (URL یا مسیر محلی)..."
                              className="text-xs num-en bg-white"
                              dir="ltr"
                            />
                            {isCustom && (
                              <button
                                type="button"
                                onClick={() => handleSubImageChange(sub.slug, "")}
                                className="text-[11px] text-slate-400 hover:text-red-600 transition-colors flex items-center gap-1"
                              >
                                <RotateCcw size={10} />
                                بازنشانی به پیش‌فرض
                              </button>
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
