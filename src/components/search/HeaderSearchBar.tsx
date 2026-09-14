"use client";

import { useState, useRef, useEffect, useCallback, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Search, X, Loader2, History, Sparkles, ArrowLeft } from "lucide-react";
import { SearchResultItem } from "@/lib/search/search-service";
import { useSearchHistory } from "@/hooks/use-search-history";
import { POPULAR_SEARCH_SUGGESTIONS } from "@/lib/search/taxonomy-dictionary";
import { normalizeProductImageUrl } from "@/lib/product-image";

interface HeaderSearchBarProps {
  className?: string;
  isMobileDrawer?: boolean;
  onNavigate?: () => void;
  autoFocus?: boolean;
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
}: HeaderSearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [categoryMatch, setCategoryMatch] = useState<{ title: string; href: string } | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { history, addSearch, removeSearch, clearHistory } = useSearchHistory();

  // Detect OS platform for keyboard shortcut display without SSR mismatch
  const isApple = useSyncExternalStore(emptySubscribe, getIsApple, () => true);
  const shortcutBadge = isApple ? "⌘K" : "Ctrl+K";

  // Debounced search suggest
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

  // Cleanup debounce timer on unmount
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
    inputRef.current?.focus();
  };

  const executeFullSearch = (term: string) => {
    const target = term.trim();
    if (!target) return;
    addSearch(target);
    setIsOpen(false);
    if (onNavigate) onNavigate();
    router.push(`/search?q=${encodeURIComponent(target)}`);
  };

  const handleSelectVariant = (item: SearchResultItem) => {
    addSearch(item.name || query);
    setIsOpen(false);
    if (onNavigate) onNavigate();
    router.push(`/product/${item.familySlug}?sku=${item.sku}`);
  };

  // Keyboard navigation
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
      inputRef.current?.blur();
    }
  };

  // Global ⌘K / Ctrl+K shortcut listener
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K" || e.code === "KeyK")) {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
        setIsOpen(true);
      }
    };
    window.addEventListener("keydown", handleGlobalKey);
    return () => window.removeEventListener("keydown", handleGlobalKey);
  }, []);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative w-full text-right ${className}`}
      dir="rtl"
    >
      {/* Search Input Field */}
      <div className="relative flex items-center">
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
          {loading ? (
            <Loader2 size={16} className="animate-spin text-blue-600" />
          ) : (
            <Search size={16} />
          )}
        </div>

        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls="header-search-results"
          aria-label="جستجوی محصولات، مشخصات فنی یا کد کالا"
          placeholder="جستجوی محصول، توان، دور، تیپ گیربکس یا کد فنی..."
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          autoFocus={autoFocus}
          className={`w-full pr-9 pl-16 py-2 rounded-xl text-xs md:text-sm bg-gray-50/90 hover:bg-gray-100/90 focus:bg-white border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-hidden text-gray-800 placeholder:text-gray-400 ${
            isMobileDrawer ? "py-2.5 text-sm" : ""
          }`}
        />

        {/* Clear button and ⌘K badge */}
        <div className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-md transition-colors"
              aria-label="پاک کردن متن جستجو"
            >
              <X size={14} />
            </button>
          )}
          {!isMobileDrawer && !query && (
            <kbd className="hidden xl:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-gray-400 bg-white border border-gray-200 rounded shadow-2xs pointer-events-none">
              ⌘K
            </kbd>
          )}
        </div>
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && (
        <div
          id="header-search-results"
          role="listbox"
          className={`absolute top-full right-0 left-0 mt-1.5 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150 max-h-[75vh] overflow-y-auto ${
            isMobileDrawer ? "max-h-[60vh]" : ""
          }`}
        >
          {/* 1. Category Quick-Jump Match */}
          {categoryMatch && (
            <div className="p-2 border-b border-gray-100 bg-blue-50/50">
              <Link
                href={categoryMatch.href}
                onClick={() => {
                  setIsOpen(false);
                  if (onNavigate) onNavigate();
                }}
                className="flex items-center justify-between px-3 py-2 rounded-xl bg-white border border-blue-100 hover:border-blue-300 transition-colors text-xs text-blue-700 font-medium"
              >
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-blue-600" />
                  <span>مشاهده دسته‌بندی «{categoryMatch.title}»</span>
                </div>
                <ArrowLeft size={14} />
              </Link>
            </div>
          )}

          {/* 2. Results List */}
          {results.length > 0 && (
            <div className="p-2">
              <div className="px-2 py-1 text-[11px] font-medium text-gray-400 flex items-center justify-between">
                <span>محصولات منطبق</span>
                <span>{results.length} مورد</span>
              </div>
              <div className="divide-y divide-gray-50">
                {results.map((item, idx) => {
                  const isSelected = selectedIndex === idx;
                  const imgSrc = normalizeProductImageUrl(item.image);
                  return (
                    <div
                      key={item.id}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelectVariant(item)}
                      className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors ${
                        isSelected ? "bg-blue-50/80" : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Thumbnail */}
                        <div className="relative w-11 h-11 rounded-lg bg-gray-100 shrink-0 overflow-hidden border border-gray-100 flex items-center justify-center">
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
              </div>

              {/* View All Results Button */}
              <div className="pt-2 mt-1 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => executeFullSearch(query)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
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
              <p className="text-xs text-gray-600 font-medium">
                محصولی منطبق با «{query}» یافت نشد.
              </p>
              <p className="text-[11px] text-gray-400 mt-1">
                کد فنی، تیپ یا مشخصات توان و دور را جستجو کنید.
              </p>
              <button
                type="button"
                onClick={() => executeFullSearch(query)}
                className="mt-3 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium hover:bg-blue-100 transition-colors"
              >
                جستجو در کل کاتالوگ
              </button>
            </div>
          )}

          {/* 4. Default State: Recent Searches & Popular Suggestions */}
          {!query.trim() && (
            <div className="p-3 space-y-3">
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
                      className="hover:text-red-500 transition-colors"
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
                          className="text-gray-400 hover:text-gray-600"
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
                  <Sparkles size={12} />
                  عبارت‌های پرطرفدار
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_SEARCH_SUGGESTIONS.slice(0, 5).map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => executeFullSearch(term)}
                      className="px-2.5 py-1 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 text-gray-600 hover:text-blue-700 text-xs transition-colors"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
