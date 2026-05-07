import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/lib/auth/server";
import { syncRenderJob } from "@/lib/render/server";

async function getApiUser() {
  const user = await getCurrentUserProfile();

  if (!user) {
    throw new Error("Unauthorized.");
  }

  return user;
}

function errorResponse(error: unknown, status = 400) {
  return NextResponse.json(
    {
      ok: false,
      error: error instanceof Error ? error.message : "Render sync failed.",
    },
    { status },
  );
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ renderJobId: string }> },
) {
  try {
    const user = await getApiUser();
    const { renderJobId } = await params;
    const renderJob = await syncRenderJob(renderJobId, user.id);

    return NextResponse.json({
      ok: true,
      renderJob,
    });
  } catch (error) {
    return errorResponse(
      error,
      error instanceof Error && error.message === "Unauthorized." ? 401 : 400,
    );
  }
}
