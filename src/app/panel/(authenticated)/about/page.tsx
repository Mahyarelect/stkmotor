"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building2,
  Save,
  Loader2,
  ExternalLink,
  Plus,
  Trash2,
  Sparkles,
  ShieldCheck,
  Award,
  Truck,
  Headphones,
  Check,
  History,
  Target,
  Image as ImageIcon,
  HeartHandshake,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GalleryManager, GalleryItem } from "@/components/admin/CmsImageUploader";

interface ValueItem {
  title: string;
  description: string;
  icon: string;
}

interface StatItem {
  label: string;
  value: string;
}

export default function AboutUsAdminPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [introText, setIntroText] = useState("");
  const [storyTitle, setStoryTitle] = useState("");
  const [storyText, setStoryText] = useState("");
  const [missionTitle, setMissionTitle] = useState("");
  const [missionText, setMissionText] = useState("");
  const [values, setValues] = useState<ValueItem[]>([]);
  const [stats, setStats] = useState<StatItem[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);

  useEffect(() => {
    async function fetchAbout() {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/about");
        if (res.ok) {
          const data = await res.json();
          setTitle(data.title || "");
          setSubtitle(data.subtitle || "");
          setIntroText(data.introText || "");
          setStoryTitle(data.storyTitle || "");
          setStoryText(data.storyText || "");
          setMissionTitle(data.missionTitle || "");
          setMissionText(data.missionText || "");

          try {
            setValues(JSON.parse(data.values || "[]"));
          } catch {
            setValues([]);
          }

          try {
            setStats(JSON.parse(data.stats || "[]"));
          } catch {
            setStats([]);
          }

          try {
            setGallery(JSON.parse(data.gallery || "[]"));
          } catch {
            setGallery([]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch about data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAbout();
  }, []);

  async function handleSave(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setSaving(true);
    setError(null);
    setSavedSuccess(false);

    try {
      const payload = {
        title,
        subtitle,
        introText,
        storyTitle,
        storyText,
        missionTitle,
        missionText,
        values,
        stats,
        gallery,
      };

      const res = await fetch("/api/admin/about", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "خطا در ذخیره اطلاعات");
      }

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "عملیات ذخیره‌سازی ناموفق بود.");
    } finally {
      setSaving(false);
    }
  }

  // Value Card Helpers
  function addValueCard() {
    setValues((prev) => [
      ...prev,
      {
        title: "ارزش جدید",
        description: "توضیح کوتاه در رابطه با این مزیت یا تعهد مجموعه...",
        icon: "ShieldCheck",
      },
    ]);
  }

  function removeValueCard(idx: number) {
    setValues((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateValueCard(idx: number, field: keyof ValueItem, val: string) {
    setValues((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: val };
      return updated;
    });
  }

  // Stat Helpers
  function addStat() {
    setStats((prev) => [...prev, { label: "شاخص جدید", value: "۱۰۰+" }]);
  }

  function removeStat(idx: number) {
    setStats((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateStat(idx: number, field: keyof StatItem, val: string) {
    setStats((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: val };
      return updated;
    });
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-gray-400" dir="rtl">
        <Loader2 size={36} className="animate-spin text-blue-600 mb-3" />
        <p className="text-xs">در حال بارگذاری محتوای صفحه درباره ما...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto" dir="rtl">
      {/* ─── Top Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Building2 size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              ویرایشگر صفحه «درباره ما» (About Us CMS)
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              مدیریت داستان مجموعه، ماموریت، ارزش‌ها، آمار کلیدی و گالری تصاویر کارگاه و تیم
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="text-xs rounded-xl h-10 gap-1.5"
          >
            <Link href="/about" target="_blank">
              <ExternalLink size={14} />
              مشاهده زنده صفحه
            </Link>
          </Button>
          <Button
            onClick={() => handleSave()}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-xl h-10 px-4 gap-1.5"
          >
            {saving ? (
              <Loader2 size={15} className="animate-spin" />
            ) : savedSuccess ? (
              <Check size={15} className="text-emerald-300" />
            ) : (
              <Save size={15} />
            )}
            {savedSuccess ? "ذخیره شد!" : "ذخیره تغییرات"}
          </Button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
          <Check size={16} className="text-emerald-600" />
          اطلاعات صفحه درباره ما با موفقیت ذخیره شد و اکنون در صفحه عمومی فرانت‌اند قابل مشاهده است.
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={(e) => handleSave(e)} className="space-y-6">
        {/* ─── Section 1: Main Header & Intro ─── */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
            <Sparkles size={18} className="text-blue-600" />
            <h2 className="text-sm font-bold text-gray-900">تیتر و پیام ابتدایی (Hero)</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">عنوان اصلی *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="درباره گروه صنعتی STK"
                className="text-xs h-9"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">زیرعنوان / شعار معرفی</Label>
              <Input
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="پیشگام در تأمین تجهیزات صنعتی، الکتروموتور و ماشین‌آلات"
                className="text-xs h-9"
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <Label className="text-xs font-semibold">پاراگراف معرفی کلی</Label>
              <Textarea
                value={introText}
                onChange={(e) => setIntroText(e.target.value)}
                placeholder="توضیحات کلی و چشم‌انداز فعالیت‌های گروه STK..."
                className="text-xs min-h-[80px] leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* ─── Section 2: Story & History ─── */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
            <History size={18} className="text-amber-600" />
            <h2 className="text-sm font-bold text-gray-900">داستان و تاریخچه ما</h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">عنوان بخش تاریخچه</Label>
              <Input
                value={storyTitle}
                onChange={(e) => setStoryTitle(e.target.value)}
                placeholder="داستان و تاریخچه ما"
                className="text-xs h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">متن کامل تاریخچه و مسیر رشد</Label>
              <Textarea
                value={storyText}
                onChange={(e) => setStoryText(e.target.value)}
                placeholder="روایت شروع به کار، چالش‌ها، دستاوردها و جایگاه فعلی در بازار صنعت کشور..."
                className="text-xs min-h-[110px] leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* ─── Section 3: Mission & Vision ─── */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
            <Target size={18} className="text-emerald-600" />
            <h2 className="text-sm font-bold text-gray-900">ماموریت و رسالت</h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">عنوان ماموریت</Label>
              <Input
                value={missionTitle}
                onChange={(e) => setMissionTitle(e.target.value)}
                placeholder="ماموریت و اهداف ما"
                className="text-xs h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">متن ماموریت و تعهد به مشتریان</Label>
              <Textarea
                value={missionText}
                onChange={(e) => setMissionText(e.target.value)}
                placeholder="ایجاد شفافیت، مشاوره صادقانه، تأمین فوری و تسهیل خطوط تولید مشتریان..."
                className="text-xs min-h-[90px] leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* ─── Section 4: Key Stats Counters ─── */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <BarChart3 size={18} className="text-indigo-600" />
              <h2 className="text-sm font-bold text-gray-900">شاخص‌ها و آمار کلیدی</h2>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addStat}
              className="text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50"
            >
              <Plus size={13} className="ml-1" />
              افزودن شاخص
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {stats.map((st, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/60 relative group space-y-2"
              >
                <button
                  type="button"
                  onClick={() => removeStat(idx)}
                  className="absolute top-2 left-2 text-gray-400 hover:text-red-600 p-1 opacity-80 group-hover:opacity-100"
                  title="حذف شاخص"
                >
                  <Trash2 size={13} />
                </button>
                <div className="space-y-1">
                  <Label className="text-[11px] text-gray-500">عدد یا مقدار</Label>
                  <Input
                    value={st.value}
                    onChange={(e) => updateStat(idx, "value", e.target.value)}
                    placeholder="مثال: ۳۰+"
                    className="text-xs h-8 bg-white font-bold text-blue-700"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-gray-500">عنوان شاخص</Label>
                  <Input
                    value={st.label}
                    onChange={(e) => updateStat(idx, "label", e.target.value)}
                    placeholder="مثال: سال تجربه تخصصی"
                    className="text-xs h-8 bg-white"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Section 5: Core Values ─── */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <HeartHandshake size={18} className="text-purple-600" />
              <h2 className="text-sm font-bold text-gray-900">ارزش‌ها و تعهدات بنیادین</h2>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addValueCard}
              className="text-xs border-purple-200 text-purple-700 hover:bg-purple-50"
            >
              <Plus size={13} className="ml-1" />
              افزودن کارت ارزش
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {values.map((v, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-gray-200 bg-white shadow-xs relative group space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-400">کارت #{idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeValueCard(idx)}
                    className="text-gray-400 hover:text-red-600 p-1"
                    title="حذف کارت"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] text-gray-600">عنوان ارزش</Label>
                  <Input
                    value={v.title}
                    onChange={(e) => updateValueCard(idx, "title", e.target.value)}
                    placeholder="مثال: اصالت قطعات و سیم‌پیچ مسی"
                    className="text-xs h-8"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] text-gray-600">توضیحات</Label>
                  <Textarea
                    value={v.description}
                    onChange={(e) => updateValueCard(idx, "description", e.target.value)}
                    placeholder="توضیح کوتاه درباره اهمیت این ارزش در مجموعه STK..."
                    className="text-xs min-h-[60px]"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Section 6: Photo Gallery ─── */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
            <ImageIcon size={18} className="text-sky-600" />
            <h2 className="text-sm font-bold text-gray-900">گالری تصاویر کارگاه، انبار و تیم</h2>
          </div>

          <GalleryManager
            slug="about"
            items={gallery}
            onChange={setGallery}
            label="تصاویر گالری صفحه درباره ما"
            description="تصاویر شفاف و واقعی از دفتر مرکزی سعدی، انبار، تیم فنی و تجهیزات تخصصی"
          />
        </div>

        {/* ─── Bottom Actions ─── */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="text-xs rounded-xl h-10"
          >
            <Link href="/about" target="_blank">
              <ExternalLink size={14} className="ml-1.5" />
              پیش‌نمایش زنده
            </Link>
          </Button>

          <Button
            type="submit"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-xl h-10 px-6 gap-1.5"
          >
            {saving ? (
              <Loader2 size={15} className="animate-spin" />
            ) : savedSuccess ? (
              <Check size={15} className="text-emerald-300" />
            ) : (
              <Save size={15} />
            )}
            {savedSuccess ? "ذخیره شد!" : "ذخیره کلیه تغییرات"}
          </Button>
        </div>
      </form>
    </div>
  );
}
