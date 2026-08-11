import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const [families, variants, singlePhaseCount, threePhaseCount, speedGroups, sizeGroups] =
    await Promise.all([
      db.productFamily.count(),
      db.productVariant.count(),
      db.productFamily.count({ where: { category: "single-phase" } }),
      db.productFamily.count({ where: { category: "three-phase" } }),
      db.productVariant.groupBy({ by: ["speed"] }),
      db.productVariant.groupBy({ by: ["size"] }),
    ]);

  const speeds = speedGroups.map((row) => row.speed).filter(Boolean).sort((a, b) => Number.parseInt(a) - Number.parseInt(b));
  const sizes = sizeGroups.map((row) => row.size).filter(Boolean).sort((a, b) => Number.parseInt(a) - Number.parseInt(b));

  return NextResponse.json(
    { families, variants, singlePhaseFamilies: singlePhaseCount, threePhaseFamilies: threePhaseCount, speeds, sizes },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=900" } }
  );
}
