import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const pages = await db.landingPage.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        slug: true,
        title: true,
        subtitle: true,
        description: true,
        bannerUrl: true,
        ctaText: true,
        ctaLink: true,
        sortOrder: true,
        featuredFamilySlugs: true,
      },
    });

    return NextResponse.json({ pages });
  } catch (error) {
    console.error("GET /api/landing error:", error);
    return NextResponse.json({ pages: [] }, { status: 500 });
  }
}
