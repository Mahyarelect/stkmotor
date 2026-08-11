"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Package,
  ArrowLeft,
  AlertTriangle,
  X,
  Check,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

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
  createdAt: string;
  _count: { variants: number };
}

export default function FamiliesPage() {
  const router = useRouter();
  const [families, setFamilies] = useState<Family[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [form, setForm] = useState({
    slug: "",
    name: "",
    nameEn: "",
    category: "three-phase",
    phase: "سه‌فاز",
    shellType: "چدنی",
    description: "",
    imageUrl: "",
    sortOrder: 0,
  });

  async function fetchFamilies() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/families");
      if (res.ok) {
        const data = await res.json();
        setFamilies(data);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  useEffect(() => {
    (async () => { await fetchFamilies(); })();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/families", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "خطا در ایجاد");
        return;
      }

      setShowCreateDialog(false);
      setForm({
        slug: "",
        name: "",
        nameEn: "",
        category: "three-phase",
        phase: "سه‌فاز",
        shellType: "چدنی",
        description: "",
        imageUrl: "",
        sortOrder: 0,
      });
      fetchFamilies();
    } catch {
      alert("خطا در ارتباط با سرور");
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/families/${id}`, { method: "DELETE" });
      if (res.ok) {
        setDeleteConfirm(null);
        fetchFamilies();
      } else {
        alert("خطا در حذف");
      }
    } catch {
      alert("خطا در ارتباط با سرور");
    }
    setSaving(false);
  }

  const filtered = families.filter(
    (f) =>
      f.name.includes(search) ||
      f.nameEn.toLowerCase().includes(search.toLowerCase()) ||
      f.slug.includes(search)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">مدیریت محصولات</h1>
          <p className="text-sm text-gray-500 mt-1">
            {families.length} خانواده محصول
          </p>
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-blue-700 hover:bg-blue-800 text-white">
              <Plus size={16} className="ml-1" />
              محصول جدید
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle>ایجاد خانواده محصول جدید</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label>نام محصول (فارسی) *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                    placeholder="الکتروموتور سه‌فاز ۱۴۰۰ دور"
                    required
                  />
                </div>
                <div>
                  <Label>Slug (انگلیسی) *</Label>
                  <Input
                    value={form.slug}
                    onChange={(e) =>
                      setForm({ ...form, slug: e.target.value })
                    }
                    placeholder="three-phase-1400"
                    dir="ltr"
                    required
                  />
                </div>
                <div>
                  <Label>نام انگلیسی</Label>
                  <Input
                    value={form.nameEn}
                    onChange={(e) =>
                      setForm({ ...form, nameEn: e.target.value })
                    }
                    placeholder="Three-Phase Motor 1400 RPM"
                    dir="ltr"
                  />
                </div>
                <div>
                  <Label>دسته‌بندی *</Label>
                  <select
                    value={form.category}
                    onChange={(e) => {
                      const cat = e.target.value;
                      setForm({
                        ...form,
                        category: cat,
                        phase: cat === "single-phase" ? "تک‌فاز" : "سه‌فاز",
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option value="three-phase">سه‌فاز</option>
                    <option value="single-phase">تک‌فاز</option>
                  </select>
                </div>
                <div>
                  <Label>نوع فاز</Label>
                  <Input
                    value={form.phase}
                    onChange={(e) =>
                      setForm({ ...form, phase: e.target.value })
                    }
                    placeholder="سه‌فاز"
                  />
                </div>
                <div>
                  <Label>نوع پوسته</Label>
                  <Input
                    value={form.shellType}
                    onChange={(e) =>
                      setForm({ ...form, shellType: e.target.value })
                    }
                    placeholder="چدنی"
                  />
                </div>
                <div>
                  <Label>ترتیب نمایش</Label>
                  <Input
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) =>
                      setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })
                    }
                    dir="ltr"
                  />
                </div>
                <div className="col-span-2">
                  <Label>مسیر تصویر (داخل public)</Label>
                  <Input
                    value={form.imageUrl}
                    onChange={(e) =>
                      setForm({ ...form, imageUrl: e.target.value })
                    }
                    placeholder="products/motor.webp"
                    dir="ltr"
                  />
                </div>
                <div className="col-span-2">
                  <Label>توضیحات</Label>
                  <textarea
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    placeholder="توضیحات محصول..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  type="submit"
                  className="bg-blue-700 hover:bg-blue-800 text-white"
                  disabled={saving}
                >
                  {saving ? (
                    <Loader2 size={16} className="animate-spin ml-1" />
                  ) : (
                    <Check size={16} className="ml-1" />
                  )}
                  ایجاد
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                >
                  انصراف
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search
          size={16}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="جستجو در محصولات..."
          className="pr-9"
        />
      </div>

      {/* Families List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-5 bg-gray-200 rounded w-48 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Package size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">محصولی یافت نشد</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((family) => (
            <Card
              key={family.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 text-sm">
                        {family.name}
                      </h3>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] ${
                          family.category === "single-phase"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {family.phase}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500">
                      slug:{" "}
                      <span className="num-en" dir="ltr">
                        {family.slug}
                      </span>{" "}
                      · {family.shellType} ·{" "}
                      <span className="num-en">{family._count.variants}</span>{" "}
                      واریانت
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/panel/families/${family.id}`)}
                      className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                    >
                      <Pencil size={14} />
                    </Button>

                    {deleteConfirm === family.id ? (
                      <div className="flex items-center gap-1 bg-red-50 rounded-lg p-1">
                        <AlertTriangle size={12} className="text-red-500" />
                        <button
                          onClick={() => handleDelete(family.id)}
                          disabled={saving}
                          className="text-[10px] text-red-600 font-medium px-1"
                        >
                          {saving ? "..." : "تایید"}
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="text-[10px] text-gray-500 px-1"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteConfirm(family.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 size={14} />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
