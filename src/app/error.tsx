"use client";
import Link from "next/link";
import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) { useEffect(() => { console.error(error); }, [error]); return <main className="min-h-screen grid place-items-center bg-slate-50 px-4" dir="rtl"><div className="max-w-lg text-center rounded-3xl border bg-white p-10 shadow-sm"><AlertTriangle size={48} className="mx-auto text-amber-500" /><h1 className="text-2xl font-bold mt-5">مشکلی در نمایش صفحه پیش آمد</h1><p className="text-gray-500 mt-3 mb-7">لطفاً دوباره تلاش کنید. اگر مشکل ادامه داشت، از صفحه اصلی وارد شوید.</p><div className="flex justify-center gap-3"><Button onClick={reset}><RotateCcw size={16} className="ml-2" />تلاش مجدد</Button><Button asChild variant="outline"><Link href="/">صفحه اصلی</Link></Button></div></div></main>; }
