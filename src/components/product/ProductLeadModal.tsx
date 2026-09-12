"use client";

import React, { useState, useEffect, useCallback, useId } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  PhoneCall,
  User,
  Building2,
  MessageSquare,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Zap,
  FileText,
  Clock,
  X,
  Loader2,
  ArrowLeft,
  ChevronRight,
} from "lucide-react";
import { normalizeIranianMobile } from "@/lib/didar";
import { telHref, useSiteSettings } from "@/hooks/use-site-settings";

export interface ProductLeadModalProps {
  productTitle: string;
  productSlug: string;
  productSku?: string;
  variantDetails?: string;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  autoTriggerDelayMs?: number; // default 6000ms
  enableExitIntent?: boolean; // default true
}

export function ProductLeadModal({
  productTitle,
  productSlug,
  productSku = "",
  variantDetails = "",
  isOpen: controlledIsOpen,
  onOpenChange: controlledOnOpenChange,
  autoTriggerDelayMs = 6000,
  enableExitIntent = true,
}: ProductLeadModalProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isControlled = controlledIsOpen !== undefined;
  const open = isControlled ? controlledIsOpen : internalIsOpen;

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) {
        setInternalIsOpen(nextOpen);
      }
      controlledOnOpenChange?.(nextOpen);

      if (!nextOpen) {
        // Record dismissal in sessionStorage so it doesn't pop up again in this session
        try {
          sessionStorage.setItem(`didar_popup_dismissed_${productSlug}`, "true");
        } catch {
          // Ignore storage restrictions
        }
      }
    },
    [isControlled, controlledOnOpenChange, productSlug]
  );

  const siteSettings = useSiteSettings();
  const phoneHref = telHref(siteSettings.phone);

  // Form State
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");

  // Submission State
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedPhone, setSubmittedPhone] = useState("");

  // Reset form when SKU or product slug changes
  const prevSkuRef = React.useRef(productSku);
  useEffect(() => {
    if (prevSkuRef.current !== productSku) {
      prevSkuRef.current = productSku;
      setIsSuccess(false);
      setMessage("");
      setErrorMessage("");
    }
  }, [productSku]);

  const handleResetForm = () => {
    setIsSuccess(false);
    setMessage("");
    setErrorMessage("");
  };

  const nameId = useId();
  const phoneId = useId();
  const companyId = useId();
  const messageId = useId();

  // Auto popup timer and exit intent
  useEffect(() => {
    // Check if user already dismissed or submitted
    try {
      if (sessionStorage.getItem(`didar_popup_dismissed_${productSlug}`)) return;
      if (localStorage.getItem(`didar_lead_submitted_${productSlug}`)) return;
    } catch {
      // Storage unavailable
    }

    // 1. Timed popup
    const timer = setTimeout(() => {
      try {
        if (!sessionStorage.getItem(`didar_popup_dismissed_${productSlug}`)) {
          handleOpenChange(true);
        }
      } catch {
        handleOpenChange(true);
      }
    }, autoTriggerDelayMs);

    // 2. Desktop Exit Intent (mouse leaving top of page)
    const handleMouseLeave = (e: MouseEvent) => {
      if (!enableExitIntent) return;
      if (e.clientY <= 15) {
        try {
          if (!sessionStorage.getItem(`didar_popup_dismissed_${productSlug}`)) {
            handleOpenChange(true);
          }
        } catch {
          handleOpenChange(true);
        }
      }
    };

    window.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [productSlug, autoTriggerDelayMs, enableExitIntent, handleOpenChange]);

  // Form submission handler
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage("");

    const trimmedName = fullName.trim();
    if (trimmedName.length < 2) {
      setErrorMessage("لطفاً نام و نام خانوادگی خود را کامل وارد فرمایید.");
      return;
    }

    const normalizedPhone = normalizeIranianMobile(phone);
    if (!normalizedPhone) {
      setErrorMessage("لطفاً یک شماره همراه معتبر ۱۱ رقمی (مانند ۰۹۱۲۳۴۵۶۷۸۹) وارد کنید.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: trimmedName,
          phone: normalizedPhone,
          company: company.trim(),
          message: message.trim(),
          productTitle,
          productSku,
          productUrl: typeof window !== "undefined" ? window.location.href : "",
          variantDetails,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || "خطا در برقراری ارتباط با سرور. لطفاً دوباره تلاش فرمایید.");
        setLoading(false);
        return;
      }

      // Success
      setSubmittedPhone(normalizedPhone);
      setIsSuccess(true);
      try {
        localStorage.setItem(`didar_lead_submitted_${productSlug}`, "true");
        sessionStorage.setItem(`didar_popup_dismissed_${productSlug}`, "true");
      } catch {
        // Ignore
      }
    } catch (err) {
      console.error("[lead-popup] Error submitting form:", err);
      setErrorMessage("خطای غیرمنتظره‌ای رخ داد. لطفاً مجدداً امتحان کنید یا با پشتیبانی تماس بگیرید.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="p-0 gap-0 overflow-hidden border-0 shadow-2xl rounded-2xl max-w-lg sm:max-w-xl bg-white text-gray-900 max-h-[92vh] flex flex-col"
        dir="rtl"
      >
        {/* Custom Close Button in top left (RTL) */}
        <button
          onClick={() => handleOpenChange(false)}
          className="absolute top-4 left-4 z-20 w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
          aria-label="بستن"
        >
          <X size={18} />
        </button>

        {/* ─── Ad Header Banner ─── */}
        <div className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-950 text-white p-6 sm:p-7 overflow-hidden shrink-0">
          {/* Decorative glowing background elements */}
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-cyan-400/15 rounded-full blur-2xl pointer-events-none" />

          {/* Ad Badge */}
          <div className="flex items-center gap-2 mb-2.5">
            <Badge className="bg-amber-400/90 text-amber-950 hover:bg-amber-400 border-0 font-bold px-2.5 py-0.5 text-xs shadow-sm flex items-center gap-1">
              <Sparkles size={12} className="text-amber-900" />
              استعلام قیمت ویژه و مشاوره رایگان
            </Badge>
            <span className="text-[11px] text-blue-200 hidden sm:inline-flex items-center gap-1">
              <Clock size={12} />
              پاسخگویی سریع
            </span>
          </div>

          <DialogTitle className="text-xl sm:text-2xl font-black tracking-tight text-white mb-2 leading-snug">
            دریافت پیش‌فاکتور رسمی و بهترین قیمت روز
          </DialogTitle>

          <DialogDescription className="text-xs sm:text-sm text-blue-100 leading-relaxed max-w-md">
            اطلاعات تماس خود را وارد کنید تا کارشناسان فنی استیکو در کوتاه‌ترین زمان برای ارائه قیمت همکاری، تخفیف پروژه و مشاوره تخصصی با شما تماس بگیرند.
          </DialogDescription>

          {/* Active Product Context Chip */}
          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-white/90 min-w-0">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="truncate font-medium">
                محصول: <strong className="text-white font-bold">{productTitle}</strong>
              </span>
            </div>
            {productSku && (
              <span className="text-[11px] bg-white/10 px-2 py-0.5 rounded text-blue-200 shrink-0 num-en">
                کد: {productSku}
              </span>
            )}
          </div>
        </div>

        {/* ─── Body Content ─── */}
        <div className="p-6 sm:p-7 overflow-y-auto">
          {isSuccess ? (
            /* ─── Success Confirmation View ─── */
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner animate-in zoom-in-75 duration-300">
                <CheckCircle2 size={36} />
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1.5">
                  درخواست شما با موفقیت در سیستم ثبت شد!
                </h3>
                <p className="text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
                  اطلاعات شما به واحد فروش منتقل شد. همکاران ما به زودی با شماره{" "}
                  <strong className="text-blue-700 font-semibold num-en">{submittedPhone || phone}</strong>{" "}
                  جهت ارائه پیش‌فاکتور و پاسخ به سوالات فنی شما تماس خواهند گرفت.
                </p>
              </div>

              {/* Direct call option for urgent inquiries */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-900 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <PhoneCall size={16} className="text-blue-600 shrink-0" />
                  <span>نیاز به استعلام فوری بدون معطلی دارید؟</span>
                </div>
                <a href={phoneHref} className="shrink-0">
                  <Button size="sm" className="bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs px-4">
                    تماس مستقیم با کارشناس
                  </Button>
                </a>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  className="w-full sm:w-auto px-6 border-gray-300 text-gray-700"
                >
                  بستن پنجره
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleResetForm}
                  className="w-full sm:w-auto px-4 text-blue-700 hover:text-blue-800 hover:bg-blue-50 text-xs font-semibold"
                >
                  ثبت استعلام جدید یا محصول دیگر
                </Button>
              </div>
            </div>
          ) : (
            /* ─── Lead Form View ─── */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Value proposition badges */}
              <div className="grid grid-cols-3 gap-2 pb-1 text-center">
                <div className="bg-gray-50 border border-gray-100 rounded-lg p-2">
                  <Zap size={14} className="text-amber-500 mx-auto mb-1" />
                  <span className="text-[11px] font-semibold text-gray-700 block">تخفیف همکاری</span>
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-lg p-2">
                  <FileText size={14} className="text-blue-500 mx-auto mb-1" />
                  <span className="text-[11px] font-semibold text-gray-700 block">پیش‌فاکتور رسمی</span>
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-lg p-2">
                  <ShieldCheck size={14} className="text-emerald-500 mx-auto mb-1" />
                  <span className="text-[11px] font-semibold text-gray-700 block">تضمین اصالت و گارانتی</span>
                </div>
              </div>

              {/* Error Alert */}
              {errorMessage && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg p-3 leading-relaxed flex items-start gap-2 animate-in fade-in">
                  <span className="font-bold shrink-0">⚠️</span>
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Fields Grid */}
              <div className="grid sm:grid-cols-2 gap-3.5">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <Label htmlFor={nameId} className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                    <User size={13} className="text-gray-400" />
                    نام و نام خانوادگی <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id={nameId}
                    type="text"
                    required
                    disabled={loading}
                    placeholder="مثال: مهدی رضایی"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="h-10 text-sm focus-visible:ring-blue-600 bg-gray-50/50"
                  />
                </div>

                {/* Mobile Phone */}
                <div className="space-y-1.5">
                  <Label htmlFor={phoneId} className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                    <PhoneCall size={13} className="text-gray-400" />
                    شماره همراه <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id={phoneId}
                    type="tel"
                    dir="ltr"
                    required
                    disabled={loading}
                    placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-10 text-sm text-left focus-visible:ring-blue-600 bg-gray-50/50 font-mono"
                  />
                </div>
              </div>

              {/* Company / Workshop (Optional) */}
              <div className="space-y-1.5">
                <Label htmlFor={companyId} className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                  <Building2 size={13} className="text-gray-400" />
                  نام شرکت، کارگاه یا پروژه <span className="text-gray-400 font-normal">(اختیاری)</span>
                </Label>
                <Input
                  id={companyId}
                  type="text"
                  disabled={loading}
                  placeholder="مثال: صنایع بسته بندی پارس"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="h-10 text-sm focus-visible:ring-blue-600 bg-gray-50/50"
                />
              </div>

              {/* Message / Requirements (Optional) */}
              <div className="space-y-1.5">
                <Label htmlFor={messageId} className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                  <MessageSquare size={13} className="text-gray-400" />
                  توضیحات یا تعداد درخواستی <span className="text-gray-400 font-normal">(اختیاری)</span>
                </Label>
                <Textarea
                  id={messageId}
                  disabled={loading}
                  rows={2}
                  placeholder="مثال: نیاز به استعلام قیمت ۵ دستگاه با پایه B35 و ارسال فوری به اصفهان دارم..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="text-sm resize-none focus-visible:ring-blue-600 bg-gray-50/50"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white font-bold text-sm sm:text-base shadow-md hover:shadow-lg transition-all rounded-xl flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin text-white" />
                      <span>در حال ثبت اطلاعات در CRM...</span>
                    </>
                  ) : (
                    <>
                      <PhoneCall size={18} />
                      <span>ثبت درخواست و تماس کارشناس</span>
                      <ArrowLeft size={16} className="mr-1" />
                    </>
                  )}
                </Button>
              </div>

              {/* Privacy / Trust Footnote */}
              <div className="text-center pt-1">
                <p className="text-[11px] text-gray-400 flex items-center justify-center gap-1">
                  <ShieldCheck size={12} className="text-emerald-500" />
                  اطلاعات شما نزد استیکو محفوظ است و صرفاً جهت استعلام استفاده می‌شود.
                </p>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Floating trigger pill rendered on the product page (bottom left, above WhatsApp)
 * Allows the user to re-open the offer popup anytime.
 */
export function ProductLeadFloatingButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-20 left-4 sm:bottom-24 sm:left-6 z-40 flex items-center gap-2 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white text-xs font-bold px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full shadow-lg shadow-blue-900/20 border border-blue-400/30 transition-all hover:scale-105 group"
      aria-label="استعلام فوری قیمت و پیش فاکتور"
    >
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400" />
      </span>
      <span>استعلام قیمت و پیش‌فاکتور</span>
      <ChevronRight size={14} className="text-blue-200 group-hover:-translate-x-0.5 transition-transform" />
    </button>
  );
}

/**
 * In-page Action Button that can be placed directly alongside Phone/WhatsApp buttons.
 */
export function ProductLeadTriggerButton({
  onClick,
  className = "",
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <Button
      type="button"
      size="lg"
      onClick={onClick}
      className={`bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white font-bold shadow-sm hover:shadow transition-all ${className}`}
    >
      <Sparkles size={16} className="ml-1.5 text-amber-300" />
      استعلام آنلاین قیمت و پیش‌فاکتور
    </Button>
  );
}
