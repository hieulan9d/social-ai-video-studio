import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/lib/auth/server";
import {
  createImageToVideoRender,
  createStartEndTransitionRender,
  createTextToVideoRender,
} from "@/lib/render/server";

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
      error: error instanceof Error ? error.message : "Render request failed.",
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
      mode?: unknown;
      promptId?: unknown;
      assetId?: unknown;
      startAssetId?: unknown;
      endAssetId?: unknown;
      motionStyle?: unknown;
      transitionStyle?: unknown;
      durationSeconds?: unknown;
      prompt?: unknown;
    };

    if (payload.mode === "image_to_video") {
      if (
        typeof payload.assetId !== "string" ||
        typeof payload.motionStyle !== "string" ||
        typeof payload.prompt !== "string"
      ) {
        throw new Error("Image, motion style, and prompt are required.");
      }

      const renderJob = await createImageToVideoRender({
        projectId,
        assetId: payload.assetId,
        userId: user.id,
        motionStyle: payload.motionStyle,
        durationSeconds:
          typeof payload.durationSeconds === "number"
            ? payload.durationSeconds
            : undefined,
        prompt: payload.prompt,
      });

      return NextResponse.json({
        ok: true,
        renderJob,
      });
    }

    if (payload.mode === "start_end_transition") {
      if (
        typeof payload.startAssetId !== "string" ||
        typeof payload.endAssetId !== "string" ||
        typeof payload.transitionStyle !== "string" ||
        typeof payload.prompt !== "string"
      ) {
        throw new Error(
          "Start image, end image, transition style, and prompt are required.",
        );
      }

      const renderJob = await createStartEndTransitionRender({
        projectId,
        startAssetId: payload.startAssetId,
        endAssetId: payload.endAssetId,
        userId: user.id,
        transitionStyle: payload.transitionStyle,
        durationSeconds:
          typeof payload.durationSeconds === "number"
            ? payload.durationSeconds
            : undefined,
        prompt: payload.prompt,
      });

      return NextResponse.json({
        ok: true,
        renderJob,
      });
    }

    if (typeof payload.promptId !== "string") {
      throw new Error("Prompt is required.");
    }

    const renderJob = await createTextToVideoRender({
      projectId,
      promptId: payload.promptId,
      userId: user.id,
    });

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
