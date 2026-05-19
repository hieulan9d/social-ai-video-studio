import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/lib/auth/server";
import { generateVideo } from "@/lib/ai/generate-video";

/**
 * POST /api/cinema/render-take
 *
 * Render a single cinema take using Google Veo.
 *
 * Body: {
 *   prompt: string
 *   duration: number
 *   aspectRatio: "16:9" | "9:16" | "1:1"
 *   quality: "standard" | "high" | "4k"
 *   referenceImageUrl?: string
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserProfile();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { prompt, duration, aspectRatio, referenceImageUrl } = body;

    if (!prompt?.trim()) {
      return NextResponse.json({ error: "prompt bắt buộc" }, { status: 400 });
    }

    const result = await generateVideo({
      userId: user.id,
      prompt: prompt.trim(),
      model: "veo-3-fast",
      duration: duration || 5,
      aspectRatio: aspectRatio || "16:9",
      startImageUrl: referenceImageUrl || null,
      videoMode: referenceImageUrl ? "image-to-video" : "text-to-video",
      projectId: null,
    });

    return NextResponse.json({
      success: true,
      outputUrl: result.outputUrl,
      type: result.type,
    });
  } catch (error) {
    console.error("[cinema/render-take]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
