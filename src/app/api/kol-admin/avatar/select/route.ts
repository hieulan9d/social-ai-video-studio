import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/auth/server";
import { AvatarGenerationService } from "@/modules/ai-kol-system";

/**
 * POST /api/kol-admin/avatar/select
 * Body: { generationId, candidateIndex }
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserProfile();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();

    if (!body.generationId || typeof body.candidateIndex !== "number") {
      return NextResponse.json(
        { error: "generationId and candidateIndex required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const service = new AvatarGenerationService(supabase);
    const generation = await service.selectCandidate(body.generationId, body.candidateIndex);

    return NextResponse.json({ generation });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
