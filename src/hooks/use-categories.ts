"use client";

import { useEffect, useState } from "react";
import { DEFAULT_CATEGORY_IMAGES, getCategoryDefaultImage, getSubcategoryDefaultImage } from "@/data/categoryImages";

export interface CategoryData {
  id: string;
  slug: string;
  name: string;
  nameEn: string;
  description: string;
  icon: string;
  imageUrl: string;
  hasCustomImage: boolean;
  sortOrder: number;
}

export function useCategories() {
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [subCatImages, setSubCatImages] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch("/api/categories")
      .then((res) => (res.ok ? res.json() : { categories: [], subCatImages: {} }))
      .then((data) => {
        if (active) {
          if (Array.isArray(data.categories)) {
            setCategories(data.categories);
          }
          if (data.subCatImages && typeof data.subCatImages === "object") {
            setSubCatImages(data.subCatImages);
          }
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const getCategoryImage = (slug: string): string => {
    const found = categories.find((c) => c.slug === slug);
    return found?.imageUrl || getCategoryDefaultImage(slug);
  };

  const getSubCategoryImage = (categorySlug: string, subCategorySlug: string): string => {
    const custom = subCatImages[subCategorySlug];
    if (custom === "__NONE__") {
      return "";
    }
    if (custom) {
      return custom;
    }
    return getSubcategoryDefaultImage(categorySlug, subCategorySlug);
  };

  return {
    categories,
    subCatImages,
    loading,
    getCategoryImage,
    getSubCategoryImage,
    getSubcategoryDefaultImage,
  };
}
