import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "STK Motors | تجهیزات صنعتی، الکتروموتور، گیربکس و پمپ",
  description:
    "کاتالوگ فنی تجهیزات صنعتی STK شامل الکتروموتور، گیربکس، پمپ و لوازم جانبی با مشخصات فنی و استعلام قیمت",
  keywords: [
    "الکتروموتور",
    "موتور الکتریکی",
    "موتور تک فاز",
    "موتور سه فاز",
    "پوسته چدنی",
    "STK Motors",
    "گیربکس صنعتی",
    "پمپ صنعتی",
    "لوازم جانبی الکتروموتور",
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
