import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/auth/server";
import { AvatarGenerationService } from "@/modules/ai-kol-system";

/**
 * POST /api/kol-admin/avatar/generate
 * Body: {
 *   sessionId, kolId, prompt,
 *   parentGenerationId?, candidateCount?, referenceImageIds?, settings?
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserProfile();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();

    const { sessionId, kolId, prompt } = body;

    if (!sessionId || !kolId || !prompt) {
      return NextResponse.json(
        { error: "sessionId, kolId, prompt required" },
        { status: 400 }
      );
    }

    if (typeof prompt !== "string" || prompt.trim().length < 3) {
      return NextResponse.json(
        { error: "prompt must be at least 3 characters" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const service = new AvatarGenerationService(supabase);

    const generation = await service.generate({
      sessionId,
      userId: user.id,
      kolId,
      prompt: prompt.trim(),
      parentGenerationId: body.parentGenerationId || null,
      candidateCount: body.candidateCount || 1,
      referenceImageIds: body.referenceImageIds,
      settings: body.settings,
    });

    return NextResponse.json({ generation });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
