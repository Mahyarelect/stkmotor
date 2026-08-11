"use client";

import { useState, useEffect } from "react";
import {
  Package,
  Layers,
  Zap,
  Gauge,
  TrendingUp,
  BarChart3,
  ArrowLeftRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface DashboardStats {
  families: number;
  variants: number;
  singlePhaseFamilies: number;
  threePhaseFamilies: number;
  speeds: string[];
  sizes: string[];
  powerRanges: string[];
}

function faNum(n: number | string): string {
  return String(n).replace(
    /\d/g,
    (d) =>
      "\u06F0\u06F1\u06F2\u06F3\u06F4\u06F5\u06F6\u06F7\u06F8\u06F9"[
        parseInt(d)
      ]
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-5">
                <div className="h-4 bg-gray-200 rounded w-20 mb-3" />
                <div className="h-8 bg-gray-200 rounded w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const cards = [
    {
      label: "خانواده محصول",
      value: stats ? faNum(stats.families) : "-",
      icon: Package,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "واریانت (سایز)",
      value: stats ? faNum(stats.variants) : "-",
      icon: Layers,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "تک‌فاز",
      value: stats ? faNum(stats.singlePhaseFamilies) : "-",
      icon: Zap,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "سه‌فاز",
      value: stats ? faNum(stats.threePhaseFamilies) : "-",
      icon: Gauge,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">داشبورد</h1>
        <p className="text-sm text-gray-500 mt-1">
          نمای کلی از وضعیت کاتالوگ
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Card key={card.label} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-500 mb-1">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                </div>
                <div
                  className={`w-10 h-10 ${card.bg} rounded-lg flex items-center justify-center`}
                >
                  <card.icon size={20} className={card.color} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Details Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Speeds */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={16} className="text-blue-600" />
              <h3 className="font-semibold text-gray-800 text-sm">
                سرعت‌های موجود
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {(stats?.speeds || []).map((s) => (
                <span
                  key={s}
                  className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium num-en"
                >
                  {s} RPM
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Frame Sizes */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 size={16} className="text-emerald-600" />
              <h3 className="font-semibold text-gray-800 text-sm">
                سایز فریم‌ها
              </h3>
            </div>
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
              {(stats?.sizes || []).map((s) => (
                <span
                  key={s}
                  className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium num-en"
                >
                  {s}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <ArrowLeftRight size={16} className="text-gray-600" />
            <h3 className="font-semibold text-gray-800 text-sm">دسترسی سریع</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "مدیریت محصولات", href: "/panel/families", color: "bg-blue-700 hover:bg-blue-800" },
              { label: "افزودن محصول جدید", href: "/panel/families?action=new", color: "bg-emerald-600 hover:bg-emerald-700" },
              { label: "تنظیمات سایت", href: "/panel/settings", color: "bg-gray-700 hover:bg-gray-800" },
              { label: "مشاهده سایت", href: "/", color: "bg-amber-600 hover:bg-amber-700" },
            ].map((action) => (
              <a key={action.label} href={action.href}>
                <button
                  className={`w-full ${action.color} text-white text-sm font-medium py-3 px-4 rounded-lg transition-colors`}
                >
                  {action.label}
                </button>
              </a>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
