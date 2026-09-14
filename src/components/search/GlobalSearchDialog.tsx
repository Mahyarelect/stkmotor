"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Search,
  Clock,
  ArrowUpRight,
  X,
  Loader2,
  Flame,
  CornerDownLeft,
  ChevronLeft,
  Sparkles,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { useSearchHistory } from "@/hooks/use-search-history";
import { POPULAR_SEARCH_SUGGESTIONS } from "@/lib/search/taxonomy-dictionary";
import { SearchResultItem } from "@/lib/search/search-service";

interface GlobalSearchDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function formatPrice(price: number): string {
  if (!price || price === 0) return "تماس بگیرید";
  return new Intl.NumberFormat("fa-IR").format(price) + " تومان";
}

export function GlobalSearchDialog({
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: GlobalSearchDialogProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const setOpen = useCallback(
    (value: boolean) => {
      if (isControlled && setControlledOpen) {
        setControlledOpen(value);
      } else {
        setInternalOpen(value);
      }
    },
    [isControlled, setControlledOpen]
  );

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [categoryMatch, setCategoryMatch] = useState<{ title: string; href: string } | null>(null);

  const { history, addSearch, removeSearch, clearHistory } = useSearchHistory();
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Global ⌘K / Ctrl+K keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K" || e.code === "KeyK")) {
        e.preventDefault();
        setOpen(!open);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, setOpen]);

  // Debounced search suggestion fetch
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setCategoryMatch(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.items || []);
          setCategoryMatch(data.categoryMatch || null);
        } else {
          setResults([]);
          setCategoryMatch(null);
        }
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [query]);

  // Reset query on close
  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  const handleSelectVariant = (item: SearchResultItem) => {
    addSearch(query || item.name);
    setOpen(false);
    router.push(`/product/${item.familySlug}?sku=${item.sku}`);
  };

  const handleSearchSubmit = (searchTerm: string) => {
    const term = searchTerm.trim();
    if (!term) return;
    addSearch(term);
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(term)}`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="p-0 overflow-hidden max-w-2xl bg-white shadow-2xl border border-gray-200 sm:rounded-xl"
        dir="rtl"
        showCloseButton={false}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>جستجوی محصولات STK Motor</DialogTitle>
        </DialogHeader>

        <Command shouldFilter={false} className="w-full">
          {/* Search Input Bar */}
          <div className="flex items-center px-4 border-b border-gray-100 h-14 gap-3 bg-gray-50/50">
            {loading ? (
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin shrink-0" />
            ) : (
              <Search className="w-5 h-5 text-gray-400 shrink-0" />
            )}
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && query.trim()) {
                  e.preventDefault();
                  handleSearchSubmit(query);
                }
              }}
              placeholder="جستجوی محصول، توان، دور، تیپ گیربکس یا کد SKU..."
              className="w-full bg-transparent text-gray-800 placeholder:text-gray-400 text-sm focus:outline-none"
              autoFocus
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-md"
                aria-label="پاک کردن متن"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs text-gray-400 border border-gray-200 px-1.5 py-0.5 rounded bg-white shadow-2xs hover:bg-gray-100"
            >
              Esc
            </button>
          </div>

          {/* Results / Suggestions list */}
          <CommandList className="max-h-[380px] overflow-y-auto p-2">
            {/* Category quick match */}
            {categoryMatch && (
              <div className="mb-2 p-2 bg-blue-50/80 border border-blue-100 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-medium text-blue-900">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>{categoryMatch.title}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    router.push(categoryMatch.href);
                  }}
                  className="text-xs text-blue-700 font-semibold flex items-center gap-1 hover:underline"
                >
                  مشاهده دسته‌بندی
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Empty search query state: Recent searches & Popular searches */}
            {!query.trim() && (
              <>
                {history.length > 0 && (
                  <CommandGroup
                    heading={
                      <div className="flex items-center justify-between text-xs font-semibold text-gray-500 pb-1">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          جستجوهای اخیر شما
                        </span>
                        <button
                          type="button"
                          onClick={clearHistory}
                          className="text-[11px] text-gray-400 hover:text-red-600 transition-colors"
                        >
                          پاک کردن همه
                        </button>
                      </div>
                    }
                  >
                    <div className="flex flex-wrap gap-1.5 py-1">
                      {history.map((term) => (
                        <div
                          key={term}
                          className="group inline-flex items-center gap-1.5 bg-gray-100 hover:bg-blue-50 text-gray-700 hover:text-blue-700 text-xs px-2.5 py-1 rounded-full cursor-pointer transition-colors"
                          onClick={() => {
                            setQuery(term);
                            handleSearchSubmit(term);
                          }}
                        >
                          <span>{term}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeSearch(term);
                            }}
                            className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity"
                            aria-label={`حذف ${term}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </CommandGroup>
                )}

                <CommandSeparator className="my-2" />

                <CommandGroup
                  heading={
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 pb-1">
                      <Flame className="w-3.5 h-3.5 text-orange-500" />
                      پیشنهادات پرطرفدار
                    </span>
                  }
                >
                  <div className="flex flex-wrap gap-1.5 py-1">
                    {POPULAR_SEARCH_SUGGESTIONS.map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => {
                          setQuery(sug);
                          handleSearchSubmit(sug);
                        }}
                        className="inline-flex items-center gap-1 text-xs text-gray-600 bg-gray-50 hover:bg-blue-50 hover:text-blue-700 border border-gray-200/80 px-2.5 py-1 rounded-full transition-colors"
                      >
                        <Search className="w-3 h-3 text-gray-400" />
                        {sug}
                      </button>
                    ))}
                  </div>
                </CommandGroup>
              </>
            )}

            {/* Results list when query is typed */}
            {query.trim() && (
              <>
                {results.length === 0 && !loading && (
                  <CommandEmpty className="py-8 text-center">
                    <p className="text-sm font-medium text-gray-600">
                      محصولی با عبارت «{query}» یافت نشد.
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      شماره فنی یا مشخصات را بررسی کنید، یا اینتر را برای جستجوی کامل بزنید.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleSearchSubmit(query)}
                      className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      جستجوی سراسری «{query}»
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </CommandEmpty>
                )}

                {results.length > 0 && (
                  <CommandGroup
                    heading={
                      <span className="text-xs font-semibold text-gray-500">
                        محصولات منطبق ({results.length})
                      </span>
                    }
                  >
                    {results.map((item) => (
                      <CommandItem
                        key={item.sku}
                        value={item.sku}
                        onSelect={() => handleSelectVariant(item)}
                        className="flex items-center justify-between p-2.5 rounded-lg hover:bg-blue-50/70 cursor-pointer transition-colors border border-transparent hover:border-blue-100 mb-1"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative w-11 h-11 bg-gray-50 rounded-md border border-gray-200/80 overflow-hidden shrink-0">
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              sizes="44px"
                              className="object-contain p-1"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900 truncate">
                                {item.name}
                              </span>
                              <Badge
                                variant="outline"
                                className="text-[10px] px-1.5 py-0 border-gray-300 text-gray-500 shrink-0 font-mono"
                              >
                                {item.sku}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className="text-xs text-gray-400">
                                {item.categoryName}
                              </span>
                              {item.specs.power && (
                                <span className="text-[11px] text-gray-500 bg-gray-100 px-1.5 rounded">
                                  {item.specs.power}
                                </span>
                              )}
                              {item.specs.speed && (
                                <span className="text-[11px] text-gray-500 bg-gray-100 px-1.5 rounded">
                                  {item.specs.speed} دور
                                </span>
                              )}
                              {item.specs.size && (
                                <span className="text-[11px] text-gray-500 bg-gray-100 px-1.5 rounded">
                                  سایز {item.specs.size}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-left shrink-0 mr-3">
                          <div className="text-xs font-semibold text-blue-900">
                            {formatPrice(item.price)}
                          </div>
                          <div className="mt-1">
                            {item.inStock ? (
                              <span className="text-[10px] text-emerald-600 font-medium bg-emerald-50 px-1.5 py-0.5 rounded">
                                موجود
                              </span>
                            ) : (
                              <span className="text-[10px] text-gray-400 font-medium bg-gray-100 px-1.5 py-0.5 rounded">
                                تماس بگیرید
                              </span>
                            )}
                          </div>
                        </div>
                      </CommandItem>
                    ))}

                    {/* View all results button */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => handleSearchSubmit(query)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg transition-colors border border-blue-200/60"
                      >
                        <span>مشاهده تمام نتایج برای «{query}»</span>
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                    </div>
                  </CommandGroup>
                )}
              </>
            )}
          </CommandList>

          {/* Dialog Footer */}
          <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-t border-gray-100 text-[11px] text-gray-400">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 bg-white rounded border border-gray-200 text-[10px]">↵</kbd>
                انتخاب / جستجو
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 bg-white rounded border border-gray-200 text-[10px]">Esc</kbd>
                بستن
              </span>
            </div>
            <div className="text-gray-400 font-mono text-[10px]">STK Search Engine</div>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
