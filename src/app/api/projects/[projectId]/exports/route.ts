import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/lib/auth/server";
import { createVideoExport } from "@/lib/exports/server";

export const runtime = "nodejs";

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
      error: error instanceof Error ? error.message : "Export request failed.",
    },
    { status },
  );
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const user = await getApiUser();
    const { projectId } = await params;
    const payload = (await request.json()) as {
      videoIds?: unknown;
      exportRatio?: unknown;
      subtitles?: unknown;
      voiceoverAssetId?: unknown;
      musicAssetId?: unknown;
      logoAssetId?: unknown;
    };

    if (
      !Array.isArray(payload.videoIds) ||
      !payload.videoIds.every((value) => typeof value === "string") ||
      typeof payload.exportRatio !== "string"
    ) {
      throw new Error("Video IDs and export ratio are required.");
    }

    const exportJob = await createVideoExport({
      projectId,
      userId: user.id,
      videoIds: payload.videoIds,
      exportRatio: payload.exportRatio,
      options: {
        subtitles:
          typeof payload.subtitles === "string" ? payload.subtitles : undefined,
        voiceoverAssetId:
          typeof payload.voiceoverAssetId === "string"
            ? payload.voiceoverAssetId
            : undefined,
        musicAssetId:
          typeof payload.musicAssetId === "string"
            ? payload.musicAssetId
            : undefined,
        logoAssetId:
          typeof payload.logoAssetId === "string" ? payload.logoAssetId : undefined,
      },
    });

    return NextResponse.json({
      ok: true,
      exportJob,
    });
  } catch (error) {
    return errorResponse(
      error,
      error instanceof Error && error.message === "Unauthorized." ? 401 : 400,
    );
  }
}
