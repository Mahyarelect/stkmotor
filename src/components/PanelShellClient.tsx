"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  Cog,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface AdminUser {
  name: string;
  role: string;
}

const NAV_ITEMS = [
  {
    href: "/panel/dashboard",
    label: "داشبورد",
    icon: LayoutDashboard,
  },
  {
    href: "/panel/families",
    label: "محصولات",
    icon: Package,
  },
  {
    href: "/panel/settings",
    label: "تنظیمات سایت",
    icon: Settings,
  },
];

export default function PanelShellClient({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => {
        if (!r.ok) throw new Error("Not authenticated");
        return r.json();
      })
      .then((data) => {
        setUser(data.user);
        setLoading(false);
      })
      .catch(() => {
        router.push("/panel");
      });
  }, [router]);

  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/panel");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Cog size={32} className="animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex" dir="rtl">
      {/* Sidebar Overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 right-0 z-50 flex h-dvh w-[min(18rem,calc(100vw-1rem))] flex-col overflow-hidden border-l border-gray-200 bg-white shadow-xl transform transition-transform lg:static lg:z-auto lg:h-screen lg:w-64 lg:translate-x-0 lg:shadow-none ${
          sidebarOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="h-16 shrink-0 flex items-center gap-3 px-5 border-b border-gray-100">
          <div className="w-9 h-9 bg-blue-700 rounded-lg flex items-center justify-center">
            <Cog size={18} className="text-white" />
          </div>
          <div className="min-w-0">
            <h2 dir="ltr" className="font-bold text-gray-900 text-sm whitespace-nowrap">STK Motors</h2>
            <p className="text-[10px] leading-5 text-gray-400 whitespace-nowrap">پنل مدیریت</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden mr-auto text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="min-h-0 flex-1 overflow-y-auto p-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <button
                key={item.href}
                onClick={() => {
                  router.push(item.href);
                  setSidebarOpen(false);
                }}
                className={`w-full min-h-11 shrink-0 flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm leading-6 font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <item.icon size={18} />
                {item.label}
                {isActive && (
                  <ChevronLeft size={14} className="mr-auto" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="shrink-0 border-t border-gray-100 bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
              <User size={14} className="text-gray-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">
                {user?.name || "ادمین"}
              </p>
              <p className="text-[10px] text-gray-400">
                {user?.role === "admin" ? "مدیر کل" : "ویرایشگر"}
              </p>
            </div>
          </div>
          <Separator className="mb-2" />
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="min-w-0 flex-1 whitespace-nowrap text-xs text-gray-500 hover:text-gray-700"
              onClick={() => router.push("/")}
            >
              مشاهده سایت
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="min-w-0 flex-1 whitespace-nowrap text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut size={14} className="ml-1" />
              خروج
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {/* Top Bar */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center px-4 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg ml-3"
          >
            <Menu size={20} />
          </button>

          <h2 className="text-sm font-semibold text-gray-800">
            {NAV_ITEMS.find((i) => i.href === pathname)?.label || "پنل مدیریت"}
          </h2>

          <div className="mr-auto flex items-center gap-2">
            <span className="text-xs text-gray-400">
              {user?.name || "ادمین"}
            </span>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
}
