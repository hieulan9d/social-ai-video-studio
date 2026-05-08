import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/lib/auth/server";
import { generateImage } from "@/lib/ai/generate-image";
import { isAspectRatio, isImageModel } from "@/lib/ai/models";

function errorResponse(error: unknown, status = 400) {
  return NextResponse.json(
    {
      ok: false,
      error: error instanceof Error ? error.message : "Tạo ảnh thất bại.",
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
    const aspectRatio = String(formData.get("aspectRatio") ?? "1:1");
    const quantity = Number.parseInt(String(formData.get("quantity") ?? "1"), 10);
    const projectId = String(formData.get("projectId") ?? "") || null;
    const referenceImage = formData.get("referenceImage");

    if (!isImageModel(model)) {
      throw new Error("Model ảnh không hợp lệ.");
    }

    if (!isAspectRatio(aspectRatio)) {
      throw new Error("Tỷ lệ ảnh không hợp lệ.");
    }

    const result = await generateImage({
      userId: user.id,
      prompt,
      model,
      aspectRatio,
      quantity,
      projectId,
      referenceImage: referenceImage instanceof File && referenceImage.size > 0
        ? referenceImage
        : null,
    });

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return errorResponse(error);
  }
}
