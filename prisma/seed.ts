import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import rawProducts from "../src/data/products.json";

const prisma = new PrismaClient();

// Helper: normalize power to kW
function toKw(power: string): number {
  if (!power) return 0;
  const hpMatch = power.match(/([\d.]+)\s*HP/i);
  if (hpMatch) return parseFloat(hpMatch[1]) * 0.746;
  const kwMatch = power.match(/([\d.]+)\s*kw/i);
  if (kwMatch) return parseFloat(kwMatch[1]);
  return 0;
}

// Helper: infer frame size from power (standard IEC mappings)
function inferFrameSize(power: string, speed: string): string {
  const kw = toKw(power);
  if (kw <= 0.09) return "56";
  if (kw <= 0.18) return "63";
  if (kw <= 0.37) return "71";
  if (kw <= 0.75) return "80";
  if (kw <= 1.5) return "90";
  if (kw <= 3.0) return "100";
  if (kw <= 5.5) return "112";
  if (kw <= 11) return "132";
  if (kw <= 18.5) return "160";
  if (kw <= 30) return "180";
  if (kw <= 45) return "200";
  if (kw <= 75) return "225";
  if (kw <= 110) return "250";
  if (kw <= 160) return "280";
  if (kw <= 250) return "315";
  return "355";
}

async function main() {
  // Local/bootstrap seeding is intentionally non-destructive.
  // Existing catalog records are preserved; missing seed records are only added.

  // Seed/rotate admin user. Production never falls back to a known password.
  const adminUsername = process.env.ADMIN_USERNAME || "admin";
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_NAME || "مدیر سایت";
  const existingAdmin = await prisma.adminUser.findUnique({
    where: { username: adminUsername },
  });

  if (!existingAdmin) {
    if (!adminPassword) {
      throw new Error("ADMIN_PASSWORD must be set before creating the admin user");
    }
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    await prisma.adminUser.create({
      data: { username: adminUsername, password: hashedPassword, name: adminName, role: "admin" },
    });
    console.log(`Admin user created: ${adminUsername}`);
  } else if (adminPassword) {
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    await prisma.adminUser.update({
      where: { username: adminUsername },
      data: { password: hashedPassword, name: adminName, role: "admin" },
    });
    console.log(`Admin user credentials rotated: ${adminUsername}`);
  } else {
    console.log(`Admin user kept unchanged: ${adminUsername}`);
  }

  // Seed default settings
  const defaultSettings = [
    { key: "site_name", value: "STK Motors", label: "نام سایت", group: "general" },
    { key: "site_description", value: "کاتالوگ الکتروموتور STK", label: "توضیحات سایت", group: "general" },
    { key: "phone", value: "021-1234-5678", label: "شماره تماس", group: "contact" },
    { key: "mobile", value: "0912-345-6789", label: "شماره موبایل", group: "contact" },
    { key: "email", value: "info@stkmotors.com", label: "ایمیل", group: "contact" },
    { key: "address", value: "تهران، ایران", label: "آدرس", group: "contact" },
    { key: "instagram", value: "https://instagram.com/stkmotors", label: "آدرس اینستاگرام", group: "social" },
    { key: "telegram", value: "https://t.me/stkmotors", label: "آدرس تلگرام", group: "social" },
    { key: "whatsapp", value: "982112345678", label: "شماره واتساپ", group: "social" },
  ];

  for (const s of defaultSettings) {
    await prisma.siteSetting.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    });
  }
  console.log("Site settings seeded");

  // Define motor families
  const families: Record<string, {
    slug: string;
    name: string;
    nameEn: string;
    category: string;
    phase: string;
    shellType: string;
    description: string;
    sortOrder: number;
  }> = {
    "single-phase-1400": {
      slug: "single-phase-1400",
      name: "الکتروموتور تک‌فاز ۱۴۰۰ دور",
      nameEn: "Single-Phase Motor 1400 RPM",
      category: "single-phase",
      phase: "تک‌فاز",
      shellType: "چدنی",
      description: "الکتروموتورهای تک‌فاز پوسته چدنی با سرعت ۱۴۰۰ دور بر دقیقه",
      sortOrder: 1,
    },
    "single-phase-3000": {
      slug: "single-phase-3000",
      name: "الکتروموتور تک‌فاز ۳۰۰۰ دور",
      nameEn: "Single-Phase Motor 3000 RPM",
      category: "single-phase",
      phase: "تک‌فاز",
      shellType: "چدنی",
      description: "الکتروموتورهای تک‌فاز پوسته چدنی با سرعت ۳۰۰۰ دور بر دقیقه",
      sortOrder: 2,
    },
    "three-phase-1000": {
      slug: "three-phase-1000",
      name: "الکتروموتور سه‌فاز ۱۰۰۰ دور",
      nameEn: "Three-Phase Motor 1000 RPM",
      category: "three-phase",
      phase: "سه‌فاز",
      shellType: "چدنی",
      description: "الکتروموتورهای سه‌فاز پوسته چدنی با سرعت ۱۰۰۰ دور بر دقیقه",
      sortOrder: 3,
    },
    "three-phase-1400": {
      slug: "three-phase-1400",
      name: "الکتروموتور سه‌فاز ۱۴۰۰ دور",
      nameEn: "Three-Phase Motor 1400 RPM",
      category: "three-phase",
      phase: "سه‌فاز",
      shellType: "چدنی",
      description: "الکتروموتورهای سه‌فاز پوسته چدنی با سرعت ۱۴۰۰ دور بر دقیقه",
      sortOrder: 4,
    },
    "three-phase-3000": {
      slug: "three-phase-3000",
      name: "الکتروموتور سه‌فاز ۳۰۰۰ دور",
      nameEn: "Three-Phase Motor 3000 RPM",
      category: "three-phase",
      phase: "سه‌فاز",
      shellType: "چدنی",
      description: "الکتروموتورهای سه‌فاز پوسته چدنی با سرعت ۳۰۰۰ دور بر دقیقه",
      sortOrder: 5,
    },
    "three-phase-special": {
      slug: "three-phase-special",
      name: "الکتروموتور سه‌فاز مدل‌های ویژه",
      nameEn: "Three-Phase Motor Special Models",
      category: "three-phase",
      phase: "سه‌فاز",
      shellType: "چدنی",
      description: "الکتروموتورهای سه‌فاز مدل‌های ویژه",
      sortOrder: 6,
    },
  };

  // Create families
  for (const [key, familyData] of Object.entries(families)) {
    await prisma.productFamily.upsert({
      where: { slug: key },
      update: {},
      create: familyData,
    });
  }

  // Create variants
  let variantCount = 0;
  for (const p of rawProducts) {
    const speed = String(p.speed || "").trim();
    const category = String(p.category || "").trim();
    const power = String(p.power || "").trim();
    const name = String(p.name || "").trim();

    let familySlug: string;
    const isFlange = name.includes("فلنج");

    if (category === "single-phase") {
      if (speed === "1400") familySlug = "single-phase-1400";
      else if (speed === "3000") familySlug = "single-phase-3000";
      else familySlug = "single-phase-3000";
    } else {
      if (isFlange) {
        familySlug = "three-phase-special";
      } else if (speed === "1000" || speed === "750" || speed === "700") {
        familySlug = "three-phase-1000";
      } else if (speed === "1400") {
        familySlug = "three-phase-1400";
      } else if (speed === "3000") {
        familySlug = "three-phase-3000";
      } else {
        familySlug = "three-phase-special";
      }
    }

    const family = await prisma.productFamily.findUnique({ where: { slug: familySlug } });
    if (!family) {
      console.warn(`Family not found: ${familySlug}`);
      continue;
    }

    const frameSize = inferFrameSize(power, speed);
    const kw = toKw(power);
    const inStock = (p.price || 0) > 0;
    const voltage = category === "single-phase" ? "220V" : "380V";

    await prisma.productVariant.upsert({
      where: { sku: String(p.code) },
      update: {},
      create: {
        familyId: family.id,
        sku: String(p.code),
        size: frameSize,
        power: power,
        powerKw: kw,
        speed: speed,
        voltage: voltage,
        price: p.price || 0,
        inStock: inStock,
        sortOrder: kw > 0 ? Math.round(kw * 100) : 999,
      },
    });
    variantCount++;
  }

  console.log(`\nSeeded: ${variantCount} variants across families`);
  console.log("Done!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
