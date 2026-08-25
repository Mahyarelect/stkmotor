import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();

/* ─────────────────────────────────────────────────────────────
 * Types & Interfaces
 * ───────────────────────────────────────────────────────────── */
export interface SeedCategory {
  slug: string;
  name: string;
  nameEn: string;
  description: string;
  icon: string;
  sortOrder: number;
}

export interface SeedFamily {
  slug: string;
  name: string;
  nameEn: string;
  mainCategory: string;
  category: string;
  subCategory: string;
  phase: string;
  shellType: string;
  brand: string;
  level1Value?: string;
  level2Value?: string;
  description: string;
  imageUrl: string;
  sortOrder: number;
}

export interface SeedVariant {
  sku: string;
  familySlug: string;
  name: string;
  size: string;
  power: string;
  powerKw: number;
  speed: string;
  mountingType: string;
  gearboxType: string;
  modelType: string;
  ratio: string;
  inputFrame: string;
  inputType: string;
  pumpType: string;
  outletSize: string;
  headMeter: number;
  floater: string;
  brand: string;
  bodyMaterial: string;
  flangeType: string;
  flangeLength: string;
  price: number;
  inStock: boolean;
  sortOrder: number;
}

export interface SeedDataset {
  categories: SeedCategory[];
  families: SeedFamily[];
  variants: SeedVariant[];
}

/* ─────────────────────────────────────────────────────────────
 * CSV Parser Helper
 * ───────────────────────────────────────────────────────────── */
function parseCsv(filePath: string): Record<string, string>[] {
  if (!fs.existsSync(filePath)) {
    throw new Error(`CSV file not found: ${filePath}`);
  }
  const content = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  const header = lines[0].split(",").map((h) => h.trim());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const cells: string[] = [];
    let insideQuote = false;
    let current = "";
    for (let c = 0; c < line.length; c++) {
      const char = line[c];
      if (char === '"') {
        insideQuote = !insideQuote;
      } else if (char === "," && !insideQuote) {
        cells.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    cells.push(current.trim());

    const obj: Record<string, string> = {};
    header.forEach((h, idx) => {
      obj[h] = (cells[idx] || "").replace(/^"|"$/g, "").trim();
    });
    rows.push(obj);
  }
  return rows;
}

function parsePrice(raw: string | undefined): number {
  if (!raw) return 0;
  const num = Number(raw.replace(/[^\d.-]/g, ""));
  return Number.isFinite(num) && num > 0 ? num : 0;
}

function parseNumber(raw: string | undefined): number {
  if (!raw) return 0;
  const num = Number(raw.replace(/[^\d.-]/g, ""));
  return Number.isFinite(num) ? num : 0;
}

/* ─────────────────────────────────────────────────────────────
 * Category Definitions
 * ───────────────────────────────────────────────────────────── */
const CATEGORIES: SeedCategory[] = [
  {
    slug: "electromotor",
    name: "الکتروموتور",
    nameEn: "Electromotor",
    description: "انواع الکتروموتورهای تک‌فاز و سه‌فاز صنعتی پوسته چدنی و آلومینیومی",
    icon: "Cog",
    sortOrder: 1,
  },
  {
    slug: "gearbox",
    name: "گیربکس صنعتی",
    nameEn: "Industrial Gearbox",
    description: "انواع گیربکس‌های صنعتی حلزونی، مکعبی NMRV و شافت مستقیم",
    icon: "Settings",
    sortOrder: 2,
  },
  {
    slug: "pump",
    name: "پمپ و الکتروپمپ",
    nameEn: "Pumps & Electropumps",
    description: "انواع پمپ‌های صنعتی و کشاورزی، کف‌کش، لجن‌کش، شناور، دنده‌ای و ضد اسید",
    icon: "Droplets",
    sortOrder: 3,
  },
  {
    slug: "accessories",
    name: "لوازم جانبی و قطعات",
    nameEn: "Accessories & Flanges",
    description: "انواع فلنج، نیم‌فلنج، براکت عقب، درب ترمینال و فلنج‌های خروجی گیربکس",
    icon: "Wrench",
    sortOrder: 4,
  },
];

/* ─────────────────────────────────────────────────────────────
 * ETL Extraction & Transformation
 * ───────────────────────────────────────────────────────────── */
export function buildDatasetFromCsv(baseCsvDir: string): SeedDataset {
  console.log(`\n📂 Reading CSV files from: ${baseCsvDir}\n`);

  const familiesMap = new Map<string, SeedFamily>();
  const variants: SeedVariant[] = [];

  function addFamily(fam: SeedFamily) {
    if (!familiesMap.has(fam.slug)) {
      familiesMap.set(fam.slug, fam);
    }
  }

  /* ───────────────────────────────────────────────────────────
   * 1. ELECTROMOTORS (الکتروموتور)
   * ─────────────────────────────────────────────────────────── */
  const electroFiles = [
    { file: "الکتروموتور/single_phase_cast_iron_clean.csv", phase: "تک‌فاز", shellType: "چدنی", defaultBrand: "STK" },
    { file: "الکتروموتور/single_phase_aluminum_clean.csv", phase: "تک‌فاز", shellType: "آلومینیومی", defaultBrand: "چینی" },
    { file: "الکتروموتور/three_phase_cast_iron_clean.csv", phase: "سه‌فاز", shellType: "چدنی", defaultBrand: "STK" },
    { file: "الکتروموتور/three_phase_aluminum_clean.csv", phase: "سه‌فاز", shellType: "آلومینیومی", defaultBrand: "چینی" },
  ];

  let electroVariantCount = 0;
  for (const { file, phase, shellType, defaultBrand } of electroFiles) {
    const fullPath = path.join(baseCsvDir, file.replace(/\//g, path.sep));
    if (!fs.existsSync(fullPath)) {
      console.warn(`⚠️ Skipping missing file: ${fullPath}`);
      continue;
    }

    const rows = parseCsv(fullPath);
    for (const row of rows) {
      const sku = row.sku?.trim();
      if (!sku) continue;

      // Extract RPM
      let rpmStr = String(row.rpm || "").replace(".0", "").trim();
      if (!rpmStr || rpmStr === "0") {
        const rpmMatch = row.name?.match(/(750|1000|1400|3000)/);
        rpmStr = rpmMatch ? rpmMatch[1] : "1400";
      }

      // Extract HP and kW
      const hpNum = parseNumber(row.hp);
      let powerKw = 0;
      let powerLabel = "";

      if (hpNum > 0) {
        powerKw = Math.round(hpNum * 0.7457 * 100) / 100;
        powerLabel = `${hpNum}HP (${powerKw}kW)`;
      } else {
        const kwMatch = row.name?.match(/(\d+(?:\.\d+)?)\s*kw/i);
        if (kwMatch) {
          powerKw = Number.parseFloat(kwMatch[1]);
          const approxHp = Math.round((powerKw / 0.7457) * 10) / 10;
          powerLabel = `${approxHp}HP (${powerKw}kW)`;
        } else {
          powerLabel = "-";
        }
      }

      // Mounting Type normalization - Rule: Exclude B5, keep B3, B35, B34
      let mounting = (row.mounting_type || "").trim();
      if (mounting.toUpperCase() === "B5") {
        // Exclude B5 per instruction and map to standard B3 / B35
        mounting = "B35";
      }
      if (!mounting) {
        mounting = "B3";
      }

      // Family Slug derivation
      const isSingle = phase === "تک‌فاز";
      const isCastIron = shellType === "چدنی";
      const phaseSlug = isSingle ? "single-phase" : "three-phase";
      const shellSlug = isCastIron ? "cast-iron" : "aluminum";
      const familySlug = `${phaseSlug}-${shellSlug}-${rpmStr}`;

      const familyName = `الکتروموتور ${phase} پوسته ${shellType} ${rpmStr} دور`;
      const familyNameEn = `${isSingle ? "Single" : "Three"} Phase ${isCastIron ? "Cast Iron" : "Aluminum"} Motor ${rpmStr} RPM`;

      addFamily({
        slug: familySlug,
        name: familyName,
        nameEn: familyNameEn,
        mainCategory: "electromotor",
        category: phaseSlug,
        subCategory: shellSlug,
        phase: phase,
        shellType: shellType,
        brand: defaultBrand,
        level1Value: phase,
        level2Value: shellType,
        description: `الکتروموتور صنعتی ${phase} با پوسته ${shellType} و سرعت اسمی ${rpmStr} دور بر دقیقه`,
        imageUrl: isCastIron ? "/images/stk-cast-iron-motor.png" : "/images/aluminum-motor.png",
        sortOrder: isSingle ? (isCastIron ? 1 : 2) : isCastIron ? 3 : 4,
      });

      // Frame size derivation from kW / HP if not given
      let frameSize = "";
      if (powerKw <= 0.37) frameSize = "71";
      else if (powerKw <= 0.75) frameSize = "80";
      else if (powerKw <= 1.5) frameSize = "90";
      else if (powerKw <= 3) frameSize = "100";
      else if (powerKw <= 4) frameSize = "112";
      else if (powerKw <= 7.5) frameSize = "132";
      else if (powerKw <= 15) frameSize = "160";
      else if (powerKw <= 22) frameSize = "180";
      else if (powerKw <= 37) frameSize = "200";
      else frameSize = "225+";

      variants.push({
        sku: sku,
        familySlug: familySlug,
        name: row.name || `${familyName} ${powerLabel}`,
        size: frameSize,
        power: powerLabel,
        powerKw: powerKw,
        speed: rpmStr,
        mountingType: mounting,
        gearboxType: "",
        modelType: "",
        ratio: "",
        inputFrame: "",
        inputType: "",
        pumpType: "",
        outletSize: "",
        headMeter: 0,
        floater: "",
        brand: defaultBrand,
        bodyMaterial: shellType === "چدنی" ? "چدن" : "آلومینیوم",
        flangeType: "",
        flangeLength: "",
        price: parsePrice(row.price),
        inStock: parsePrice(row.price) > 0,
        sortOrder: powerKw * 100 + (isSingle ? 0 : 1000),
      });

      electroVariantCount++;
    }
  }

  /* ───────────────────────────────────────────────────────────
   * 2. GEARBOXES (گیربکس)
   * ─────────────────────────────────────────────────────────── */
  // 2a. Worm Gearbox (حلزونی VF / MVF / ترکیبی)
  const wormPath = path.join(baseCsvDir, "گیربکس", "worm_gearbox_clean.csv");
  if (fs.existsSync(wormPath)) {
    const rows = parseCsv(wormPath);
    for (const row of rows) {
      const sku = row.sku?.trim();
      if (!sku) continue;

      const rawModel = row.model || "";
      const isMVF = rawModel.toUpperCase().includes("MVF") || (row.input_type && row.input_type.includes("فلنج"));
      const isCombined = rawModel.includes("VF-FC") || rawModel.includes("MVF-FC") || rawModel.includes("VF-VF") || rawModel.includes("MVF-VF");

      let familySlug = "";
      let familyName = "";
      let familyNameEn = "";

      if (isCombined) {
        familySlug = isMVF ? "worm-gearbox-combined-mvf" : "worm-gearbox-combined-vf";
        familyName = isMVF ? "گیربکس حلزونی ترکیبی سری MVF (فلنج‌دار)" : "گیربکس حلزونی ترکیبی سری VF (شافت‌دار)";
        familyNameEn = isMVF ? "Combined Worm Gearbox MVF Series" : "Combined Worm Gearbox VF Series";
      } else {
        familySlug = isMVF ? "worm-gearbox-mvf" : "worm-gearbox-vf";
        familyName = isMVF ? "گیربکس حلزونی سری MVF (ورودی فلنج‌دار / هالو شافت)" : "گیربکس حلزونی سری VF (ورودی شافت‌دار)";
        familyNameEn = isMVF ? "Worm Gearbox MVF Series (Flange Input)" : "Worm Gearbox VF Series (Solid Shaft Input)";
      }

      addFamily({
        slug: familySlug,
        name: familyName,
        nameEn: familyNameEn,
        mainCategory: "gearbox",
        category: "worm",
        subCategory: isMVF ? "mvf" : "vf",
        phase: "",
        shellType: "چدنی / آلومینیومی",
        brand: "STK / ایرانی",
        level1Value: "حلزونی",
        level2Value: isMVF ? "MVF (فلنج‌دار)" : "VF (شافت‌دار)",
        description: `گیربکس حلزونی صنعتی تیپ ${row.size || ""} با بازدهی بالا و عملکرد بی‌صدا`,
        imageUrl: "/images/worm-gearbox.png",
        sortOrder: 10,
      });

      variants.push({
        sku: sku,
        familySlug: familySlug,
        name: row.name || `${familyName} تیپ ${row.size}`,
        size: row.size || "",
        power: "",
        powerKw: 0,
        speed: "",
        mountingType: row.mounting_type || (isMVF ? "B5 / B14" : "N/A/P پایه‌دار"),
        gearboxType: "حلزونی",
        modelType: rawModel || (isMVF ? "MVF" : "VF"),
        ratio: "",
        inputFrame: "",
        inputType: row.input_type || (isMVF ? "فلنج‌دار (هالو شافت)" : "شافت‌دار"),
        pumpType: "",
        outletSize: "",
        headMeter: 0,
        floater: "",
        brand: "ایرانی",
        bodyMaterial: "چدن / آلومینیوم",
        flangeType: "",
        flangeLength: "",
        price: parsePrice(row.price),
        inStock: parsePrice(row.price) > 0,
        sortOrder: parseNumber(row.size),
      });
    }
  }

  // 2b. Cubic Gearbox (مکعبی NMRV - بازه فریم 56 تا 160)
  const cubicPath = path.join(baseCsvDir, "گیربکس", "cubic_gearbox_clean.csv");
  if (fs.existsSync(cubicPath)) {
    const rows = parseCsv(cubicPath);
    const familySlug = "cubic-gearbox-nmrv";
    addFamily({
      slug: familySlug,
      name: "گیربکس مکعبی صنعتی سری NMRV",
      nameEn: "NMRV Cubic Industrial Gearbox",
      mainCategory: "gearbox",
      category: "cubic",
      subCategory: "nmrv",
      phase: "",
      shellType: "آلومینیوم / چدن",
      brand: "STK / طرح ایتالیا",
      level1Value: "مکعبی",
      level2Value: "NMRV",
      description: "گیربکس‌های مکعبی آلومینیومی و چدنی سری NMRV با نسبت‌های تبدیل متنوع و فریم ورودی ۵۶ تا ۱۶۰",
      imageUrl: "/images/cubic-gearbox.png",
      sortOrder: 11,
    });

    for (const row of rows) {
      const sku = row.sku?.trim();
      if (!sku) continue;

      // Bound inputFrame between 56 and 160
      let inputFrame = row.input_frame || "";
      const frameNum = parseNumber(inputFrame);
      if (frameNum > 0 && (frameNum < 56 || frameNum > 160)) {
        inputFrame = frameNum < 56 ? "56" : "160";
      }

      const ratio = row.ratio || "";

      variants.push({
        sku: sku,
        familySlug: familySlug,
        name: row.name || `گیربکس مکعبی تیپ ${row.size} فریم ${inputFrame} نسبت ${ratio}`,
        size: row.size || "",
        power: "",
        powerKw: 0,
        speed: "",
        mountingType: "هالو شافت / فلنجی",
        gearboxType: "مکعبی",
        modelType: "NMRV",
        ratio: ratio,
        inputFrame: inputFrame,
        inputType: "فلنج‌دار (هالو شافت)",
        pumpType: "",
        outletSize: "",
        headMeter: 0,
        floater: "",
        brand: "طرح ایتالیا",
        bodyMaterial: parseNumber(row.size) <= 90 ? "آلومینیوم" : "چدن",
        flangeType: "",
        flangeLength: "",
        price: parsePrice(row.price),
        inStock: parsePrice(row.price) > 0,
        sortOrder: parseNumber(row.size) * 1000 + parseNumber(ratio),
      });
    }
  }

  // 2c. Direct Shaft Gearbox (شافت مستقیم)
  const directPath = path.join(baseCsvDir, "گیربکس", "direct_shaft_gearbox_clean.csv");
  if (fs.existsSync(directPath)) {
    const rows = parseCsv(directPath);
    const familySlug = "direct-shaft-gearbox";
    addFamily({
      slug: familySlug,
      name: "گیربکس شافت مستقیم صنعتی",
      nameEn: "Inline Helical Direct Shaft Gearbox",
      mainCategory: "gearbox",
      category: "inline-shaft",
      subCategory: "direct",
      phase: "",
      shellType: "چدنی",
      brand: "صنعتی",
      level1Value: "شافت مستقیم",
      level2Value: "هلیکال",
      description: "گیربکس هلیکال شافت مستقیم با گشتاور خروجی بالا و راندمان مکانیکی فوق‌العاده",
      imageUrl: "/images/direct-shaft-gearbox.png",
      sortOrder: 12,
    });

    for (const row of rows) {
      const sku = row.sku?.trim();
      if (!sku) continue;

      variants.push({
        sku: sku,
        familySlug: familySlug,
        name: row.name || `گیربکس شافت مستقیم سایز ${row.size}`,
        size: row.size || "",
        power: "",
        powerKw: 0,
        speed: "",
        mountingType: "پایه‌دار",
        gearboxType: "شافت مستقیم",
        modelType: "Helical",
        ratio: "",
        inputFrame: "",
        inputType: "شافت‌دار",
        pumpType: "",
        outletSize: "",
        headMeter: 0,
        floater: "",
        brand: "صنعتی",
        bodyMaterial: "چدن",
        flangeType: "",
        flangeLength: "",
        price: parsePrice(row.price),
        inStock: parsePrice(row.price) > 0,
        sortOrder: parseNumber(row.size),
      });
    }
  }

  /* ───────────────────────────────────────────────────────────
   * 3. PUMPS (پمپ و الکتروپمپ)
   * ─────────────────────────────────────────────────────────── */
  const pumpFiles = [
    {
      file: "پمپ/electropump_clean.csv",
      familySlug: "pump-surface-electropump",
      name: "الکتروپمپ سطحی بشقابی و دو پروانه",
      nameEn: "Surface Centrifugal & Twin-Impeller Electropumps",
      subCat: "surface-pump",
      level1: "الکتروپمپ سطحی",
      level2: "بشقابی / جتی",
      desc: "انواع پمپ‌های آب سطحی بشقابی، جتی و دو پروانه خانگی و ساختمانی",
      img: "/images/surface-pump.png",
      sortOrder: 20,
    },
    {
      file: "پمپ/submersible_sump_pump_clean.csv",
      familySlug: "pump-submersible-sump",
      name: "پمپ کف‌کش آب تمیز و کشاورزی",
      nameEn: "Submersible Sump & Drainage Pumps",
      subCat: "submersible-sump",
      level1: "کف‌کش",
      level2: "آب تمیز",
      desc: "انواع پمپ‌های کف‌کش فلوتردار و ساده جهت تخلیه استخر، چاه و مصارف کشاورزی",
      img: "/images/submersible-sump-pump.png",
      sortOrder: 21,
    },
    {
      file: "پمپ/sewage_pump_clean.csv",
      familySlug: "pump-sewage",
      name: "پمپ لجن‌کش صنعتی و فاضلاب",
      nameEn: "Submersible Sewage & Slurry Pumps",
      subCat: "sewage-pump",
      level1: "لجن‌کش",
      level2: "فاضلابی",
      desc: "پمپ‌های لجن‌کش پروانه خردکن‌دار و ساده جهت انتقال فاضلاب سنگین و پساب صنعتی",
      img: "/images/sewage-pump.png",
      sortOrder: 22,
    },
    {
      file: "پمپ/submersible_pump_clean.csv",
      familySlug: "pump-submersible-deep-well",
      name: "پمپ شناور استیل چاه عمیق",
      nameEn: "Deep Well Submersible Pumps",
      subCat: "submersible-pump",
      level1: "شناور",
      level2: "استیل",
      desc: "پمپ‌های شناور تمام استیل چندطبقه جهت استحصال آب از چاه‌های عمیق و نیمه‌عمیق",
      img: "/images/deep-well-pump.png",
      sortOrder: 23,
    },
    {
      file: "پمپ/gear_pump_clean.csv",
      familySlug: "pump-gear",
      name: "پمپ دنده‌ای غلیظ‌کش و روغن‌کش صنعتی",
      nameEn: "Industrial Rotary Gear Pumps",
      subCat: "gear-pump",
      level1: "پمپ دنده‌ای",
      level2: "روغن و مایعات غلیظ",
      desc: "پمپ‌های دنده‌ای خودمکش جهت جابجایی سوخت، روغن‌های هیدرولیک و مایعات ویسکوز",
      img: "/images/gear-pump.png",
      sortOrder: 24,
    },
    {
      file: "پمپ/acid_pump_clean.csv",
      familySlug: "pump-acid",
      name: "کله پمپ ضد اسید و مواد خورنده پلیمری",
      nameEn: "Anti-Acid & Chemical Process Pump Heads",
      subCat: "acid-pump",
      level1: "پمپ ضد اسید",
      level2: "پلیمری",
      desc: "کله پمپ‌های مگنتی و پلیمری مقاوم در برابر انواع اسیدها و مواد شیمیایی خورنده",
      img: "/images/acid-pump.png",
      sortOrder: 25,
    },
  ];

  for (const item of pumpFiles) {
    const fullPath = path.join(baseCsvDir, item.file.replace(/\//g, path.sep));
    if (!fs.existsSync(fullPath)) continue;

    addFamily({
      slug: item.familySlug,
      name: item.name,
      nameEn: item.nameEn,
      mainCategory: "pump",
      category: item.subCat,
      subCategory: item.subCat,
      phase: "",
      shellType: "",
      brand: "STK / چینی / ایرانی",
      level1Value: item.level1,
      level2Value: item.level2,
      description: item.desc,
      imageUrl: item.img,
      sortOrder: item.sortOrder,
    });

    const rows = parseCsv(fullPath);
    for (const row of rows) {
      const sku = row.sku?.trim();
      if (!sku) continue;

      const hpNum = parseNumber(row.hp);
      const headNum = parseNumber(row.head_meter);
      const outlet = row.outlet_size_inch ? `${row.outlet_size_inch} اینچ` : row.size ? `سایز ${row.size}` : "";

      variants.push({
        sku: sku,
        familySlug: item.familySlug,
        name: row.name || `${item.name} ${outlet}`,
        size: outlet,
        power: hpNum > 0 ? `${hpNum}HP` : "",
        powerKw: hpNum > 0 ? Math.round(hpNum * 0.7457 * 100) / 100 : 0,
        speed: "",
        mountingType: "پایه‌دار / فلنجی",
        gearboxType: "",
        modelType: row.model || row.product_type || "",
        ratio: "",
        inputFrame: "",
        inputType: "",
        pumpType: row.product_type || item.level1,
        outletSize: row.outlet_size_inch || row.size || "",
        headMeter: headNum,
        floater: row.floater || (row.name?.includes("فلوتر") ? "فلوتردار" : "ساده"),
        brand: row.brand || "چینی / ایرانی",
        bodyMaterial: row.body_material || (item.subCat.includes("acid") ? "پلیمر / تفلون" : "چدن / استیل"),
        flangeType: "",
        flangeLength: "",
        price: parsePrice(row.price),
        inStock: parsePrice(row.price) > 0,
        sortOrder: headNum > 0 ? headNum : hpNum > 0 ? hpNum * 10 : parseNumber(sku),
      });
    }
  }

  /* ───────────────────────────────────────────────────────────
   * 4. ACCESSORIES & FLANGES (لوازم جانبی و فلنج)
   * ─────────────────────────────────────────────────────────── */
  const accessoryFiles = [
    {
      file: "لوازم جانبی/فلنج/chinese_flange_clean.csv",
      familySlug: "flange-chinese",
      name: "فلنج الکتروموتورهای چینی",
      nameEn: "Chinese Electric Motor Flanges",
      subCat: "flange",
      level1: "فلنج",
      level2: "موتورهای چینی",
      desc: "انواع فلنج‌های چدنی B35 و B14 برای الکتروموتورهای تک‌فاز و سه‌فاز چینی",
      img: "/images/chinese-flange.png",
      sortOrder: 30,
      brand: "چینی",
      type: "فلنج",
    },
    {
      file: "لوازم جانبی/فلنج/electrogen_flange_clean.csv",
      familySlug: "flange-electrogen",
      name: "فلنج و نیم‌فلنج الکتروموتور الکتروژن",
      nameEn: "Electrogen Motor Flanges & Semi-Flanges",
      subCat: "flange",
      level1: "فلنج",
      level2: "الکتروژن",
      desc: "فلنج و نیم‌فلنج استاندارد الکتروموتورهای پوسته آلومینیومی و چدنی الکتروژن",
      img: "/images/electrogen-flange.png",
      sortOrder: 31,
      brand: "الکتروژن",
      type: "فلنج",
    },
    {
      file: "لوازم جانبی/فلنج/motogen_flange_clean.csv",
      familySlug: "flange-motogen",
      name: "فلنج و نیم‌فلنج الکتروموتور موتوژن",
      nameEn: "Motogen Motor Flanges & Covers",
      subCat: "flange",
      level1: "فلنج",
      level2: "موتوژن",
      desc: "فلنج، نیم‌فلنج و درب ترمینال اصلی الکتروموتورهای صنعتی موتوژن تبریز",
      img: "/images/motogen-flange.png",
      sortOrder: 32,
      brand: "موتوژن",
      type: "فلنج",
    },
    {
      file: "لوازم جانبی/فلنج/motogen_rear_bracket_clean.csv",
      familySlug: "bracket-motogen-rear",
      name: "براکت عقب الکتروموتور موتوژن",
      nameEn: "Motogen Rear Endshield Brackets",
      subCat: "bracket",
      level1: "براکت عقب",
      level2: "موتوژن",
      desc: "براکت عقب آلومینیومی و چدنی جهت نصب بلبرینگ و پروانه خنک‌کننده موتوژن",
      img: "/images/rear-bracket.png",
      sortOrder: 33,
      brand: "موتوژن",
      type: "براکت عقب",
    },
    {
      file: "لوازم جانبی/فلنج/output_flange_clean.csv",
      familySlug: "flange-gearbox-output",
      name: "فلنج خروجی گیربکس‌های مکعبی",
      nameEn: "NMRV Gearbox Output Flanges",
      subCat: "gearbox-flange",
      level1: "فلنج خروجی",
      level2: "گیربکس مکعبی",
      desc: "فلنج خروجی بلند و کوتاه گیربکس‌های مکعبی تیپ ۳۰ الی ۱۳۰",
      img: "/images/output-flange.png",
      sortOrder: 34,
      brand: "صنعتی",
      type: "فلنج خروجی",
    },
  ];

  for (const item of accessoryFiles) {
    const fullPath = path.join(baseCsvDir, item.file.replace(/\//g, path.sep));
    if (!fs.existsSync(fullPath)) continue;

    addFamily({
      slug: item.familySlug,
      name: item.name,
      nameEn: item.nameEn,
      mainCategory: "accessories",
      category: item.subCat,
      subCategory: item.subCat,
      phase: "",
      shellType: "",
      brand: item.brand,
      level1Value: item.level1,
      level2Value: item.level2,
      description: item.desc,
      imageUrl: item.img,
      sortOrder: item.sortOrder,
    });

    const rows = parseCsv(fullPath);
    for (const row of rows) {
      const sku = row.sku?.trim();
      if (!sku) continue;

      const frameSize = row.frame_size || row.size || "";
      const hpNum = parseNumber(row.hp);

      variants.push({
        sku: sku,
        familySlug: item.familySlug,
        name: row.name || `${item.name} سایز ${frameSize}`,
        size: frameSize,
        power: hpNum > 0 ? `${hpNum}HP` : "",
        powerKw: hpNum > 0 ? Math.round(hpNum * 0.7457 * 100) / 100 : 0,
        speed: "",
        mountingType: "فلنجی",
        gearboxType: row.gearbox_type || "",
        modelType: row.product_type || item.type,
        ratio: "",
        inputFrame: "",
        inputType: "",
        pumpType: "",
        outletSize: "",
        headMeter: 0,
        floater: "",
        brand: row.brand || item.brand,
        bodyMaterial: row.body_material || "چدن / آلومینیوم",
        flangeType: row.flange_type || item.type,
        flangeLength: row.flange_length || "استاندارد",
        price: parsePrice(row.price),
        inStock: parsePrice(row.price) > 0,
        sortOrder: parseNumber(frameSize) || parseNumber(sku),
      });
    }
  }

  const families = Array.from(familiesMap.values());

  console.log(`\n✅ ETL Parsing complete:`);
  console.log(`   - Categories: ${CATEGORIES.length}`);
  console.log(`   - Families:   ${families.length}`);
  console.log(`   - Variants:   ${variants.length}`);

  return {
    categories: CATEGORIES,
    families,
    variants,
  };
}

/* ─────────────────────────────────────────────────────────────
 * Database Upsert & Synchronization
 * ───────────────────────────────────────────────────────────── */
export async function runEtlIngestion(baseCsvDir = "C:\\Users\\hosei\\Desktop\\csv") {
  console.log("==================================================");
  console.log("🚀 Starting STK Motors Comprehensive CSV & Excel ETL");
  console.log("==================================================");

  // 1. Build Dataset
  const dataset = buildDatasetFromCsv(baseCsvDir);

  // 2. Save / Sync with prisma/seed-data.json
  const seedJsonPath = path.join(process.cwd(), "prisma", "seed-data.json");
  fs.writeFileSync(seedJsonPath, JSON.stringify(dataset, null, 2), "utf8");
  console.log(`\n💾 Synchronized dataset to: ${seedJsonPath}`);

  // 3. Upsert Categories
  console.log("\n⚡ Upserting Categories into database...");
  const categoryMap = new Map<string, string>();
  for (const cat of dataset.categories) {
    const record = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        nameEn: cat.nameEn,
        description: cat.description,
        icon: cat.icon,
        sortOrder: cat.sortOrder,
      },
      create: {
        slug: cat.slug,
        name: cat.name,
        nameEn: cat.nameEn,
        description: cat.description,
        icon: cat.icon,
        sortOrder: cat.sortOrder,
      },
    });
    categoryMap.set(cat.slug, record.id);
  }
  console.log(`✅ ${categoryMap.size} Categories upserted.`);

  // 4. Upsert Product Families
  console.log("\n⚡ Upserting Product Families into database...");
  const familyMap = new Map<string, string>();
  for (const fam of dataset.families) {
    const categoryId = categoryMap.get(fam.mainCategory) || null;
    const record = await prisma.productFamily.upsert({
      where: { slug: fam.slug },
      update: {
        name: fam.name,
        nameEn: fam.nameEn,
        mainCategory: fam.mainCategory,
        category: fam.category,
        subCategory: fam.subCategory,
        phase: fam.phase,
        shellType: fam.shellType,
        brand: fam.brand,
        level1Value: fam.level1Value || "",
        level2Value: fam.level2Value || "",
        description: fam.description,
        imageUrl: fam.imageUrl,
        sortOrder: fam.sortOrder,
        categoryId: categoryId,
      },
      create: {
        slug: fam.slug,
        name: fam.name,
        nameEn: fam.nameEn,
        mainCategory: fam.mainCategory,
        category: fam.category,
        subCategory: fam.subCategory,
        phase: fam.phase,
        shellType: fam.shellType,
        brand: fam.brand,
        level1Value: fam.level1Value || "",
        level2Value: fam.level2Value || "",
        description: fam.description,
        imageUrl: fam.imageUrl,
        sortOrder: fam.sortOrder,
        categoryId: categoryId,
      },
    });
    familyMap.set(fam.slug, record.id);
  }
  console.log(`✅ ${familyMap.size} Product Families upserted.`);

  // 5. Upsert Product Variants
  console.log("\n⚡ Upserting Product Variants into database...");
  let variantSuccessCount = 0;
  const categoryCounts: Record<string, number> = {
    electromotor: 0,
    gearbox: 0,
    pump: 0,
    accessories: 0,
  };

  for (const v of dataset.variants) {
    const familyId = familyMap.get(v.familySlug);
    if (!familyId) {
      console.warn(`⚠️ Family not found for variant SKU: ${v.sku} (familySlug: ${v.familySlug})`);
      continue;
    }

    const fam = dataset.families.find((f) => f.slug === v.familySlug);
    if (fam && fam.mainCategory in categoryCounts) {
      categoryCounts[fam.mainCategory]++;
    }

    await prisma.productVariant.upsert({
      where: { sku: v.sku },
      update: {
        familyId: familyId,
        name: v.name,
        size: v.size,
        power: v.power,
        powerKw: v.powerKw,
        speed: v.speed,
        mountingType: v.mountingType,
        gearboxType: v.gearboxType,
        modelType: v.modelType,
        ratio: v.ratio,
        inputFrame: v.inputFrame,
        inputType: v.inputType,
        pumpType: v.pumpType,
        outletSize: v.outletSize,
        headMeter: v.headMeter,
        floater: v.floater,
        brand: v.brand,
        bodyMaterial: v.bodyMaterial,
        flangeType: v.flangeType,
        flangeLength: v.flangeLength,
        price: BigInt(v.price),
        inStock: v.inStock,
        sortOrder: v.sortOrder,
      },
      create: {
        sku: v.sku,
        familyId: familyId,
        name: v.name,
        size: v.size,
        power: v.power,
        powerKw: v.powerKw,
        speed: v.speed,
        mountingType: v.mountingType,
        gearboxType: v.gearboxType,
        modelType: v.modelType,
        ratio: v.ratio,
        inputFrame: v.inputFrame,
        inputType: v.inputType,
        pumpType: v.pumpType,
        outletSize: v.outletSize,
        headMeter: v.headMeter,
        floater: v.floater,
        brand: v.brand,
        bodyMaterial: v.bodyMaterial,
        flangeType: v.flangeType,
        flangeLength: v.flangeLength,
        price: BigInt(v.price),
        inStock: v.inStock,
        sortOrder: v.sortOrder,
      },
    });

    variantSuccessCount++;
  }

  console.log("\n==================================================");
  console.log("📊 Ingestion Summary by Category:");
  console.log("==================================================");
  console.log(`🔌 الکتروموتور (electromotor):  ${categoryCounts.electromotor} variants`);
  console.log(`⚙️ گیربکس (gearbox):         ${categoryCounts.gearbox} variants`);
  console.log(`💧 پمپ (pump):                ${categoryCounts.pump} variants`);
  console.log(`🔧 لوازم جانبی (accessories): ${categoryCounts.accessories} variants`);
  console.log("--------------------------------------------------");
  console.log(`🎉 TOTAL INGESTED VARIANTS:   ${variantSuccessCount} variants`);
  console.log("==================================================\n");

  await prisma.$disconnect();
  return {
    categories: dataset.categories.length,
    families: dataset.families.length,
    variants: variantSuccessCount,
    categoryCounts,
  };
}

/* ─────────────────────────────────────────────────────────────
 * CLI Entrypoint
 * ───────────────────────────────────────────────────────────── */
if (require.main === module || process.argv[1]?.endsWith("import-all-csv.ts")) {
  const csvDirArg = process.argv[2] || "C:\\Users\\hosei\\Desktop\\csv";
  runEtlIngestion(csvDirArg).catch((err) => {
    console.error("❌ ETL Ingestion failed:", err);
    process.exit(1);
  });
}
