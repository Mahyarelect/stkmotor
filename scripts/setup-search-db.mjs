import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("[search-db] Setting up PostgreSQL search extensions and indexes...");

  try {
    // 1. Enable pg_trgm extension for fuzzy and trigram matching
    await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS pg_trgm;`);
    console.log("[search-db] Extension pg_trgm enabled.");

    // 2. Add GIN trigram indexes on ProductVariant
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_variant_trgm_name 
      ON "ProductVariant" USING gin (name gin_trgm_ops);
    `);
    console.log("[search-db] Index idx_variant_trgm_name ready.");

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_variant_trgm_model 
      ON "ProductVariant" USING gin ("modelType" gin_trgm_ops);
    `);
    console.log("[search-db] Index idx_variant_trgm_model ready.");

    // 3. Add GIN trigram indexes on ProductFamily
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_family_trgm_name 
      ON "ProductFamily" USING gin (name gin_trgm_ops);
    `);
    console.log("[search-db] Index idx_family_trgm_name ready.");

    // 4. B-tree index on SKU
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_variant_sku 
      ON "ProductVariant" (sku);
    `);
    console.log("[search-db] Index idx_variant_sku ready.");

    console.log("[search-db] All search indexes verified and active!");
  } catch (error) {
    console.error("[search-db] Error setting up database search:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
