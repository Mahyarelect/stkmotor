import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

interface SeedCategory {
  slug: string;
  name: string;
  nameEn: string;
  description: string;
  icon: string;
  sortOrder: number;
}

interface SeedFamily {
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
  sortOrder: number;
}

interface SeedVariant {
  sku: string;
  familySlug: string;
  name: string;
  size: string;
  power: string;
  powerKw: number;
  speed: string;
  voltage?: string;
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

interface SeedData {
  categories: SeedCategory[];
  families: SeedFamily[];
  variants: SeedVariant[];
}

async function main() {
  console.log("==================================================");
  console.log("🚀 Starting STK Motors Comprehensive Database Seed");
  console.log("==================================================\n");

  // 1. Seed / Rotate Admin User
  const adminUsername = process.env.ADMIN_USERNAME || "admin";
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin123456!";
  const adminName = process.env.ADMIN_NAME || "مدیر سایت";

  const existingAdmin = await prisma.adminUser.findUnique({
    where: { username: adminUsername },
  });

  const hashedPassword = await bcrypt.hash(adminPassword, 12);
  if (!existingAdmin) {
    await prisma.adminUser.create({
      data: {
        username: adminUsername,
        password: hashedPassword,
        name: adminName,
        role: "admin",
      },
    });
    console.log(`✅ Admin user created: ${adminUsername}`);
  } else {
    await prisma.adminUser.update({
      where: { username: adminUsername },
      data: {
        password: hashedPassword,
        name: adminName,
        role: "admin",
      },
    });
    console.log(`✅ Admin user credentials updated/verified: ${adminUsername}`);
  }

  // 2. Seed Default Site Settings
  const defaultSettings = [
    { key: "site_name", value: "STK Motors", label: "نام سایت", group: "general" },
    { key: "site_description", value: "کاتالوگ تخصصی الکتروموتور، گیربکس، پمپ و لوازم جانبی صنعتی STK", label: "توضیحات سایت", group: "general" },
    { key: "phone", value: "021-1234-5678", label: "شماره تماس دفتر", group: "contact" },
    { key: "mobile", value: "0912-345-6789", label: "شماره همراه مشاوره", group: "contact" },
    { key: "email", value: "info@stkmotors.com", label: "ایمیل پشتیبانی", group: "contact" },
    { key: "address", value: "تهران، خیابان سعدی جنوبی، پلاک ۱۲۳", label: "آدرس فروشگاه", group: "contact" },
    { key: "instagram", value: "https://instagram.com/stkmotors", label: "آدرس اینستاگرام", group: "social" },
    { key: "telegram", value: "https://t.me/stkmotors", label: "آدرس کانال تلگرام", group: "social" },
    { key: "whatsapp", value: "989123456789", label: "شماره پشتیبانی واتساپ", group: "social" },
  ];

  for (const s of defaultSettings) {
    await prisma.siteSetting.upsert({
      where: { key: s.key },
      update: { label: s.label, group: s.group },
      create: s,
    });
  }
  console.log(`✅ Default site settings verified (${defaultSettings.length} items)`);

  // 3. Load Seed Data JSON
  const seedDataPath = path.join(__dirname, "seed-data.json");
  if (!fs.existsSync(seedDataPath)) {
    throw new Error(`Seed data file not found at ${seedDataPath}`);
  }
  const seedData: SeedData = JSON.parse(fs.readFileSync(seedDataPath, "utf-8"));
  console.log(`\n📦 Loaded seed data: ${seedData.categories.length} categories, ${seedData.families.length} families, ${seedData.variants.length} variants\n`);

  // 4. Clean up legacy/orphaned catalog records
  const validFamilySlugs = new Set(seedData.families.map((f) => f.slug));
  const validVariantSkus = new Set(seedData.variants.map((v) => v.sku));

  // Delete legacy variants that are not in the new clean dataset
  const deletedVariants = await prisma.productVariant.deleteMany({
    where: {
      sku: { notIn: Array.from(validVariantSkus) },
    },
  });
  if (deletedVariants.count > 0) {
    console.log(`🧹 Cleaned up ${deletedVariants.count} obsolete product variants`);
  }

  // Delete legacy families that are not in the new clean dataset
  const deletedFamilies = await prisma.productFamily.deleteMany({
    where: {
      slug: { notIn: Array.from(validFamilySlugs) },
    },
  });
  if (deletedFamilies.count > 0) {
    console.log(`🧹 Cleaned up ${deletedFamilies.count} obsolete product families`);
  }

  // 5. Seed Categories
  const categoryMap = new Map<string, string>();
  for (const cat of seedData.categories) {
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
  console.log(`✅ Seeded ${categoryMap.size} root categories`);

  // 6. Seed Product Families
  const familyMap = new Map<string, string>();
  for (const fam of seedData.families) {
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
        sortOrder: fam.sortOrder,
        categoryId: categoryId,
      },
    });
    familyMap.set(fam.slug, record.id);
  }
  console.log(`✅ Seeded ${familyMap.size} product families`);

  // 6. Seed Product Variants
  let seededVariants = 0;
  const categoryVariantCounts: Record<string, number> = {};

  for (const v of seedData.variants) {
    const familyId = familyMap.get(v.familySlug);
    if (!familyId) {
      console.warn(`⚠️ Family not found for variant SKU ${v.sku} (familySlug: ${v.familySlug})`);
      continue;
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
        voltage: v.voltage || "",
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
        familyId: familyId,
        sku: v.sku,
        name: v.name,
        size: v.size,
        power: v.power,
        powerKw: v.powerKw,
        speed: v.speed,
        voltage: v.voltage || "",
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

    seededVariants++;
    const famObj = seedData.families.find((f) => f.slug === v.familySlug);
    const mainCat = famObj?.mainCategory || "other";
    categoryVariantCounts[mainCat] = (categoryVariantCounts[mainCat] || 0) + 1;
  }

  console.log(`\n==================================================`);
  console.log(`🎉 Database Seeding Completed Successfully!`);
  console.log(`==================================================`);
  console.log(`Total Categories: ${seedData.categories.length}`);
  console.log(`Total Product Families: ${seedData.families.length}`);
  console.log(`Total Variants Seeded: ${seededVariants}`);
  console.log(`\nVariant breakdown by category:`);
  for (const [cat, count] of Object.entries(categoryVariantCounts)) {
    console.log(`  - ${cat}: ${count} variants`);
  }
  console.log(`==================================================\n`);
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed with error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
