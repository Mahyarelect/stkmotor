"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Cog, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryCardProps {
  title: string;
  href: string;
  image?: string | null;
  description?: string | null;
  countLabel?: string | null;
  isActive?: boolean;
  className?: string;
}

export function CategoryCard({
  title,
  href,
  image,
  description,
  countLabel,
  isActive = false,
  className,
}: CategoryCardProps) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <Link
      href={href}
      className={cn(
        "group relative flex flex-col rounded-2xl bg-white border border-gray-200/90 shadow-sm overflow-hidden",
        "transition-all duration-300 ease-out",
        "hover:shadow-xl hover:border-blue-500/80 hover:-translate-y-1",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2",
        isActive && "border-blue-600 ring-2 ring-blue-500/30 shadow-md",
        className
      )}
    >
      {/* ─── Image / Visual Header ─── */}
      <div className="relative w-full h-44 sm:h-52 bg-gradient-to-br from-slate-50 via-gray-100 to-blue-50/40 flex items-center justify-center overflow-hidden border-b border-gray-100">
        {/* Subtle grid pattern background */}
        <div
          className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(#1e3a8a_1px,transparent_1px)] [background-size:16px_16px]"
          aria-hidden="true"
        />

        {image && !imageFailed ? (
          <img
            src={image}
            alt={title}
            onError={() => setImageFailed(true)}
            className="w-full h-full object-contain p-4 transition-transform duration-500 ease-out group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-100/70 border border-blue-200/60 flex items-center justify-center mb-2 transition-transform duration-300 group-hover:scale-110 group-hover:bg-blue-600 group-hover:border-blue-600">
              <Cog
                size={32}
                className="text-blue-700 transition-colors duration-300 group-hover:text-white"
              />
            </div>
            <span className="text-[11px] font-medium text-gray-400 group-hover:text-blue-600 transition-colors">
              دسته محصولات صنعتی
            </span>
          </div>
        )}

        {/* Count or Category Tag */}
        {countLabel && (
          <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm border border-gray-200/70 text-gray-600 text-[11px] font-medium px-2.5 py-0.5 rounded-full shadow-xs">
            {countLabel}
          </span>
        )}

        {isActive && (
          <span className="absolute top-3 right-3 bg-blue-600 text-white text-[11px] font-medium px-2.5 py-0.5 rounded-full shadow-xs">
            دسته‌بندی فعال
          </span>
        )}
      </div>

      {/* ─── Content Body ─── */}
      <div className="p-5 flex flex-col flex-1 justify-between bg-white">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Layers size={15} className="text-blue-600 shrink-0" />
            <h3 className="font-bold text-base sm:text-lg text-gray-900 group-hover:text-blue-700 transition-colors">
              {title}
            </h3>
          </div>
          {description && (
            <p className="text-xs sm:text-sm text-gray-500 leading-relaxed line-clamp-2 mb-4">
              {description}
            </p>
          )}
        </div>

        {/* ─── Bottom CTA Link (RTL forward: arrow to left) ─── */}
        <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs sm:text-sm font-semibold text-blue-700">
          <span className="group-hover:translate-x-[-2px] transition-transform">
            مشاهده محصولات
          </span>
          <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center transition-all duration-300 group-hover:bg-blue-600 group-hover:text-white group-hover:-translate-x-1">
            <ArrowLeft size={14} />
          </div>
        </div>
      </div>
    </Link>
  );
}
