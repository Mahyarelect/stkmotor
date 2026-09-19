"use client";

import { useState, useRef, useEffect, useCallback, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Search,
  X,
  Loader2,
  History,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  Flame,
  MessageCircle,
  Tag,
} from "lucide-react";
import { SearchResultItem } from "@/lib/search/search-service";
import { useSearchHistory } from "@/hooks/use-search-history";
import { POPULAR_SEARCH_SUGGESTIONS } from "@/lib/search/taxonomy-dictionary";
import { normalizeProductImageUrl } from "@/lib/product-image";
import { CATALOG_CATEGORIES } from "@/data/catalogCategories";
import { whatsappHref, useSiteSettings } from "@/hooks/use-site-settings";

interface HeaderSearchBarProps {
  className?: string;
  isMobileDrawer?: boolean;
  onNavigate?: () => void;
  autoFocus?: boolean;
  onClick?: () => void;
  /** Force open mobile search overlay */
  isMobileSearchOpen?: boolean;
  onMobileSearchClose?: () => void;
  /** Only render mobile search overlay */
  mobileOnly?: boolean;
  /** Only render desktop search bar */
  desktopOnly?: boolean;
}

function formatToman(price: number): string {
  if (!price || price <= 0) return "تماس بگیرید";
  return `${new Intl.NumberFormat("fa-IR").format(price)} تومان`;
}

const emptySubscribe = () => () => {};
const getIsApple = () => {
  if (typeof navigator === "undefined") return true;
  return /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform || navigator.userAgent);
};

export function HeaderSearchBar({
  className = "",
  isMobileDrawer = false,
  onNavigate,
  autoFocus = false,
  onClick,
  isMobileSearchOpen: controlledMobileOpen,
  onMobileSearchClose,
  mobileOnly = false,
  desktopOnly = false,
}: HeaderSearchBarProps) {
  const router = useRouter();
  const siteSettings = useSiteSettings();

  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [categoryMatch, setCategoryMatch] = useState<{ title: string; href: string } | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Mobile full-screen search state
  const [internalMobileOpen, setInternalMobileOpen] = useState(false);
  const isMobileOpen = controlledMobileOpen !== undefined ? controlledMobileOpen : internalMobileOpen;

  const setMobileOpen = useCallback(
    (val: boolean) => {
      if (controlledMobileOpen !== undefined && onMobileSearchClose && !val) {
        onMobileSearchClose();
      } else {
        setInternalMobileOpen(val);
      }
    },
    [controlledMobileOpen, onMobileSearchClose]
  );

  const desktopContainerRef = useRef<HTMLDivElement>(null);
  const desktopInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { history, addSearch, removeSearch, clearHistory } = useSearchHistory();

  // Detect OS platform for keyboard shortcut display without SSR mismatch
  const isApple = useSyncExternalStore(emptySubscribe, getIsApple, () => true);
  const shortcutBadge = isApple ? "⌘K" : "Ctrl+K";

  // Lock body scroll when mobile search is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileOpen]);

  // Focus mobile input on open
  useEffect(() => {
    if (isMobileOpen) {
      const timer = setTimeout(() => {
        mobileInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isMobileOpen]);

  // Global keyboard shortcut listener for ⌘K / Ctrl+K
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K" || e.code === "KeyK")) {
        e.preventDefault();
        if (window.innerWidth < 768) {
          setMobileOpen(true);
        } else {
          desktopInputRef.current?.focus();
          setIsOpen(true);
        }
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [setMobileOpen]);

  // Click outside listener for desktop autocomplete dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        desktopContainerRef.current &&
        !desktopContainerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch search suggestions debounced
  const fetchSuggestions = useCallback((searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setResults([]);
      setCategoryMatch(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`/api/search/suggest?q=${encodeURIComponent(trimmed)}`)
      .then((res) => (res.ok ? res.json() : { items: [], categoryMatch: null }))
      .then((data) => {
        setResults(data.items || []);
        setCategoryMatch(data.categoryMatch || null);
        setSelectedIndex(-1);
        itemRefs.current = [];
      })
      .catch(() => {
        setResults([]);
        setCategoryMatch(null);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setIsOpen(true);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      fetchSuggestions(val);
    }, 180);
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setCategoryMatch(null);
    setSelectedIndex(-1);
    if (isMobileOpen) {
      mobileInputRef.current?.focus();
    } else {
      desktopInputRef.current?.focus();
    }
  };

  const executeFullSearch = (term: string) => {
    const target = term.trim();
    if (!target) return;
    addSearch(target);
    setIsOpen(false);
    setMobileOpen(false);
    if (onNavigate) onNavigate();
    router.push(`/search?q=${encodeURIComponent(target)}`);
  };

  const handleSelectVariant = (item: SearchResultItem) => {
    addSearch(item.name || query);
    setIsOpen(false);
    setMobileOpen(false);
    if (onNavigate) onNavigate();
    router.push(`/product/${item.familySlug}?sku=${item.sku}`);
  };

  const handleSelectCategory = (href: string) => {
    setIsOpen(false);
    setMobileOpen(false);
    if (onNavigate) onNavigate();
    router.push(href);
  };

  // Keyboard navigation for desktop dropdown
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > -1 ? prev - 1 : -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && results[selectedIndex]) {
        handleSelectVariant(results[selectedIndex]);
      } else {
        executeFullSearch(query);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      desktopInputRef.current?.blur();
    }
  };

  // Mobile drawer trigger mode (if used inside mobile hamburger menu)
  if (isMobileDrawer) {
    return (
      <button
        type="button"
        onClick={() => {
          if (onClick) onClick();
          setMobileOpen(true);
        }}
        className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-500 hover:text-gray-900 transition-colors text-right cursor-pointer ${className}`}
        aria-label="جستجوی سریع محصولات"
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <Search size={16} className="text-gray-400 shrink-0" />
          <span className="text-xs truncate font-normal">
            جستجوی محصولات...
          </span>
        </div>
      </button>
    );
  }

  const whatsappInquiryMessage = `سلام، وقت بخیر. درباره محصول «${query.trim() || "تجهیزات صنعتی"}» در سایت STK Motor سوال داشتم و می‌خواستم استعلام قیمت و موجودی بگیرم.`;
  const whatsappUrl = whatsappHref(siteSettings.whatsapp, whatsappInquiryMessage);

  return (
    <>
      {/* ══════════════════════════════════════════════════
          DESKTOP MAIN UNIFIED SEARCH BAR (Screens >= md)
         ══════════════════════════════════════════════════ */}
      {!mobileOnly && (
        <div
          ref={desktopContainerRef}
          className={`relative w-full ${className}`}
          dir="rtl"
        >
        {/* Main Search Input */}
        <div className="relative flex items-center">
          <input
            ref={desktopInputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            autoFocus={autoFocus}
            placeholder="جستجوی محصولات..."
            aria-label="جستجوی سریع محصولات"
            aria-expanded={isOpen}
            aria-autocomplete="list"
            aria-controls="header-search-results"
            className="w-full pl-14 pr-10 py-2.5 text-xs lg:text-sm bg-gray-50/90 hover:bg-gray-100/90 focus:bg-white border border-gray-200 focus:border-blue-500 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 transition-all text-gray-800 placeholder:text-gray-400 shadow-2xs"
          />

          {/* Search Icon (RTL Right) */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 flex items-center">
            {loading ? (
              <Loader2 size={16} className="animate-spin text-blue-600" />
            ) : (
              <Search size={16} />
            )}
          </div>

          {/* Left Controls: Clear (X) or Shortcut Badge */}
          <div className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {query.length > 0 ? (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-200/80 transition-colors cursor-pointer"
                aria-label="پاک کردن متن"
              >
                <X size={14} />
              </button>
            ) : (
              <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-gray-400 bg-white border border-gray-200 rounded shadow-2xs">
                {shortcutBadge}
              </kbd>
            )}
          </div>
        </div>

        {/* ─── Desktop Autocomplete Dropdown ─── */}
        {isOpen && (
          <div
            id="header-search-results"
            role="listbox"
            className="absolute top-full right-0 left-0 mt-1.5 bg-white rounded-2xl shadow-2xl border border-gray-200/90 z-50 overflow-hidden max-h-[460px] flex flex-col transition-all"
          >
            {/* 1. Category Quick Match */}
            {categoryMatch && (
              <div className="p-2 border-b border-blue-100 bg-blue-50/50">
                <button
                  type="button"
                  onClick={() => handleSelectCategory(categoryMatch.href)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white border border-blue-200/80 hover:bg-blue-50 text-blue-800 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles size={14} className="text-blue-600 shrink-0" />
                    <span>دسته‌بندی مرتبط: {categoryMatch.title}</span>
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-blue-600 font-medium">
                    <span>مشاهده دسته‌بندی</span>
                    <ArrowLeft size={12} />
                  </span>
                </button>
              </div>
            )}

            {/* 2. Search Results List */}
            {results.length > 0 && (
              <div className="overflow-y-auto flex-1 p-2 divide-y divide-gray-50">
                <div className="px-2 py-1 text-[11px] font-medium text-gray-400 flex items-center justify-between">
                  <span>محصولات منطبق</span>
                  <span>{results.length} مورد</span>
                </div>
                {results.map((item, idx) => {
                  const isSelected = selectedIndex === idx;
                  const imgSrc = normalizeProductImageUrl(item.image);
                  return (
                    <div
                      key={item.id || item.sku}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelectVariant(item)}
                      className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors ${
                        isSelected ? "bg-blue-50/80" : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Thumbnail */}
                        <div className="relative w-11 h-11 rounded-lg bg-gray-50 shrink-0 overflow-hidden border border-gray-200/80 flex items-center justify-center">
                          {imgSrc ? (
                            <Image
                              src={imgSrc}
                              alt={item.name}
                              fill
                              sizes="44px"
                              className="object-contain p-1"
                            />
                          ) : (
                            <div className="text-[10px] text-gray-400">STK</div>
                          )}
                        </div>

                        {/* Title & Specs */}
                        <div className="min-w-0 text-right">
                          <p className="text-xs font-semibold text-gray-900 truncate">
                            {item.name}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                              کد: {item.sku}
                            </span>
                            <span className="text-[10px] text-gray-500">
                              {item.categoryName}
                            </span>
                            {item.specs?.power && (
                              <span className="text-[10px] text-blue-600 font-medium">
                                {item.specs.power}
                              </span>
                            )}
                            {item.specs?.speed && (
                              <span className="text-[10px] text-gray-500">
                                {item.specs.speed} RPM
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Price & Stock */}
                      <div className="text-left shrink-0 mr-2">
                        <div className="text-xs font-bold text-blue-700">
                          {formatToman(item.price)}
                        </div>
                        <span
                          className={`inline-block text-[10px] font-medium mt-0.5 ${
                            item.inStock ? "text-emerald-600" : "text-amber-600"
                          }`}
                        >
                          {item.inStock ? "موجود" : "استعلام موجودی"}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* View All Results Button */}
                <div className="pt-2 mt-1 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => executeFullSearch(query)}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer bg-blue-50/50 border border-blue-200/60"
                  >
                    <span>مشاهده همه نتایج برای «{query}»</span>
                    <ArrowLeft size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* 3. Empty State with Did You Mean */}
            {query.trim().length > 0 && !loading && results.length === 0 && (
              <div className="p-6 text-center">
                <p className="text-xs text-gray-700 font-medium">
                  محصولی با عبارت «{query}» یافت نشد.
                </p>
                <p className="text-[11px] text-gray-400 mt-1">
                  کد فنی، تیپ یا مشخصات توان و دور را جستجو کنید.
                </p>
                <button
                  type="button"
                  onClick={() => executeFullSearch(query)}
                  className="mt-3 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium hover:bg-blue-100 transition-colors cursor-pointer"
                >
                  <span>جستجو در کل کاتالوگ</span>
                  <ArrowLeft size={12} />
                </button>
              </div>
            )}

            {/* 4. Default State: Recent Searches & Popular Suggestions */}
            {!query.trim() && (
              <div className="p-3 space-y-3.5 max-h-[380px] overflow-y-auto">
                {/* Recent Searches */}
                {history.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-gray-400 px-1 mb-1.5">
                      <span className="flex items-center gap-1">
                        <History size={12} />
                        جستجوهای اخیر
                      </span>
                      <button
                        type="button"
                        onClick={clearHistory}
                        className="hover:text-red-500 transition-colors cursor-pointer text-[10px]"
                      >
                        پاک کردن همه
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {history.map((term) => (
                        <div
                          key={term}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-blue-50 text-gray-700 hover:text-blue-700 text-xs transition-colors cursor-pointer"
                        >
                          <span onClick={() => executeFullSearch(term)}>{term}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeSearch(term);
                            }}
                            className="text-gray-400 hover:text-gray-600 cursor-pointer"
                            aria-label={`حذف ${term}`}
                          >
                            <X size={11} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Popular Searches */}
                <div>
                  <div className="text-[11px] text-gray-400 px-1 mb-1.5 flex items-center gap-1">
                    <Flame size={12} className="text-orange-500" />
                    عبارت‌های پرطرفدار
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {POPULAR_SEARCH_SUGGESTIONS.slice(0, 6).map((term) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => executeFullSearch(term)}
                        className="px-2.5 py-1 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 text-gray-600 hover:text-blue-700 text-xs transition-colors cursor-pointer"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Dropdown Footer */}
            <div className="flex items-center justify-between px-3.5 py-2 bg-gray-50 border-t border-gray-100 text-[11px] text-gray-400">
              <div className="flex items-center gap-2">
                <span>↵ انتخاب / جستجو</span>
                <span>•</span>
                <span>Esc بستن</span>
              </div>
              <span className="font-mono text-[10px] text-gray-400">STK Catalog Search</span>
            </div>
          </div>
        )}
      </div>
      )}

      {/* ══════════════════════════════════════════════════
          MOBILE FULL-SCREEN DEDICATED SEARCH OVERLAY
         ══════════════════════════════════════════════════ */}
      {!desktopOnly && isMobileOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="جستجوی سریع محصولات"
          className="fixed inset-0 z-[100] bg-white flex flex-col md:hidden animate-in fade-in duration-150"
          dir="rtl"
        >
          {/* Mobile Top Header Bar */}
          <div className="h-16 border-b border-gray-200 px-3 flex items-center gap-2.5 bg-white shrink-0 shadow-2xs">
            {/* Back Arrow Button (Right side in RTL) */}
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="min-h-11 min-w-11 p-2.5 text-gray-600 hover:bg-gray-100 rounded-full flex items-center justify-center cursor-pointer -mr-1"
              aria-label="بستن جستجو"
            >
              <ArrowRight size={22} className="text-gray-700" />
            </button>

            {/* Mobile Search Input Wrapper */}
            <div className="flex-1 relative flex items-center bg-gray-100 rounded-xl px-3 h-11 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:bg-white focus-within:border focus-within:border-blue-500 transition-all">
              <Search size={18} className="text-gray-400 shrink-0 ml-2" />
              <input
                ref={mobileInputRef}
                type="search"
                enterKeyHint="search"
                value={query}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    executeFullSearch(query);
                  }
                }}
                placeholder="جستجوی محصولات..."
                className="w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
              />

              {loading && (
                <Loader2 size={16} className="animate-spin text-blue-600 shrink-0 mr-1" />
              )}

              {query.length > 0 && !loading && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-full shrink-0 mr-1 cursor-pointer"
                  aria-label="پاک کردن متن"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Search Submit Button */}
            {query.trim().length > 0 && (
              <button
                type="button"
                onClick={() => executeFullSearch(query)}
                className="min-h-11 px-3 bg-blue-700 text-white rounded-xl text-xs font-semibold hover:bg-blue-800 transition-colors shrink-0 flex items-center justify-center shadow-xs"
              >
                جستجو
              </button>
            )}
          </div>

          {/* Mobile Search Body Content */}
          <div className="flex-1 overflow-y-auto px-4 py-4 overscroll-contain">
            {/* Category Match Card */}
            {categoryMatch && (
              <div className="mb-4 p-3 bg-blue-50/80 border border-blue-200/80 rounded-xl flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-2 text-xs font-semibold text-blue-900 min-w-0">
                  <Sparkles size={16} className="text-blue-600 shrink-0" />
                  <span className="truncate">{categoryMatch.title}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleSelectCategory(categoryMatch.href)}
                  className="text-xs text-blue-700 font-bold flex items-center gap-1 shrink-0 hover:underline"
                >
                  مشاهده
                  <ChevronLeft size={14} />
                </button>
              </div>
            )}

            {/* Results List */}
            {results.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-medium text-gray-400 px-1 mb-2">
                  <span>محصولات منطبق</span>
                  <span>{results.length} مورد</span>
                </div>

                {results.map((item) => {
                  const imgSrc = normalizeProductImageUrl(item.image);
                  return (
                    <div
                      key={item.id || item.sku}
                      role="option"
                      onClick={() => handleSelectVariant(item)}
                      className="flex items-center justify-between p-3 rounded-2xl bg-white border border-gray-200 hover:border-blue-300 active:bg-blue-50/50 shadow-2xs cursor-pointer transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {/* Thumbnail */}
                        <div className="relative w-14 h-14 rounded-xl bg-gray-50 shrink-0 overflow-hidden border border-gray-100 flex items-center justify-center">
                          {imgSrc ? (
                            <Image
                              src={imgSrc}
                              alt={item.name}
                              fill
                              sizes="56px"
                              className="object-contain p-1"
                            />
                          ) : (
                            <div className="text-xs text-gray-400 font-bold">STK</div>
                          )}
                        </div>

                        {/* Details */}
                        <div className="min-w-0 text-right">
                          <p className="text-sm font-bold text-gray-900 truncate">
                            {item.name}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 font-medium">
                              کد: {item.sku}
                            </span>
                            <span className="text-[11px] text-gray-500">
                              {item.categoryName}
                            </span>
                            {item.specs?.power && (
                              <span className="text-[11px] text-blue-700 font-semibold bg-blue-50 px-1.5 py-0.5 rounded">
                                {item.specs.power}
                              </span>
                            )}
                            {item.specs?.speed && (
                              <span className="text-[11px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                {item.specs.speed} دور
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Price & Stock */}
                      <div className="text-left shrink-0 mr-3">
                        <div className="text-xs font-bold text-blue-900">
                          {formatToman(item.price)}
                        </div>
                        <span
                          className={`inline-block text-[10px] font-medium mt-1 px-1.5 py-0.5 rounded ${
                            item.inStock
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {item.inStock ? "موجود" : "استعلام"}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* View Full Search Button */}
                <div className="pt-3 pb-8">
                  <button
                    type="button"
                    onClick={() => executeFullSearch(query)}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-blue-700 bg-blue-50 border border-blue-200 active:bg-blue-100 transition-colors shadow-2xs"
                  >
                    <span>مشاهده تمام نتایج در کاتالوگ</span>
                    <ArrowLeft size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Empty Query State: Recent, Popular, and Categories */}
            {!query.trim() && (
              <div className="space-y-6">
                {/* Recent Searches */}
                {history.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold text-gray-500 mb-2.5">
                      <span className="flex items-center gap-1.5">
                        <History size={14} className="text-gray-400" />
                        جستجوهای اخیر شما
                      </span>
                      <button
                        type="button"
                        onClick={clearHistory}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        پاک کردن همه
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {history.map((term) => (
                        <div
                          key={term}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 active:bg-blue-100 text-gray-800 text-xs font-medium transition-colors"
                        >
                          <span onClick={() => executeFullSearch(term)}>{term}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeSearch(term);
                            }}
                            className="text-gray-400 hover:text-gray-700 p-0.5"
                            aria-label={`حذف ${term}`}
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Popular Trending Suggestions */}
                <div>
                  <div className="text-xs font-semibold text-gray-500 mb-2.5 flex items-center gap-1.5">
                    <Flame size={15} className="text-orange-500" />
                    عبارت‌های پرطرفدار
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {POPULAR_SEARCH_SUGGESTIONS.map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => executeFullSearch(sug)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-gray-200 active:bg-blue-50 text-gray-700 text-xs font-medium transition-colors"
                      >
                        <Search size={12} className="text-gray-400" />
                        <span>{sug}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick Category Shortcuts */}
                <div>
                  <div className="text-xs font-semibold text-gray-500 mb-2.5 flex items-center gap-1.5">
                    <Tag size={14} className="text-blue-600" />
                    دسته‌بندی‌های کاتالوگ
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {CATALOG_CATEGORIES.map((cat) => (
                      <button
                        key={cat.slug}
                        type="button"
                        onClick={() => handleSelectCategory(cat.href)}
                        className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200/80 active:bg-blue-50 text-right text-xs font-semibold text-gray-800 transition-colors"
                      >
                        <span>{cat.name}</span>
                        <ChevronLeft size={14} className="text-gray-400" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Empty Search Result State */}
            {query.trim().length > 0 && !loading && results.length === 0 && (
              <div className="py-12 text-center px-4">
                <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 mx-auto flex items-center justify-center mb-3">
                  <Search size={28} />
                </div>
                <h4 className="text-base font-bold text-gray-900">
                  محصولی با عبارت «{query}» یافت نشد
                </h4>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed max-w-xs mx-auto">
                  پیشنهاد می‌کنیم توان (کیلووات یا اسب)، دور (۱۴۰۰ یا ۳۰۰۰)، تیپ گیربکس یا کد فنی را امتحان کنید.
                </p>

                <div className="mt-6 flex flex-col gap-2.5">
                  <button
                    type="button"
                    onClick={() => executeFullSearch(query)}
                    className="w-full py-2.5 rounded-xl bg-blue-700 text-white text-xs font-bold hover:bg-blue-800 transition-colors"
                  >
                    جستجوی پیشرفته در همه کاتالوگ
                  </button>

                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 rounded-xl border border-emerald-500 text-emerald-700 text-xs font-bold hover:bg-emerald-50 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <MessageCircle size={15} />
                    استعلام موجودی و قیمت در واتساپ
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default HeaderSearchBar;
