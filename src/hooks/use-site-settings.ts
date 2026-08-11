"use client";

import { useEffect, useState } from "react";

export interface PublicSiteSettings {
  site_name: string;
  site_description: string;
  phone: string;
  mobile: string;
  email: string;
  address: string;
  instagram: string;
  telegram: string;
  whatsapp: string;
}

export const DEFAULT_SITE_SETTINGS: PublicSiteSettings = {
  site_name: "STK Motors",
  site_description: "کاتالوگ الکتروموتور STK",
  phone: "021-1234-5678",
  mobile: "0912-345-6789",
  email: "info@stkmotors.com",
  address: "تهران، ایران",
  instagram: "https://instagram.com/stkmotors",
  telegram: "https://t.me/stkmotors",
  whatsapp: "982112345678",
};

export function useSiteSettings() {
  const [settings, setSettings] = useState<PublicSiteSettings>(DEFAULT_SITE_SETTINGS);

  useEffect(() => {
    let active = true;
    fetch("/api/settings")
      .then((response) => (response.ok ? response.json() : {}))
      .then((data) => {
        if (active) setSettings((current) => ({ ...current, ...data }));
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, []);

  return settings;
}

export function telHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export function whatsappHref(phone: string) {
  return `https://wa.me/${phone.replace(/[^\d]/g, "")}`;
}
