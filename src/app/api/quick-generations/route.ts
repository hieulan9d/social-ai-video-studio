import { NextRequest, NextResponse } from "next/server";
import { createQuickGeneration, listQuickGenerations } from "@/lib/ai/quick-generations";
import { getCurrentUserProfile } from "@/lib/auth/server";

export async function GET(request: NextRequest) {
  const user = await getCurrentUserProfile();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Ban can dang nhap." }, { status: 401 });
  }

  const type = request.nextUrl.searchParams.get("type");
  const generations = await listQuickGenerations({
    userId: user.id,
    type:
      type === "image" || type === "video" || type === "prompt" ? type : undefined,
  });

  return NextResponse.json({ ok: true, generations });
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUserProfile();

    if (!user) {
      return NextResponse.json({ ok: false, error: "Ban can dang nhap." }, { status: 401 });
    }

    const payload = (await request.json()) as {
      type?: unknown;
      prompt?: unknown;
      model?: unknown;
      outputUrl?: unknown;
      status?: unknown;
      aspectRatio?: unknown;
      durationSeconds?: unknown;
      quantity?: unknown;
      referenceFileName?: unknown;
      errorMessage?: unknown;
      metadata?: unknown;
    };

    if (
      payload.type !== "image" &&
      payload.type !== "video" &&
      payload.type !== "prompt"
    ) {
      throw new Error("Loai lich su quick khong hop le.");
    }

    if (typeof payload.prompt !== "string" || payload.prompt.trim().length < 3) {
      throw new Error("Prompt khong hop le.");
    }

    if (typeof payload.model !== "string" || payload.model.trim().length === 0) {
      throw new Error("Model khong hop le.");
    }

    const generation = await createQuickGeneration({
      userId: user.id,
      type: payload.type,
      prompt: payload.prompt.trim(),
      model: payload.model.trim(),
      outputUrl: typeof payload.outputUrl === "string" ? payload.outputUrl : null,
      status:
        payload.status === "queued" ||
        payload.status === "processing" ||
        payload.status === "completed" ||
        payload.status === "failed"
          ? payload.status
          : "completed",
      aspectRatio: typeof payload.aspectRatio === "string" ? payload.aspectRatio : null,
      durationSeconds:
        typeof payload.durationSeconds === "number" ? payload.durationSeconds : null,
      quantity: typeof payload.quantity === "number" ? payload.quantity : 1,
      referenceFileName:
        typeof payload.referenceFileName === "string" ? payload.referenceFileName : null,
      errorMessage:
        typeof payload.errorMessage === "string" ? payload.errorMessage : null,
      metadata:
        payload.metadata && typeof payload.metadata === "object"
          ? (payload.metadata as Record<string, unknown>)
          : {},
    });

    return NextResponse.json({
      ok: true,
      generation,
      warning: generation ? null : "Bang quick_generations chua ton tai.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Khong the luu lich su quick.",
      },
      { status: 400 },
    );
  }
}
