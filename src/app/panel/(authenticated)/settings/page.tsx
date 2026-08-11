"use client";

import { useState, useEffect } from "react";
import {
  Phone,
  Mail,
  MapPin,
  Instagram,
  Send,
  Globe,
  Save,
  Loader2,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface Setting {
  id: string;
  key: string;
  value: string;
  label: string;
  group: string;
}

const SETTING_DEFINITIONS = [
  { key: "site_name", label: "نام سایت", group: "general", placeholder: "STK Motors", icon: Globe },
  { key: "site_description", label: "توضیحات سایت", group: "general", placeholder: "کاتالوگ الکتروموتور STK", icon: Globe },
  { key: "phone", label: "شماره تماس", group: "contact", placeholder: "021-1234-5678", icon: Phone },
  { key: "mobile", label: "شماره موبایل", group: "contact", placeholder: "0912-345-6789", icon: Phone },
  { key: "email", label: "ایمیل", group: "contact", placeholder: "info@stkmotors.com", icon: Mail },
  { key: "address", label: "آدرس", group: "contact", placeholder: "تهران، ایران", icon: MapPin },
  { key: "instagram", label: "آدرس اینستاگرام", group: "social", placeholder: "https://instagram.com/stkmotors", icon: Instagram },
  { key: "telegram", label: "آدرس تلگرام", group: "social", placeholder: "https://t.me/stkmotors", icon: Send },
  { key: "whatsapp", label: "شماره واتساپ", group: "social", placeholder: "982112345678", icon: Send },
];

const GROUP_LABELS: Record<string, string> = {
  general: "اطلاعات کلی",
  contact: "اطلاعات تماس",
  social: "شبکه‌های اجتماعی",
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Local edit state
  const [values, setValues] = useState<Record<string, string>>({});

  async function fetchSettings() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings");
      if (res.ok) {
        const data: Setting[] = await res.json();
        setSettings(data);
        const v: Record<string, string> = {};
        data.forEach((s) => {
          v[s.key] = s.value;
        });
        setValues(v);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  useEffect(() => {
    (async () => { await fetchSettings(); })();
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const payload = SETTING_DEFINITIONS.map((def) => ({
        key: def.key,
        value: values[def.key] || "",
        label: def.label,
        group: def.group,
      }));

      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        alert("خطا در ذخیره");
      }
    } catch {
      alert("خطا در ارتباط با سرور");
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-5">
              <div className="h-4 bg-gray-200 rounded w-32 mb-3" />
              <div className="h-8 bg-gray-100 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const groups = [...new Set(SETTING_DEFINITIONS.map((d) => d.group))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">تنظیمات سایت</h1>
          <p className="text-sm text-gray-500 mt-1">
            مدیریت اطلاعات و تنظیمات کاتالوگ
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-700 hover:bg-blue-800 text-white"
        >
          {saving ? (
            <Loader2 size={16} className="animate-spin" />
          ) : saved ? (
            <Check size={16} className="ml-1" />
          ) : (
            <Save size={16} className="ml-1" />
          )}
          {saving ? "در حال ذخیره..." : saved ? "ذخیره شد!" : "ذخیره تغییرات"}
        </Button>
      </div>

      {/* Settings Groups */}
      {groups.map((group) => {
        const defs = SETTING_DEFINITIONS.filter((d) => d.group === group);
        return (
          <Card key={group}>
            <CardContent className="p-5">
              <h2 className="font-semibold text-gray-800 text-sm mb-4">
                {GROUP_LABELS[group]}
              </h2>
              <div className="space-y-4">
                {defs.map((def, idx) => (
                  <div key={def.key}>
                    {idx > 0 && <Separator className="mb-4" />}
                    <div className="flex items-start gap-4">
                      <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                        <def.icon size={16} className="text-gray-500" />
                      </div>
                      <div className="flex-1">
                        <Label className="text-xs text-gray-600">
                          {def.label}
                        </Label>
                        <Input
                          value={values[def.key] || ""}
                          onChange={(e) =>
                            setValues({ ...values, [def.key]: e.target.value })
                          }
                          placeholder={def.placeholder}
                          className="mt-1"
                          dir={
                            ["email", "instagram", "telegram"].includes(def.key)
                              ? "ltr"
                              : undefined
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
