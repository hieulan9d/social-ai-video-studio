import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/lib/auth/server";
import { generateVideo } from "@/lib/ai/generate-video";
import { isAspectRatio, isVideoModel } from "@/lib/ai/models";

function errorResponse(error: unknown, status = 400) {
  return NextResponse.json(
    {
      ok: false,
      error: error instanceof Error ? error.message : "Tạo video thất bại.",
    },
    { status },
  );
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUserProfile();

    if (!user) {
      return errorResponse(new Error("Bạn cần đăng nhập."), 401);
    }

    const formData = await request.formData();
    const prompt = String(formData.get("prompt") ?? "");
    const model = String(formData.get("model") ?? "");
    const aspectRatio = String(formData.get("aspectRatio") ?? "9:16");
    const duration = Number.parseInt(String(formData.get("duration") ?? "5"), 10);
    const projectId = String(formData.get("projectId") ?? "") || null;
    const referenceAsset = formData.get("referenceAsset");
    const startImage = formData.get("startImage");
    const endImage = formData.get("endImage");
    const startImageUrl = String(formData.get("startImageUrl") ?? "").trim();
    const endImageUrl = String(formData.get("endImageUrl") ?? "").trim();
    const videoMode = String(formData.get("videoMode") ?? "");

    if (!isVideoModel(model)) {
      throw new Error("Model video không hợp lệ.");
    }

    if (!isAspectRatio(aspectRatio)) {
      throw new Error("Tỷ lệ video không hợp lệ.");
    }

    const result = await generateVideo({
      userId: user.id,
      prompt,
      model,
      duration,
      aspectRatio,
      projectId,
      startImage: startImage instanceof File && startImage.size > 0 ? startImage : null,
      endImage: endImage instanceof File && endImage.size > 0 ? endImage : null,
      startImageUrl: startImageUrl || null,
      endImageUrl: endImageUrl || null,
      videoMode:
        videoMode === "text-to-video" ||
        videoMode === "image-to-video" ||
        videoMode === "start-end-image-to-video"
          ? videoMode
          : undefined,
      referenceAsset: referenceAsset instanceof File && referenceAsset.size > 0
        ? referenceAsset
        : null,
    });

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return errorResponse(error);
  }
}
