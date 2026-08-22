"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  Phone,
  Mail,
  Instagram,
  Send,
  Cog,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { telHref, useSiteSettings } from "@/hooks/use-site-settings";
import { CATALOG_CATEGORIES } from "@/data/catalogCategories";

export function SiteHeader() {
  const siteSettings = useSiteSettings();
  const phoneLink = telHref(siteSettings.phone);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileExpandedCat, setMobileExpandedCat] = useState<string | null>(null);
  const dropdownTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  return (
    <>
      {/* ─── Top Bar ─── */}
      <div className="bg-blue-900 text-white text-xs py-2">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a
              href={phoneLink}
              className="flex items-center gap-1 hover:text-blue-200 transition-colors"
            >
              <Phone size={12} />
              <span className="num-en">{siteSettings.phone}</span>
            </a>
            <a
              href={`mailto:${siteSettings.email}`}
              className="flex items-center gap-1 hover:text-blue-200 transition-colors"
            >
              <Mail size={12} />
              <span className="num-en">{siteSettings.email}</span>
            </a>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={siteSettings.instagram || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-200 transition-colors"
              aria-label="Instagram"
            >
              <Instagram size={14} />
            </a>
            <a
              href={siteSettings.telegram || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-200 transition-colors"
              aria-label="Telegram"
            >
              <Send size={14} />
            </a>
          </div>
        </div>
      </div>

      {/* ─── Header ─── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105">
                <Cog size={22} className="text-white" />
              </div>
              <div>
                <span className="block text-lg font-bold text-blue-900 tracking-tight">
                  {siteSettings.site_name}
                </span>
                <p className="text-[10px] text-gray-400 -mt-0.5">
                  تجهیزات صنعتی، انتقال قدرت و سیالات
                </p>
              </div>
            </Link>

            {/* Desktop Nav — Product Categories */}
            <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-gray-600">
              <Link
                href="/"
                className="px-3 py-2 rounded-md hover:text-blue-700 hover:bg-gray-50 transition-colors"
              >
                خانه
              </Link>
              {CATALOG_CATEGORIES.map((cat) => (
                <div
                  key={cat.slug}
                  className="relative"
                  onMouseEnter={() => {
                    if (dropdownTimeout.current) clearTimeout(dropdownTimeout.current);
                    setOpenDropdown(cat.slug);
                  }}
                  onMouseLeave={() => {
                    dropdownTimeout.current = setTimeout(() => setOpenDropdown(null), 150);
                  }}
                  onFocus={() => {
                    if (dropdownTimeout.current) clearTimeout(dropdownTimeout.current);
                    if (cat.subCategories.length > 0) setOpenDropdown(cat.slug);
                  }}
                  onBlur={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                      setOpenDropdown(null);
                    }
                  }}
                >
                  <Link
                    href={cat.href}
                    className={`flex items-center gap-1 px-3 py-2 rounded-md transition-colors ${
                      openDropdown === cat.slug
                        ? "text-blue-700 bg-blue-50"
                        : "hover:text-blue-700 hover:bg-gray-50"
                    }`}
                  >
                    {cat.name}
                    {cat.subCategories.length > 0 && (
                      <ChevronDown
                        size={13}
                        className={`transition-transform ${
                          openDropdown === cat.slug ? "rotate-180" : ""
                        }`}
                      />
                    )}
                  </Link>
                  {/* Dropdown */}
                  {openDropdown === cat.slug && cat.subCategories.length > 0 && (
                    <div className="absolute top-full right-0 mt-0 pt-1 z-50">
                      <div className="bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-[210px]">
                        {cat.subCategories.map((sub) => (
                          <Link
                            key={sub.slug}
                            href={sub.href}
                            className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                          >
                            {sub.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </nav>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-3">
              <a href={phoneLink}>
                <Button
                  size="sm"
                  className="bg-blue-700 hover:bg-blue-800 text-white shadow-sm"
                >
                  <Phone size={14} className="ml-1.5" />
                  مشاوره رایگان
                </Button>
              </a>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden min-h-11 min-w-11 p-2 text-gray-600 hover:bg-gray-100 rounded-lg flex items-center justify-center"
              onClick={() => {
                setMobileMenuOpen(!mobileMenuOpen);
                setMobileExpandedCat(null);
              }}
              aria-label="منوی سایت"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Nav — Product Categories Accordion */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1 max-h-[70vh] overflow-y-auto">
            <Link
              href="/"
              className="block py-2.5 text-sm font-medium text-gray-700 hover:text-blue-700"
              onClick={() => setMobileMenuOpen(false)}
            >
              خانه
            </Link>
            <Separator className="my-1" />
            {CATALOG_CATEGORIES.map((cat) => (
              <div key={cat.slug}>
                {cat.subCategories.length > 0 ? (
                  <>
                    <div className="flex items-center justify-between w-full py-2 text-sm font-medium text-gray-700">
                      <Link
                        href={cat.href}
                        className="hover:text-blue-700"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {cat.name}
                      </Link>
                      <button
                        type="button"
                        onClick={() =>
                          setMobileExpandedCat(
                            mobileExpandedCat === cat.slug ? null : cat.slug
                          )
                        }
                        className="min-h-11 min-w-11 p-2 text-gray-400 hover:text-blue-700 flex items-center justify-center"
                        aria-label={`نمایش زیردسته‌های ${cat.name}`}
                      >
                        <ChevronDown
                          size={16}
                          className={`transition-transform ${
                            mobileExpandedCat === cat.slug ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                    </div>
                    {mobileExpandedCat === cat.slug && (
                      <div className="pr-4 pb-1 space-y-0.5">
                        {cat.subCategories.map((sub) => (
                          <Link
                            key={sub.slug}
                            href={sub.href}
                            className="block py-2 text-sm text-gray-600 hover:text-blue-700 transition-colors"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            {sub.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    href={cat.href}
                    className="block py-2.5 text-sm font-medium text-gray-700 hover:text-blue-700"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {cat.name}
                  </Link>
                )}
              </div>
            ))}
            <Separator />
            <div className="flex gap-2 pt-1">
              <Link
                href="/#about"
                className="text-xs text-gray-500 hover:text-blue-600"
                onClick={() => setMobileMenuOpen(false)}
              >
                درباره ما
              </Link>
              <span className="text-gray-300">|</span>
              <Link
                href="/#contact"
                className="text-xs text-gray-500 hover:text-blue-600"
                onClick={() => setMobileMenuOpen(false)}
              >
                تماس
              </Link>
            </div>
            <a href={phoneLink} className="block pt-1">
              <Button className="w-full bg-blue-700 hover:bg-blue-800 text-white">
                <Phone size={14} className="ml-1.5" />
                تماس: <span className="num-en mr-1">{siteSettings.phone}</span>
              </Button>
            </a>
          </div>
        )}
      </header>
    </>
  );
}
