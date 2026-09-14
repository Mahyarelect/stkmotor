export function normalizeCatalogSearch(value: string): string {
  return value
    .toLowerCase()
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/[\u064B-\u065F\u0670\u200c\u200d]/g, " ")
    .replace(/[^\p{L}\p{N}.\/+-]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function catalogSearchTerms(value: string): string[] {
  return normalizeCatalogSearch(value).split(" ").filter(Boolean).slice(0, 8);
}

export function catalogSearchSpellings(term: string): string[] {
  return [...new Set([
    term,
    term.replace(/ی/g, "ي").replace(/ک/g, "ك"),
  ])].filter(Boolean);
}
