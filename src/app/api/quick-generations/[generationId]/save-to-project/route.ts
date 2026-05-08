import { NextRequest, NextResponse } from "next/server";
import { getQuickGeneration } from "@/lib/ai/quick-generations";
import { saveGeneratedProjectAsset } from "@/lib/ai/generated-assets";
import { getCurrentUserProfile } from "@/lib/auth/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ generationId: string }> },
) {
  try {
    const user = await getCurrentUserProfile();

    if (!user) {
      return NextResponse.json({ ok: false, error: "Ban can dang nhap." }, { status: 401 });
    }

    const { generationId } = await params;
    const payload = (await request.json()) as { projectId?: unknown };

    if (typeof payload.projectId !== "string" || !payload.projectId) {
      throw new Error("Vui long chon du an.");
    }

    const generation = await getQuickGeneration({ userId: user.id, generationId });

    if (generation.type === "prompt") {
      throw new Error("Prompt AI khong co file output de luu vao du an.");
    }

    if (!generation.output_url) {
      throw new Error("Output nay chua san sang de luu vao du an.");
    }

    const asset = await saveGeneratedProjectAsset({
      userId: user.id,
      projectId: payload.projectId,
      type: generation.type,
      prompt: generation.prompt,
      model: generation.model,
      outputUrl: generation.output_url,
      metadata: {
        quick_generation_id: generation.id,
        aspect_ratio: generation.aspect_ratio,
        duration_seconds: generation.duration_seconds,
      },
    });

    return NextResponse.json({ ok: true, asset });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Khong the luu vao du an.",
      },
      { status: 400 },
    );
  }
}
