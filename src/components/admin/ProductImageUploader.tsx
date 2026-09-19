"use client";

import { useRef, useState } from "react";
import { FolderOpen, Loader2, Trash2, UploadCloud, Link as LinkIcon } from "lucide-react";
import { ProductImage } from "@/components/ProductImage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ProductImageUploaderProps {
  slug: string;
  value: string;
  onChange: (url: string) => void;
  compact?: boolean;
  label?: string;
  defaultFallback?: string;
}

export function ProductImageUploader({
  slug,
  value,
  onChange,
  compact = false,
  label,
}: ProductImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [showManualUrl, setShowManualUrl] = useState(false);

  const cleanSlug =
    (slug || "uploads")
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "uploads";

  async function upload(file?: File) {
    if (!file || uploading) return;
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("slug", cleanSlug);
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

  if (compact) {
    return (
      <div className="space-y-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => void upload(e.target.files?.[0])}
        />

        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold h-8.5 rounded-lg shadow-xs cursor-pointer"
          >
            {uploading ? (
              <>
                <Loader2 size={14} className="animate-spin ml-1.5" />
                در حال بارگذاری...
              </>
            ) : (
              <>
                <FolderOpen size={14} className="ml-1.5" />
                {value ? "تعویض تصویر (Browse)" : "انتخاب تصویر (Browse)"}
              </>
            )}
          </Button>

          {value && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onChange("")}
              className="h-8.5 px-2.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-slate-200 cursor-pointer"
              title="حذف و بازگشت به پیش‌فرض"
            >
              <Trash2 size={13} />
            </Button>
          )}
        </div>

        {error && <p className="text-[11px] text-red-600 font-medium">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {label && <label className="text-xs font-semibold text-slate-700">{label}</label>}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(event) => void upload(event.target.files?.[0])}
      />

      <div
        className={`relative overflow-hidden rounded-xl border-2 border-dashed transition-all ${
          dragging
            ? "border-blue-500 bg-blue-50/70"
            : "border-slate-200 bg-slate-50/40 hover:border-slate-300"
        }`}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          void upload(event.dataTransfer.files[0]);
        }}
      >
        {value ? (
          <div className="flex flex-col sm:flex-row items-center gap-4 p-4">
            <div className="h-32 w-32 shrink-0 overflow-hidden rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-center p-2">
              <ProductImage src={value} alt="پیش‌نمایش تصویر" className="h-full w-full object-contain" />
            </div>
            <div className="min-w-0 flex-1 space-y-2.5 text-center sm:text-right">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded inline-block">
                  تصویر بارگذاری‌شده
                </span>
                <p dir="ltr" className="truncate text-xs font-mono text-slate-500">
                  {value}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={() => inputRef.current?.click()}
                  disabled={uploading}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  {uploading ? (
                    <>
                      <Loader2 size={14} className="animate-spin ml-1.5" />
                      در حال بارگذاری...
                    </>
                  ) : (
                    <>
                      <FolderOpen size={14} className="ml-1.5" />
                      تعویض تصویر از کامپیوتر (Browse)
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onChange("")}
                  className="text-xs text-red-600 hover:bg-red-50 hover:text-red-700 border-slate-200 cursor-pointer"
                >
                  <Trash2 size={14} className="ml-1.5" />
                  حذف تصویر
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex min-h-44 w-full flex-col items-center justify-center p-6 text-center">
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="animate-spin text-blue-600" size={32} />
                <span className="text-sm font-semibold text-slate-700">در حال بهینه‌سازی و ذخیره تصویر...</span>
              </div>
            ) : (
              <>
                <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center mb-3 text-blue-600">
                  <UploadCloud size={24} />
                </div>
                <h4 className="text-sm font-bold text-slate-800 mb-1">
                  تصویر را اینجا بکشید یا مستقیماً از کامپیوتر انتخاب کنید
                </h4>
                <p className="text-xs text-slate-400 mb-4 max-w-sm">
                  فرمت‌های مجاز: JPG، PNG، WebP (حداکثر ۱۵ مگابایت) - به صورت خودکار به WebP تبدیل می‌شود.
                </p>

                <Button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-9 px-5 rounded-xl shadow-xs cursor-pointer"
                >
                  <FolderOpen size={15} className="ml-2" />
                  انتخاب تصویر از سیستم (Browse)
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {error && <p role="alert" className="text-xs text-red-600 font-medium">{error}</p>}

      {/* Optional manual URL toggle */}
      <div className="flex items-center justify-between text-[11px] text-slate-400">
        <span>فایل به طور خودکار به فرمت استاندارد بهینه‌سازی می‌شود.</span>
        <button
          type="button"
          onClick={() => setShowManualUrl(!showManualUrl)}
          className="text-slate-500 hover:text-blue-600 flex items-center gap-1 underline cursor-pointer"
        >
          <LinkIcon size={11} />
          {showManualUrl ? "بستن آدرس دستی" : "یا وارد کردن آدرس دستی (URL)"}
        </button>
      </div>

      {showManualUrl && (
        <div className="pt-1">
          <Input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://... یا /media/..."
            className="text-xs num-en bg-white"
            dir="ltr"
          />
        </div>
      )}
    </div>
  );
}
