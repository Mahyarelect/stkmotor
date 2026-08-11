import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "STK Motors | کاتالوگ الکتروموتور پوسته چدنی",
  description:
    "کاتالوگ فنی الکتروموتور STK - معرفی مدل‌های تک‌فاز و سه‌فاز پوسته چدنی، سایزها و مشخصات فنی",
  keywords: [
    "الکتروموتور",
    "موتور الکتریکی",
    "موتور تک فاز",
    "موتور سه فاز",
    "پوسته چدنی",
    "STK Motors",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="antialiased bg-white text-gray-900"
        style={{ fontFamily: "Vazirmatn, sans-serif" }}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
