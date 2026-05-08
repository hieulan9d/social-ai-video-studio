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
      return NextResponse.json({ ok: false, error: "Bạn cần đăng nhập." }, { status: 401 });
    }

    const { generationId } = await params;
    const payload = (await request.json()) as { projectId?: unknown };

    if (typeof payload.projectId !== "string" || !payload.projectId) {
      throw new Error("Vui lòng chọn dự án.");
    }

    const generation = await getQuickGeneration({ userId: user.id, generationId });

    if (generation.type === "prompt") {
      throw new Error("Prompt AI không có file output để lưu vào dự án.");
    }

    if (!generation.output_url) {
      throw new Error("Output này chưa sẵn sàng để lưu vào dự án.");
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
        error: error instanceof Error ? error.message : "Không thể lưu vào dự án.",
      },
      { status: 400 },
    );
  }
}
