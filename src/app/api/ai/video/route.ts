import { NextRequest, NextResponse } from "next/server";
import { generateVideo, type VideoMode } from "@/lib/ai/video";

const VALID_MODES: VideoMode[] = [
  "text-to-video",
  "image-to-video",
  "start-end-image-to-video",
];
const VALID_DURATIONS = [5, 8, 10];
const VALID_RATIOS = ["16:9", "9:16", "1:1"];

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

  const {
    prompt,
    mode,
    startImage,
    endImage,
    duration,
    aspectRatio,
    fast,
  } = body as Record<string, unknown>;

  if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
    return NextResponse.json(
      { success: false, error: 'Thiếu trường "prompt".' },
      { status: 400 }
    );
  }

  if (mode && !VALID_MODES.includes(mode as VideoMode)) {
    return NextResponse.json(
      {
        success: false,
        error: `Mode "${mode}" không hợp lệ. Hợp lệ: ${VALID_MODES.join(", ")}`,
      },
      { status: 400 }
    );
  }

  if (duration && !VALID_DURATIONS.includes(Number(duration))) {
    return NextResponse.json(
      {
        success: false,
        error: `Duration "${duration}" không hợp lệ. Hợp lệ: ${VALID_DURATIONS.join(", ")}`,
      },
      { status: 400 }
    );
  }

  if (aspectRatio && !VALID_RATIOS.includes(aspectRatio as string)) {
    return NextResponse.json(
      {
        success: false,
        error: `AspectRatio "${aspectRatio}" không hợp lệ. Hợp lệ: ${VALID_RATIOS.join(", ")}`,
      },
      { status: 400 }
    );
  }

  try {
    const result = await generateVideo({
      prompt,
      mode: (mode as VideoMode) ?? "text-to-video",
      startImage: typeof startImage === "string" ? startImage : undefined,
      endImage: typeof endImage === "string" ? endImage : undefined,
      duration: (duration as 5 | 8 | 10) ?? 5,
      aspectRatio: (aspectRatio as "16:9" | "9:16" | "1:1") ?? "16:9",
      fast: fast === true,
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
