import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/lib/auth/server";
import { generateVideo } from "@/lib/ai/generate-video";
import { AvatarStorageService } from "@/modules/ai-kol-system";

/**
 * POST /api/cinema/render-transition
 *
 * Render a start/end frame transition video using Google Veo.
 *
 * Body: {
 *   startFrameUrl: string (data URL or public URL)
 *   endFrameUrl: string (data URL or public URL)
 *   prompt: string
 *   duration: number (3-10)
 *   aspectRatio: "16:9" | "9:16" | "1:1"
 *   quality: "standard" | "high" | "4k"
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserProfile();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { startFrameUrl, endFrameUrl, prompt, duration, aspectRatio } = body;

    if (!startFrameUrl || !endFrameUrl || !prompt?.trim()) {
      return NextResponse.json(
        { error: "startFrameUrl, endFrameUrl, prompt bắt buộc" },
        { status: 400 }
      );
    }

    // Upload data URLs to storage if needed (Veo needs public URLs)
    const storage = new AvatarStorageService();
    let resolvedStartUrl = startFrameUrl;
    let resolvedEndUrl = endFrameUrl;

    if (startFrameUrl.startsWith("data:")) {
      const path = `cinema/${user.id}/transitions/${Date.now()}_start.png`;
      const stored = await storage.fetchAndStore({ sourceUrl: startFrameUrl, path });
      resolvedStartUrl = stored.publicUrl;
    }

    if (endFrameUrl.startsWith("data:")) {
      const path = `cinema/${user.id}/transitions/${Date.now()}_end.png`;
      const stored = await storage.fetchAndStore({ sourceUrl: endFrameUrl, path });
      resolvedEndUrl = stored.publicUrl;
    }

    // Call Veo with start-end-image-to-video mode
    const result = await generateVideo({
      userId: user.id,
      prompt: prompt.trim(),
      model: "veo-3-fast",
      duration: duration || 5,
      aspectRatio: aspectRatio || "16:9",
      startImageUrl: resolvedStartUrl,
      endImageUrl: resolvedEndUrl,
      videoMode: "start-end-image-to-video",
      projectId: null,
    });

    return NextResponse.json({
      success: true,
      outputUrl: result.outputUrl,
      type: result.type,
    });
  } catch (error) {
    console.error("[cinema/render-transition]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
