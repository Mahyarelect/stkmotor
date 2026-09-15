import { Metadata } from "next";
import { db } from "@/lib/db";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import AboutUsClient from "./AboutUsClient";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const about = await db.aboutPage.findFirst();
  const title = about?.title || "درباره ما | گروه صنعتی STK";
  const description =
    about?.subtitle ||
    about?.introText?.slice(0, 160) ||
    "آشنایی با تاریخچه، رسالت، گالری تصاویر و ارزش‌های گروه صنعتی STK، مرجع الکتروموتور و ماشین‌آلات صنعتی";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
    },
  };
}

export default async function AboutPage() {
  let about = await db.aboutPage.findFirst();
  if (!about) {
    about = await db.aboutPage.create({
      data: {},
    });
  }

  // Also fetch site settings for address and phone numbers
  const settings = await db.siteSetting.findMany();
  const settingsMap: Record<string, string> = {};
  settings.forEach((s) => {
    settingsMap[s.key] = s.value;
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50" dir="rtl">
      <SiteHeader />
      <main className="flex-1">
        <AboutUsClient
          data={{
            title: about.title,
            subtitle: about.subtitle,
            introText: about.introText,
            storyTitle: about.storyTitle,
            storyText: about.storyText,
            missionTitle: about.missionTitle,
            missionText: about.missionText,
            values: about.values,
            gallery: about.gallery,
            stats: about.stats,
          }}
          settings={settingsMap}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
