"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Phone,
  Mail,
  MapPin,
  Cog,
  ArrowUp,
  MessageCircle,
  Send,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { telHref, useSiteSettings, whatsappHref } from "@/hooks/use-site-settings";
import { CATALOG_CATEGORIES } from "@/data/catalogCategories";

export function SiteFooter() {
  const siteSettings = useSiteSettings();
  const phoneLink = telHref(siteSettings.phone);
  const whatsappLink = whatsappHref(siteSettings.whatsapp);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* ─── Footer ─── */}
      <footer className="bg-gray-900 text-gray-400">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center">
                  <Cog size={16} className="text-white" />
                </div>
                <span className="text-white font-bold text-base">{siteSettings.site_name}</span>
              </div>
              <p className="text-sm leading-relaxed text-gray-400">
                ارائه دهنده تخصصی انواع الکتروموتورهای صنعتی تک‌فاز و سه‌فاز پوسته چدنی و آلومینیومی با بالاترین استانداردهای کیفی و مشاوره فنی رایگان.
              </p>
            </div>
            <div>
              <h5 className="text-white font-semibold mb-3 text-sm">دسته‌بندی محصولات</h5>
              <div className="space-y-2 text-sm">
                {CATALOG_CATEGORIES.map((cat) => (
                  <Link
                    key={cat.slug}
                    href={cat.href}
                    className="block hover:text-blue-400 transition-colors"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
              <h5 className="text-white font-semibold mb-3 mt-6 text-sm">لینک‌های مفید</h5>
              <div className="space-y-2 text-sm">
                <Link href="/" className="block hover:text-blue-400 transition-colors">
                  خانه
                </Link>
                <Link href="/electromotors" className="block hover:text-blue-400 transition-colors">
                  کاتالوگ الکتروموتورها
                </Link>
                <Link href="/#about" className="block hover:text-blue-400 transition-colors">
                  درباره ما
                </Link>
                <Link href="/#contact" className="block hover:text-blue-400 transition-colors">
                  تماس با ما
                </Link>
              </div>
            </div>
            <div>
              <h5 className="text-white font-semibold mb-3 text-sm">اطلاعات تماس</h5>
              <div className="space-y-2.5 text-sm">
                <p className="flex items-center gap-2">
                  <Phone size={14} className="text-blue-400 shrink-0" />
                  <a href={phoneLink} className="hover:text-white num-en">{siteSettings.phone}</a>
                </p>
                <p className="flex items-center gap-2">
                  <Mail size={14} className="text-blue-400 shrink-0" />
                  <a href={`mailto:${siteSettings.email}`} className="hover:text-white num-en">{siteSettings.email}</a>
                </p>
                <p className="flex items-center gap-2">
                  <MapPin size={14} className="text-blue-400 shrink-0" />
                  <span>{siteSettings.address}</span>
                </p>
              </div>
            </div>
          </div>
          <Separator className="bg-gray-800 my-8" />
          <p className="text-center text-xs text-gray-500">
            تمامی حقوق محفوظ است &copy; STK Motors {new Date().getFullYear()}
          </p>
        </div>
      </footer>

      {/* ─── Sticky Mobile Action Bar ─── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] safe-area-pb">
        <div className="grid grid-cols-3 divide-x divide-gray-200">
          <a
            href={phoneLink}
            className="flex flex-col items-center py-2.5 text-gray-600 active:bg-gray-50"
          >
            <Phone size={18} className="mb-0.5 text-blue-700" />
            <span className="text-[10px] font-medium">تماس تلفنی</span>
          </a>
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center py-2.5 text-gray-600 active:bg-gray-50"
          >
            <Send size={18} className="mb-0.5 text-emerald-600" />
            <span className="text-[10px] font-medium">واتساپ</span>
          </a>
          <Link
            href="/electromotors"
            className="flex flex-col items-center py-2.5 text-gray-600 active:bg-gray-50"
          >
            <MessageCircle size={18} className="mb-0.5 text-orange-500" />
            <span className="text-[10px] font-medium">کاتالوگ موتورها</span>
          </Link>
        </div>
      </div>

      {/* ─── Floating Desktop WhatsApp Button ─── */}
      <a
        href={whatsappLink}
        target="_blank"
        rel="noopener noreferrer"
        className="hidden md:flex fixed bottom-6 left-6 z-50 w-14 h-14 bg-emerald-500 hover:bg-emerald-600 rounded-full items-center justify-center shadow-lg shadow-emerald-500/30 transition-all hover:scale-110"
        title="مشاوره در واتساپ"
        aria-label="مشاوره در واتساپ"
      >
        <MessageCircle size={26} className="text-white" />
      </a>

      {/* ─── Scroll to Top ─── */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 z-50 w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-md hover:bg-gray-50 transition-colors md:bottom-6"
          aria-label="بازگشت به بالای صفحه"
        >
          <ArrowUp size={16} className="text-gray-600" />
        </button>
      )}

      {/* Spacer for mobile action bar */}
      <div className="h-16 md:hidden" />
    </>
  );
}
