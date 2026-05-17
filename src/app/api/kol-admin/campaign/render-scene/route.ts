import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/lib/auth/server";
import { generateVideo } from "@/lib/ai/generate-video";

/**
 * POST /api/kol-admin/campaign/render-scene
 *
 * Render a single scene to video using Google Veo.
 * Uses the existing generateVideo pipeline (credits, Veo, storage).
 *
 * Body: {
 *   campaignId, sceneId, prompt,
 *   duration?, aspectRatio?, model?,
 *   referenceImageUrl?, cameraAngle?, cameraMotion?
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserProfile();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();

    const { campaignId, sceneId, prompt } = body;

    if (!prompt || prompt.trim().length < 3) {
      return NextResponse.json({ error: "prompt required (min 3 chars)" }, { status: 400 });
    }

    const result = await generateVideo({
      userId: user.id,
      prompt: prompt.trim(),
      model: body.model || "veo-3-fast",
      cameraAngle: body.cameraAngle || null,
      cameraMotion: body.cameraMotion || null,
      duration: body.duration || 6,
      aspectRatio: body.aspectRatio || "9:16",
      startImageUrl: body.referenceImageUrl || null,
      videoMode: body.referenceImageUrl ? "image-to-video" : "text-to-video",
      projectId: null, // KOL campaign videos stored separately
    });

    return NextResponse.json({
      success: true,
      outputUrl: result.outputUrl,
      type: result.type,
      campaignId,
      sceneId,
    });
  } catch (error) {
    console.error("[render-scene]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
