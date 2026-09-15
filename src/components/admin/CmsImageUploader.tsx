"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import {
  UploadCloud,
  Loader2,
  Trash2,
  ImagePlus,
  X,
  Plus,
  MoveUp,
  MoveDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// ─── Single Banner / Image Uploader ──────────────────────────────────────────
interface SingleImageUploaderProps {
  slug?: string;
  value: string;
  onChange: (url: string) => void;
  label?: string;
  description?: string;
  aspectRatioClass?: string;
}

export function SingleImageUploader({
  slug = "cms",
  value,
  onChange,
  label = "تصویر بنر",
  description = "تصویر باکیفیت ترجیحاً افقی (WebP، JPG یا PNG تا ۱۰ مگابایت)",
  aspectRatioClass = "aspect-[21/9]",
}: SingleImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(file?: File) {
    if (!file || uploading) return;
    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("slug", slug.replace(/[^a-z0-9-]/gi, "-").toLowerCase() || "cms");

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "خطا در بارگذاری تصویر");
      }

      onChange(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "بارگذاری تصویر انجام نشد.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleDelete() {
    if (!value) return;
    if (value.startsWith("/products/")) {
      try {
        await fetch(`/api/admin/upload?url=${encodeURIComponent(value)}`, {
          method: "DELETE",
        });
      } catch {
        // ignore delete failures
      }
    }
    onChange("");
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs h-7 px-2"
          >
            <Trash2 size={13} className="ml-1" />
            حذف تصویر
          </Button>
        )}
      </div>

      {value ? (
        <div className={`relative w-full ${aspectRatioClass} rounded-xl overflow-hidden border border-gray-200 bg-gray-100 group`}>
          <Image
            src={value}
            alt={label}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 1200px) 100vw, 1200px"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="bg-white/90 text-gray-800 hover:bg-white text-xs"
            >
              <ImagePlus size={14} className="ml-1" />
              تغییر تصویر
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              className="text-xs"
            >
              <Trash2 size={14} className="ml-1" />
              حذف
            </Button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files?.[0];
            if (file) void handleUpload(file);
          }}
          className={`flex flex-col items-center justify-center border-2 border-dashed border-gray-300 hover:border-blue-500 rounded-xl p-8 cursor-pointer bg-gray-50/70 hover:bg-blue-50/40 transition-colors ${
            uploading ? "pointer-events-none opacity-60" : ""
          }`}
        >
          {uploading ? (
            <Loader2 size={32} className="animate-spin text-blue-600 mb-2" />
          ) : (
            <UploadCloud size={36} className="text-gray-400 mb-2" />
          )}
          <span className="text-sm font-medium text-gray-700">
            {uploading ? "در حال آپلود و پردازش..." : "کلیک برای انتخاب فایل یا رها کردن تصویر"}
          </span>
          <span className="text-xs text-gray-400 mt-1">{description}</span>
        </div>
      )}

      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleUpload(file);
        }}
      />
    </div>
  );
}

// ─── Gallery Multi-Image Manager ─────────────────────────────────────────────
export interface GalleryItem {
  url: string;
  caption: string;
}

interface GalleryManagerProps {
  slug?: string;
  items: GalleryItem[];
  onChange: (items: GalleryItem[]) => void;
  label?: string;
  description?: string;
}

export function GalleryManager({
  slug = "about",
  items,
  onChange,
  label = "گالری تصاویر",
  description = "تصاویر فروشگاه، انبار، تجهیزات یا خط تولید و پرسنل",
}: GalleryManagerProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0 || uploading) return;
    setError(null);
    setUploading(true);

    try {
      const newItems: GalleryItem[] = [...items];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("file", file);
        formData.append("slug", slug.replace(/[^a-z0-9-]/gi, "-").toLowerCase() || "about");

        const res = await fetch("/api/admin/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (res.ok && data.url) {
          newItems.push({
            url: data.url,
            caption: file.name.replace(/\.[^/.]+$/, ""),
          });
        }
      }

      onChange(newItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در بارگذاری برخی تصاویر");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function handleRemove(index: number) {
    const updated = items.filter((_, i) => i !== index);
    onChange(updated);
  }

  function handleCaptionChange(index: number, newCaption: string) {
    const updated = [...items];
    updated[index] = { ...updated[index], caption: newCaption };
    onChange(updated);
  }

  function moveItem(index: number, direction: "up" | "down") {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;
    const updated = [...items];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    onChange(updated);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-semibold text-gray-800">{label}</label>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="text-xs border-blue-200 hover:bg-blue-50 text-blue-700"
        >
          {uploading ? (
            <Loader2 size={13} className="ml-1.5 animate-spin text-blue-600" />
          ) : (
            <Plus size={13} className="ml-1.5 text-blue-600" />
          )}
          افزودن تصویر جدید
        </Button>
      </div>

      {items.length === 0 ? (
        <div
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center bg-gray-50/50 hover:bg-gray-50 hover:border-gray-300 cursor-pointer transition-colors"
        >
          <ImagePlus size={32} className="mx-auto text-gray-400 mb-2" />
          <p className="text-xs text-gray-500 font-medium">هیچ تصویری در گالری ثبت نشده است.</p>
          <p className="text-[11px] text-gray-400 mt-0.5">برای افزودن عکس روی این بخش کلیک کنید.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="group relative border border-gray-200 rounded-xl overflow-hidden bg-white shadow-xs hover:shadow-sm transition-shadow flex flex-col"
            >
              <div className="relative aspect-video w-full bg-gray-100">
                <Image
                  src={item.url}
                  alt={item.caption || `تصویر ${idx + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute top-2 left-2 flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                  {idx > 0 && (
                    <button
                      type="button"
                      onClick={() => moveItem(idx, "up")}
                      className="p-1 rounded-md bg-black/60 hover:bg-black text-white text-xs"
                      title="انتقال به قبل"
                    >
                      <MoveUp size={12} />
                    </button>
                  )}
                  {idx < items.length - 1 && (
                    <button
                      type="button"
                      onClick={() => moveItem(idx, "down")}
                      className="p-1 rounded-md bg-black/60 hover:bg-black text-white text-xs"
                      title="انتقال به بعد"
                    >
                      <MoveDown size={12} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemove(idx)}
                    className="p-1 rounded-md bg-red-600 hover:bg-red-700 text-white text-xs"
                    title="حذف تصویر"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
              <div className="p-2.5 bg-white border-t border-gray-100">
                <Input
                  value={item.caption}
                  onChange={(e) => handleCaptionChange(idx, e.target.value)}
                  placeholder="کپشن یا توضیح عکس..."
                  className="text-xs h-8"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => void handleUpload(e.target.files)}
      />
    </div>
  );
}
