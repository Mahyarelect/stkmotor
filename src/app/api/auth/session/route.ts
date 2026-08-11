import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    const session = await requireAdmin();
    return NextResponse.json({
      authenticated: true,
      user: { name: session.name, role: session.role },
    });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
