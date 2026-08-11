import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "پنل مدیریت | STK Motors",
  description: "پنل مدیریت کاتالوگ الکتروموتور STK",
  robots: { index: false, follow: false, noarchive: true },
};

export default function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50" dir="rtl" lang="fa">
      {children}
    </div>
  );
}
