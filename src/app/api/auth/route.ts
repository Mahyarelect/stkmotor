import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createToken } from "@/lib/auth";
import bcrypt from "bcryptjs";
import {
  clearLoginFailures,
  loginRetryAfterSeconds,
  recordLoginFailure,
} from "@/lib/login-rate-limit";

export async function POST(request: NextRequest) {
  const { username, password } = await request.json();

  if (!username || !password) {
    return NextResponse.json(
      { error: "نام کاربری و رمز عبور الزامی است" },
      { status: 400 }
    );
  }

  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const clientKey = `${forwardedFor || "local"}:${String(username).toLowerCase()}`;
  const retryAfter = loginRetryAfterSeconds(clientKey);
  if (retryAfter > 0) {
    return NextResponse.json(
      { error: "تعداد تلاش‌های ورود بیش از حد مجاز است. کمی بعد دوباره تلاش کنید." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  const admin = await db.adminUser.findUnique({ where: { username } });
  if (!admin) {
    recordLoginFailure(clientKey);
    return NextResponse.json(
      { error: "نام کاربری یا رمز عبور اشتباه است" },
      { status: 401 }
    );
  }

  const valid = await bcrypt.compare(password, admin.password);
  if (!valid) {
    recordLoginFailure(clientKey);
    return NextResponse.json(
      { error: "نام کاربری یا رمز عبور اشتباه است" },
      { status: 401 }
    );
  }

  if (admin.role !== "admin") {
    recordLoginFailure(clientKey);
    return NextResponse.json(
      { error: "دسترسی به پنل فقط برای مدیر اصلی مجاز است" },
      { status: 403 }
    );
  }

  clearLoginFailures(clientKey);

  const token = await createToken({
    userId: admin.id,
    username: admin.username,
    name: admin.name || admin.username,
    role: admin.role,
  });

  const response = NextResponse.json({
    success: true,
    user: { name: admin.name || admin.username, role: admin.role },
  });

  response.cookies.set("admin_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set("admin_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return response;
}
