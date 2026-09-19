import { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import LandingPageClient from "./LandingPageClient";

export const revalidate = 30;

async function findLandingPage(rawSlug: string) {
  if (!rawSlug) return null;
  let decoded = rawSlug;
  try {
    decoded = decodeURIComponent(rawSlug);
  } catch {
    decoded = rawSlug;
  }
  const clean = decoded.trim();
  const lower = clean.toLowerCase();
  const rawLower = rawSlug.trim().toLowerCase();

  return db.landingPage.findFirst({
    where: {
      OR: [
        { slug: clean },
        { slug: rawSlug },
        { slug: lower },
        { slug: rawLower },
        { slug: { equals: clean, mode: "insensitive" } },
      ],
    },
  });
}

export async function generateMetadata(
  props: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await props.params;
  const page = await findLandingPage(slug);

  if (!page) {
    return {
      title: "صفحه مورد نظر پیدا نشد",
    };
  }

  const title = page.seoTitle || page.title;
  const description = page.seoDescription || page.subtitle || page.description.slice(0, 160);

  return {
    title: `${title} | STK Motors`,
    description,
    openGraph: {
      title: `${title} | STK Motors`,
      description,
      images: page.bannerUrl ? [{ url: page.bannerUrl }] : [],
    },
  };
}

export default async function DynamicLandingPage(
  props: { params: Promise<{ slug: string }> }
) {
  const { slug } = await props.params;
  const session = await getSession();
  const isAdmin = session?.role === "admin";

  const landingPage = await findLandingPage(slug);

  if (!landingPage || (!landingPage.isActive && !isAdmin)) {
    notFound();
  }

  // Load featured product families
  let familySlugs: string[] = [];
  try {
    familySlugs = JSON.parse(landingPage.featuredFamilySlugs || "[]");
  } catch {
    familySlugs = [];
  }

  let featuredFamilies: any[] = [];
  if (familySlugs.length > 0) {
    const records = await db.productFamily.findMany({
      where: {
        slug: { in: familySlugs },
      },
      include: {
        variants: {
          select: {
            id: true,
            sku: true,
            name: true,
            price: true,
            inStock: true,
            power: true,
            speed: true,
            size: true,
          },
          orderBy: [{ inStock: "desc" }, { price: "asc" }],
        },
      },
    });

    featuredFamilies = familySlugs
      .map((slug) => records.find((r) => r.slug === slug))
      .filter(Boolean)
      .map((f) => {
        const prices = f!.variants.map((v) => Number(v.price)).filter((p) => p > 0);
        const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
        const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
        const hasInStock = f!.variants.some((v) => v.inStock);

        return {
          id: f!.id,
          slug: f!.slug,
          name: f!.name,
          nameEn: f!.nameEn,
          mainCategory: f!.mainCategory,
          category: f!.category,
          brand: f!.brand,
          description: f!.description,
          imageUrl: f!.imageUrl,
          variantCount: f!.variants.length,
          minPrice,
          maxPrice,
          inStock: hasInStock,
        };
      });
  }

  // Also fetch site settings for contact buttons
  const settings = await db.siteSetting.findMany();
  const settingsMap: Record<string, string> = {};
  settings.forEach((s) => {
    settingsMap[s.key] = s.value;
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50" dir="rtl">
      <SiteHeader />
      <main className="flex-1">
        <LandingPageClient
          page={landingPage}
          families={featuredFamilies}
          settings={settingsMap}
          isAdminPreview={!landingPage.isActive && isAdmin}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
