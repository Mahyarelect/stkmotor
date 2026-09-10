"use client";

import { useState } from "react";
import { Cog } from "lucide-react";
import { normalizeProductImageUrl } from "@/lib/product-image";

interface ProductImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  placeholderClassName?: string;
  iconSize?: number;
  loading?: "eager" | "lazy";
}

export function ProductImage({
  src,
  alt,
  className = "h-full w-full object-contain",
  placeholderClassName = "text-gray-300",
  iconSize = 40,
  loading = "lazy",
}: ProductImageProps) {
  const normalizedSrc = normalizeProductImageUrl(src);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const failed = Boolean(normalizedSrc && failedSrc === normalizedSrc);

  if (!normalizedSrc || failed) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center text-center">
        <Cog size={iconSize} className={`${placeholderClassName} mb-1`} />
        <p className="text-xs text-gray-400/70">تصویر محصول</p>
      </div>
    );
  }

  return (
    <img
      src={normalizedSrc}
      alt={alt}
      className={className}
      loading={loading}
      decoding="async"
      onError={() => setFailedSrc(normalizedSrc)}
    />
  );
}
