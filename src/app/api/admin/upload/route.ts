import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const ALLOWED_FORMATS = new Set(["jpeg", "png", "webp"]);

function safeSlug(value: FormDataEntryValue | null): string | null {
  const slug = String(value ?? "").trim().toLowerCase();
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ? slug : null;
}

function unauthorized(error: unknown) {
  return error instanceof Error && error.message === "Unauthorized";
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const formData = await request.formData();
    const file = formData.get("file");
    const slug = safeSlug(formData.get("slug"));

    if (!(file instanceof File) || !slug) {
      return NextResponse.json({ error: "فایل و slug معتبر الزامی است." }, { status: 400 });
    }
    if (!ALLOWED_TYPES.has(file.type) || file.size === 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "فقط JPEG، PNG یا WebP تا حجم ۱۰ مگابایت مجاز است." }, { status: 400 });
    }

    const input = Buffer.from(await file.arrayBuffer());
    const metadata = await sharp(input, { failOn: "error", limitInputPixels: 40_000_000 }).metadata();
    if (!metadata.format || !ALLOWED_FORMATS.has(metadata.format)) {
      return NextResponse.json({ error: "محتوای فایل، تصویر پشتیبانی‌شده نیست." }, { status: 400 });
    }

    const output = await sharp(input, { failOn: "error", limitInputPixels: 40_000_000 })
      .rotate()
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82, effort: 4 })
      .toBuffer({ resolveWithObject: true });

    const directory = path.join(process.cwd(), "public", "products", slug);
    await mkdir(directory, { recursive: true });
    const filename = `${Date.now()}-${randomUUID().slice(0, 8)}.webp`;
    await writeFile(path.join(directory, filename), output.data, { flag: "wx" });

    return NextResponse.json({
      url: `/products/${slug}/${filename}`,
      width: output.info.width,
      height: output.info.height,
      size: output.info.size,
    }, { status: 201 });
  } catch (error: unknown) {
    if (unauthorized(error)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (error instanceof Error && /Input buffer|image|pixel|unsupported/i.test(error.message)) {
      return NextResponse.json({ error: "تصویر خراب یا نامعتبر است." }, { status: 400 });
    }
    console.error("Admin image upload failed", error);
    return NextResponse.json({ error: "ذخیره تصویر انجام نشد." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
    const url = new URL(request.url).searchParams.get("url") ?? "";
    if (!/^\/products\/[a-z0-9]+(?:-[a-z0-9]+)*\/[a-zA-Z0-9-]+\.webp$/.test(url)) {
      return NextResponse.json({ error: "مسیر تصویر معتبر نیست." }, { status: 400 });
    }
    const publicRoot = path.resolve(process.cwd(), "public");
    const target = path.resolve(publicRoot, `.${url}`);
    if (!target.startsWith(`${publicRoot}${path.sep}`)) {
      return NextResponse.json({ error: "مسیر تصویر معتبر نیست." }, { status: 400 });
    }
    await unlink(target).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== "ENOENT") throw error;
    });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (unauthorized(error)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "حذف تصویر انجام نشد." }, { status: 500 });
  }
}
