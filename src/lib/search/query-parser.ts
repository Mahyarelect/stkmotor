import {
  POWER_CONVERSIONS,
  CANONICAL_SPEEDS,
  GEARBOX_SERIES,
  GEARBOX_SIZES,
  PUMP_TYPES,
  CATEGORY_SYNONYMS,
  BRAND_SYNONYMS,
} from "./taxonomy-dictionary.ts";
import { normalizePersianText, normalizeDigits, tokenizePersianText } from "./persian-normalizer.ts";

export interface ParsedSearchQuery {
  rawQuery: string;
  normalizedQuery: string;
  tokens: string[];
  residualTokens: string[];
  isCategoryOnly: boolean;
  sku?: string;
  category?: string; // "electromotor" | "gearbox" | "pump" | "accessories"
  phase?: string; // "single-phase" | "three-phase"
  shellType?: string; // "چدنی" | "آلومینیومی"
  power?: string; // e.g. "1.5HP"
  powerKw?: number;
  speed?: string; // "1400" | "3000" | "1000" | "750"
  gearboxType?: string; // "حلزونی" | "مکعبی"
  modelType?: string; // "VF" | "MVF" | "NMRV"
  gearboxSize?: string; // "86" | "110" etc.
  ratio?: string;
  pumpType?: string; // "کف‌کش" | "لجن‌کش" | "بشقابی"
  outletSize?: string; // "1" | "2" | "3"
  headMeter?: number;
  floater?: string; // "فلوتردار" | "ساده"
  brand?: string;
  cleanQuery: string;
}

export function parseSearchQuery(rawQuery: string): ParsedSearchQuery {
  const normalized = normalizePersianText(rawQuery);
  const digitsOnly = normalizeDigits(rawQuery);

  const result: ParsedSearchQuery = {
    rawQuery,
    normalizedQuery: normalized,
    tokens: tokenizePersianText(normalized),
    residualTokens: [],
    isCategoryOnly: false,
    cleanQuery: normalized,
  };

  if (!normalized) return result;

  // 1. Detect SKU (e.g. 10000014, 10100055, 10200064)
  const skuMatch = digitsOnly.match(/(?:^|[^\d])(10\d{6,8})(?=[^\d]|$)/);
  if (skuMatch) {
    result.sku = skuMatch[1];
  }

  // 2. Detect Speed (RPM)
  const speedMatch = normalized.match(/(?:^|[^\d])(3000|2900|2850|2800|1500|1450|1440|1420|1400|1000|960|950|940|900|750|720|700)(?:\s*(?:دور|rpm))?(?=$|[^\p{L}\p{N}])/iu);
  if (speedMatch) {
    const rawSpeed = speedMatch[1];
    result.speed = CANONICAL_SPEEDS[rawSpeed] || rawSpeed;
  }

  // 3. Detect Power (HP or kW)
  // Text expressions: نیم اسب, یک اسب, دو اسب, etc.
  for (const conv of POWER_CONVERSIONS) {
    for (const alias of conv.aliases) {
      const aliasNorm = normalizePersianText(alias);
      if (normalized.includes(aliasNorm)) {
        result.power = conv.hp;
        result.powerKw = conv.kw;
        break;
      }
    }
    if (result.power) break;
  }

  // Numeric power regex: e.g. "1.5 اسب", "2hp", "3 kw"
  if (!result.power) {
    const hpMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(?:اسب|hp)(?=$|[^\p{L}\p{N}])/iu);
    if (hpMatch) {
      const val = hpMatch[1];
      const found = POWER_CONVERSIONS.find((c) => c.hp.startsWith(val));
      if (found) {
        result.power = found.hp;
        result.powerKw = found.kw;
      } else {
        result.power = `${val}HP`;
      }
    } else {
      const kwMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(?:کیلووات|kw)(?=$|[^\p{L}\p{N}])/iu);
      if (kwMatch) {
        const kwVal = Number.parseFloat(kwMatch[1]);
        const found = POWER_CONVERSIONS.find((c) => Math.abs(c.kw - kwVal) < 0.05);
        if (found) {
          result.power = found.hp;
          result.powerKw = found.kw;
        } else {
          result.powerKw = kwVal;
        }
      }
    }
  }

  // 4. Detect Gearbox Series & Model
  for (const series of GEARBOX_SERIES) {
    const regex = new RegExp(`(?:^|[^a-zA-Z])${series}(?=[^a-zA-Z]|$)`, "i");
    if (regex.test(rawQuery) || regex.test(normalized)) {
      result.modelType = series.toUpperCase();
      result.category = "gearbox";
      break;
    }
  }

  // Detect Gearbox Type
  if (normalized.includes("حلزونی")) {
    result.gearboxType = "حلزونی";
    result.category = "gearbox";
  } else if (normalized.includes("مکعبی")) {
    result.gearboxType = "مکعبی";
    result.category = "gearbox";
  } else if (normalized.includes("شافتمستقیم")) {
    result.gearboxType = "شافت مستقیم";
    result.category = "gearbox";
  }

  // Detect Gearbox Size (especially when prefixed with تیپ or after model e.g. "VF 86" or "تیپ 86")
  const sizeWithPrefix = normalized.match(/(?:تیپ|سایز)\s*(30|44|49|62|63|86|110|130|150)(?=$|[^\p{L}\p{N}])/u);
  if (sizeWithPrefix) {
    result.gearboxSize = sizeWithPrefix[1];
    result.category = result.category || "gearbox";
  } else if (result.modelType || result.gearboxType) {
    for (const s of GEARBOX_SIZES) {
      const regex = new RegExp(`(?:^|[^0-9])${s}(?=[^0-9]|$)`);
      if (regex.test(normalized) && s !== result.speed) {
        result.gearboxSize = s;
        break;
      }
    }
  }

  // Detect Ratio (e.g. "1:30", "1 به 30", "نسبت 30")
  const ratioMatch = normalized.match(/(?:نسبت|دور|ratio)?\s*(?:1\s*[:به]\s*)?([1-9]\d*(?:\.\d+)?)(?=$|[^\p{L}\p{N}])/iu);
  if (ratioMatch && result.category === "gearbox" && !result.gearboxSize) {
    const possibleRatio = ratioMatch[1];
    if (["7.5", "10", "15", "20", "25", "30", "40", "50", "60", "80", "100"].includes(possibleRatio)) {
      result.ratio = possibleRatio;
    }
  }

  // 5. Detect Pump Attributes
  for (const [key, canonical] of Object.entries(PUMP_TYPES)) {
    if (normalized.includes(key)) {
      result.pumpType = canonical;
      result.category = "pump";
      break;
    }
  }

  // Pump outlet size in inches (e.g. "2 اینچ", "3 اینچ", "1 اینچ")
  const inchMatch = normalized.match(/(\d+(?:\.\d+)?)\s*اینچ(?=$|[^\p{L}\p{N}])/u);
  if (inchMatch) {
    result.outletSize = inchMatch[1];
    result.category = result.category || "pump";
  }

  // Pump head in meters (e.g. "16 متری", "32 متر")
  const headMatch = normalized.match(/(\d+)\s*متر(?:ی)?(?=$|[^\p{L}\p{N}])/u);
  if (headMatch) {
    result.headMeter = Number.parseInt(headMatch[1], 10);
    result.category = result.category || "pump";
  }

  // Floater
  if (normalized.includes("فلوتردار")) {
    result.floater = "فلوتردار";
    result.category = "pump";
  } else if (normalized.includes("ساده") && result.category === "pump") {
    result.floater = "ساده";
  }

  // 6. Detect Phase (Single-Phase vs Three-Phase)
  if (normalized.includes("تکفاز")) {
    result.phase = "single-phase";
    result.category = result.category || "electromotor";
  } else if (normalized.includes("سهفاز")) {
    result.phase = "three-phase";
    result.category = result.category || "electromotor";
  }

  // 7. Detect Shell Material
  if (normalized.includes("چدن")) {
    result.shellType = "چدنی";
    result.category = result.category || "electromotor";
  } else if (normalized.includes("الومینیوم")) {
    result.shellType = "آلومینیومی";
    result.category = result.category || "electromotor";
  }

  // 8. Detect Category from Synonyms
  if (!result.category) {
    for (const [synonym, cat] of Object.entries(CATEGORY_SYNONYMS)) {
      if (normalized.includes(synonym)) {
        result.category = cat;
        break;
      }
    }
  }

  // 9. Detect Brand
  for (const [brandKey, canonicalBrand] of Object.entries(BRAND_SYNONYMS)) {
    const regex = new RegExp(`(?:^|[^\p{L}\p{N}])${brandKey}(?=$|[^\p{L}\p{N}])`, "u");
    if (regex.test(normalized)) {
      result.brand = canonicalBrand;
      break;
    }
  }

  // 10. Check if query is purely a category request (e.g. "الکتروموتور", "دینام", "گیربکس", "پمپ")
  const categoryWords = new Set([
    "الکتروموتور", "الکتروموتورها", "دینام", "موتور", "گیربکس", "گیربکسها",
    "پمپ", "پمپها", "الکتروپمپ", "لوازم جانبی"
  ]);
  const queryTokens = result.tokens;
  result.isCategoryOnly = Boolean(
    result.category &&
    queryTokens.length > 0 &&
    queryTokens.every((w) => categoryWords.has(w))
  );

  // 11. Clean query string and extract residual keywords for token-based scoring
  let clean = normalized;
  if (result.sku) clean = clean.replace(result.sku, "");
  if (result.speed) clean = clean.replace(new RegExp(`(?:^|[^0-9])${result.speed}(?:\\s*(?:دور|rpm))?`, "gi"), "");
  if (result.gearboxSize) clean = clean.replace(new RegExp(`(?:تیپ|سایز)?\\s*${result.gearboxSize}`, "gi"), "");
  if (result.modelType) clean = clean.replace(new RegExp(`(?:^|[^a-zA-Z])${result.modelType}(?=[^a-zA-Z]|$)`, "gi"), "");
  if (result.outletSize) clean = clean.replace(new RegExp(`${result.outletSize}\\s*اینچ`, "gu"), "");
  if (result.headMeter) clean = clean.replace(new RegExp(`${result.headMeter}\\s*متر(?:ی)?`, "gu"), "");
  result.cleanQuery = clean.replace(/\s+/g, " ").trim();

  // 12. Residual tokens (words like "موتوژن", "چینی", "استریم", specific technical keywords)
  const matchedTokens = new Set<string>();
  if (result.sku) matchedTokens.add(result.sku);
  if (result.speed) {
    matchedTokens.add(result.speed);
    matchedTokens.add(result.speed + "rpm");
    matchedTokens.add(result.speed + "دور");
  }
  if (result.gearboxSize) matchedTokens.add(result.gearboxSize);
  if (result.modelType) matchedTokens.add(result.modelType.toLowerCase());
  if (result.modelType && result.gearboxSize) {
    matchedTokens.add((result.modelType + result.gearboxSize).toLowerCase());
    matchedTokens.add((result.gearboxSize + result.modelType).toLowerCase());
  }
  if (result.power) {
    matchedTokens.add(result.power.toLowerCase());
    matchedTokens.add(normalizePersianText(result.power).toLowerCase());
    const powerNum = result.power.replace(/[^\d.]/g, "");
    if (powerNum) matchedTokens.add(powerNum);
    matchedTokens.add("اسب");
    matchedTokens.add("hp");
    matchedTokens.add("کیلووات");
    matchedTokens.add("kw");
  }
  if (result.powerKw) {
    matchedTokens.add(String(result.powerKw));
  }
  if (result.outletSize) {
    matchedTokens.add(result.outletSize);
    matchedTokens.add(result.outletSize + "اینچ");
  }
  if (result.headMeter) {
    matchedTokens.add(String(result.headMeter));
    matchedTokens.add(String(result.headMeter) + "متر");
    matchedTokens.add(String(result.headMeter) + "متری");
  }
  if (result.pumpType) matchedTokens.add(normalizePersianText(result.pumpType));
  if (result.phase === "single-phase") matchedTokens.add("تکفاز");
  if (result.phase === "three-phase") matchedTokens.add("سهفاز");

  result.residualTokens = queryTokens.filter((t) => {
    const normT = normalizePersianText(t).toLowerCase();
    return !matchedTokens.has(normT) && !matchedTokens.has(t.toLowerCase()) && !categoryWords.has(normT) && !categoryWords.has(t);
  });

  return result;
}
