"use client";

import { useEffect, useState } from "react";

export interface LandingPageBrief {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  description?: string;
  bannerUrl?: string;
  ctaText?: string;
  ctaLink?: string;
  sortOrder: number;
  featuredFamilySlugs?: string;
}

export function useLandingPages() {
  const [landingPages, setLandingPages] = useState<LandingPageBrief[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch("/api/landing")
      .then((res) => (res.ok ? res.json() : { pages: [] }))
      .then((data) => {
        if (active && Array.isArray(data.pages)) {
          setLandingPages(data.pages);
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

  return { landingPages, loading };
}
