import { NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/lib/auth/server";
import { getDashboardSummary } from "@/lib/dashboard/summary";

export async function GET() {
  const user = await getCurrentUserProfile();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Bạn cần đăng nhập." }, { status: 401 });
  }

  const summary = await getDashboardSummary(user.id);
  return NextResponse.json({ ok: true, summary });
}
