"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Zap,
  Sparkles,
  MessageCircle,
  ExternalLink,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLandingPages, LandingPageBrief } from "@/hooks/use-landing-pages";

interface HomeHeroSliderProps {
  whatsappLink: string;
}

interface SlideItem {
  id: string;
  isDefault: boolean;
  slug?: string;
  badge: string;
  badgeIcon: "zap" | "sparkles";
  title: string;
  highlightText?: string;
  subtitle?: string;
  description: string;
  bannerUrl?: string;
  primaryCtaText: string;
  primaryCtaLink: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
}

export function HomeHeroSlider({ whatsappLink }: HomeHeroSliderProps) {
  const { landingPages } = useLandingPages();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const autoPlayTimer = useRef<NodeJS.Timeout | null>(null);

  // Construct slides list: Slide 0 is default home hero, subsequent slides are active landing pages
  const slides: SlideItem[] = [
    {
      id: "default-home",
      isDefault: true,
      badge: "نماینده رسمی STK Motors",
      badgeIcon: "zap",
      title: "تجهیزات صنعتی برای حرکت، انتقال و سیالات",
      highlightText: "الکتروموتور، گیربکس، پمپ و قطعات جانبی",
      description:
        "مجموعه یکپارچه تجهیزات صنعتی با مشخصات فنی دقیق، مدل‌های متنوع و امکان استعلام مستقیم از کارشناسان STK Motors.",
      primaryCtaText: "مشاهده همه محصولات",
      primaryCtaLink: "#products",
      secondaryCtaText: "استعلام قیمت",
      secondaryCtaLink: whatsappLink,
    },
    ...landingPages.map((lp) => ({
      id: lp.id,
      isDefault: false,
      slug: lp.slug,
      badge: lp.subtitle ? "پیشنهاد ویژه و جشنواره" : "کمپین تخصصی STK",
      badgeIcon: "sparkles" as const,
      title: lp.title,
      highlightText: lp.subtitle || undefined,
      description:
        lp.description ||
        "بررسی مشخصات فنی، مدل‌های موجود و استعلام قیمت فوری این دسته از محصولات در کاتالوگ STK Motors.",
      bannerUrl: lp.bannerUrl,
      primaryCtaText: lp.ctaText || "مشاهده این بخش و محصولات",
      primaryCtaLink: lp.ctaLink || `/landing/${lp.slug}`,
      secondaryCtaText: "ورود به صفحه اختصاصی",
      secondaryCtaLink: `/landing/${lp.slug}`,
    })),
  ];

  const totalSlides = slides.length;

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  const AUTO_PLAY_INTERVAL = 4500; // 4.5 seconds for optimal reading and smooth transition

  // Auto-play interval
  useEffect(() => {
    if (totalSlides <= 1 || isPaused) return;

    autoPlayTimer.current = setInterval(() => {
      nextSlide();
    }, AUTO_PLAY_INTERVAL);

    return () => {
      if (autoPlayTimer.current) clearInterval(autoPlayTimer.current);
    };
  }, [totalSlides, isPaused, nextSlide]);

  // Touch swipe support
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    // In RTL, dragging left (diff > 50) means next slide
    if (diff > 50) {
      nextSlide();
    } else if (diff < -50) {
      prevSlide();
    }
    touchStartX.current = null;
  };

  const activeSlideData = slides[currentSlide] || slides[0];

  return (
    <section
      id="home"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="relative bg-slate-950 text-white overflow-hidden min-h-[440px] sm:min-h-[480px] lg:min-h-[520px] flex items-center select-none"
    >
      {/* ─── Background Slides ─── */}
      {slides.map((slide, idx) => {
        const isActive = idx === currentSlide;
        return (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              isActive ? "opacity-100 z-10 pointer-events-auto" : "opacity-0 z-0 pointer-events-none"
            }`}
          >
            {slide.bannerUrl ? (
              <>
                <img
                  src={slide.bannerUrl}
                  alt={slide.title}
                  className="w-full h-full object-cover opacity-25 scale-105 transition-transform duration-1000"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-blue-950/60" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/40" />
              </>
            ) : (
              <div className="w-full h-full bg-gradient-to-bl from-blue-900 via-blue-800 to-blue-950">
                <div className="absolute inset-0 opacity-15">
                  <div className="absolute top-10 right-20 w-80 h-80 bg-white rounded-full blur-3xl animate-pulse" />
                  <div className="absolute bottom-10 left-20 w-96 h-96 bg-blue-400 rounded-full blur-3xl" />
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* ─── Slide Content Container ─── */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 py-16 sm:py-20 lg:py-24 w-full">
        <div className="max-w-2xl space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/25 border border-blue-400/30 text-blue-200 text-xs sm:text-sm font-semibold backdrop-blur-md">
            {activeSlideData.badgeIcon === "zap" ? (
              <Zap size={13} className="text-blue-300 ml-0.5" />
            ) : (
              <Sparkles size={13} className="text-amber-300 ml-0.5 animate-pulse" />
            )}
            <span>{activeSlideData.badge}</span>
            {totalSlides > 1 && (
              <span className="mr-1 text-[10px] text-blue-300/70 border-r border-blue-400/30 pr-1.5">
                اسلاید {currentSlide + 1} از {totalSlides}
              </span>
            )}
          </div>

          {/* Headline */}
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight text-white drop-shadow-sm min-h-[72px] sm:min-h-[100px]">
            {activeSlideData.title}
            {activeSlideData.highlightText && (
              <>
                <br />
                <span className="text-blue-300 font-bold block sm:inline mt-1 sm:mt-0">
                  {activeSlideData.highlightText}
                </span>
              </>
            )}
          </h1>

          {/* Description */}
          <p className="text-blue-100/85 text-xs sm:text-base leading-relaxed line-clamp-3 min-h-[50px]">
            {activeSlideData.description}
          </p>

          {/* Call to Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {activeSlideData.primaryCtaLink.startsWith("#") ? (
              <Link href={activeSlideData.primaryCtaLink}>
                <Button
                  size="lg"
                  className="bg-white text-blue-900 hover:bg-blue-50 font-bold px-6 sm:px-8 text-xs sm:text-sm shadow-md h-11 sm:h-12 rounded-xl cursor-pointer"
                >
                  {activeSlideData.primaryCtaText}
                  <ChevronLeft size={17} className="mr-1" />
                </Button>
              </Link>
            ) : (
              <Link href={activeSlideData.primaryCtaLink}>
                <Button
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 sm:px-8 text-xs sm:text-sm shadow-md h-11 sm:h-12 rounded-xl cursor-pointer"
                >
                  {activeSlideData.primaryCtaText}
                  <ArrowLeft size={16} className="mr-1.5" />
                </Button>
              </Link>
            )}

            {activeSlideData.secondaryCtaLink && (
              activeSlideData.secondaryCtaLink.startsWith("http") || activeSlideData.secondaryCtaLink.startsWith("https") ? (
                <a href={activeSlideData.secondaryCtaLink} target="_blank" rel="noopener noreferrer">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white/30 bg-white/10 hover:bg-white/20 text-white hover:text-white px-5 sm:px-6 text-xs sm:text-sm h-11 sm:h-12 rounded-xl backdrop-blur-xs cursor-pointer"
                  >
                    <MessageCircle size={15} className="ml-1.5" />
                    {activeSlideData.secondaryCtaText}
                  </Button>
                </a>
              ) : (
                <Link href={activeSlideData.secondaryCtaLink}>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white/30 bg-white/10 hover:bg-white/20 text-white hover:text-white px-5 sm:px-6 text-xs sm:text-sm h-11 sm:h-12 rounded-xl backdrop-blur-xs cursor-pointer"
                  >
                    <ExternalLink size={14} className="ml-1.5" />
                    {activeSlideData.secondaryCtaText}
                  </Button>
                </Link>
              )
            )}
          </div>
        </div>
      </div>

      {/* ─── Navigation Arrows (When > 1 slide) ─── */}
      {totalSlides > 1 && (
        <>
          <button
            type="button"
            onClick={prevSlide}
            aria-label="اسلاید قبلی"
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-black/25 hover:bg-white/25 border border-white/20 text-white flex items-center justify-center backdrop-blur-md transition-all hover:scale-105 cursor-pointer shadow-lg"
          >
            <ChevronRight size={22} />
          </button>

          <button
            type="button"
            onClick={nextSlide}
            aria-label="اسلاید بعدی"
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-black/25 hover:bg-white/25 border border-white/20 text-white flex items-center justify-center backdrop-blur-md transition-all hover:scale-105 cursor-pointer shadow-lg"
          >
            <ChevronLeft size={22} />
          </button>
        </>
      )}

      {/* ─── Slide Indicator Dots with Progress (Bottom) ─── */}
      {totalSlides > 1 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/45 backdrop-blur-md border border-white/10 shadow-lg">
          {slides.map((s, idx) => {
            const isActive = idx === currentSlide;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setCurrentSlide(idx)}
                aria-label={`رفتن به اسلاید ${idx + 1}`}
                className={`relative overflow-hidden transition-all duration-300 rounded-full cursor-pointer ${
                  isActive
                    ? "w-8 h-2 bg-white/20"
                    : "w-2 h-2 bg-white/40 hover:bg-white/70"
                }`}
              >
                {isActive && (
                  <span
                    key={`bar-${currentSlide}-${isPaused}`}
                    className="absolute inset-0 bg-blue-400 rounded-full transition-all"
                    style={{
                      animation: !isPaused ? `sliderBarProgress ${AUTO_PLAY_INTERVAL}ms linear forwards` : "none",
                      width: isPaused ? "100%" : undefined,
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Embedded CSS animation for slide progress */}
      <style jsx>{`
        @keyframes sliderBarProgress {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }
      `}</style>
    </section>
  );
}
