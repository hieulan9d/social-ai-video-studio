import { NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/lib/auth/server";
import { getProjects } from "@/lib/projects/server";

export async function GET() {
  const user = await getCurrentUserProfile();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Ban can dang nhap." }, { status: 401 });
  }

  const projects = await getProjects(user.id);
  return NextResponse.json({ ok: true, projects });
}
