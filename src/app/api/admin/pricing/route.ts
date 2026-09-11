import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { parseCsv, parsePrice, rowsToImportedPrices, serializePrice, type ImportedPriceRow } from "@/lib/pricing";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const variantSelect = {
  id: true,
  sku: true,
  name: true,
  price: true,
  brand: true,
  family: { select: { name: true, mainCategory: true, brand: true } },
} as const;

type CatalogVariant = Awaited<ReturnType<typeof findVariants>>[number];

async function findVariants(category?: string, brand?: string) {
  return db.productVariant.findMany({
    where: {
      ...(category ? { family: { mainCategory: category } } : {}),
      ...(brand ? { OR: [{ brand }, { family: { brand } }] } : {}),
    },
    select: variantSelect,
    orderBy: { sku: "asc" },
  });
}

function previewItem(variant: CatalogVariant, newPrice: bigint) {
  return {
    id: variant.id,
    sku: variant.sku,
    productName: variant.name || variant.family.name,
    category: variant.family.mainCategory,
    brand: variant.brand || variant.family.brand,
    oldPrice: serializePrice(variant.price),
    newPrice: serializePrice(newPrice),
    difference: serializePrice(newPrice - variant.price),
  };
}

async function importPreview(rows: ImportedPriceRow[]) {
  const invalidRows = rows.filter((row) => !row.sku || row.price === null).map((row) => row.row);
  const valid = rows.filter((row): row is ImportedPriceRow & { price: bigint } => Boolean(row.sku) && row.price !== null);
  const duplicates = new Set<string>();
  const lastBySku = new Map<string, (typeof valid)[number]>();
  for (const row of valid) {
    if (lastBySku.has(row.sku)) duplicates.add(row.sku);
    lastBySku.set(row.sku, row);
  }
  const variants = await db.productVariant.findMany({
    where: { sku: { in: [...lastBySku.keys()] } },
    select: variantSelect,
  });
  const found = new Set(variants.map((variant) => variant.sku));
  const changes = variants
    .map((variant) => previewItem(variant, lastBySku.get(variant.sku)!.price))
    .filter((item) => String(item.oldPrice) !== String(item.newPrice));
  const unchangedCount = variants.length - changes.length;
  return {
    changes,
    unchangedCount,
    missingSkus: [...lastBySku.keys()].filter((sku) => !found.has(sku)),
    invalidRows,
    duplicateSkus: [...duplicates],
    summary: { rows: rows.length, changes: changes.length, unchanged: unchangedCount },
  };
}

async function readSpreadsheet(file: File): Promise<ImportedPriceRow[]> {
  if (file.size === 0 || file.size > MAX_FILE_SIZE) throw new Error("حجم فایل باید کمتر از ۱۰ مگابایت باشد.");
  const extension = file.name.toLowerCase().split(".").pop();
  const buffer = Buffer.from(await file.arrayBuffer());
  if (extension === "csv") {
    return rowsToImportedPrices(parseCsv(buffer.toString("utf8").replace(/^\uFEFF/, "")));
  }
  if (extension === "xlsx") {
    const ExcelJS = (await import("exceljs")).default;
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as import("exceljs").Buffer);
    const worksheet = workbook.worksheets[0];
    if (!worksheet) return [];
    const rows: unknown[][] = [];
    worksheet.eachRow({ includeEmpty: false }, (row) => {
      const values: unknown[] = [];
      row.eachCell({ includeEmpty: true }, (cell, column) => { values[column - 1] = cell.text; });
      rows.push(values);
    });
    return rowsToImportedPrices(rows);
  }
  throw new Error("فقط فایل CSV یا XLSX قابل قبول است.");
}

export async function GET() {
  try {
    await requireAdmin();
    const [logs, families, variants] = await Promise.all([
      db.priceChangeLog.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
      db.productFamily.findMany({ select: { mainCategory: true, brand: true } }),
      db.productVariant.findMany({ select: { brand: true } }),
    ]);
    return NextResponse.json({
      logs: logs.map((log) => ({ ...log, oldPrice: serializePrice(log.oldPrice), newPrice: serializePrice(log.newPrice) })),
      categories: [...new Set(families.map((family) => family.mainCategory).filter(Boolean))].sort(),
      brands: [...new Set([...families.map((family) => family.brand), ...variants.map((variant) => variant.brand)].filter(Boolean))].sort(),
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("Pricing history failed", error);
    return NextResponse.json({ error: "دریافت اطلاعات قیمت ممکن نشد." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if ((request.headers.get("content-type") ?? "").includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file");
      if (!(file instanceof File)) return NextResponse.json({ error: "فایل الزامی است." }, { status: 400 });
      return NextResponse.json(await importPreview(await readSpreadsheet(file)));
    }

    const body = await request.json();
    if (body.type === "bulk") {
      const value = Number(body.value);
      const adjustmentType = body.adjustmentType;
      if (!Number.isFinite(value) || !["percentage", "fixed"].includes(adjustmentType)) {
        return NextResponse.json({ error: "نوع و مقدار تغییر معتبر نیست." }, { status: 400 });
      }
      if (adjustmentType === "percentage" && (value <= -100 || value > 1000)) {
        return NextResponse.json({ error: "درصد باید بیشتر از ۱۰۰- و حداکثر ۱۰۰۰ باشد." }, { status: 400 });
      }
      const variants = await findVariants(String(body.category ?? ""), String(body.brand ?? ""));
      const changes = variants.map((variant) => {
        const calculated = adjustmentType === "percentage"
          ? Math.round(Number(variant.price) * (1 + value / 100))
          : Number(variant.price) + Math.round(value);
        if (!Number.isSafeInteger(calculated) || calculated < 0) throw new Error("قیمت حاصل معتبر نیست.");
        return previewItem(variant, BigInt(calculated));
      }).filter((item) => String(item.oldPrice) !== String(item.newPrice));

      if (body.action !== "apply") return NextResponse.json({ changes, summary: { matched: variants.length, changes: changes.length } });
      if (changes.length > 2000) return NextResponse.json({ error: "حداکثر ۲۰۰۰ تغییر در هر عملیات مجاز است." }, { status: 400 });
      await db.$transaction(changes.flatMap((change) => [
        db.productVariant.update({ where: { id: change.id }, data: { price: BigInt(String(change.newPrice)) } }),
        db.priceChangeLog.create({ data: {
          sku: change.sku, productName: change.productName, category: change.category,
          oldPrice: BigInt(String(change.oldPrice)), newPrice: BigInt(String(change.newPrice)),
          source: `bulk-${adjustmentType}`, note: String(body.note ?? "").slice(0, 200),
          adminId: admin.userId, adminName: admin.name || admin.username,
        } }),
      ]));
      return NextResponse.json({ success: true, updated: changes.length });
    }

    if (body.type === "import" && body.action === "apply" && Array.isArray(body.changes)) {
      if (body.changes.length > 5000) return NextResponse.json({ error: "حداکثر ۵۰۰۰ ردیف مجاز است." }, { status: 400 });
      const requested = new Map<string, bigint>();
      for (const change of body.changes) {
        const price = parsePrice(change.newPrice);
        const sku = String(change.sku ?? "").trim();
        if (!sku || price === null) return NextResponse.json({ error: "اطلاعات تغییر قیمت نامعتبر است." }, { status: 400 });
        requested.set(sku, price);
      }
      const variants = await db.productVariant.findMany({ where: { sku: { in: [...requested.keys()] } }, select: variantSelect });
      if (variants.length !== requested.size) return NextResponse.json({ error: "یک یا چند SKU دیگر در کاتالوگ وجود ندارد؛ دوباره پیش‌نمایش بگیرید." }, { status: 409 });
      const changes = variants.map((variant) => previewItem(variant, requested.get(variant.sku)!))
        .filter((item) => String(item.oldPrice) !== String(item.newPrice));
      await db.$transaction(changes.flatMap((change) => [
        db.productVariant.update({ where: { id: change.id }, data: { price: BigInt(String(change.newPrice)) } }),
        db.priceChangeLog.create({ data: {
          sku: change.sku, productName: change.productName, category: change.category,
          oldPrice: BigInt(String(change.oldPrice)), newPrice: BigInt(String(change.newPrice)),
          source: body.source === "xlsx" ? "import-xlsx" : "import-csv",
          note: String(body.note ?? "").slice(0, 200), adminId: admin.userId, adminName: admin.name || admin.username,
        } }),
      ]));
      return NextResponse.json({ success: true, updated: changes.length });
    }

    return NextResponse.json({ error: "درخواست نامعتبر است." }, { status: 400 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (error instanceof SyntaxError) return NextResponse.json({ error: "بدنه درخواست معتبر نیست." }, { status: 400 });
    if (error instanceof Error && /فایل|ستون|قیمت/.test(error.message)) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error("Pricing operation failed", error);
    return NextResponse.json({ error: "عملیات قیمت انجام نشد." }, { status: 500 });
  }
}
