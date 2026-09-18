import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";

const MAX_IMAGE_SIZE = 15 * 1024 * 1024;
const MAX_VIDEO_SIZE = 100 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const ALLOWED_IMAGE_FORMATS = new Set(["jpeg", "png", "webp", "gif"]);
const ALLOWED_VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime", "video/x-matroska"]);

function safeSlug(value: FormDataEntryValue | null): string | null {
  const slug = String(value ?? "").trim().toLowerCase();
  return /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/.test(slug) ? slug : null;
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

    const isVideo = ALLOWED_VIDEO_TYPES.has(file.type) || file.type.startsWith("video/");
    const isImage = ALLOWED_IMAGE_TYPES.has(file.type) || file.type.startsWith("image/");

    if (!isImage && !isVideo) {
      return NextResponse.json(
        { error: "فرمت فایل مجاز نیست. لطفاً تصویر (JPEG, PNG, WebP) یا ویدیو (MP4, WebM) بارگذاری نمایید." },
        { status: 400 }
      );
    }

    const directory = path.join(process.cwd(), "public", "products", slug);
    await mkdir(directory, { recursive: true });

    // Handle Video upload
    if (isVideo) {
      if (file.size === 0 || file.size > MAX_VIDEO_SIZE) {
        return NextResponse.json({ error: "حجم ویدیو باید بین ۱ بایت تا ۱۰۰ مگابایت باشد." }, { status: 400 });
      }

      let ext = "mp4";
      if (file.type.includes("webm") || file.name.endsWith(".webm")) ext = "webm";
      else if (file.type.includes("quicktime") || file.name.endsWith(".mov")) ext = "mov";

      const filename = `${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(path.join(directory, filename), buffer, { flag: "wx" });

      return NextResponse.json(
        {
          url: `/products/${slug}/${filename}`,
          type: "video",
          size: file.size,
          filename,
        },
        { status: 201 }
      );
    }

    // Handle Image upload
    if (file.size === 0 || file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json({ error: "حجم تصویر باید حداکثر ۱۵ مگابایت باشد." }, { status: 400 });
    }

    const input = Buffer.from(await file.arrayBuffer());

    // If GIF, write directly to preserve animation
    if (file.type === "image/gif" || file.name.endsWith(".gif")) {
      const filename = `${Date.now()}-${randomUUID().slice(0, 8)}.gif`;
      await writeFile(path.join(directory, filename), input, { flag: "wx" });
      return NextResponse.json(
        {
          url: `/products/${slug}/${filename}`,
          type: "image",
          size: file.size,
        },
        { status: 201 }
      );
    }

    const metadata = await sharp(input, { failOn: "error", limitInputPixels: 40_000_000 }).metadata();
    if (!metadata.format || !ALLOWED_IMAGE_FORMATS.has(metadata.format)) {
      return NextResponse.json({ error: "محتوای فایل، تصویر پشتیبانی‌شده نیست." }, { status: 400 });
    }

    const output = await sharp(input, { failOn: "error", limitInputPixels: 40_000_000 })
      .rotate()
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82, effort: 4 })
      .toBuffer({ resolveWithObject: true });

    const filename = `${Date.now()}-${randomUUID().slice(0, 8)}.webp`;
    await writeFile(path.join(directory, filename), output.data, { flag: "wx" });

    return NextResponse.json(
      {
        url: `/products/${slug}/${filename}`,
        type: "image",
        width: output.info.width,
        height: output.info.height,
        size: output.info.size,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (unauthorized(error)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (error instanceof Error && /Input buffer|image|pixel|unsupported/i.test(error.message)) {
      return NextResponse.json({ error: "تصویر خراب یا نامعتبر است." }, { status: 400 });
    }
    console.error("Admin media upload failed", error);
    return NextResponse.json({ error: "ذخیره فایل انجام نشد." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
    const url = new URL(request.url).searchParams.get("url") ?? "";
    const isValidPath = /^\/products\/[a-z0-9_-]+\/[a-zA-Z0-9_-]+\.(webp|png|jpg|jpeg|gif|mp4|webm|mov)$/i.test(url);

    if (!isValidPath) {
      return NextResponse.json({ error: "مسیر فایل معتبر نیست." }, { status: 400 });
    }

    const publicRoot = path.resolve(process.cwd(), "public");
    const target = path.resolve(publicRoot, `.${url}`);
    if (!target.startsWith(`${publicRoot}${path.sep}`)) {
      return NextResponse.json({ error: "مسیر فایل معتبر نیست." }, { status: 400 });
    }

    await unlink(target).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== "ENOENT") throw error;
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (unauthorized(error)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "حذف فایل انجام نشد." }, { status: 500 });
  }
}
