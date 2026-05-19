import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/auth/server";
import { KolService } from "@/modules/ai-kol-system";

/**
 * POST /api/kol-admin/kol/voice-preset
 * Body: { kolId, voicePreset }
 *
 * Save voice preset to KOL settings.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserProfile();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { kolId, voicePreset } = body;

    if (!kolId) {
      return NextResponse.json({ error: "kolId required" }, { status: 400 });
    }

    const supabase = await createClient();
    const service = new KolService(supabase);

    await service.updateKol(kolId, user.id, {
      settings: { voice_preset: voicePreset || null },
    });

    return NextResponse.json({ ok: true, voicePreset });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/kol-admin/kol/voice-preset?kolId=xxx
 * Get voice preset for a KOL.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUserProfile();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const kolId = req.nextUrl.searchParams.get("kolId");
    if (!kolId) {
      return NextResponse.json({ error: "kolId required" }, { status: 400 });
    }

    const supabase = await createClient();
    const service = new KolService(supabase);
    const kol = await service.getKol(kolId);

    const voicePreset = (kol?.settings as Record<string, unknown>)?.voice_preset || null;

    return NextResponse.json({ voicePreset });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
