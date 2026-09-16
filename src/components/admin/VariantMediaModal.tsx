"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  UploadCloud,
  Loader2,
  Trash2,
  GripVertical,
  Star,
  Film,
  Image as ImageIcon,
  ArrowRight,
  ArrowLeft,
  Plus,
  Check,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { ProductImage } from "@/components/ProductImage";

export interface VariantMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  variant: {
    id: string;
    sku: string;
    size?: string;
    power?: string;
    name?: string;
    media?: {
      images: string[];
      videos: string[];
    };
  } | null;
  familySlug: string;
  familyName: string;
  onSaved?: (updatedVariant: {
    id: string;
    sku: string;
    media: { images: string[]; videos: string[] };
  }) => void;
}

interface SortableImageProps {
  id: string;
  src: string;
  index: number;
  total: number;
  isPrimary: boolean;
  onSetPrimary: (index: number) => void;
  onMove: (fromIndex: number, toIndex: number) => void;
  onDelete: (index: number) => void;
  onReplace: (index: number, file: File) => void;
}

function SortableImageItem({
  id,
  src,
  index,
  total,
  isPrimary,
  onSetPrimary,
  onMove,
  onDelete,
  onReplace,
}: SortableImageProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const replaceInputRef = useRef<HTMLInputElement>(null);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative flex flex-col rounded-xl border bg-white p-2 shadow-2xs transition-all ${
        isPrimary
          ? "border-amber-400 ring-2 ring-amber-200"
          : "border-gray-200 hover:border-blue-300"
      }`}
    >
      {/* Top Bar: Primary Badge & Drag Handle */}
      <div className="mb-1.5 flex items-center justify-between">
        {isPrimary ? (
          <Badge className="bg-amber-500 text-[10px] text-white hover:bg-amber-600">
            <Star size={10} className="ml-1 fill-white" /> تصویر شاخص
          </Badge>
        ) : (
          <span className="text-[11px] font-mono text-gray-400">#{index + 1}</span>
        )}

        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab p-1 text-gray-400 hover:text-gray-700 active:cursor-grabbing"
          title="برای جابجایی بکشید و رها کنید"
          aria-label="دستگیره جابجایی تصویر"
        >
          <GripVertical size={14} />
        </button>
      </div>

      {/* Image Preview Container */}
      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-gray-50">
        <ProductImage src={src} alt={`تصویر ${index + 1}`} className="h-full w-full object-contain p-1" />
      </div>

      {/* Path Display */}
      <p dir="ltr" className="mt-1.5 truncate text-[10px] font-mono text-gray-400" title={src}>
        {src}
      </p>

      {/* Action Buttons */}
      <div className="mt-2 flex flex-wrap items-center gap-1 border-t border-gray-100 pt-2">
        {!isPrimary && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onSetPrimary(index)}
            className="h-6 flex-1 px-1.5 text-[10px] text-amber-700 hover:bg-amber-50"
            title="انتخاب به عنوان تصویر اصلی"
          >
            <Star size={11} className="ml-0.5" /> شاخص
          </Button>
        )}

        {/* Quick move buttons */}
        <div className="flex items-center gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={index === 0}
            onClick={() => onMove(index, index - 1)}
            className="h-6 w-6 p-0"
            title="انتقال به جلو"
            aria-label="انتقال به جلو"
          >
            <ArrowRight size={12} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={index === total - 1}
            onClick={() => onMove(index, index + 1)}
            className="h-6 w-6 p-0"
            title="انتقال به عقب"
            aria-label="انتقال به عقب"
          >
            <ArrowLeft size={12} />
          </Button>
        </div>

        {/* Replace Button */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => replaceInputRef.current?.click()}
          className="h-6 w-6 p-0"
          title="جایگزینی تصویر"
          aria-label="جایگزینی تصویر"
        >
          <RefreshCw size={12} className="text-gray-500 hover:text-blue-600" />
        </Button>
        <input
          ref={replaceInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onReplace(index, file);
          }}
        />

        {/* Delete Button */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onDelete(index)}
          className="h-6 w-6 p-0 text-red-500 hover:bg-red-50 hover:text-red-700"
          title="حذف تصویر"
          aria-label="حذف تصویر"
        >
          <Trash2 size={12} />
        </Button>
      </div>
    </div>
  );
}

export function VariantMediaModal({
  isOpen,
  onClose,
  variant,
  familySlug,
  familyName,
  onSaved,
}: VariantMediaModalProps) {
  const [activeTab, setActiveTab] = useState<"images" | "videos">("images");
  const [images, setImages] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Link inputs
  const [imageLinkInput, setImageLinkInput] = useState("");
  const [videoLinkInput, setVideoLinkInput] = useState("");

  const multiImageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  // Sync state when variant changes
  useEffect(() => {
    if (variant) {
      setImages(variant.media?.images || []);
      setVideos(variant.media?.videos || []);
      setError(null);
      setSuccessMessage(null);
      setImageLinkInput("");
      setVideoLinkInput("");
    }
  }, [variant]);

  if (!variant) return null;

  const uploadSlug = familySlug || variant.sku || "products";

  // Handle Drag & Drop End
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setImages((items) => {
      const oldIndex = items.findIndex((_, idx) => `img-${idx}` === active.id);
      const newIndex = items.findIndex((_, idx) => `img-${idx}` === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        return arrayMove(items, oldIndex, newIndex);
      }
      return items;
    });
  };

  // Set image as primary (move to index 0)
  const handleSetPrimary = (index: number) => {
    if (index === 0) return;
    setImages((items) => {
      const selected = items[index];
      const next = items.filter((_, idx) => idx !== index);
      return [selected, ...next];
    });
  };

  // Move image manually
  const handleMoveImage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= images.length) return;
    setImages((items) => arrayMove(items, fromIndex, toIndex));
  };

  // Delete image
  const handleDeleteImage = (index: number) => {
    setImages((items) => items.filter((_, idx) => idx !== index));
  };

  // Replace single image
  const handleReplaceImage = async (index: number, file: File) => {
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("slug", uploadSlug);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "خطا در آپلود تصویر");

      setImages((items) => {
        const copy = [...items];
        copy[index] = data.url;
        return copy;
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "خطا در آپلود تصویر");
    } finally {
      setUploading(false);
    }
  };

  // Upload multiple images
  const handleUploadImages = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);
    const newUrls: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("file", file);
        formData.append("slug", uploadSlug);

        const res = await fetch("/api/admin/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || `خطا در آپلود فایل ${file.name}`);
        }
        newUrls.push(data.url);
      }

      setImages((prev) => [...prev, ...newUrls]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "خطا در بارگذاری تصاویر");
    } finally {
      setUploading(false);
      if (multiImageInputRef.current) multiImageInputRef.current.value = "";
    }
  };

  // Add Image by Direct URL
  const handleAddImageLink = () => {
    const trimmed = imageLinkInput.trim();
    if (!trimmed) return;
    setImages((prev) => [...prev, trimmed]);
    setImageLinkInput("");
  };

  // Upload video
  const handleUploadVideo = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("slug", uploadSlug);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "خطا در آپلود ویدیو");

      setVideos((prev) => [...prev, data.url]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "خطا در آپلود ویدیو");
    } finally {
      setUploading(false);
      if (videoInputRef.current) videoInputRef.current.value = "";
    }
  };

  // Add Video by Direct URL
  const handleAddVideoLink = () => {
    const trimmed = videoLinkInput.trim();
    if (!trimmed) return;
    setVideos((prev) => [...prev, trimmed]);
    setVideoLinkInput("");
  };

  // Delete video
  const handleDeleteVideo = (index: number) => {
    setVideos((items) => items.filter((_, idx) => idx !== index));
  };

  // Save changes to database
  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(`/api/admin/variants/${variant.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          media: {
            images,
            videos,
          },
        }),
      });

      const updated = await res.json();
      if (!res.ok) {
        throw new Error(updated.error || "خطا در ذخیره مدیا در دیتابیس");
      }

      setSuccessMessage("تغییرات مدیا با موفقیت در پایگاه داده ثبت شد!");
      onSaved?.({
        id: variant.id,
        sku: variant.sku,
        media: { images, videos },
      });

      // Auto close after brief moment
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "خطا در ثبت تغییرات");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto" dir="rtl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-bold text-gray-900 sm:text-lg">
              مدیریت تصاویر و ویدیوهای واریانت
            </DialogTitle>
            <Badge variant="outline" className="num-en font-mono font-bold">
              SKU: {variant.sku}
            </Badge>
          </div>
          <DialogDescription className="text-xs text-gray-500">
            {familyName} — {variant.name || (variant.size ? `سایز فریم ${variant.size}` : "")}{" "}
            {variant.power ? `(${variant.power})` : ""}
          </DialogDescription>
        </DialogHeader>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200">
          <button
            type="button"
            onClick={() => setActiveTab("images")}
            className={`flex items-center gap-1.5 border-b-2 px-4 py-2 text-xs font-semibold transition-colors ${
              activeTab === "images"
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <ImageIcon size={14} />
            گالری تصاویر ({images.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("videos")}
            className={`flex items-center gap-1.5 border-b-2 px-4 py-2 text-xs font-semibold transition-colors ${
              activeTab === "videos"
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <Film size={14} />
            ویدیوها ({videos.length})
          </button>
        </div>

        {/* Feedback alerts */}
        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 p-2.5 text-xs text-red-700">
            <AlertCircle size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {successMessage && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-2.5 text-xs text-emerald-700">
            <Check size={14} className="shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* ─── TAB 1: Images & Drag-and-Drop Reordering ─── */}
        {activeTab === "images" && (
          <div className="space-y-4 pt-2">
            {/* Action Bar: Upload & Add Link */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {/* Multi Upload Button */}
              <div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => multiImageInputRef.current?.click()}
                  disabled={uploading || saving}
                  className="w-full border-dashed border-blue-300 bg-blue-50/50 hover:bg-blue-100/50"
                >
                  {uploading ? (
                    <Loader2 size={14} className="animate-spin ml-1.5 text-blue-600" />
                  ) : (
                    <UploadCloud size={14} className="ml-1.5 text-blue-600" />
                  )}
                  بارگذاری عکس‌های جدید (چندگانه)
                </Button>
                <input
                  ref={multiImageInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => void handleUploadImages(e.target.files)}
                />
                <p className="mt-1 text-[11px] text-gray-400">
                  فرمت‌های JPEG، PNG، WebP یا GIF (تبدیل خودکار به WebP با کیفیت بالا)
                </p>
              </div>

              {/* Add by URL */}
              <div>
                <div className="flex gap-1.5">
                  <Input
                    placeholder="یا درج آدرس مستقیم تصویر..."
                    value={imageLinkInput}
                    onChange={(e) => setImageLinkInput(e.target.value)}
                    dir="ltr"
                    className="text-xs"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddImageLink();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddImageLink}
                    disabled={!imageLinkInput.trim()}
                    className="shrink-0"
                  >
                    <Plus size={14} className="ml-1" /> افزودن
                  </Button>
                </div>
                <p className="mt-1 text-[11px] text-gray-400">
                  مثال: /media/products/assets/image.webp یا لینک بیرونی
                </p>
              </div>
            </div>

            {/* Instruction Tip */}
            <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
              <span>
                💡 برای تغییر ترتیب نمایش، تصاویر را با ماوس بکشید و رها کنید (Drag & Drop) یا از دکمه‌های جهت‌نما
                استفاده کنید. اولین عکس همواره <strong>تصویر شاخص</strong> واریانت خواهد بود.
              </span>
            </div>

            {/* Sortable Image Grid */}
            {images.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-10 text-center">
                <ImageIcon size={36} className="text-gray-300 mb-2" />
                <p className="text-xs font-medium text-gray-500">هیچ تصویری برای این واریانت ثبت نشده است</p>
                <p className="text-[11px] text-gray-400 mt-1">از دکمه بالا برای بارگذاری تصاویر جدید استفاده کنید</p>
              </div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={images.map((_, idx) => `img-${idx}`)} strategy={rectSortingStrategy}>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {images.map((src, index) => (
                      <SortableImageItem
                        key={`img-${index}-${src}`}
                        id={`img-${index}`}
                        src={src}
                        index={index}
                        total={images.length}
                        isPrimary={index === 0}
                        onSetPrimary={handleSetPrimary}
                        onMove={handleMoveImage}
                        onDelete={handleDeleteImage}
                        onReplace={handleReplaceImage}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        )}

        {/* ─── TAB 2: Videos ─── */}
        {activeTab === "videos" && (
          <div className="space-y-4 pt-2">
            {/* Upload Video & Add by URL */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => videoInputRef.current?.click()}
                  disabled={uploading || saving}
                  className="w-full border-dashed border-purple-300 bg-purple-50/50 hover:bg-purple-100/50"
                >
                  {uploading ? (
                    <Loader2 size={14} className="animate-spin ml-1.5 text-purple-600" />
                  ) : (
                    <Film size={14} className="ml-1.5 text-purple-600" />
                  )}
                  بارگذاری ویدیوی جدید (MP4, WebM)
                </Button>
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleUploadVideo(file);
                  }}
                />
                <p className="mt-1 text-[11px] text-gray-400">فرمت‌های MP4 یا WebM تا سقف ۱۰۰ مگابایت</p>
              </div>

              <div>
                <div className="flex gap-1.5">
                  <Input
                    placeholder="یا درج لینک مستقیم فایل ویدیو..."
                    value={videoLinkInput}
                    onChange={(e) => setVideoLinkInput(e.target.value)}
                    dir="ltr"
                    className="text-xs"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddVideoLink();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddVideoLink}
                    disabled={!videoLinkInput.trim()}
                    className="shrink-0"
                  >
                    <Plus size={14} className="ml-1" /> افزودن
                  </Button>
                </div>
                <p className="mt-1 text-[11px] text-gray-400">مثال: /media/products/assets/clip.mp4</p>
              </div>
            </div>

            {/* Video List */}
            {videos.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-10 text-center">
                <Film size={36} className="text-gray-300 mb-2" />
                <p className="text-xs font-medium text-gray-500">هیچ ویدیویی برای این واریانت ثبت نشده است</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {videos.map((vidSrc, vIdx) => (
                  <div
                    key={`${vidSrc}-${vIdx}`}
                    className="flex flex-col rounded-xl border border-gray-200 bg-white p-2.5 shadow-2xs"
                  >
                    <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
                      <video
                        src={vidSrc}
                        controls
                        preload="metadata"
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <p dir="ltr" className="truncate text-[11px] font-mono text-gray-500" title={vidSrc}>
                        {vidSrc}
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteVideo(vIdx)}
                        className="h-6 w-6 p-0 text-red-500 hover:bg-red-50 hover:text-red-700"
                        title="حذف ویدیو"
                        aria-label="حذف ویدیو"
                      >
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-end gap-2 border-t border-gray-200 pt-3">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={saving}>
            انصراف
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={saving || uploading}
            className="bg-blue-700 text-white hover:bg-blue-800"
          >
            {saving ? (
              <Loader2 size={14} className="animate-spin ml-1.5" />
            ) : (
              <Check size={14} className="ml-1.5" />
            )}
            ذخیره تغییرات مدیا در دیتابیس
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
