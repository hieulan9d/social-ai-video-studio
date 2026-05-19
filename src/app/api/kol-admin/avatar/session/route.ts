import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/auth/server";
import { AvatarGenerationService } from "@/modules/ai-kol-system";

/**
 * GET  /api/kol-admin/avatar/session?kolId=xxx
 *   Returns active session + generations + reference images
 *
 * POST /api/kol-admin/avatar/session  { kolId }
 *   Get or create active session for a KOL
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
    const service = new AvatarGenerationService(supabase);

    const session = await service.getOrCreateActiveSession(kolId, user.id);
    const [generations, references] = await Promise.all([
      service.listGenerations(session.id),
      service.listReferenceImages(session.id),
    ]);

    return NextResponse.json({ session, generations, references });
  } catch (error) {
    const errorObj = error as Record<string, unknown>;
    const message = (errorObj?.message as string) || String(error);
    const code = errorObj?.code as string | undefined;
    const hint = errorObj?.hint as string | undefined;

    console.error("[avatar/session GET]", { message, code, hint, error });

    const isMissingTable =
      code === "42P01" ||
      code === "PGRST205" ||
      message.includes("does not exist") ||
      message.includes("Could not find the table");

    return NextResponse.json(
      {
        error: message,
        code,
        hint,
        isMissingTable,
        action: isMissingTable
          ? "Run migration 003_avatar_generation.sql in Supabase SQL Editor"
          : undefined,
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserProfile();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    if (!body.kolId) {
      return NextResponse.json({ error: "kolId required" }, { status: 400 });
    }

    const supabase = await createClient();
    const service = new AvatarGenerationService(supabase);
    const session = await service.getOrCreateActiveSession(body.kolId, user.id);

    return NextResponse.json({ session });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
