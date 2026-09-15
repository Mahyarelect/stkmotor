"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Sparkles,
  Phone,
  MessageCircle,
  ChevronLeft,
  Package,
  ShieldCheck,
  Award,
  Truck,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { telHref, whatsappHref } from "@/hooks/use-site-settings";

interface LandingPageData {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  bannerUrl: string;
  ctaText: string;
  ctaLink: string;
  content: string;
  isActive: boolean;
}

interface FeaturedFamilyItem {
  id: string;
  slug: string;
  name: string;
  nameEn: string;
  mainCategory: string;
  category: string;
  brand: string;
  description: string;
  imageUrl: string;
  variantCount: number;
  minPrice: number;
  maxPrice: number;
  inStock: boolean;
}

function formatPrice(price: number): string {
  if (!price || price === 0) return "تماس بگیرید";
  return new Intl.NumberFormat("fa-IR").format(price) + " تومان";
}

export default function LandingPageClient({
  page,
  families,
  settings,
  isAdminPreview = false,
}: {
  page: LandingPageData;
  families: FeaturedFamilyItem[];
  settings: Record<string, string>;
  isAdminPreview?: boolean;
}) {
  const phone = settings.phone || "021-3390-1234";
  const whatsapp = settings.whatsapp || "989123456789";
  const ctaLink = page.ctaLink || "#products";
  const ctaText = page.ctaText || "مشاهده مشخصات و ثبت سفارش";

  return (
    <div className="space-y-16 pb-20">
      {/* ─── Admin Preview Banner ─── */}
      {isAdminPreview && (
        <div className="bg-amber-500 text-amber-950 px-4 py-2.5 text-center text-xs font-semibold flex items-center justify-center gap-2">
          <AlertCircle size={16} />
          <span>این صفحه فرود در حالت «غیرفعال / پیش‌نویس» قرار دارد و تنها برای مدیران سیستم قابل مشاهده است.</span>
        </div>
      )}

      {/* ─── 1. Hero Banner ─── */}
      <section className="relative overflow-hidden bg-slate-950 text-white">
        {page.bannerUrl ? (
          <div className="relative min-h-[420px] lg:min-h-[500px] flex items-center">
            {/* Banner Background Image with Gradient Overlay */}
            <Image
              src={page.bannerUrl}
              alt={page.title}
              fill
              priority
              className="object-cover opacity-35"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/40" />

            <div className="max-w-5xl mx-auto px-4 py-20 relative z-10 text-center space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold backdrop-blur-md">
                <Sparkles size={14} className="text-blue-400" />
                <span>کمپین و پیشنهاد ویژه STK Motors</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
                {page.title}
              </h1>

              {page.subtitle && (
                <p className="text-lg sm:text-xl text-blue-100/90 font-medium max-w-2xl mx-auto">
                  {page.subtitle}
                </p>
              )}

              {page.description && (
                <p className="text-sm sm:text-base text-gray-300 max-w-3xl mx-auto leading-relaxed">
                  {page.description}
                </p>
              )}

              <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
                <Button
                  asChild
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm h-11 px-6 rounded-xl gap-2 shadow-lg shadow-blue-600/30 font-bold"
                >
                  <a href={ctaLink}>
                    {ctaText}
                    <ChevronLeft size={16} />
                  </a>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="border-white/20 bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm h-11 px-5 rounded-xl gap-2 backdrop-blur-md"
                >
                  <a href={telHref(phone)}>
                    <Phone size={14} className="text-blue-400" />
                    استعلام تلفنی قیمت
                  </a>
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative pt-20 pb-24 px-4 bg-gradient-to-b from-blue-950 via-slate-900 to-slate-950">
            <div className="max-w-5xl mx-auto relative z-10 text-center space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-xs font-semibold">
                <Sparkles size={14} className="text-blue-400" />
                <span>کمپین ویژه STK Motors</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
                {page.title}
              </h1>

              {page.subtitle && (
                <p className="text-lg sm:text-xl text-blue-100/90 font-medium max-w-2xl mx-auto">
                  {page.subtitle}
                </p>
              )}

              {page.description && (
                <p className="text-sm sm:text-base text-gray-300 max-w-3xl mx-auto leading-relaxed">
                  {page.description}
                </p>
              )}

              <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
                <Button
                  asChild
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm h-11 px-6 rounded-xl gap-2 font-bold"
                >
                  <a href={ctaLink}>
                    {ctaText}
                    <ChevronLeft size={16} />
                  </a>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="border-white/20 bg-white/5 hover:bg-white/10 text-white text-xs sm:text-sm h-11 px-5 rounded-xl gap-2"
                >
                  <a href={telHref(phone)}>
                    <Phone size={14} className="text-blue-400" />
                    تماس و مشاوره
                  </a>
                </Button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ─── 2. Key Selling Points / Trust Badges ─── */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-xs sm:text-sm">تضمین اصالت کالا</h3>
              <p className="text-[11px] text-gray-500 mt-0.5">سیم‌پیچ ۱۰۰٪ مس استاندارد با گارانتی سلامت</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Truck size={22} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-xs sm:text-sm">تحویل فوری سراسری</h3>
              <p className="text-[11px] text-gray-500 mt-0.5">ارسال روز در تهران و باربری به تمام استان‌ها</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Award size={22} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-xs sm:text-sm">مشاوره فنی پیش از خرید</h3>
              <p className="text-[11px] text-gray-500 mt-0.5">محاسبه توان و گشتاور مورد نیاز کاربری شما</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 3. Custom Rich Content Section ─── */}
      {page.content && (
        <section className="max-w-5xl mx-auto px-4">
          <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-xs space-y-4">
            <h2 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-3">
              توضیحات و مشخصات اختصاصی
            </h2>
            <div className="text-sm text-gray-700 leading-loose whitespace-pre-line space-y-3">
              {page.content}
            </div>
          </div>
        </section>
      )}

      {/* ─── 4. Featured Products Grid ─── */}
      <section id="products" className="max-w-6xl mx-auto px-4 space-y-8 scroll-mt-24">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-gray-200 pb-4">
          <div>
            <div className="flex items-center gap-2 text-blue-600 font-semibold text-xs mb-1">
              <Package size={16} />
              <span>ویترین منتخب</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">محصولات منتخب این صفحه</h2>
          </div>
          <span className="text-xs text-gray-500">
            {families.length} مدل و خانواده محصول آماده سفارش
          </span>
        </div>

        {families.length === 0 ? (
          <div className="text-center p-12 bg-white rounded-2xl border border-gray-200">
            <Package size={36} className="mx-auto text-gray-300 mb-2" />
            <p className="text-xs text-gray-500 font-medium">
              محصولات این صفحه به زودی اضافه خواهند شد.
            </p>
            <Button asChild variant="outline" size="sm" className="mt-3 text-xs">
              <Link href="/electromotors">مشاهده کل کاتالوگ محصولات</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {families.map((fam) => (
              <Card
                key={fam.id}
                className="overflow-hidden border border-gray-200 hover:border-blue-300 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col bg-white rounded-2xl"
              >
                <div className="relative aspect-video w-full bg-slate-50 border-b border-gray-100 flex items-center justify-center p-4">
                  {fam.imageUrl ? (
                    <Image
                      src={fam.imageUrl}
                      alt={fam.name}
                      fill
                      className="object-contain p-2"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  ) : (
                    <Package size={40} className="text-gray-300" />
                  )}
                  {fam.brand && (
                    <Badge className="absolute top-3 right-3 bg-white/90 text-gray-800 border border-gray-200 text-[10px] font-semibold">
                      {fam.brand}
                    </Badge>
                  )}
                </div>

                <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <h3 className="font-bold text-gray-900 text-sm sm:text-base leading-snug">
                      {fam.name}
                    </h3>
                    {fam.description && (
                      <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                        {fam.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-gray-400 block">شروع قیمت از:</span>
                      <span className="text-sm sm:text-base font-extrabold text-blue-900 num-en">
                        {formatPrice(fam.minPrice)}
                      </span>
                    </div>

                    <Button
                      asChild
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl h-9 px-3 gap-1"
                    >
                      <Link href={`/product/${fam.slug}`}>
                        مشاهده و خرید
                        <ChevronLeft size={14} />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* ─── 5. Inquiry & Consultation Banner ─── */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white rounded-3xl p-8 sm:p-12 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl text-center md:text-right">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              نیاز به راهنمایی در انتخاب مشخصات دارید؟
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
              مهندسان فروش STK آماده‌اند تا با بررسی نوع بار، دور و ابعاد شافت، بهترین محصول را به همراه پیش‌فاکتور رسمی معرفی کنند.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto shrink-0">
            <Button
              asChild
              className="bg-white hover:bg-blue-50 text-blue-900 text-xs sm:text-sm font-bold h-11 px-6 rounded-xl gap-2 shadow-lg"
            >
              <a href={telHref(phone)}>
                <Phone size={16} className="text-blue-600" />
                {phone}
              </a>
            </Button>
            <Button
              asChild
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold h-11 px-6 rounded-xl gap-2 shadow-lg shadow-emerald-600/30"
            >
              <a href={whatsappHref(whatsapp)} target="_blank" rel="noopener noreferrer">
                <MessageCircle size={16} />
                مشاوره در واتساپ
              </a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
