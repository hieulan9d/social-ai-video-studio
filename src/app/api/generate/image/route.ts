import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/lib/auth/server";
import { isCameraAngle } from "@/lib/ai/camera-angle";
import { generateImage } from "@/lib/ai/generate-image";
import { isAspectRatio, isImageModel } from "@/lib/ai/models";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    const message = typeof record.message === "string" ? record.message : null;
    const details = typeof record.details === "string" ? record.details : null;
    const hint = typeof record.hint === "string" ? record.hint : null;
    const summary = [message, details, hint].filter(Boolean).join(" | ");

    if (summary) {
      return summary;
    }

    try {
      return JSON.stringify(record);
    } catch {
      return "Tạo ảnh thất bại.";
    }
  }

  return "Tạo ảnh thất bại.";
}

function errorResponse(error: unknown, status = 400) {
  return NextResponse.json(
    {
      ok: false,
      error: getErrorMessage(error),
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
    const cameraAngle = String(formData.get("cameraAngle") ?? "");
    const quantity = Number.parseInt(String(formData.get("quantity") ?? "1"), 10);
    const projectId = String(formData.get("projectId") ?? "") || null;
    const referenceImage = formData.get("referenceImage");

    if (!isImageModel(model)) {
      throw new Error("Model ảnh không hợp lệ.");
    }

    if (!isAspectRatio(aspectRatio)) {
      throw new Error("Tỷ lệ ảnh không hợp lệ.");
    }

    if (cameraAngle && !isCameraAngle(cameraAngle)) {
      throw new Error("Góc máy ảnh không hợp lệ.");
    }

    const result = await generateImage({
      userId: user.id,
      prompt,
      model,
      aspectRatio,
      cameraAngle: cameraAngle && isCameraAngle(cameraAngle) ? cameraAngle : null,
      quantity,
      projectId,
      referenceImage:
        referenceImage instanceof File && referenceImage.size > 0
          ? referenceImage
          : null,
    });

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return errorResponse(error);
  }
}
