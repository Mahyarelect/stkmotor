import { NextRequest, NextResponse } from "next/server";
import { submitLeadToDidar, normalizeIranianMobile } from "@/lib/didar";

// Simple in-memory rate limiter per IP: max 20 requests per 10 minutes with auto-prune
const rateLimitMap = new Map<string, { count: number; expiresAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const maxRequests = 20;

  // Auto-prune expired records to prevent unbounded memory growth
  if (rateLimitMap.size > 200) {
    for (const [key, val] of rateLimitMap.entries()) {
      if (val.expiresAt < now) {
        rateLimitMap.delete(key);
      }
    }
  }

  const record = rateLimitMap.get(ip);
  if (!record || record.expiresAt < now) {
    rateLimitMap.set(ip, { count: 1, expiresAt: now + windowMs });
    return false;
  }

  if (record.count >= maxRequests) {
    return true;
  }

  record.count += 1;
  return false;
}

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-real-ip") ||
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      (process.env.NODE_ENV === "test" ? `test-ip-${Date.now()}` : "anonymous");

    if (isRateLimited(ip)) {
      return NextResponse.json(
        {
          success: false,
          error: "تعداد درخواست‌های ارسالی شما بیش از حد مجاز است. لطفاً چند دقیقه دیگر مجدداً تلاش نمایید.",
        },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "داده‌های ارسالی نامعتبر است." },
        { status: 400 }
      );
    }

    const {
      fullName,
      phone,
      company,
      message,
      productTitle,
      productSku,
      productUrl,
      variantDetails,
    } = body;

    // Validation
    const nameStr = typeof fullName === "string" ? fullName.trim().slice(0, 100) : "";
    if (nameStr.length < 2) {
      return NextResponse.json(
        { success: false, error: "لطفاً نام و نام خانوادگی خود را کامل وارد کنید." },
        { status: 400 }
      );
    }

    const phoneStr = typeof phone === "string" ? phone : "";
    const normalizedPhone = normalizeIranianMobile(phoneStr);
    if (!normalizedPhone) {
      return NextResponse.json(
        {
          success: false,
          error: "شماره موبایل وارد شده معتبر نیست. لطفاً یک شماره ۱۱ رقمی معتبر (مانند ۰۹۱۲۳۴۵۶۷۸۹) وارد کنید.",
        },
        { status: 400 }
      );
    }

    const result = await submitLeadToDidar({
      fullName: nameStr,
      phone: normalizedPhone,
      company: typeof company === "string" ? company.trim().slice(0, 100) : "",
      message: typeof message === "string" ? message.trim().slice(0, 1000) : "",
      productTitle: typeof productTitle === "string" ? productTitle.trim().slice(0, 150) : "محصول صنعتی",
      productSku: typeof productSku === "string" ? productSku.trim().slice(0, 50) : "",
      productUrl: typeof productUrl === "string" ? productUrl.trim().slice(0, 300) : "",
      variantDetails: typeof variantDetails === "string" ? variantDetails.trim().slice(0, 200) : "",
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      contactId: result.contactId,
      dealId: result.dealId,
    });
  } catch (error) {
    console.error("[api/leads] Internal error processing lead:", error);
    return NextResponse.json(
      {
        success: false,
        error: "خطایی در ثبت اطلاعات در سامانه رخ داد. لطفاً با پشتیبانی یا شماره تماس‌های سایت تماس بگیرید.",
      },
      { status: 500 }
    );
  }
}
