export interface ImportedPriceRow {
  row: number;
  sku: string;
  price: bigint | null;
}

const SKU_HEADERS = ["sku", "کد", "کد کالا", "کد محصول", "شناسه کالا"];
const PRICE_HEADERS = ["price", "new price", "newprice", "قیمت", "قیمت جدید"];

export function normalizeDigits(value: unknown): string {
  return String(value ?? "")
    .trim()
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
}

function normalizeHeader(value: unknown): string {
  return normalizeDigits(value).toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
}

export function parsePrice(value: unknown): bigint | null {
  const normalized = normalizeDigits(value).replace(/[،,٬\s]/g, "").replace(/تومان|ریال/gi, "");
  if (!/^\d+$/.test(normalized)) return null;
  try {
    const result = BigInt(normalized);
    return result >= BigInt(0) ? result : null;
  } catch {
    return null;
  }
}

export function rowsToImportedPrices(rows: unknown[][]): ImportedPriceRow[] {
  if (rows.length < 2) return [];
  const headers = rows[0].map(normalizeHeader);
  const skuIndex = headers.findIndex((header) => SKU_HEADERS.includes(header));
  const priceIndex = headers.findIndex((header) => PRICE_HEADERS.includes(header));
  if (skuIndex === -1 || priceIndex === -1) {
    throw new Error("فایل باید ستون‌های SKU و price (یا معادل فارسی آن‌ها) داشته باشد.");
  }

  return rows.slice(1, 5001).map((row, index) => ({
    row: index + 2,
    sku: normalizeDigits(row[skuIndex]),
    price: parsePrice(row[priceIndex]),
  }));
}

export function parseCsv(text: string): unknown[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"') {
      if (quoted && text[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && text[index + 1] === "\n") index += 1;
      row.push(cell);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += character;
    }
  }
  row.push(cell);
  if (row.some((value) => value.trim())) rows.push(row);
  return rows;
}

export function serializePrice(value: bigint): number | string {
  return value <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(value) : value.toString();
}
