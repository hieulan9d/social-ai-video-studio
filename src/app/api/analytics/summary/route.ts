import { NextResponse } from "next/server";
import { getAnalyticsDashboardSummary } from "@/lib/analytics/dashboard";
import { getCurrentUserProfile } from "@/lib/auth/server";

export async function GET() {
  const user = await getCurrentUserProfile();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Bạn cần đăng nhập." }, { status: 401 });
  }

  const summary = await getAnalyticsDashboardSummary(user.id);
  return NextResponse.json({ ok: true, summary });
}
