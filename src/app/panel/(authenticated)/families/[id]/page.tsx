"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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
  Image as ImageIcon,
  Film,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ProductImageUploader } from "@/components/admin/ProductImageUploader";
import { CATALOG_TAXONOMY, legacyCategory, phaseForCategory, taxonomyCategory } from "@/lib/catalog-taxonomy";
import { ProductImage } from "@/components/ProductImage";
import { VariantMediaModal } from "@/components/admin/VariantMediaModal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Variant {
  id: string;
  sku: string;
  name?: string;
  size: string;
  power: string;
  powerKw: number;
  speed: string;
  mountingType?: string;
  voltage?: string;
  gearboxType?: string;
  modelType?: string;
  ratio?: string;
  inputFrame?: string;
  inputType?: string;
  pumpType?: string;
  outletSize?: string;
  headMeter?: number;
  floater?: string;
  brand?: string;
  bodyMaterial?: string;
  flangeType?: string;
  flangeLength?: string;
  price: number;
  weight: string;
  dimensions: string;
  inStock: boolean;
  sortOrder: number;
  media?: {
    images: string[];
    videos: string[];
  };
}

interface Family {
  id: string;
  slug: string;
  name: string;
  nameEn: string;
  category: string;
  mainCategory: string;
  subCategory: string;
  phase: string;
  shellType: string;
  description: string;
  imageUrl: string;
  sortOrder: number;
  variants: Variant[];
}

function formatPrice(price: number): string {
  if (price === 0) return "تماس بگیرید";
  return new Intl.NumberFormat("fa-IR").format(price) + " تومان";
}

const EMPTY_VARIANT = {
  sku: "",
  size: "",
  power: "",
  powerKw: 0,
  speed: "",
  mountingType: "",
  voltage: "",
  gearboxType: "", modelType: "", ratio: "", inputFrame: "", inputType: "",
  pumpType: "", outletSize: "", headMeter: 0, floater: "",
  brand: "", bodyMaterial: "", flangeType: "", flangeLength: "",
  price: 0,
  weight: "",
  dimensions: "",
  inStock: true,
  sortOrder: 0,
};

export default function FamilyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const familyId = params.id as string;

  const [family, setFamily] = useState<Family | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Edit family state
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    slug: "",
    name: "",
    nameEn: "",
    category: "",
    mainCategory: "electromotor",
    subCategory: "",
    phase: "",
    shellType: "",
    description: "",
    imageUrl: "",
    sortOrder: 0,
  });

  // New variant form
  const [showNewVariant, setShowNewVariant] = useState(false);
  const [newVariant, setNewVariant] = useState(EMPTY_VARIANT);

  // Delete confirm
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  // Variant media modal state
  const [selectedVariantForMedia, setSelectedVariantForMedia] = useState<Variant | null>(null);

  async function fetchFamily() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/families/${familyId}`);
      if (res.ok) {
        const data = await res.json();
        setFamily(data);
        setEditForm({
          slug: data.slug,
          name: data.name,
          nameEn: data.nameEn,
          category: data.category,
          mainCategory: data.mainCategory,
          subCategory: data.subCategory,
          phase: data.phase,
          shellType: data.shellType,
          description: data.description,
          imageUrl: data.imageUrl,
          sortOrder: data.sortOrder,
        });
      } else {
        router.push("/panel/families");
      }
    } catch {
      router.push("/panel/families");
    }
    setLoading(false);
  }

  useEffect(() => {
    (async () => { await fetchFamily(); })();
  }, [familyId]);

  async function handleSaveFamily() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/families/${familyId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        setEditMode(false);
        fetchFamily();
      } else {
        alert("خطا در بروزرسانی");
      }
    } catch {
      alert("خطا در ارتباط با سرور");
    }
    setSaving(false);
  }

  async function handleAddVariant(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/variants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newVariant, familyId }),
      });
      if (res.ok) {
        setShowNewVariant(false);
        setNewVariant(EMPTY_VARIANT);
        fetchFamily();
      } else {
        const data = await res.json();
        alert(data.error || "خطا در ایجاد واریانت");
      }
    } catch {
      alert("خطا در ارتباط با سرور");
    }
    setSaving(false);
  }

  async function handleToggleStock(variantId: string, currentStock: boolean) {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/variants/${variantId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inStock: !currentStock }),
      });
      if (res.ok) fetchFamily();
    } catch {
      alert("خطا");
    }
    setSaving(false);
  }

  async function handleDeleteVariant(variantId: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/variants/${variantId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDeleteConfirm(null);
        fetchFamily();
      }
    } catch {
      alert("خطا");
    }
    setSaving(false);
  }

  if (loading || !family) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back */}
      <button
        onClick={() => router.push("/panel/families")}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowRight size={14} />
        بازگشت به لیست
      </button>

      {/* Family Info Card */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-gray-900">
                  {family.name}
                </h1>
                <Badge
                  className={`text-[10px] ${
                    family.category === "single-phase"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {family.phase}
                </Badge>
              </div>
              <p className="text-xs text-gray-500 mt-1 num-en" dir="ltr">
                slug: {family.slug}
              </p>
            </div>
            <Button
              variant={editMode ? "default" : "outline"}
              size="sm"
              onClick={() => {
                if (editMode) {
                  handleSaveFamily();
                } else {
                  setEditMode(true);
                }
              }}
              disabled={saving}
              className={
                editMode
                  ? "bg-blue-700 hover:bg-blue-800 text-white"
                  : ""
              }
            >
              {saving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : editMode ? (
                <>
                  <Save size={14} className="ml-1" />
                  ذخیره
                </>
              ) : (
                <>
                  <Pencil size={14} className="ml-1" />
                  ویرایش
                </>
              )}
            </Button>
          </div>

          {editMode ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-gray-50 rounded-lg">
              <div>
                <Label className="text-xs">نام (فارسی)</Label>
                <Input
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Slug</Label>
                <Input
                  value={editForm.slug}
                  onChange={(e) =>
                    setEditForm({ ...editForm, slug: e.target.value })
                  }
                  className="mt-1"
                  dir="ltr"
                />
              </div>
              <div>
                <Label className="text-xs">نام انگلیسی</Label>
                <Input
                  value={editForm.nameEn}
                  onChange={(e) =>
                    setEditForm({ ...editForm, nameEn: e.target.value })
                  }
                  className="mt-1"
                  dir="ltr"
                />
              </div>
              <div><Label className="text-xs">دسته اصلی</Label><select value={editForm.mainCategory} onChange={(e) => { const mainCategory = e.target.value; const subCategory = taxonomyCategory(mainCategory)?.children[0]?.slug || ""; setEditForm({ ...editForm, mainCategory, subCategory, category: legacyCategory(mainCategory, subCategory), phase: phaseForCategory(mainCategory, subCategory) }); }} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">{CATALOG_TAXONOMY.map((item) => <option key={item.slug} value={item.slug}>{item.label}</option>)}</select></div>
              <div><Label className="text-xs">زیر‌دسته</Label><select value={editForm.subCategory} onChange={(e) => { const subCategory = e.target.value; setEditForm({ ...editForm, subCategory, category: legacyCategory(editForm.mainCategory, subCategory), phase: phaseForCategory(editForm.mainCategory, subCategory) }); }} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">{taxonomyCategory(editForm.mainCategory)?.children.map((item) => <option key={item.slug} value={item.slug}>{item.label}</option>)}</select></div>
              {editForm.mainCategory === "electromotor" && <div>
                <Label className="text-xs">نوع پوسته</Label>
                <Input
                  value={editForm.shellType}
                  onChange={(e) =>
                    setEditForm({ ...editForm, shellType: e.target.value })
                  }
                  className="mt-1"
                />
              </div>}
              <div>
                <Label className="text-xs">ترتیب</Label>
                <Input
                  type="number"
                  value={editForm.sortOrder}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      sortOrder: parseInt(e.target.value) || 0,
                    })
                  }
                  className="mt-1"
                  dir="ltr"
                />
              </div>
              <div className="sm:col-span-2">
                <Label className="mb-1 block text-xs">تصویر محصول</Label>
                <ProductImageUploader
                  slug={editForm.slug}
                  value={editForm.imageUrl}
                  onChange={(imageUrl) => setEditForm({ ...editForm, imageUrl })}
                />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs">توضیحات</Label>
                <textarea
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm({ ...editForm, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mt-1 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  rows={2}
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-gray-400">نام EN:</span>{" "}
                <span className="text-gray-700 num-en">{family.nameEn || "-"}</span>
              </div>
              <div>
                <span className="text-gray-400">پوسته:</span>{" "}
                <span className="text-gray-700">{family.shellType}</span>
              </div>
              <div>
                <span className="text-gray-400">ترتیب:</span>{" "}
                <span className="text-gray-700 num-en">{family.sortOrder}</span>
              </div>
              <div>
                <span className="text-gray-400">واریانت:</span>{" "}
                <span className="text-gray-700 num-en">{family.variants.length}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Variants */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">
              واریانت‌ها ({family.variants.length})
            </h2>
            <Button
              size="sm"
              onClick={() => setShowNewVariant(!showNewVariant)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {showNewVariant ? (
                <X size={14} className="ml-1" />
              ) : (
                <Plus size={14} className="ml-1" />
              )}
              {showNewVariant ? "انصراف" : "افزودن واریانت"}
            </Button>
          </div>

          {/* New Variant Form */}
          {showNewVariant && (
            <form
              onSubmit={handleAddVariant}
              className="p-4 bg-emerald-50 rounded-lg mb-4 space-y-3"
            >
              <p className="text-sm font-semibold text-emerald-800">
                واریانت جدید
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <Label className="text-xs">کد SKU *</Label>
                  <Input
                    value={newVariant.sku}
                    onChange={(e) =>
                      setNewVariant({ ...newVariant, sku: e.target.value })
                    }
                    placeholder="1010003XX"
                    dir="ltr"
                    required
                  />
                </div>
                <div>
                  <Label className="text-xs">سایز فریم</Label>
                  <Input
                    value={newVariant.size}
                    onChange={(e) =>
                      setNewVariant({ ...newVariant, size: e.target.value })
                    }
                    placeholder="90"
                    dir="ltr"
                  />
                </div>
                <div>
                  <Label className="text-xs">توان</Label>
                  <Input
                    value={newVariant.power}
                    onChange={(e) =>
                      setNewVariant({ ...newVariant, power: e.target.value })
                    }
                    placeholder="2HP"
                    dir="ltr"
                  />
                </div>
                <div>
                  <Label className="text-xs">توان (kW)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newVariant.powerKw || ""}
                    onChange={(e) =>
                      setNewVariant({
                        ...newVariant,
                        powerKw: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="1.5"
                    dir="ltr"
                  />
                </div>
                <div>
                  <Label className="text-xs">سرعت (RPM)</Label>
                  <Input
                    value={newVariant.speed}
                    onChange={(e) =>
                      setNewVariant({ ...newVariant, speed: e.target.value })
                    }
                    placeholder="1400"
                    dir="ltr"
                  />
                </div>
                <div>
                  <Label className="text-xs">نحوه نصب</Label>
                  <Input
                    value={newVariant.mountingType}
                    onChange={(e) =>
                      setNewVariant({ ...newVariant, mountingType: e.target.value })
                    }
                    placeholder="B3 / B35 / FC"
                    dir="ltr"
                  />
                </div>
                {family.mainCategory === "electromotor" && <div><Label className="text-xs">ولتاژ</Label><Input value={newVariant.voltage} onChange={(e) => setNewVariant({ ...newVariant, voltage: e.target.value })} placeholder="380/660V" dir="ltr" /></div>}
                {family.mainCategory === "gearbox" && <>
                  <div><Label className="text-xs">نوع گیربکس</Label><Input value={newVariant.gearboxType} onChange={(e) => setNewVariant({ ...newVariant, gearboxType: e.target.value })} /></div>
                  <div><Label className="text-xs">مدل</Label><Input value={newVariant.modelType} onChange={(e) => setNewVariant({ ...newVariant, modelType: e.target.value })} dir="ltr" /></div>
                  <div><Label className="text-xs">نسبت تبدیل</Label><Input value={newVariant.ratio} onChange={(e) => setNewVariant({ ...newVariant, ratio: e.target.value })} dir="ltr" /></div>
                  <div><Label className="text-xs">فریم ورودی</Label><Input value={newVariant.inputFrame} onChange={(e) => setNewVariant({ ...newVariant, inputFrame: e.target.value })} dir="ltr" /></div>
                </>}
                {family.mainCategory === "pump" && <>
                  <div><Label className="text-xs">نوع پمپ</Label><Input value={newVariant.pumpType} onChange={(e) => setNewVariant({ ...newVariant, pumpType: e.target.value })} /></div>
                  <div><Label className="text-xs">سایز خروجی (اینچ)</Label><Input value={newVariant.outletSize} onChange={(e) => setNewVariant({ ...newVariant, outletSize: e.target.value })} dir="ltr" /></div>
                  <div><Label className="text-xs">هد (متر)</Label><Input type="number" value={newVariant.headMeter || ""} onChange={(e) => setNewVariant({ ...newVariant, headMeter: Number(e.target.value) || 0 })} dir="ltr" /></div>
                  <div><Label className="text-xs">شناور</Label><Input value={newVariant.floater} onChange={(e) => setNewVariant({ ...newVariant, floater: e.target.value })} /></div>
                </>}
                {family.mainCategory === "accessories" && <>
                  <div><Label className="text-xs">برند</Label><Input value={newVariant.brand} onChange={(e) => setNewVariant({ ...newVariant, brand: e.target.value })} /></div>
                  <div><Label className="text-xs">جنس بدنه</Label><Input value={newVariant.bodyMaterial} onChange={(e) => setNewVariant({ ...newVariant, bodyMaterial: e.target.value })} /></div>
                  <div><Label className="text-xs">نوع فلنج/قطعه</Label><Input value={newVariant.flangeType} onChange={(e) => setNewVariant({ ...newVariant, flangeType: e.target.value })} /></div>
                  <div><Label className="text-xs">طول فلنج</Label><Input value={newVariant.flangeLength} onChange={(e) => setNewVariant({ ...newVariant, flangeLength: e.target.value })} /></div>
                </>}
                <div>
                  <Label className="text-xs">قیمت (تومان)</Label>
                  <Input
                    type="number"
                    value={newVariant.price || ""}
                    onChange={(e) =>
                      setNewVariant({
                        ...newVariant,
                        price: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="0"
                    dir="ltr"
                  />
                </div>
                <div>
                  <Label className="text-xs">وزن</Label>
                  <Input
                    value={newVariant.weight}
                    onChange={(e) =>
                      setNewVariant({ ...newVariant, weight: e.target.value })
                    }
                    placeholder="15kg"
                    dir="ltr"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={newVariant.inStock}
                    onChange={(e) =>
                      setNewVariant({ ...newVariant, inStock: e.target.checked })
                    }
                    className="rounded"
                  />
                  موجود
                </label>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={saving}
                >
                  {saving ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Check size={14} className="ml-1" />
                  )}
                  افزودن
                </Button>
              </div>
            </form>
          )}

          {/* Variants Table */}
          {family.variants.length === 0 ? (
            <div className="text-center py-8">
              <Package size={32} className="text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">واریانتی ثبت نشده</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-right text-xs font-medium">SKU</TableHead>
                    <TableHead className="text-center text-xs font-medium">تصاویر و مدیا</TableHead>
                    <TableHead className="text-right text-xs font-medium">سایز</TableHead>
                    <TableHead className="text-right text-xs font-medium">توان</TableHead>
                    <TableHead className="text-right text-xs font-medium">kW</TableHead>
                    <TableHead className="text-right text-xs font-medium">دور</TableHead>
                    <TableHead className="text-right text-xs font-medium">نصب</TableHead>
                    <TableHead className="text-right text-xs font-medium">قیمت</TableHead>
                    <TableHead className="text-center text-xs font-medium">وضعیت</TableHead>
                    <TableHead className="text-center text-xs font-medium">عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {family.variants.map((v) => (
                    <TableRow key={v.id} className="text-sm">
                      <TableCell className="num-en font-mono text-xs">
                        {v.sku}
                      </TableCell>
                      <TableCell className="text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedVariantForMedia(v)}
                          className="group inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs transition-all hover:border-blue-400 hover:bg-blue-50/50"
                          title="مدیریت تصاویر، ترتیب و ویدیوهای این واریانت"
                          aria-label={`مدیریت مدیا برای کد ${v.sku}`}
                        >
                          <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded bg-gray-100">
                            {v.media?.images?.[0] ? (
                              <ProductImage
                                src={v.media.images[0]}
                                alt=""
                                className="h-full w-full object-contain p-0.5"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-gray-400">
                                <ImageIcon size={14} />
                              </div>
                            )}
                            {v.media?.videos && v.media.videos.length > 0 && (
                              <span className="absolute bottom-0 right-0 rounded-tl bg-purple-600 px-0.5 text-[8px] text-white">
                                <Film size={8} />
                              </span>
                            )}
                          </div>
                          <div className="flex flex-col items-start pr-1 text-right">
                            <span className="text-[11px] font-medium text-blue-700 group-hover:underline">
                              {v.media?.images?.length || 0} عکس
                            </span>
                            {v.media?.videos && v.media.videos.length > 0 && (
                              <span className="text-[10px] text-purple-600">
                                {v.media.videos.length} ویدیو
                              </span>
                            )}
                          </div>
                        </button>
                      </TableCell>
                      <TableCell className="num-en">{v.size || "-"}</TableCell>
                      <TableCell className="num-en">{v.power || "-"}</TableCell>
                      <TableCell className="num-en">{v.powerKw || "-"}</TableCell>
                      <TableCell className="num-en">
                        {v.speed ? `${v.speed} RPM` : "-"}
                      </TableCell>
                      <TableCell className="num-en">{v.mountingType || "-"}</TableCell>
                      <TableCell className="text-xs font-medium">
                        {v.price > 0
                          ? formatPrice(v.price)
                          : "تماس بگیرید"}
                      </TableCell>
                      <TableCell className="text-center">
                        <button
                          onClick={() => handleToggleStock(v.id, v.inStock)}
                          disabled={saving}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            v.inStock
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {v.inStock ? "موجود" : "ناموجود"}
                        </button>
                      </TableCell>
                      <TableCell className="text-center">
                        {deleteConfirm === v.id ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleDeleteVariant(v.id)}
                              disabled={saving}
                              className="text-[10px] text-red-600 font-medium px-1"
                            >
                              تایید
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(v.id)}
                            className="text-red-400 hover:text-red-600"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Variant Media Management Modal */}
      {selectedVariantForMedia && (
        <VariantMediaModal
          isOpen={Boolean(selectedVariantForMedia)}
          onClose={() => setSelectedVariantForMedia(null)}
          variant={selectedVariantForMedia}
          familySlug={family.slug}
          familyName={family.name}
          onSaved={(updated) => {
            setFamily((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                variants: prev.variants.map((v) =>
                  v.id === updated.id ? { ...v, media: updated.media } : v
                ),
              };
            });
            void fetchFamily();
          }}
        />
      )}
    </div>
  );
}
