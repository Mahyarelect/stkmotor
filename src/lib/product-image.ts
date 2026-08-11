/**
 * Normalize product image paths for files served from Next.js /public.
 * Local panel values may be "products/motor.webp", "/products/motor.webp",
 * or "public/products/motor.webp". Remote http(s) URLs are preserved.
 */
export function normalizeProductImageUrl(value?: string | null): string | null {
  if (!value) return null;
  const raw = value.trim();
  if (!raw) return null;
  if (/^(https?:|data:|blob:)/i.test(raw)) return raw;

  let path = raw.replace(/\\/g, "/");
  path = path.replace(/^\.\//, "");
  path = path.replace(/^public\//i, "");
  path = path.replace(/^\/+/, "");
  return path ? `/${path}` : null;
}
