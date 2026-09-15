import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";

function unauthorized(error: unknown) {
  return error instanceof Error && error.message === "Unauthorized";
}

export async function GET() {
  try {
    await requireAdmin();
    let about = await db.aboutPage.findFirst();
    if (!about) {
      about = await db.aboutPage.create({
        data: {},
      });
    }
    return NextResponse.json(about);
  } catch (error) {
    if (unauthorized(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/admin/about error:", error);
    return NextResponse.json(
      { error: "خطا در دریافت اطلاعات درباره ما" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();

    let about = await db.aboutPage.findFirst();
    if (!about) {
      about = await db.aboutPage.create({
        data: {},
      });
    }

    const values = Array.isArray(body.values)
      ? JSON.stringify(body.values)
      : typeof body.values === "string"
      ? body.values
      : about.values;

    const gallery = Array.isArray(body.gallery)
      ? JSON.stringify(body.gallery)
      : typeof body.gallery === "string"
      ? body.gallery
      : about.gallery;

    const stats = Array.isArray(body.stats)
      ? JSON.stringify(body.stats)
      : typeof body.stats === "string"
      ? body.stats
      : about.stats;

    const updated = await db.aboutPage.update({
      where: { id: about.id },
      data: {
        title: body.title !== undefined ? String(body.title).trim() : about.title,
        subtitle: body.subtitle !== undefined ? String(body.subtitle).trim() : about.subtitle,
        introText: body.introText !== undefined ? String(body.introText).trim() : about.introText,
        storyTitle: body.storyTitle !== undefined ? String(body.storyTitle).trim() : about.storyTitle,
        storyText: body.storyText !== undefined ? String(body.storyText).trim() : about.storyText,
        missionTitle: body.missionTitle !== undefined ? String(body.missionTitle).trim() : about.missionTitle,
        missionText: body.missionText !== undefined ? String(body.missionText).trim() : about.missionText,
        values,
        gallery,
        stats,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (unauthorized(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("PUT /api/admin/about error:", error);
    return NextResponse.json(
      { error: "خطا در ذخیره اطلاعات درباره ما" },
      { status: 500 }
    );
  }
}
