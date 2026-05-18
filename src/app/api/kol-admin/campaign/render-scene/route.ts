import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import { generateVideo } from "@/lib/ai/generate-video";
import { KolService } from "@/modules/ai-kol-system";

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

    // Handle reference image — if it's a data URL, we need to upload it first
    let referenceImageUrl = body.referenceImageUrl || null;
    if (referenceImageUrl && referenceImageUrl.startsWith("data:")) {
      // Upload data URL to storage for Veo to access
      const { AvatarStorageService } = await import("@/modules/ai-kol-system");
      const storage = new AvatarStorageService();
      const path = `render-refs/${user.id}/${Date.now()}_ref.png`;
      const stored = await storage.fetchAndStore({ sourceUrl: referenceImageUrl, path });
      referenceImageUrl = stored.publicUrl;
    }

    // Get KOL voice preset if kolId provided
    let voicePreset: string | null = null;
    if (body.kolId) {
      try {
        const supabase = await createClient();
        const kolService = new KolService(supabase);
        const kol = await kolService.getKol(body.kolId);
        voicePreset = (kol?.settings as Record<string, unknown>)?.voice_preset as string | null;
      } catch { /* ignore */ }
    }

    // Inject voice preset into prompt if available
    let finalPrompt = prompt.trim();
    if (voicePreset) {
      finalPrompt = `${finalPrompt}\n\n[VOICE: Use speaker "${voicePreset}" for all speech in this scene. Maintain this exact voice throughout.]`;
    }

    const result = await generateVideo({
      userId: user.id,
      prompt: finalPrompt,
      model: body.model || "veo-3-fast",
      cameraAngle: body.cameraAngle || null,
      cameraMotion: body.cameraMotion || null,
      duration: body.duration || 6,
      aspectRatio: body.aspectRatio || "9:16",
      startImageUrl: referenceImageUrl,
      videoMode: referenceImageUrl ? "image-to-video" : "text-to-video",
      projectId: null,
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
