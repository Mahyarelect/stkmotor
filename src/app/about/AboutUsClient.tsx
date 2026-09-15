"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ShieldCheck,
  Award,
  Truck,
  Headphones,
  MapPin,
  Phone,
  Mail,
  MessageCircle,
  Sparkles,
  ChevronLeft,
  X,
  Building2,
  HeartHandshake,
  Target,
  History,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { telHref, whatsappHref } from "@/hooks/use-site-settings";

interface ValueItem {
  title: string;
  description: string;
  icon?: string;
}

interface StatItem {
  label: string;
  value: string;
}

interface GalleryItem {
  url: string;
  caption: string;
}

interface AboutUsData {
  title: string;
  subtitle: string;
  introText: string;
  storyTitle: string;
  storyText: string;
  missionTitle: string;
  missionText: string;
  values: string;
  gallery: string;
  stats: string;
}

const ICON_MAP: Record<string, any> = {
  ShieldCheck,
  Award,
  Truck,
  Headphones,
  CheckCircle2,
  HeartHandshake,
};

export default function AboutUsClient({
  data,
  settings,
}: {
  data: AboutUsData;
  settings: Record<string, string>;
}) {
  const [activeImage, setActiveImage] = useState<GalleryItem | null>(null);

  let valuesList: ValueItem[] = [];
  try {
    valuesList = JSON.parse(data.values || "[]");
  } catch {
    valuesList = [];
  }

  let statsList: StatItem[] = [];
  try {
    statsList = JSON.parse(data.stats || "[]");
  } catch {
    statsList = [];
  }

  let galleryList: GalleryItem[] = [];
  try {
    galleryList = JSON.parse(data.gallery || "[]");
  } catch {
    galleryList = [];
  }

  const phone = settings.phone || "021-3390-1234";
  const mobile = settings.mobile || "0912-345-6789";
  const address = settings.address || "تهران، خیابان سعدی جنوبی، مرکز تجارت تجهیزات صنعتی";
  const email = settings.email || "info@stkmotors.com";
  const whatsapp = settings.whatsapp || "989123456789";

  return (
    <div className="space-y-16 pb-20">
      {/* ─── 1. Hero Section ─── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-950 via-slate-900 to-slate-950 text-white pt-20 pb-24 px-4">
        {/* Background ambient glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto relative z-10 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-xs font-medium backdrop-blur-md">
            <Sparkles size={14} className="text-blue-400" />
            <span>تأمین‌کننده رسمی تجهیزات صنعتی و الکتروموتور</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
            {data.title || "درباره گروه صنعتی STK"}
          </h1>

          {data.subtitle && (
            <p className="text-lg sm:text-xl text-blue-100/90 font-medium max-w-2xl mx-auto">
              {data.subtitle}
            </p>
          )}

          {data.introText && (
            <p className="text-sm sm:text-base text-gray-300 max-w-3xl mx-auto leading-relaxed">
              {data.introText}
            </p>
          )}

          <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
            <Button
              asChild
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs h-10 px-5 rounded-xl gap-2 shadow-lg shadow-blue-600/30"
            >
              <Link href="/electromotors">
                مشاهده کاتالوگ محصولات
                <ChevronLeft size={16} />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-white/20 bg-white/5 hover:bg-white/10 text-white text-xs h-10 px-5 rounded-xl gap-2"
            >
              <a href={telHref(phone)}>
                <Phone size={14} className="text-blue-400" />
                تماس و مشاوره فوری
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* ─── 2. Key Statistics Counters ─── */}
      {statsList.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 -mt-24 relative z-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statsList.map((st, idx) => (
              <div
                key={idx}
                className="bg-white/95 backdrop-blur-md p-6 rounded-2xl border border-gray-200/80 shadow-lg text-center transform transition-transform hover:-translate-y-1 duration-200"
              >
                <div className="text-2xl sm:text-3xl font-black text-blue-600 tracking-tight mb-1 font-mono" dir="ltr">
                  {st.value}
                </div>
                <div className="text-xs sm:text-sm font-semibold text-gray-700">
                  {st.label}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── 3. Story & Mission ─── */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Story Card */}
          {data.storyText && (
            <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-xs space-y-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <History size={24} />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                {data.storyTitle || "داستان و تاریخچه ما"}
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                {data.storyText}
              </p>
            </div>
          )}

          {/* Mission Card */}
          {data.missionText && (
            <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-xs space-y-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Target size={24} />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                {data.missionTitle || "ماموریت و اهداف ما"}
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                {data.missionText}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ─── 4. Core Values ─── */}
      {valuesList.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">ارزش‌ها و استانداردهای STK</h2>
            <p className="text-xs sm:text-sm text-gray-500 max-w-lg mx-auto">
              تعهداتی که فعالیت روزانه و رویکرد ما در خدمت‌رسانی به کارگاه‌ها و صنایع را هدایت می‌کنند
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {valuesList.map((val, idx) => {
              const IconComp = ICON_MAP[val.icon || ""] || ShieldCheck;
              return (
                <div
                  key={idx}
                  className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs hover:border-blue-300 hover:shadow-md transition-all duration-200 space-y-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <IconComp size={20} />
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm">{val.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{val.description}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ─── 5. Photo Gallery ─── */}
      {galleryList.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">گالری تصاویر مجموعه و کارگاه</h2>
            <p className="text-xs sm:text-sm text-gray-500 max-w-lg mx-auto">
              نگاهی به بخش‌های انبار مرکزی، نمایشگاه محصولات و توانمندی‌های تأمین تجهیزات
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {galleryList.map((item, idx) => (
              <div
                key={idx}
                onClick={() => setActiveImage(item)}
                className="group relative aspect-video rounded-2xl overflow-hidden border border-gray-200 bg-gray-100 shadow-xs cursor-pointer hover:shadow-md transition-all duration-300"
              >
                <Image
                  src={item.url}
                  alt={item.caption || `گالری ${idx + 1}`}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4 text-white">
                  <span className="text-xs font-semibold">{item.caption || "مشاهده تصویر"}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── 6. Location & Direct Contact Section ─── */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-xl border border-blue-900/50 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-xl text-center md:text-right">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-medium">
              <Building2 size={14} />
              <span>دفتر و انبار مرکزی</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              آماده پاسخگویی و میزبانی از شما هستیم
            </h2>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
              برای دریافت مشاوره تخصصی انتخاب موتور، استعلام پیش‌فاکتور یا خرید حضوری، کارشناسان ما در ساعات اداری پاسخگوی شما هستند.
            </p>

            <div className="pt-2 space-y-2 text-xs sm:text-sm text-gray-300">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <MapPin size={16} className="text-blue-400 shrink-0" />
                <span>{address}</span>
              </div>
              <div className="flex items-center justify-center md:justify-start gap-2">
                <Phone size={16} className="text-blue-400 shrink-0" />
                <span className="num-en font-mono">{phone}</span>
                {mobile && <span className="text-gray-400">|</span>}
                {mobile && <span className="num-en font-mono">{mobile}</span>}
              </div>
              <div className="flex items-center justify-center md:justify-start gap-2">
                <Mail size={16} className="text-blue-400 shrink-0" />
                <span className="num-en font-mono">{email}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-3 w-full sm:w-auto shrink-0">
            <Button
              asChild
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs h-11 px-6 rounded-xl gap-2 shadow-lg shadow-blue-600/30"
            >
              <a href={telHref(phone)}>
                <Phone size={15} />
                تماس تلفنی با کارشناسان
              </a>
            </Button>
            <Button
              asChild
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-11 px-6 rounded-xl gap-2 shadow-lg shadow-emerald-600/30"
            >
              <a href={whatsappHref(whatsapp)} target="_blank" rel="noopener noreferrer">
                <MessageCircle size={16} />
                ارسال پیام در واتساپ
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* ─── Lightbox Modal ─── */}
      <Dialog open={Boolean(activeImage)} onOpenChange={(open) => !open && setActiveImage(null)}>
        <DialogContent className="max-w-4xl p-2 bg-black/90 border-0 text-white overflow-hidden">
          {activeImage && (
            <div className="space-y-2">
              <div className="relative aspect-video w-full rounded-lg overflow-hidden">
                <Image
                  src={activeImage.url}
                  alt={activeImage.caption || "نمایش تصویر"}
                  fill
                  className="object-contain"
                  sizes="100vw"
                />
              </div>
              {activeImage.caption && (
                <p className="text-center text-xs text-gray-300 py-1" dir="rtl">
                  {activeImage.caption}
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
