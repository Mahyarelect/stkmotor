"use client";

import { useState, useEffect, useMemo, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  Check,
  Loader2,
  Package,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Search,
  Zap,
  Gauge,
  Sliders,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProductImage } from "@/components/ProductImage";

/* ─────────────────────────────────────────────────────────────
 * Types
 * ───────────────────────────────────────────────────────────── */
interface Variant {
  id: string;
  sku: string;
  name: string;
  size: string;
  power: string;
  powerKw: number;
  speed: string;
  mountingType: string;
  gearboxType: string;
  modelType: string;
  ratio: string;
  inputFrame: string;
  inputType: string;
  pumpType: string;
  outletSize: string;
  headMeter: number;
  floater: string;
  brand: string;
  bodyMaterial: string;
  flangeType: string;
  flangeLength: string;
  price: number;
  weight: string;
  dimensions: string;
  inStock: boolean;
  sortOrder: number;
}

interface Family {
  id: string;
  slug: string;
  name: string;
  nameEn: string;
  mainCategory: string;
  category: string;
  subCategory: string;
  phase: string;
  shellType: string;
  brand: string;
  level1Value: string;
  level2Value: string;
  description: string;
  imageUrl: string;
  sortOrder: number;
  variants: Variant[];
}

function formatPrice(price: number): string {
  if (!price || price === 0) return "تماس بگیرید / استعلام";
  return new Intl.NumberFormat("fa-IR").format(price) + " تومان";
}

const EMPTY_VARIANT = {
  id: "",
  sku: "",
  name: "",
  size: "",
  power: "",
  powerKw: 0,
  speed: "1400",
  mountingType: "B3",
  gearboxType: "",
  modelType: "",
  ratio: "",
  inputFrame: "",
  inputType: "",
  pumpType: "",
  outletSize: "",
  headMeter: 0,
  floater: "ساده",
  brand: "",
  bodyMaterial: "",
  flangeType: "",
  flangeLength: "استاندارد",
  price: 0,
  weight: "",
  dimensions: "",
  inStock: true,
  sortOrder: 0,
};

export default function FamilyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const familyId = resolvedParams.id;
  const router = useRouter();

  const [family, setFamily] = useState<Family | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingFamily, setSavingFamily] = useState(false);
  const [savingVariant, setSavingVariant] = useState(false);
  const [variantSearch, setVariantSearch] = useState("");

  // Edit Family Modal State
  const [editFamilyOpen, setEditFamilyOpen] = useState(false);
  const [familyForm, setFamilyForm] = useState({
    slug: "",
    name: "",
    nameEn: "",
    mainCategory: "electromotor",
    category: "single-phase",
    subCategory: "",
    phase: "تک‌فاز",
    shellType: "چدنی",
    brand: "STK",
    level1Value: "",
    level2Value: "",
    description: "",
    imageUrl: "",
    sortOrder: 0,
  });

  // Variant Modal State (Create / Edit)
  const [variantDialogOpen, setVariantDialogOpen] = useState(false);
  const [variantForm, setVariantForm] = useState(EMPTY_VARIANT);
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);

  // Delete Variant State
  const [deleteVariantConfirm, setDeleteVariantConfirm] = useState<Variant | null>(null);
  const [deletingVariant, setDeletingVariant] = useState(false);

  async function fetchFamily() {
    try {
      const res = await fetch(`/api/admin/families/${familyId}`);
      if (res.ok) {
        const data = await res.json();
        setFamily(data);
        setFamilyForm({
          slug: data.slug || "",
          name: data.name || "",
          nameEn: data.nameEn || "",
          mainCategory: data.mainCategory || "electromotor",
          category: data.category || "",
          subCategory: data.subCategory || "",
          phase: data.phase || "",
          shellType: data.shellType || "",
          brand: data.brand || "",
          level1Value: data.level1Value || "",
          level2Value: data.level2Value || "",
          description: data.description || "",
          imageUrl: data.imageUrl || "",
          sortOrder: data.sortOrder || 0,
        });
      } else {
        router.push("/panel/families");
      }
    } catch {
      router.push("/panel/families");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchFamily();
  }, [familyId]);

  // Filtered variants
  const filteredVariants = useMemo(() => {
    if (!family) return [];
    if (!variantSearch.trim()) return family.variants;
    const q = variantSearch.trim().toLowerCase();
    return family.variants.filter(
      (v) =>
        v.sku.toLowerCase().includes(q) ||
        (v.name || "").toLowerCase().includes(q) ||
        (v.size || "").toLowerCase().includes(q) ||
        (v.power || "").toLowerCase().includes(q) ||
        (v.speed || "").toLowerCase().includes(q) ||
        (v.ratio || "").toLowerCase().includes(q) ||
        (v.modelType || "").toLowerCase().includes(q) ||
        (v.mountingType || "").toLowerCase().includes(q)
    );
  }, [family, variantSearch]);

  // Save Family
  async function handleSaveFamily(e: React.FormEvent) {
    e.preventDefault();
    setSavingFamily(true);
    try {
      const res = await fetch(`/api/admin/families/${familyId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(familyForm),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "خطا در بروزرسانی مشخصات محصول");
        setSavingFamily(false);
        return;
      }

      await fetchFamily();
      setEditFamilyOpen(false);
    } catch {
      alert("خطا در برقراری ارتباط با سرور");
    }
    setSavingFamily(false);
  }

  // Open Create Variant Modal
  function handleOpenCreateVariant() {
    setEditingVariantId(null);
    setVariantForm({
      ...EMPTY_VARIANT,
      brand: family?.brand || "STK",
      bodyMaterial: family?.shellType === "چدنی" ? "چدن" : "آلومینیوم",
      sortOrder: (family?.variants?.length || 0) + 1,
    });
    setVariantDialogOpen(true);
  }

  // Open Edit Variant Modal
  function handleOpenEditVariant(v: Variant) {
    setEditingVariantId(v.id);
    setVariantForm({
      id: v.id,
      sku: v.sku,
      name: v.name || "",
      size: v.size || "",
      power: v.power || "",
      powerKw: v.powerKw || 0,
      speed: v.speed || "",
      mountingType: v.mountingType || "",
      gearboxType: v.gearboxType || "",
      modelType: v.modelType || "",
      ratio: v.ratio || "",
      inputFrame: v.inputFrame || "",
      inputType: v.inputType || "",
      pumpType: v.pumpType || "",
      outletSize: v.outletSize || "",
      headMeter: v.headMeter || 0,
      floater: v.floater || "ساده",
      brand: v.brand || "",
      bodyMaterial: v.bodyMaterial || "",
      flangeType: v.flangeType || "",
      flangeLength: v.flangeLength || "استاندارد",
      price: v.price || 0,
      weight: v.weight || "",
      dimensions: v.dimensions || "",
      inStock: v.inStock !== false,
      sortOrder: v.sortOrder || 0,
    });
    setVariantDialogOpen(true);
  }

  // Save Variant (Create / Update)
  async function handleSaveVariant(e: React.FormEvent) {
    e.preventDefault();
    if (!variantForm.sku.trim()) {
      alert("کد محصول (SKU) الزامی است.");
      return;
    }

    setSavingVariant(true);
    try {
      const url = editingVariantId
        ? `/api/admin/variants/${editingVariantId}`
        : "/api/admin/variants";
      const method = editingVariantId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...variantForm,
          familyId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "خطا در ذخیره‌سازی واریانت");
        setSavingVariant(false);
        return;
      }

      await fetchFamily();
      setVariantDialogOpen(false);
    } catch {
      alert("خطا در برقراری ارتباط با سرور");
    }
    setSavingVariant(false);
  }

  // Quick Toggle inStock
  async function handleToggleStock(v: Variant) {
    try {
      const updatedStock = !v.inStock;
      // Optimistic update
      setFamily((prev) =>
        prev
          ? {
              ...prev,
              variants: prev.variants.map((item) =>
                item.id === v.id ? { ...item, inStock: updatedStock } : item
              ),
            }
          : prev
      );

      await fetch(`/api/admin/variants/${v.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inStock: updatedStock }),
      });
    } catch (err) {
      console.error("Toggle stock error:", err);
      await fetchFamily();
    }
  }

  // Delete Variant
  async function handleDeleteVariant() {
    if (!deleteVariantConfirm) return;
    setDeletingVariant(true);
    try {
      const res = await fetch(`/api/admin/variants/${deleteVariantConfirm.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDeleteVariantConfirm(null);
        await fetchFamily();
      } else {
        const data = await res.json();
        alert(data.error || "خطا در حذف واریانت");
      }
    } catch {
      alert("خطا در برقراری ارتباط با سرور");
    }
    setDeletingVariant(false);
  }

  if (loading) {
    return (
      <div className="py-24 text-center bg-white rounded-2xl border border-gray-100 max-w-7xl mx-auto">
        <Loader2 size={36} className="animate-spin text-blue-600 mx-auto mb-3" />
        <p className="text-sm text-gray-500">در حال بارگذاری جزئیات محصول...</p>
      </div>
    );
  }

  if (!family) return null;

  const inStockCount = family.variants.filter((v) => v.inStock).length;
  const outOfStockCount = family.variants.length - inStockCount;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ─── Header & Breadcrumb ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/panel/families")}
            className="h-9 w-9 p-0 rounded-xl"
            title="بازگشت به لیست محصولات"
          >
            <ArrowRight size={16} />
          </Button>

          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                {family.mainCategory === "electromotor"
                  ? "الکتروموتور"
                  : family.mainCategory === "gearbox"
                  ? "گیربکس"
                  : family.mainCategory === "pump"
                  ? "پمپ"
                  : "لوازم جانبی"}
              </Badge>
              {family.brand && (
                <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-700">
                  {family.brand}
                </Badge>
              )}
            </div>
            <h1 className="text-xl font-bold text-gray-900">{family.name}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/product/${family.slug}`)}
            className="h-9 text-xs text-gray-700 gap-1.5 rounded-xl"
          >
            <ExternalLink size={14} />
            مشاهده در سایت
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditFamilyOpen(true)}
            className="h-9 text-xs text-blue-700 border-blue-200 hover:bg-blue-50 gap-1.5 rounded-xl"
          >
            <Pencil size={14} />
            ویرایش مشخصات خانواده
          </Button>
          <Button
            onClick={handleOpenCreateVariant}
            size="sm"
            className="h-9 text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1.5 rounded-xl"
          >
            <Plus size={15} />
            واریانت جدید
          </Button>
        </div>
      </div>

      {/* ─── Product Overview & Stats Card ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Family Summary Card */}
        <Card className="lg:col-span-3 bg-white border-gray-200 rounded-2xl overflow-hidden shadow-xs">
          <CardContent className="p-5">
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <div className="w-24 h-24 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center p-2 shrink-0 overflow-hidden">
                <ProductImage
                  src={family.imageUrl}
                  alt={family.name}
                  className="object-contain w-full h-full"
                  iconSize={32}
                />
              </div>

              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600">
                  <span>
                    نام انگلیسی: <bdi className="num-en text-gray-800 font-medium">{family.nameEn || "-"}</bdi>
                  </span>
                  <span>·</span>
                  <span>
                    اسلاگ: <code className="bg-gray-100 px-1.5 py-0.5 rounded num-en">{family.slug}</code>
                  </span>
                  <span>·</span>
                  <span>
                    اولویت: <span className="font-semibold num-en">{family.sortOrder}</span>
                  </span>
                </div>

                {/* Specs Tags */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {family.phase && (
                    <Badge variant="outline" className="text-xs bg-slate-50 text-slate-700">
                      فاز: {family.phase}
                    </Badge>
                  )}
                  {family.shellType && (
                    <Badge variant="outline" className="text-xs bg-slate-50 text-slate-700">
                      پوسته: {family.shellType}
                    </Badge>
                  )}
                  {family.level1Value && (
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                      {family.level1Value}
                    </Badge>
                  )}
                  {family.level2Value && (
                    <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                      {family.level2Value}
                    </Badge>
                  )}
                </div>

                {family.description && (
                  <p className="text-xs text-gray-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    {family.description}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats Panel */}
        <Card className="bg-white border-gray-200 rounded-2xl shadow-xs flex flex-col justify-between">
          <CardContent className="p-5 space-y-3">
            <h3 className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
              <Sliders size={14} className="text-blue-600" />
              وضعیت واریانت‌ها
            </h3>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50 text-xs">
                <span className="text-gray-500">کل واریانت‌ها:</span>
                <span className="font-bold text-gray-900 num-en">{family.variants.length}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50/70 text-xs">
                <span className="text-emerald-700 font-medium">موجود در کاتالوگ:</span>
                <span className="font-bold text-emerald-800 num-en">{inStockCount}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-orange-50/70 text-xs">
                <span className="text-orange-700 font-medium">نیازمند استعلام:</span>
                <span className="font-bold text-orange-800 num-en">{outOfStockCount}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── VARIANTS MANAGEMENT TABLE ─── */}
      <Card className="bg-white border-gray-200 rounded-2xl shadow-xs overflow-hidden">
        <CardContent className="p-5 space-y-4">
          {/* Table Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Package size={18} className="text-blue-600" />
                لیست سایزها و مدل‌های فنی (واریانت‌ها)
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                برای تغییر وضعیت موجودی می‌توانید روی دکمه موجود/استعلام در جدول کلیک کنید.
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <Input
                value={variantSearch}
                onChange={(e) => setVariantSearch(e.target.value)}
                placeholder="جستجو در SKU، سایز، توان، دور..."
                className="pr-9 h-9 text-xs bg-gray-50 border-gray-200"
              />
            </div>
          </div>

          {filteredVariants.length === 0 ? (
            <div className="py-12 text-center border border-dashed border-gray-200 rounded-xl">
              <Package size={36} className="text-gray-300 mx-auto mb-2" />
              <p className="text-xs text-gray-400">
                {variantSearch ? "موردی با جستجوی شما یافت نشد." : "هنوز هیچ واریانتی برای این محصول ثبت نشده است."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <Table className="text-xs">
                <TableHeader className="bg-gray-50/80">
                  <TableRow>
                    <TableHead className="text-right font-bold">کد محصول (SKU)</TableHead>
                    <TableHead className="text-right font-bold">سایز / فریم</TableHead>
                    {family.mainCategory === "electromotor" && (
                      <>
                        <TableHead className="text-right font-bold">توان (HP / kW)</TableHead>
                        <TableHead className="text-right font-bold">دور (RPM)</TableHead>
                        <TableHead className="text-right font-bold">نوع نصب</TableHead>
                      </>
                    )}
                    {family.mainCategory === "gearbox" && (
                      <>
                        <TableHead className="text-right font-bold">مدل / سری</TableHead>
                        <TableHead className="text-right font-bold">نسبت تبدیل</TableHead>
                        <TableHead className="text-right font-bold">فریم ورودی</TableHead>
                      </>
                    )}
                    {family.mainCategory === "pump" && (
                      <>
                        <TableHead className="text-right font-bold">سایز خروجی</TableHead>
                        <TableHead className="text-right font-bold">هد (متر)</TableHead>
                        <TableHead className="text-right font-bold">فلوتر</TableHead>
                      </>
                    )}
                    {family.mainCategory === "accessories" && (
                      <>
                        <TableHead className="text-right font-bold">نوع قطعه</TableHead>
                        <TableHead className="text-right font-bold">جنس بدنه</TableHead>
                        <TableHead className="text-right font-bold">طول فلنج</TableHead>
                      </>
                    )}
                    <TableHead className="text-right font-bold">قیمت (تومان)</TableHead>
                    <TableHead className="text-center font-bold">وضعیت موجودی</TableHead>
                    <TableHead className="text-left font-bold pl-4">عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVariants.map((v) => (
                    <TableRow key={v.id} className="hover:bg-blue-50/30 transition-colors">
                      {/* SKU */}
                      <TableCell className="font-mono font-semibold text-blue-700 num-en">
                        {v.sku}
                      </TableCell>

                      {/* Size */}
                      <TableCell className="font-medium num-en">{v.size || "-"}</TableCell>

                      {/* Electromotor specs */}
                      {family.mainCategory === "electromotor" && (
                        <>
                          <TableCell className="num-en font-medium">{v.power || `${v.powerKw}kW` || "-"}</TableCell>
                          <TableCell className="num-en">{v.speed ? `${v.speed} RPM` : "-"}</TableCell>
                          <TableCell className="num-en">
                            <Badge variant="outline" className="text-[10px]">
                              {v.mountingType || "B3"}
                            </Badge>
                          </TableCell>
                        </>
                      )}

                      {/* Gearbox specs */}
                      {family.mainCategory === "gearbox" && (
                        <>
                          <TableCell className="num-en">{v.modelType || "-"}</TableCell>
                          <TableCell className="num-en font-bold text-blue-600">{v.ratio ? `1:${v.ratio}` : "-"}</TableCell>
                          <TableCell className="num-en">{v.inputFrame || "-"}</TableCell>
                        </>
                      )}

                      {/* Pump specs */}
                      {family.mainCategory === "pump" && (
                        <>
                          <TableCell className="num-en">{v.outletSize || "-"}</TableCell>
                          <TableCell className="num-en font-semibold">{v.headMeter ? `${v.headMeter}m` : "-"}</TableCell>
                          <TableCell>{v.floater || "ساده"}</TableCell>
                        </>
                      )}

                      {/* Accessories specs */}
                      {family.mainCategory === "accessories" && (
                        <>
                          <TableCell>{v.flangeType || "-"}</TableCell>
                          <TableCell>{v.bodyMaterial || "-"}</TableCell>
                          <TableCell>{v.flangeLength || "استاندارد"}</TableCell>
                        </>
                      )}

                      {/* Price */}
                      <TableCell className="font-semibold text-gray-800 num-en">
                        {formatPrice(v.price)}
                      </TableCell>

                      {/* inStock toggle button */}
                      <TableCell className="text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStock(v)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                            v.inStock
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              : "bg-orange-100 text-orange-800 hover:bg-orange-200"
                          }`}
                          title="کلیک برای تغییر وضعیت موجودی"
                        >
                          {v.inStock ? (
                            <>
                              <CheckCircle2 size={12} />
                              موجود
                            </>
                          ) : (
                            <>
                              <AlertCircle size={12} />
                              استعلام
                            </>
                          )}
                        </button>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-left pl-4">
                        <div className="flex items-center gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEditVariant(v)}
                            className="h-7 w-7 p-0 text-gray-600 hover:text-blue-600 rounded-lg"
                            title="ویرایش واریانت"
                          >
                            <Pencil size={13} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteVariantConfirm(v)}
                            className="h-7 w-7 p-0 text-gray-400 hover:text-red-600 rounded-lg"
                            title="حذف واریانت"
                          >
                            <Trash2 size={13} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── EDIT FAMILY MODAL ─── */}
      <Dialog open={editFamilyOpen} onOpenChange={setEditFamilyOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Pencil className="text-blue-600" size={18} />
              ویرایش اطلاعات خانواده محصول
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveFamily} className="space-y-4 mt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">نام فارسی محصول *</Label>
                <Input
                  value={familyForm.name}
                  onChange={(e) => setFamilyForm({ ...familyForm, name: e.target.value })}
                  required
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">نام انگلیسی (Name En)</Label>
                <Input
                  value={familyForm.nameEn}
                  onChange={(e) => setFamilyForm({ ...familyForm, nameEn: e.target.value })}
                  className="h-9 text-xs text-left num-en"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">شناسه یکتا (Slug) *</Label>
                <Input
                  value={familyForm.slug}
                  onChange={(e) =>
                    setFamilyForm({
                      ...familyForm,
                      slug: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, "-"),
                    })
                  }
                  required
                  className="h-9 text-xs text-left num-en"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">برند محصول</Label>
                <Input
                  value={familyForm.brand}
                  onChange={(e) => setFamilyForm({ ...familyForm, brand: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            {/* Category specific fields */}
            {family.mainCategory === "electromotor" && (
              <div className="grid grid-cols-2 gap-3 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">تعداد فاز</Label>
                  <select
                    value={familyForm.phase}
                    onChange={(e) => setFamilyForm({ ...familyForm, phase: e.target.value })}
                    className="w-full h-9 rounded-md border border-input bg-white px-3 py-1 text-xs"
                  >
                    <option value="تک‌فاز">تک‌فاز (Single Phase)</option>
                    <option value="سه‌فاز">سه‌فاز (Three Phase)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">جنس پوسته بدنه</Label>
                  <select
                    value={familyForm.shellType}
                    onChange={(e) => setFamilyForm({ ...familyForm, shellType: e.target.value })}
                    className="w-full h-9 rounded-md border border-input bg-white px-3 py-1 text-xs"
                  >
                    <option value="چدنی">پوسته چدنی</option>
                    <option value="آلومینیومی">پوسته آلومینیومی</option>
                  </select>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">آدرس تصویر (Image URL)</Label>
                <Input
                  value={familyForm.imageUrl}
                  onChange={(e) => setFamilyForm({ ...familyForm, imageUrl: e.target.value })}
                  className="h-9 text-xs text-left num-en"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">اولویت نمایش (Sort Order)</Label>
                <Input
                  type="number"
                  value={familyForm.sortOrder}
                  onChange={(e) => setFamilyForm({ ...familyForm, sortOrder: Number(e.target.value) })}
                  className="h-9 text-xs num-en"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">توضیحات محصول</Label>
              <Textarea
                value={familyForm.description}
                onChange={(e) => setFamilyForm({ ...familyForm, description: e.target.value })}
                rows={3}
                className="text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditFamilyOpen(false)}
                disabled={savingFamily}
              >
                انصراف
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={savingFamily}
              >
                {savingFamily && <Loader2 size={14} className="animate-spin ml-1.5" />}
                ذخیره تغییرات
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── ADD / EDIT VARIANT MODAL ─── */}
      <Dialog open={variantDialogOpen} onOpenChange={setVariantDialogOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Package className="text-blue-600" size={18} />
              {editingVariantId ? "ویرایش واریانت محصول" : "افزودن واریانت / سایز جدید"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveVariant} className="space-y-4 mt-2">
            {/* Core SKU and Size */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">کد یکتای محصول (SKU) *</Label>
                <Input
                  value={variantForm.sku}
                  onChange={(e) => setVariantForm({ ...variantForm, sku: e.target.value.toUpperCase() })}
                  placeholder="مثال: 10100035 یا STK-1400-1HP"
                  required
                  className="h-9 text-xs font-mono text-left num-en"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">سایز / فریم بدنه</Label>
                <Input
                  value={variantForm.size}
                  onChange={(e) => setVariantForm({ ...variantForm, size: e.target.value })}
                  placeholder="مثال: 80, 90, 100, 112"
                  className="h-9 text-xs num-en"
                />
              </div>
            </div>

            {/* Category specific fields */}
            {family.mainCategory === "electromotor" && (
              <div className="grid grid-cols-3 gap-3 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">توان اسمی (HP)</Label>
                  <Input
                    value={variantForm.power}
                    onChange={(e) => setVariantForm({ ...variantForm, power: e.target.value })}
                    placeholder="مثال: 1HP یا 0.75kW"
                    className="h-9 text-xs bg-white num-en"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">توان معادل (kW)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={variantForm.powerKw}
                    onChange={(e) => setVariantForm({ ...variantForm, powerKw: Number(e.target.value) })}
                    placeholder="0.75"
                    className="h-9 text-xs bg-white num-en"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">سرعت اسمی (RPM)</Label>
                  <Input
                    value={variantForm.speed}
                    onChange={(e) => setVariantForm({ ...variantForm, speed: e.target.value })}
                    placeholder="1400 یا 3000"
                    className="h-9 text-xs bg-white num-en"
                  />
                </div>
                <div className="space-y-1.5 col-span-3">
                  <Label className="text-xs font-semibold">نوع نصب (Mounting Type)</Label>
                  <select
                    value={variantForm.mountingType}
                    onChange={(e) => setVariantForm({ ...variantForm, mountingType: e.target.value })}
                    className="w-full h-9 rounded-md border border-input bg-white px-3 py-1 text-xs"
                  >
                    <option value="B3">B3 (پایه‌دار)</option>
                    <option value="B35">B35 (پایه‌دار + فلنج بزرگ)</option>
                    <option value="B34">B34 (پایه‌دار + نیم‌فلنج)</option>
                  </select>
                </div>
              </div>
            )}

            {family.mainCategory === "gearbox" && (
              <div className="grid grid-cols-3 gap-3 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">مدل ورودی</Label>
                  <Input
                    value={variantForm.modelType}
                    onChange={(e) => setVariantForm({ ...variantForm, modelType: e.target.value })}
                    placeholder="VF / MVF / NMRV"
                    className="h-9 text-xs bg-white num-en"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">نسبت تبدیل (Ratio)</Label>
                  <Input
                    value={variantForm.ratio}
                    onChange={(e) => setVariantForm({ ...variantForm, ratio: e.target.value })}
                    placeholder="7.5, 10, 15, 20, ..."
                    className="h-9 text-xs bg-white num-en"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">فریم ورودی</Label>
                  <Input
                    value={variantForm.inputFrame}
                    onChange={(e) => setVariantForm({ ...variantForm, inputFrame: e.target.value })}
                    placeholder="56, 63, 71, 80, 90..."
                    className="h-9 text-xs bg-white num-en"
                  />
                </div>
              </div>
            )}

            {family.mainCategory === "pump" && (
              <div className="grid grid-cols-3 gap-3 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">سایز خروجی (اینچ)</Label>
                  <Input
                    value={variantForm.outletSize}
                    onChange={(e) => setVariantForm({ ...variantForm, outletSize: e.target.value })}
                    placeholder="1, 1.25, 2, 3..."
                    className="h-9 text-xs bg-white num-en"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">حداکثر هد (متر)</Label>
                  <Input
                    type="number"
                    value={variantForm.headMeter}
                    onChange={(e) => setVariantForm({ ...variantForm, headMeter: Number(e.target.value) })}
                    placeholder="16, 24, 32..."
                    className="h-9 text-xs bg-white num-en"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">فلوتر</Label>
                  <select
                    value={variantForm.floater}
                    onChange={(e) => setVariantForm({ ...variantForm, floater: e.target.value })}
                    className="w-full h-9 rounded-md border border-input bg-white px-3 py-1 text-xs"
                  >
                    <option value="ساده">ساده (بدون فلوتر)</option>
                    <option value="فلوتردار">فلوتردار</option>
                  </select>
                </div>
              </div>
            )}

            {family.mainCategory === "accessories" && (
              <div className="grid grid-cols-3 gap-3 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">نوع قطعه</Label>
                  <Input
                    value={variantForm.flangeType}
                    onChange={(e) => setVariantForm({ ...variantForm, flangeType: e.target.value })}
                    placeholder="فلنج / نیم‌فلنج / براکت"
                    className="h-9 text-xs bg-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">جنس بدنه</Label>
                  <Input
                    value={variantForm.bodyMaterial}
                    onChange={(e) => setVariantForm({ ...variantForm, bodyMaterial: e.target.value })}
                    placeholder="چدن / آلومینیوم"
                    className="h-9 text-xs bg-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">طول فلنج</Label>
                  <Input
                    value={variantForm.flangeLength}
                    onChange={(e) => setVariantForm({ ...variantForm, flangeLength: e.target.value })}
                    placeholder="استاندارد / بلند"
                    className="h-9 text-xs bg-white"
                  />
                </div>
              </div>
            )}

            {/* Price & Stock */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">قیمت به تومان (۰ برای استعلام)</Label>
                <Input
                  type="number"
                  value={variantForm.price}
                  onChange={(e) => setVariantForm({ ...variantForm, price: Number(e.target.value) })}
                  placeholder="15000000"
                  className="h-9 text-xs num-en"
                />
                {variantForm.price > 0 && (
                  <p className="text-[11px] text-blue-600 font-medium">{formatPrice(variantForm.price)}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">وضعیت موجودی کاتالوگ</Label>
                <select
                  value={variantForm.inStock ? "true" : "false"}
                  onChange={(e) => setVariantForm({ ...variantForm, inStock: e.target.value === "true" })}
                  className="w-full h-9 rounded-md border border-input bg-white px-3 py-1 text-xs"
                >
                  <option value="true">موجود در کاتالوگ</option>
                  <option value="false">نیازمند استعلام قیمت</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setVariantDialogOpen(false)}
                disabled={savingVariant}
              >
                انصراف
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={savingVariant}
              >
                {savingVariant && <Loader2 size={14} className="animate-spin ml-1.5" />}
                {editingVariantId ? "ذخیره تغییرات" : "افزودن واریانت"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── DELETE VARIANT MODAL ─── */}
      <Dialog open={!!deleteVariantConfirm} onOpenChange={(open) => !open && setDeleteVariantConfirm(null)}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-red-600 flex items-center gap-2">
              <Trash2 size={18} />
              تایید حذف واریانت
            </DialogTitle>
          </DialogHeader>

          <div className="py-3 space-y-2 text-sm text-gray-700">
            <p>
              آیا از حذف واریانت با کد SKU <strong>«{deleteVariantConfirm?.sku}»</strong> اطمینان دارید؟
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteVariantConfirm(null)}
              disabled={deletingVariant}
            >
              انصراف
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteVariant}
              disabled={deletingVariant}
              className="bg-red-600 hover:bg-red-700"
            >
              {deletingVariant && <Loader2 size={14} className="animate-spin ml-1.5" />}
              حذف واریانت
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
