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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

interface Variant {
  id: string;
  sku: string;
  size: string;
  power: string;
  powerKw: number;
  speed: string;
  voltage: string;
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
  category: string;
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
  voltage: "",
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
              <div>
                <Label className="text-xs">نوع فاز</Label>
                <Input
                  value={editForm.phase}
                  onChange={(e) =>
                    setEditForm({ ...editForm, phase: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">نوع پوسته</Label>
                <Input
                  value={editForm.shellType}
                  onChange={(e) =>
                    setEditForm({ ...editForm, shellType: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
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
              <div>
                <Label className="text-xs">آدرس تصویر</Label>
                <Input
                  value={editForm.imageUrl}
                  onChange={(e) =>
                    setEditForm({ ...editForm, imageUrl: e.target.value })
                  }
                  className="mt-1"
                  dir="ltr"
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
                  <Label className="text-xs">ولتاژ</Label>
                  <Input
                    value={newVariant.voltage}
                    onChange={(e) =>
                      setNewVariant({ ...newVariant, voltage: e.target.value })
                    }
                    placeholder="380V"
                    dir="ltr"
                  />
                </div>
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
                    <TableHead className="text-right text-xs font-medium">سایز</TableHead>
                    <TableHead className="text-right text-xs font-medium">توان</TableHead>
                    <TableHead className="text-right text-xs font-medium">kW</TableHead>
                    <TableHead className="text-right text-xs font-medium">دور</TableHead>
                    <TableHead className="text-right text-xs font-medium">ولتاژ</TableHead>
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
                      <TableCell className="num-en">{v.size || "-"}</TableCell>
                      <TableCell className="num-en">{v.power || "-"}</TableCell>
                      <TableCell className="num-en">{v.powerKw || "-"}</TableCell>
                      <TableCell className="num-en">
                        {v.speed ? `${v.speed} RPM` : "-"}
                      </TableCell>
                      <TableCell className="num-en">{v.voltage || "-"}</TableCell>
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
    </div>
  );
}
