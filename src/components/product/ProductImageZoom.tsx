"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  X,
  Maximize2,
  Cog,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { normalizeProductImageUrl } from "@/lib/product-image";

export interface ProductImageZoomProps {
  src?: string | null;
  alt: string;
  className?: string;
  placeholderClassName?: string;
  iconSize?: number;
  loading?: "eager" | "lazy";
  // PROJECT.md interface contract names
  images?: string[];
  initialIndex?: number;
  onThumbnailSelect?: (index: number) => void;
  // Alternate aliases
  allImages?: string[];
  activeIndex?: number;
  onSelectImage?: (index: number) => void;
}

const DESKTOP_ZOOM_SCALE = 2.4;
const LENS_SIZE = 130;

function faNum(n: number | string): string {
  return String(n).replace(/\d/g, (d) => "\u06F0\u06F1\u06F2\u06F3\u06F4\u06F5\u06F6\u06F7\u06F8\u06F9"[parseInt(d)]);
}

export function ProductImageZoom({
  src,
  alt,
  className = "h-full w-full object-contain p-5 sm:p-6",
  placeholderClassName = "text-gray-300",
  iconSize = 56,
  loading = "eager",
  images = [],
  initialIndex,
  onThumbnailSelect,
  allImages = [],
  activeIndex,
  onSelectImage,
}: ProductImageZoomProps) {
  const normalizedSrc = normalizeProductImageUrl(src);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const failed = Boolean(normalizedSrc && failedSrc === normalizedSrc);

  // Desktop hover zoom state & refs
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const lensRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const rafId = useRef<number | null>(null);

  // Gallery images resolution
  const resolvedImages = images.length > 0 ? images : allImages.length > 0 ? allImages : normalizedSrc ? [normalizedSrc] : [];
  const resolvedActiveIndex = typeof initialIndex === "number" ? initialIndex : typeof activeIndex === "number" ? activeIndex : 0;

  // Fullscreen modal state & refs
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalScale, setModalScale] = useState(1);
  const [modalTranslate, setModalTranslate] = useState({ x: 0, y: 0 });
  const [modalIndex, setModalIndex] = useState(resolvedActiveIndex);

  const gestureAreaRef = useRef<HTMLDivElement>(null);
  const pinchStartDist = useRef<number | null>(null);
  const pinchStartScale = useRef(1);
  const isDragging = useRef(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const translateStart = useRef({ x: 0, y: 0 });
  const lastTapTime = useRef(0);

  // Sync modalIndex when external active index changes
  useEffect(() => {
    setModalIndex(resolvedActiveIndex);
  }, [resolvedActiveIndex]);

  // Desktop hover tracking with 60fps RAF & clamped boundaries
  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch") return; // Touch devices open modal
    if (!containerRef.current || !imageRef.current) return;

    if (rafId.current !== null) {
      cancelAnimationFrame(rafId.current);
    }

    const clientX = e.clientX;
    const clientY = e.clientY;

    rafId.current = requestAnimationFrame(() => {
      if (!containerRef.current || !imageRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      // Clamped cursor coordinates within container boundaries
      const clampedCursorX = Math.max(0, Math.min(rect.width, clientX - rect.left));
      const clampedCursorY = Math.max(0, Math.min(rect.height, clientY - rect.top));

      // Percentages for inner zoom transform origin [0%, 100%]
      // Strictly guarantees no blank gaps outside bounds
      const xPercent = (clampedCursorX / rect.width) * 100;
      const yPercent = (clampedCursorY / rect.height) * 100;

      // Clamped lens position [0, rect.width - LENS_SIZE]
      const halfLens = LENS_SIZE / 2;
      const lensX = Math.max(0, Math.min(rect.width - LENS_SIZE, clampedCursorX - halfLens));
      const lensY = Math.max(0, Math.min(rect.height - LENS_SIZE, clampedCursorY - halfLens));

      // Apply fast 60fps transform
      imageRef.current.style.transition = "transform 0.05s ease-out, transform-origin 0.05s ease-out";
      imageRef.current.style.transformOrigin = `${xPercent.toFixed(2)}% ${yPercent.toFixed(2)}%`;
      imageRef.current.style.transform = `scale(${DESKTOP_ZOOM_SCALE})`;

      if (lensRef.current) {
        lensRef.current.style.transform = `translate3d(${lensX.toFixed(1)}px, ${lensY.toFixed(1)}px, 0)`;
        lensRef.current.style.opacity = "1";
      }
    });
  }, []);

  const handlePointerEnter = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch") return;
    setIsHovered(true);
    if (imageRef.current) {
      imageRef.current.style.transition = "transform 0.15s ease-out";
    }
  }, []);

  const handlePointerLeave = useCallback(() => {
    setIsHovered(false);
    if (rafId.current !== null) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
    if (lensRef.current) {
      lensRef.current.style.opacity = "0";
    }
    if (imageRef.current) {
      imageRef.current.style.transition = "transform 0.25s ease-out, transform-origin 0.25s ease-out";
      imageRef.current.style.transformOrigin = "center center";
      imageRef.current.style.transform = "scale(1)";
    }
  }, []);

  // Clean reset when image source changes
  useEffect(() => {
    setIsHovered(false);
    if (rafId.current !== null) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
    if (lensRef.current) {
      lensRef.current.style.opacity = "0";
    }
    if (imageRef.current) {
      imageRef.current.style.transition = "none";
      imageRef.current.style.transformOrigin = "center center";
      imageRef.current.style.transform = "scale(1)";
    }
    setModalScale(1);
    setModalTranslate({ x: 0, y: 0 });
  }, [normalizedSrc]);

  // Modal pan clamping helper
  const clampModalPan = useCallback((targetX: number, targetY: number, scale: number) => {
    if (scale <= 1.05) {
      return { x: 0, y: 0 };
    }
    const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 800;
    const viewportHeight = typeof window !== "undefined" ? window.innerHeight : 600;

    const maxPanX = Math.max(0, ((scale - 1) * viewportWidth) / 2);
    const maxPanY = Math.max(0, ((scale - 1) * viewportHeight) / 2);

    const clampedX = Math.max(-maxPanX, Math.min(maxPanX, targetX));
    const clampedY = Math.max(-maxPanY, Math.min(maxPanY, targetY));

    return { x: clampedX, y: clampedY };
  }, []);

  // Modal zoom controls
  const handleZoomIn = useCallback(() => {
    setModalScale((prev) => {
      const next = Math.min(4, Number((prev + 0.5).toFixed(1)));
      setModalTranslate((pos) => clampModalPan(pos.x, pos.y, next));
      return next;
    });
  }, [clampModalPan]);

  const handleZoomOut = useCallback(() => {
    setModalScale((prev) => {
      const next = Math.max(1, Number((prev - 0.5).toFixed(1)));
      setModalTranslate((pos) => clampModalPan(pos.x, pos.y, next));
      return next;
    });
  }, [clampModalPan]);

  const handleZoomReset = useCallback(() => {
    setModalScale(1);
    setModalTranslate({ x: 0, y: 0 });
    setIsInteracting(false);
  }, []);

  // Modal image selection
  const handleSelectImage = useCallback((index: number) => {
    setModalIndex(index);
    handleZoomReset();
    if (onThumbnailSelect) onThumbnailSelect(index);
    if (onSelectImage) onSelectImage(index);
  }, [handleZoomReset, onThumbnailSelect, onSelectImage]);

  const handleNextImage = useCallback(() => {
    if (resolvedImages.length <= 1) return;
    const nextIdx = (modalIndex + 1) % resolvedImages.length;
    handleSelectImage(nextIdx);
  }, [resolvedImages.length, modalIndex, handleSelectImage]);

  const handlePrevImage = useCallback(() => {
    if (resolvedImages.length <= 1) return;
    const prevIdx = (modalIndex - 1 + resolvedImages.length) % resolvedImages.length;
    handleSelectImage(prevIdx);
  }, [resolvedImages.length, modalIndex, handleSelectImage]);

  // Touch gesture handlers for mobile modal
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setIsInteracting(true);
    if (e.touches.length === 2) {
      // 2-touch pinch start
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      pinchStartDist.current = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      pinchStartScale.current = modalScale;
      isDragging.current = false;
    } else if (e.touches.length === 1) {
      // 1-touch pan start
      dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      translateStart.current = { ...modalTranslate };
      isDragging.current = true;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && pinchStartDist.current !== null) {
      // Pinch gesture
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const currentDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      if (pinchStartDist.current > 0) {
        const factor = currentDist / pinchStartDist.current;
        const targetScale = Math.max(1, Math.min(4, Number((pinchStartScale.current * factor).toFixed(2))));
        setModalScale(targetScale);
        setModalTranslate((pos) => clampModalPan(pos.x, pos.y, targetScale));
      }
    } else if (e.touches.length === 1 && modalScale > 1.05 && isDragging.current) {
      // 1-finger pan with boundary clamping
      const touch = e.touches[0];
      const dx = touch.clientX - dragStart.current.x;
      const dy = touch.clientY - dragStart.current.y;
      const targetX = translateStart.current.x + dx;
      const targetY = translateStart.current.y + dy;
      setModalTranslate(clampModalPan(targetX, targetY, modalScale));
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length < 2) {
      pinchStartDist.current = null;
    }
    if (e.touches.length === 0) {
      isDragging.current = false;
      setIsInteracting(false);
      if (modalScale <= 1.05) {
        setModalTranslate({ x: 0, y: 0 });
      }

      // Double-tap zoom toggle within 300ms
      const now = Date.now();
      const timeSinceLastTap = now - lastTapTime.current;
      if (timeSinceLastTap < 300 && timeSinceLastTap > 40) {
        if (modalScale > 1.2) {
          handleZoomReset();
        } else {
          setModalScale(2.5);
          setModalTranslate({ x: 0, y: 0 });
        }
        lastTapTime.current = 0;
        return;
      }
      lastTapTime.current = now;
    }
  };

  // Mouse pan inside modal on desktop
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (modalScale > 1.05) {
      setIsInteracting(true);
      isDragging.current = true;
      dragStart.current = { x: e.clientX, y: e.clientY };
      translateStart.current = { ...modalTranslate };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging.current && modalScale > 1.05) {
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      const targetX = translateStart.current.x + dx;
      const targetY = translateStart.current.y + dy;
      setModalTranslate(clampModalPan(targetX, targetY, modalScale));
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    setIsInteracting(false);
  };

  const handleDoubleClick = () => {
    setIsInteracting(false);
    if (modalScale > 1.2) {
      handleZoomReset();
    } else {
      setModalScale(2.5);
      setModalTranslate({ x: 0, y: 0 });
    }
  };

  // Body scroll locking and keyboard handling
  useEffect(() => {
    if (!isModalOpen) return;

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsModalOpen(false);
        handleZoomReset();
      } else if (e.key === "+" || e.key === "=") {
        handleZoomIn();
      } else if (e.key === "-") {
        handleZoomOut();
      } else if (e.key === "0") {
        handleZoomReset();
      } else if (e.key === "ArrowLeft" && modalScale <= 1.05) {
        handleNextImage();
      } else if (e.key === "ArrowRight" && modalScale <= 1.05) {
        handlePrevImage();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isModalOpen, modalScale, handleZoomIn, handleZoomOut, handleZoomReset, handleNextImage, handlePrevImage]);

  if (!normalizedSrc || failed) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center text-center">
        <Cog size={iconSize} className={`${placeholderClassName} mb-1`} />
        <p className="text-xs text-gray-400/70">تصویر محصول</p>
      </div>
    );
  }

  const modalActiveSrc = resolvedImages[modalIndex] || normalizedSrc;
  const normalizedModalSrc = normalizeProductImageUrl(modalActiveSrc) || normalizedSrc;

  return (
    <>
      {/* Primary Image Container with Inner Lens Zoom */}
      <div
        ref={containerRef}
        onPointerEnter={handlePointerEnter}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onClick={() => {
          setIsModalOpen(true);
        }}
        data-testid="product-image-zoom-container"
        className="relative h-full w-full overflow-hidden rounded-2xl flex items-center justify-center cursor-zoom-in select-none group"
      >
        <img
          ref={imageRef}
          src={normalizedSrc}
          alt={alt}
          className={`${className} will-change-transform`}
          loading={loading}
          decoding="async"
          onError={() => setFailedSrc(normalizedSrc)}
          style={{
            transform: "scale(1)",
            transformOrigin: "center center",
          }}
        />

        {/* Desktop Inner Zoom Magnifier Lens */}
        <div
          ref={lensRef}
          aria-hidden="true"
          data-testid="product-image-zoom-lens"
          className="pointer-events-none absolute top-0 left-0 hidden lg:block rounded-2xl border-2 border-blue-500/80 bg-blue-500/10 shadow-lg backdrop-contrast-125 transition-opacity duration-150"
          style={{
            width: `${LENS_SIZE}px`,
            height: `${LENS_SIZE}px`,
            opacity: 0,
            willChange: "transform, opacity",
          }}
        >
          {/* Subtle crosshair center reticle */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-blue-600/90 shadow-xs ring-2 ring-white/90" />
          </div>
          <div className="absolute top-1.5 right-2 rounded-sm bg-blue-600/90 px-1 py-0.2 text-[9px] font-bold text-white shadow-xs select-none">
            {DESKTOP_ZOOM_SCALE}×
          </div>
        </div>

        {/* Action Button & Indicator Badges */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsModalOpen(true);
          }}
          aria-label="بزرگنمایی تمام‌صفحه تصویر"
          className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/70 hover:bg-black/90 backdrop-blur-xs text-white text-xs font-medium shadow-md transition-all cursor-pointer group-hover:scale-105"
        >
          <Maximize2 size={13} className="text-blue-400" />
          <span className="hidden sm:inline">بزرگنمایی تمام‌صفحه</span>
          <span className="sm:hidden">زوم</span>
        </button>

        {isHovered && (
          <div
            data-testid="zoom-hover-badge"
            className="hidden lg:flex absolute top-3 left-3 items-center gap-1 px-2.5 py-1 rounded-md bg-blue-600/90 backdrop-blur-xs text-white text-[11px] font-medium shadow-sm pointer-events-none animate-in fade-in duration-150"
          >
            <span>ذره‌بین {faNum(DESKTOP_ZOOM_SCALE)} برابر</span>
          </div>
        )}
      </div>

      {/* Fullscreen Touch/Pinch Zoom Modal via Portal */}
      {isModalOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="بزرگنمایی تمام‌صفحه تصویر"
            data-testid="product-image-zoom-modal"
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col select-none animate-in fade-in duration-200 overflow-hidden"
          >
            {/* Top Toolbar */}
            <div className="flex items-center justify-between px-4 py-3 bg-black/50 border-b border-white/10 text-white z-10 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    handleZoomReset();
                  }}
                  className="min-h-11 min-w-11 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 active:bg-white/30 transition-colors text-white cursor-pointer"
                  aria-label="بستن بزرگنمایی"
                >
                  <X size={22} />
                </button>
                <div className="text-right min-w-0">
                  <p className="text-sm font-medium text-white/90 truncate">{alt}</p>
                  {resolvedImages.length > 1 && (
                    <p className="text-xs text-white/60 mt-0.5">
                      تصویر {faNum(modalIndex + 1)} از {faNum(resolvedImages.length)}
                    </p>
                  )}
                </div>
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-white/10 text-white/80 font-mono text-xs">
                  {modalScale.toFixed(1)}×
                </span>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  className="min-h-11 min-w-11 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 active:bg-white/30 transition-colors text-white cursor-pointer"
                  aria-label="افزایش بزرگنمایی"
                >
                  <ZoomIn size={18} />
                </button>
                <button
                  type="button"
                  onClick={handleZoomOut}
                  className="min-h-11 min-w-11 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 active:bg-white/30 transition-colors text-white cursor-pointer"
                  aria-label="کاهش بزرگنمایی"
                >
                  <ZoomOut size={18} />
                </button>
                <button
                  type="button"
                  onClick={handleZoomReset}
                  className="min-h-11 min-w-11 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 active:bg-white/30 transition-colors text-white cursor-pointer"
                  aria-label="بازنشانی بزرگنمایی"
                >
                  <RotateCcw size={16} />
                </button>
              </div>
            </div>

            {/* Gesture Canvas Area */}
            <div
              ref={gestureAreaRef}
              data-testid="zoom-canvas"
              className="flex-1 relative overflow-hidden flex items-center justify-center touch-none cursor-grab active:cursor-grabbing select-none"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onDoubleClick={handleDoubleClick}
              onClick={(e) => {
                // Light dismiss when clicking the backdrop at scale 1
                if (e.target === gestureAreaRef.current && modalScale <= 1.05) {
                  setIsModalOpen(false);
                  handleZoomReset();
                }
              }}
            >
              {/* Prev / Next navigation arrows when multiple images */}
              {resolvedImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrevImage();
                    }}
                    aria-label="تصویر قبلی"
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-20 min-h-11 min-w-11 flex items-center justify-center rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 shadow-lg cursor-pointer transition-transform hover:scale-110 active:scale-95"
                  >
                    <ChevronRight size={24} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNextImage();
                    }}
                    aria-label="تصویر بعدی"
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-20 min-h-11 min-w-11 flex items-center justify-center rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 shadow-lg cursor-pointer transition-transform hover:scale-110 active:scale-95"
                  >
                    <ChevronLeft size={24} />
                  </button>
                </>
              )}

              <img
                src={normalizedModalSrc}
                alt={alt}
                className="max-h-[80vh] max-w-[90vw] object-contain select-none pointer-events-none will-change-transform"
                style={{
                  transform: `translate3d(${modalTranslate.x}px, ${modalTranslate.y}px, 0) scale(${modalScale})`,
                  transformOrigin: "center center",
                  transition: isInteracting ? "none" : "transform 0.2s ease-out",
                }}
                draggable={false}
              />
            </div>

            {/* Bottom Thumbnail Strip inside Modal */}
            {resolvedImages.length > 1 && (
              <div
                role="tablist"
                aria-label="تصاویر گالری در بزرگنمایی"
                className="px-4 py-3 bg-black/60 border-t border-white/10 flex items-center justify-center gap-2 overflow-x-auto z-10 shrink-0"
              >
                {resolvedImages.map((imageSrc, idx) => (
                  <button
                    key={`modal-thumb-${imageSrc}-${idx}`}
                    type="button"
                    role="tab"
                    aria-selected={modalIndex === idx}
                    aria-label={`نمایش تصویر ${faNum(idx + 1)}`}
                    onClick={() => {
                      handleSelectImage(idx);
                    }}
                    className={`relative h-14 w-14 shrink-0 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                      modalIndex === idx
                        ? "border-blue-500 ring-2 ring-blue-500/50 scale-105"
                        : "border-white/20 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={normalizeProductImageUrl(imageSrc) || ""}
                      alt=""
                      className="h-full w-full object-contain p-1"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>,
          document.body
        )}
    </>
  );
}
