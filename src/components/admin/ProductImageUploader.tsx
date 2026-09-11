"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2, UploadCloud } from "lucide-react";
import { ProductImage } from "@/components/ProductImage";
import { Button } from "@/components/ui/button";

interface ProductImageUploaderProps {
  slug: string;
  value: string;
  onChange: (url: string) => void;
}

export function ProductImageUploader({ slug, value, onChange }: ProductImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function upload(file?: File) {
    if (!file || uploading) return;
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      setError("ابتدا slug انگلیسی معتبر را وارد کنید.");
      return;
    }
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("slug", slug);
      const response = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "بارگذاری تصویر انجام نشد.");
      onChange(result.url);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "بارگذاری تصویر انجام نشد.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <div
        className={`relative overflow-hidden rounded-xl border-2 border-dashed transition-colors ${dragging ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white"}`}
        onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          void upload(event.dataTransfer.files[0]);
        }}
      >
        {value ? (
          <div className="flex min-h-40 items-center gap-4 p-3">
            <div className="h-32 w-32 shrink-0 overflow-hidden rounded-lg bg-gray-50">
              <ProductImage src={value} alt="پیش‌نمایش تصویر محصول" />
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <p dir="ltr" className="truncate text-xs text-gray-500">{value}</p>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={uploading}>
                  <ImagePlus size={14} className="ml-1" /> تغییر تصویر
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => onChange("")} className="text-red-600">
                  <Trash2 size={14} className="ml-1" /> حذف انتخاب
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading} className="flex min-h-40 w-full flex-col items-center justify-center p-5 text-center">
            {uploading ? <Loader2 className="mb-2 animate-spin text-blue-600" /> : <UploadCloud className="mb-2 text-blue-600" />}
            <span className="text-sm font-medium text-gray-800">تصویر را بکشید و رها کنید یا انتخاب کنید</span>
            <span className="mt-1 text-xs text-gray-500">JPEG، PNG یا WebP — حداکثر ۱۰ مگابایت</span>
          </button>
        )}
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => void upload(event.target.files?.[0])} />
      </div>
      {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
      <p className="text-[11px] text-gray-400">تصویر هنگام بارگذاری به WebP بهینه و حداکثر ۱۶۰۰×۱۶۰۰ پیکسل می‌شود.</p>
    </div>
  );
}
