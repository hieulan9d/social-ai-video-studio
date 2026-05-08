import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/lib/auth/server";
import { searchProjects } from "@/lib/projects/server";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUserProfile();

    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
    }

    const query = request.nextUrl.searchParams.get("q") ?? "";
    const projects = await searchProjects({
      userId: user.id,
      query,
      limit: 6,
    });

    return NextResponse.json({
      ok: true,
      projects: projects.map((project) => ({
        id: project.id,
        title: project.title,
        brief: project.brief,
        platform: project.platform,
        videoType: project.videoType,
        language: project.language,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Search failed.",
      },
      { status: 400 },
    );
  }
}
