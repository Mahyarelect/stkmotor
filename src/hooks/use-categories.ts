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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch("/api/categories")
      .then((res) => (res.ok ? res.json() : { categories: [] }))
      .then((data) => {
        if (active && Array.isArray(data.categories)) {
          setCategories(data.categories);
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

  return { categories, loading, getCategoryImage, getSubcategoryDefaultImage };
}
