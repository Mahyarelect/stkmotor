/**
 * Persian & Arabic Text Normalization for STK Motor Catalog Search.
 * Handles orthographic variations (ZWNJ, Arabic chars, Perso-Arabic digits, compound terms).
 */

const ARABIC_TO_PERSIAN_CHARS: Record<string, string> = {
  "ي": "ی",
  "ى": "ی",
  "ك": "ک",
  "ة": "ه",
  "آ": "ا",
  "أ": "ا",
  "إ": "ا",
  "ؤ": "ا",
  "ئ": "ی",
};

const PERSIAN_ARABIC_DIGITS: Record<string, string> = {
  "۰": "0", "۱": "1", "۲": "2", "۳": "3", "۴": "4",
  "۵": "5", "۶": "6", "۷": "7", "۸": "8", "۹": "9",
  "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4",
  "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9",
};

const STOP_WORDS = new Set([
  "و", "یا", "از", "به", "در", "با", "برای", "که", "تا", "این", "آن", "ها", "های",
  "نوع", "مدل", "دستگاه", "محصول", "قیمت", "خرید", "فروش"
]);

/**
 * Converts Persian and Arabic numerals to ASCII digits (0-9).
 */
export function normalizeDigits(input: string): string {
  if (!input) return "";
  return input.replace(/[۰-۹٠-٩]/g, (char) => PERSIAN_ARABIC_DIGITS[char] || char);
}

/**
 * Normalizes Persian/Arabic text into canonical search form.
 */
export function normalizePersianText(input: string): string {
  if (!input) return "";

  let text = input.trim();

  // 1. Convert digits to ASCII
  text = normalizeDigits(text);

  // 2. Handle decimal separators like 1,5 or ۱٫۵ or 1.5
  text = text.replace(/(\d)[,٫](\d)/g, "$1.$2");
  // Temporarily protect decimal point using a unicode private char
  text = text.replace(/(\d)\.(\d)/g, "$1\uE000$2");

  // 3. Normalize Arabic characters (including alef maksura \u0649 and yeh-hamza \u0626)
  text = text.replace(/[يكىةآأإؤئ]/g, (char) => ARABIC_TO_PERSIAN_CHARS[char] || char);

  // 4. Remove Arabic/Persian diacritics and tatweel/kashida
  text = text.replace(/[\u064B-\u065F\u0670\u0640]/g, "");

  // 5. Remove zero-width non-joiners (ZWNJ), ZWJ, and non-breaking spaces
  text = text.replace(/[\u200C\u200D\u200E\u200F\u00A0\u00AD]/g, " ");

  // 6. Canonicalize compound words that are inconsistently spaced across database records
  text = text
    .replace(/(?<=^|[^\p{L}\p{N}])الکترو\s*موتور(?=$|[^\p{L}\p{N}])/gu, "الکتروموتور")
    .replace(/(?<=^|[^\p{L}\p{N}])الکترو\s*پمپ(?=$|[^\p{L}\p{N}])/gu, "الکتروپمپ")
    .replace(/(?<=^|[^\p{L}\p{N}])تک\s*فاز(?=$|[^\p{L}\p{N}])/gu, "تکفاز")
    .replace(/(?<=^|[^\p{L}\p{N}])سه\s*فاز(?=$|[^\p{L}\p{N}])/gu, "سهفاز")
    .replace(/(?<=^|[^\p{L}\p{N}])کف\s*کش(?=$|[^\p{L}\p{N}])/gu, "کفکش")
    .replace(/(?<=^|[^\p{L}\p{N}])لجن\s*کش(?=$|[^\p{L}\p{N}])/gu, "لجنکش")
    .replace(/(?<=^|[^\p{L}\p{N}])فلوتر\s*دار(?=$|[^\p{L}\p{N}])/gu, "فلوتردار")
    .replace(/(?<=^|[^\p{L}\p{N}])پایه\s*دار(?=$|[^\p{L}\p{N}])/gu, "پایهدار")
    .replace(/(?<=^|[^\p{L}\p{N}])فلنج\s*دار(?=$|[^\p{L}\p{N}])/gu, "فلنجدار")
    .replace(/(?<=^|[^\p{L}\p{N}])نیم\s*فلنج(?=$|[^\p{L}\p{N}])/gu, "نیمفلنج")
    .replace(/(?<=^|[^\p{L}\p{N}])دو\s*پروانه(?=$|[^\p{L}\p{N}])/gu, "دوپروانه")
    .replace(/(?<=^|[^\p{L}\p{N}])شافت\s*دار(?=$|[^\p{L}\p{N}])/gu, "شافتدار")
    .replace(/(?<=^|[^\p{L}\p{N}])شافت\s*مستقیم(?=$|[^\p{L}\p{N}])/gu, "شافتمستقیم")
    .replace(/(?<=^|[^\p{L}\p{N}])چدنی(?=$|[^\p{L}\p{N}])/gu, "چدن")
    .replace(/(?<=^|[^\p{L}\p{N}])(آلومینیومی|الومینیومی|آلومینیوم)(?=$|[^\p{L}\p{N}])/gu, "الومینیوم");

  // 7. Normalize multiple spaces and punctuation (including SQL wildcards %, _)
  text = text.replace(/[_\-–—/\\|:;,،.؟!()[\]{}"'«»%#*~`^&+=<>]+/g, " ");

  // 8. Restore decimal point
  text = text.replace(/\uE000/g, ".");

  text = text.replace(/\s+/g, " ").trim();

  return text;
}

/**
 * Tokenizes text into search terms, removing stop words.
 */
export function tokenizePersianText(input: string): string[] {
  const normalized = normalizePersianText(input);
  if (!normalized) return [];

  return normalized
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

/**
 * Generates SQL search variations for compound terms across the entire query phrase,
 * matching ZWNJ-formatted fields (`تک‌فاز`), spaced fields (`تک فاز`), and fused fields (`تکفاز`).
 */
export function getCompoundVariations(term: string): string[] {
  const normalized = normalizePersianText(term);
  if (!normalized) return [];

  const rawTrimmed = term.trim();
  const variations = new Set<string>([normalized, rawTrimmed]);

  for (const v of Array.from(variations)) {
    // Alef Madda variations (آلومینیوم vs الومینیوم, آب vs اب, etc.)
    if (v.includes("الومینیوم")) {
      variations.add(v.replace(/الومینیوم/g, "آلومینیوم"));
      variations.add(v.replace(/الومینیوم/g, "آلومینیومی"));
      variations.add(v.replace(/الومینیوم/g, "الومینیومی"));
    }
    if (v.includes("آلومینیوم")) {
      variations.add(v.replace(/آلومینیوم/g, "الومینیوم"));
      variations.add(v.replace(/آلومینیوم/g, "آلومینیومی"));
      variations.add(v.replace(/آلومینیوم/g, "الومینیومی"));
    }
    if (v.startsWith("ا") && !v.startsWith("الومینیوم")) {
      variations.add("آ" + v.slice(1));
    }
    if (v.startsWith("آ") && !v.startsWith("آلومینیوم")) {
      variations.add("ا" + v.slice(1));
    }

    // Single / Three phase
    if (v.includes("تکفاز")) {
      variations.add(v.replace(/تکفاز/g, "تک‌فاز"));
      variations.add(v.replace(/تکفاز/g, "تک فاز"));
    }
    if (v.includes("سهفاز")) {
      variations.add(v.replace(/سهفاز/g, "سه‌فاز"));
      variations.add(v.replace(/سهفاز/g, "سه فاز"));
    }

    // Pump types
    if (v.includes("کفکش")) {
      variations.add(v.replace(/کفکش/g, "کف‌کش"));
      variations.add(v.replace(/کفکش/g, "کف کش"));
    }
    if (v.includes("لجنکش")) {
      variations.add(v.replace(/لجنکش/g, "لجن‌کش"));
      variations.add(v.replace(/لجنکش/g, "لجن کش"));
    }
    if (v.includes("دوپروانه")) {
      variations.add(v.replace(/دوپروانه/g, "دو پروانه"));
      variations.add(v.replace(/دوپروانه/g, "دو‌پروانه"));
    }

    // Flange and gearbox compounds
    if (v.includes("نیمفلنج")) {
      variations.add(v.replace(/نیمفلنج/g, "نیم فلنج"));
      variations.add(v.replace(/نیمفلنج/g, "نیم‌فلنج"));
    }
    if (v.includes("شافتمستقیم")) {
      variations.add(v.replace(/شافتمستقیم/g, "شافت مستقیم"));
      variations.add(v.replace(/شافتمستقیم/g, "شافت‌مستقیم"));
    }
    if (v.includes("شافتدار")) {
      variations.add(v.replace(/شافتدار/g, "شافت دار"));
      variations.add(v.replace(/شافتدار/g, "شافت‌دار"));
    }
    if (v.includes("فلنجدار")) {
      variations.add(v.replace(/فلنجدار/g, "فلنج دار"));
      variations.add(v.replace(/فلنجدار/g, "فلنج‌دار"));
    }
    if (v.includes("فلوتردار")) {
      variations.add(v.replace(/فلوتردار/g, "فلوتر دار"));
      variations.add(v.replace(/فلوتردار/g, "فلوتر‌دار"));
    }
    if (v.includes("پایهدار")) {
      variations.add(v.replace(/پایهدار/g, "پایه دار"));
      variations.add(v.replace(/پایهدار/g, "پایه‌دار"));
    }

    // Category compounds
    if (v.includes("الکتروموتور")) {
      variations.add(v.replace(/الکتروموتور/g, "الکترو موتور"));
      variations.add(v.replace(/الکتروموتور/g, "الکترو‌موتور"));
    }
    if (v.includes("الکتروپمپ")) {
      variations.add(v.replace(/الکتروپمپ/g, "الکترو پمپ"));
      variations.add(v.replace(/الکتروپمپ/g, "الکترو‌پمپ"));
    }

    // Materials
    if (v.includes("چدن")) {
      variations.add(v.replace(/چدن/g, "چدنی"));
    }

    // Gasoil / Special variants
    if (v.includes("گازویل") || v.includes("گازوایل") || v.includes("گازوئیل") || v.includes("گازوییل")) {
      variations.add(v.replace(/گازویل|گازوایل|گازوییل/g, "گازوئیل"));
      variations.add(v.replace(/گازوئیل/g, "گازویل"));
    }
  }

  return Array.from(variations).filter(Boolean);
}
