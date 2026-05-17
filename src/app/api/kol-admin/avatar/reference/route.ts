import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/auth/server";
import { AvatarGenerationService } from "@/modules/ai-kol-system";
import type { AvatarReferenceRole } from "@/modules/ai-kol-system";

const ALLOWED_ROLES: AvatarReferenceRole[] = [
  "face",
  "hair",
  "makeup",
  "outfit",
  "style",
  "pose",
  "general",
];

/**
 * POST /api/kol-admin/avatar/reference
 *   FormData: sessionId, kolId, role, file
 *   Upload a reference image to the session.
 *
 * DELETE /api/kol-admin/avatar/reference?id=xxx&path=xxx
 *   Remove a reference image.
 */

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserProfile();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const formData = await req.formData();

    const sessionId = String(formData.get("sessionId") || "");
    const kolId = String(formData.get("kolId") || "");
    const role = String(formData.get("role") || "general") as AvatarReferenceRole;
    const file = formData.get("file");

    if (!sessionId || !kolId) {
      return NextResponse.json({ error: "sessionId and kolId required" }, { status: 400 });
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file required" }, { status: 400 });
    }

    if (!ALLOWED_ROLES.includes(role)) {
      return NextResponse.json({ error: `role must be one of ${ALLOWED_ROLES.join(", ")}` }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "file must be an image" }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "file too large (max 10MB)" }, { status: 400 });
    }

    const supabase = await createClient();
    const service = new AvatarGenerationService(supabase);

    const ref = await service.uploadReferenceImage({
      sessionId,
      userId: user.id,
      kolId,
      file,
      role,
    });

    return NextResponse.json({ reference: ref });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUserProfile();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const id = req.nextUrl.searchParams.get("id");
    const path = req.nextUrl.searchParams.get("path");

    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    const supabase = await createClient();
    const service = new AvatarGenerationService(supabase);
    await service.deleteReferenceImage(id, path || undefined);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
