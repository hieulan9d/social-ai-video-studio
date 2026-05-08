import { NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/lib/auth/server";
import { getProjects } from "@/lib/projects/server";

export async function GET() {
  const user = await getCurrentUserProfile();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Bạn cần đăng nhập." }, { status: 401 });
  }

  const projects = await getProjects(user.id);
  return NextResponse.json({ ok: true, projects });
}
