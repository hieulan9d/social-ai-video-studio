import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/lib/auth/server";
import { listQuickGenerations } from "@/lib/ai/quick-generations";

export async function GET(request: NextRequest) {
  const user = await getCurrentUserProfile();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Bạn cần đăng nhập." }, { status: 401 });
  }

  const type = request.nextUrl.searchParams.get("type");
  const generations = await listQuickGenerations({
    userId: user.id,
    type: type === "image" || type === "video" ? type : undefined,
  });

  return NextResponse.json({ ok: true, generations });
}
