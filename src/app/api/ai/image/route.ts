import { NextRequest, NextResponse } from "next/server";
import { generateImage } from "@/lib/ai/image";

const VALID_SIZES = ["1024x1024", "1024x1536", "1536x1024"];
const VALID_QUALITIES = ["low", "medium", "high"];
const VALID_FORMATS = ["png", "jpeg", "webp"];

export async function POST(req: NextRequest) {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Request body không hợp lệ (phải là JSON)." },
      { status: 400 }
    );
  }

  const { prompt, size, quality, outputFormat } = body as Record<string, unknown>;

  if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
    return NextResponse.json(
      { success: false, error: 'Thiếu trường "prompt".' },
      { status: 400 }
    );
  }

  if (size && !VALID_SIZES.includes(size as string)) {
    return NextResponse.json(
      {
        success: false,
        error: `Size "${size}" không hợp lệ. Hợp lệ: ${VALID_SIZES.join(", ")}`,
      },
      { status: 400 }
    );
  }

  if (quality && !VALID_QUALITIES.includes(quality as string)) {
    return NextResponse.json(
      {
        success: false,
        error: `Quality "${quality}" không hợp lệ. Hợp lệ: ${VALID_QUALITIES.join(", ")}`,
      },
      { status: 400 }
    );
  }

  if (outputFormat && !VALID_FORMATS.includes(outputFormat as string)) {
    return NextResponse.json(
      {
        success: false,
        error: `OutputFormat "${outputFormat}" không hợp lệ. Hợp lệ: ${VALID_FORMATS.join(", ")}`,
      },
      { status: 400 }
    );
  }

  try {
    const result = await generateImage({
      prompt,
      size: (size as "1024x1024" | "1024x1536" | "1536x1024") ?? "1024x1024",
      quality: (quality as "low" | "medium" | "high") ?? "high",
      outputFormat: (outputFormat as "png" | "jpeg" | "webp") ?? "png",
    });

    if (!result.success) {
      return NextResponse.json(result, { status: 502 });
    }

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Lỗi không xác định";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
