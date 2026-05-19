import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/auth/server";
import { IdentityLockService } from "@/modules/ai-kol-system";

/**
 * POST /api/kol-admin/avatar/finalize
 * Body: { sessionId, kolId, generationId, candidateIndex, visualAnchor?, consistencyRules? }
 *
 * Locks the avatar as the official KOL identity.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserProfile();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();

    if (!body.sessionId || !body.kolId || !body.generationId || typeof body.candidateIndex !== "number") {
      return NextResponse.json(
        { error: "sessionId, kolId, generationId, candidateIndex required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const service = new IdentityLockService(supabase);

    const lock = await service.finalizeAvatar({
      session_id: body.sessionId,
      kolId: body.kolId,
      userId: user.id,
      generation_id: body.generationId,
      candidate_index: body.candidateIndex,
      visual_anchor: body.visualAnchor,
      consistency_rules: body.consistencyRules,
    });

    return NextResponse.json({ lock });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
