"use client";

import { useEffect, useState } from "react";
import { ArrowDownUp, FileSpreadsheet, History, Loader2, Percent, RefreshCw, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type PriceValue = number | string;
interface PriceChange { sku: string; productName: string; category: string; brand: string; oldPrice: PriceValue; newPrice: PriceValue; difference: PriceValue }
interface PriceLog { id: string; sku: string; productName: string; oldPrice: PriceValue; newPrice: PriceValue; source: string; adminName: string; createdAt: string }

const CATEGORY_LABELS: Record<string, string> = {
  electromotor: "الکتروموتور", gearbox: "گیربکس", pump: "پمپ", accessories: "قطعات و لوازم",
};

function formatPrice(value: PriceValue) {
  return `${new Intl.NumberFormat("fa-IR").format(Number(value))} تومان`;
}

function ChangesTable({ changes }: { changes: PriceChange[] }) {
  if (!changes.length) return <p className="py-8 text-center text-sm text-gray-500">تغییری برای نمایش وجود ندارد.</p>;
  return (
    <div className="max-h-[28rem] overflow-auto rounded-lg border">
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-gray-50">
          <TableRow><TableHead>SKU</TableHead><TableHead>محصول</TableHead><TableHead>قیمت فعلی</TableHead><TableHead>قیمت جدید</TableHead><TableHead>تغییر</TableHead></TableRow>
        </TableHeader>
        <TableBody>{changes.map((change) => (
          <TableRow key={change.sku}>
            <TableCell dir="ltr" className="font-mono text-xs">{change.sku}</TableCell>
            <TableCell className="max-w-56 truncate">{change.productName}</TableCell>
            <TableCell className="whitespace-nowrap">{formatPrice(change.oldPrice)}</TableCell>
            <TableCell className="whitespace-nowrap font-semibold text-blue-700">{formatPrice(change.newPrice)}</TableCell>
            <TableCell dir="ltr" className={Number(change.difference) >= 0 ? "text-emerald-600" : "text-red-600"}>
              {Number(change.difference) > 0 ? "+" : ""}{formatPrice(change.difference)}
            </TableCell>
          </TableRow>
        ))}</TableBody>
      </Table>
    </div>
  );
}

export default function PricingPage() {
  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [logs, setLogs] = useState<PriceLog[]>([]);
  const [bulk, setBulk] = useState({ adjustmentType: "percentage", value: "", category: "", brand: "", note: "" });
  const [bulkChanges, setBulkChanges] = useState<PriceChange[]>([]);
  const [importChanges, setImportChanges] = useState<PriceChange[]>([]);
  const [importSource, setImportSource] = useState<"csv" | "xlsx">("csv");
  const [importNotes, setImportNotes] = useState({ missing: [] as string[], invalid: [] as number[], duplicates: [] as string[], unchanged: 0 });
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/pricing");
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setCategories(result.categories);
      setBrands(result.brands);
      setLogs(result.logs);
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "دریافت اطلاعات ممکن نشد." });
    } finally { setLoading(false); }
  }

  useEffect(() => { void loadData(); }, []);

  async function previewBulk() {
    if (!bulk.value) return setMessage({ type: "error", text: "مقدار تغییر قیمت را وارد کنید." });
    setWorking(true); setMessage(null);
    try {
      const response = await fetch("/api/admin/pricing", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "bulk", action: "preview", ...bulk, value: Number(bulk.value) }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setBulkChanges(result.changes);
      setMessage({ type: "success", text: `پیش‌نمایش ${result.changes.length} تغییر از ${result.summary.matched} محصول آماده شد.` });
    } catch (error) { setMessage({ type: "error", text: error instanceof Error ? error.message : "پیش‌نمایش ممکن نشد." }); }
    finally { setWorking(false); }
  }

  async function applyBulk() {
    if (!bulkChanges.length || !window.confirm(`قیمت ${bulkChanges.length} محصول تغییر کند؟`)) return;
    setWorking(true); setMessage(null);
    try {
      const response = await fetch("/api/admin/pricing", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "bulk", action: "apply", ...bulk, value: Number(bulk.value) }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setBulkChanges([]);
      setMessage({ type: "success", text: `قیمت ${result.updated} محصول با موفقیت تغییر کرد.` });
      await loadData();
    } catch (error) { setMessage({ type: "error", text: error instanceof Error ? error.message : "ثبت تغییرات ممکن نشد." }); }
    finally { setWorking(false); }
  }

  async function previewFile(file?: File) {
    if (!file) return;
    setWorking(true); setMessage(null); setImportChanges([]);
    try {
      const formData = new FormData(); formData.append("file", file);
      const response = await fetch("/api/admin/pricing", { method: "POST", body: formData });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setImportSource(file.name.toLowerCase().endsWith(".xlsx") ? "xlsx" : "csv");
      setImportChanges(result.changes);
      setImportNotes({ missing: result.missingSkus, invalid: result.invalidRows, duplicates: result.duplicateSkus, unchanged: result.unchangedCount });
      setMessage({ type: "success", text: `${result.changes.length} تغییر از فایل شناسایی شد.` });
    } catch (error) { setMessage({ type: "error", text: error instanceof Error ? error.message : "خواندن فایل ممکن نشد." }); }
    finally { setWorking(false); }
  }

  async function applyImport() {
    if (!importChanges.length || !window.confirm(`${importChanges.length} تغییر فایل ثبت شود؟`)) return;
    setWorking(true); setMessage(null);
    try {
      const response = await fetch("/api/admin/pricing", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "import", action: "apply", source: importSource, changes: importChanges.map(({ sku, newPrice }) => ({ sku, newPrice })) }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setImportChanges([]);
      setMessage({ type: "success", text: `${result.updated} قیمت با موفقیت وارد شد.` });
      await loadData();
    } catch (error) { setMessage({ type: "error", text: error instanceof Error ? error.message : "ثبت فایل ممکن نشد." }); }
    finally { setWorking(false); }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-xl font-bold text-gray-900">مدیریت قیمت‌ها</h1><p className="mt-1 text-sm text-gray-500">پیش‌نمایش، تغییر گروهی و ثبت سابقه قیمت</p></div>
        <Button variant="outline" size="sm" onClick={() => void loadData()} disabled={loading}><RefreshCw size={14} className={loading ? "ml-1 animate-spin" : "ml-1"} />به‌روزرسانی</Button>
      </div>

      {message && <div role="alert" className={`rounded-lg border px-4 py-3 text-sm ${message.type === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>{message.text}</div>}

      <Tabs defaultValue="bulk" dir="rtl">
        <TabsList className="grid h-auto w-full max-w-xl grid-cols-3">
          <TabsTrigger value="bulk"><Percent size={15} className="ml-1" />تغییر گروهی</TabsTrigger>
          <TabsTrigger value="import"><FileSpreadsheet size={15} className="ml-1" />ورود فایل</TabsTrigger>
          <TabsTrigger value="history"><History size={15} className="ml-1" />سابقه</TabsTrigger>
        </TabsList>

        <TabsContent value="bulk" className="mt-4 space-y-4">
          <Card><CardHeader><CardTitle className="text-base">فیلتر و مقدار تغییر</CardTitle></CardHeader><CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div><Label>دسته‌بندی</Label><select value={bulk.category} onChange={(e) => { setBulk({ ...bulk, category: e.target.value }); setBulkChanges([]); }} className="mt-1 h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm"><option value="">همه دسته‌ها</option>{categories.map((category) => <option key={category} value={category}>{CATEGORY_LABELS[category] || category}</option>)}</select></div>
              <div><Label>برند</Label><select value={bulk.brand} onChange={(e) => { setBulk({ ...bulk, brand: e.target.value }); setBulkChanges([]); }} className="mt-1 h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm"><option value="">همه برندها</option>{brands.map((brand) => <option key={brand} value={brand}>{brand}</option>)}</select></div>
              <div><Label>نوع تغییر</Label><select value={bulk.adjustmentType} onChange={(e) => { setBulk({ ...bulk, adjustmentType: e.target.value }); setBulkChanges([]); }} className="mt-1 h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm"><option value="percentage">درصدی</option><option value="fixed">مبلغ ثابت (تومان)</option></select></div>
              <div><Label>مقدار</Label><Input className="mt-1" type="number" step={bulk.adjustmentType === "percentage" ? "0.1" : "1"} value={bulk.value} onChange={(e) => { setBulk({ ...bulk, value: e.target.value }); setBulkChanges([]); }} placeholder={bulk.adjustmentType === "percentage" ? "مثلاً 10 یا -5" : "مثلاً 50000"} dir="ltr" /></div>
            </div>
            <div><Label>یادداشت (اختیاری)</Label><Input className="mt-1 max-w-xl" value={bulk.note} onChange={(e) => setBulk({ ...bulk, note: e.target.value })} placeholder="علت تغییر قیمت" /></div>
            <Button onClick={() => void previewBulk()} disabled={working}>{working ? <Loader2 size={15} className="ml-1 animate-spin" /> : <ArrowDownUp size={15} className="ml-1" />}ساخت پیش‌نمایش</Button>
          </CardContent></Card>
          {bulkChanges.length > 0 && <Card><CardHeader className="flex-row items-center justify-between"><CardTitle className="text-base">پیش‌نمایش {bulkChanges.length} تغییر</CardTitle><Button onClick={() => void applyBulk()} disabled={working} className="bg-emerald-600 hover:bg-emerald-700">تأیید و ثبت</Button></CardHeader><CardContent><ChangesTable changes={bulkChanges} /></CardContent></Card>}
        </TabsContent>

        <TabsContent value="import" className="mt-4 space-y-4">
          <Card><CardContent className="pt-6">
            <label className={`flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-colors ${dragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-400"}`} onDragEnter={() => setDragging(true)} onDragLeave={() => setDragging(false)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); setDragging(false); void previewFile(event.dataTransfer.files[0]); }}>
              {working ? <Loader2 className="mb-3 animate-spin text-blue-600" /> : <UploadCloud className="mb-3 text-blue-600" size={32} />}
              <span className="font-medium">فایل CSV یا XLSX را اینجا رها کنید</span><span className="mt-1 text-xs text-gray-500">ستون‌های لازم: SKU و price — حداکثر ۵۰۰۰ ردیف و ۱۰ مگابایت</span>
              <input type="file" accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="hidden" onChange={(event) => void previewFile(event.target.files?.[0])} />
            </label>
          </CardContent></Card>
          {(importNotes.missing.length > 0 || importNotes.invalid.length > 0 || importNotes.duplicates.length > 0) && <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800"><p>SKU ناموجود: {importNotes.missing.length} · ردیف نامعتبر: {importNotes.invalid.length} · SKU تکراری: {importNotes.duplicates.length} · بدون تغییر: {importNotes.unchanged}</p></div>}
          {importChanges.length > 0 && <Card><CardHeader className="flex-row items-center justify-between"><CardTitle className="text-base">پیش‌نمایش {importChanges.length} تغییر</CardTitle><Button onClick={() => void applyImport()} disabled={working} className="bg-emerald-600 hover:bg-emerald-700">تأیید و ورود قیمت‌ها</Button></CardHeader><CardContent><ChangesTable changes={importChanges} /></CardContent></Card>}
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card><CardHeader><CardTitle className="text-base">۱۰۰ تغییر اخیر</CardTitle></CardHeader><CardContent>{loading ? <Loader2 className="mx-auto animate-spin text-blue-600" /> : logs.length === 0 ? <p className="py-8 text-center text-sm text-gray-500">هنوز تغییری ثبت نشده است.</p> : <div className="overflow-auto rounded-lg border"><Table><TableHeader><TableRow><TableHead>زمان</TableHead><TableHead>SKU</TableHead><TableHead>محصول</TableHead><TableHead>قبل</TableHead><TableHead>بعد</TableHead><TableHead>روش / مدیر</TableHead></TableRow></TableHeader><TableBody>{logs.map((log) => <TableRow key={log.id}><TableCell className="whitespace-nowrap text-xs">{new Date(log.createdAt).toLocaleString("fa-IR")}</TableCell><TableCell dir="ltr" className="font-mono text-xs">{log.sku}</TableCell><TableCell>{log.productName}</TableCell><TableCell>{formatPrice(log.oldPrice)}</TableCell><TableCell className="font-semibold">{formatPrice(log.newPrice)}</TableCell><TableCell className="text-xs">{log.source}<br />{log.adminName}</TableCell></TableRow>)}</TableBody></Table></div>}</CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
