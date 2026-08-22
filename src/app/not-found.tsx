import Link from "next/link";
import { Home, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

export default function NotFound() { return <div className="min-h-screen flex flex-col" dir="rtl"><SiteHeader /><main className="flex-1 grid place-items-center px-4 py-20 bg-slate-50"><div className="text-center"><p className="text-8xl font-black text-blue-100">۴۰۴</p><h1 className="text-2xl font-bold mt-2">صفحه مورد نظر پیدا نشد</h1><p className="text-gray-500 mt-3 mb-7">آدرس را بررسی کنید یا از کاتالوگ محصولات جستجو را ادامه دهید.</p><div className="flex justify-center gap-3"><Button asChild><Link href="/"><Home size={16} className="ml-2" />صفحه اصلی</Link></Button><Button asChild variant="outline"><Link href="/#products"><Search size={16} className="ml-2" />جستجوی محصولات</Link></Button></div></div></main><SiteFooter /></div>; }
