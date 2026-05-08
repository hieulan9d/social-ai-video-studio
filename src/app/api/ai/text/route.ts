import { NextRequest, NextResponse } from "next/server";
import { generateText } from "@/lib/ai/text";
import type { AITask } from "@/lib/ai/model-router";

const VALID_TASKS: AITask[] = [
  "chat",
  "prompt",
  "script",
  "reasoning",
  "gemini_text",
  "gemini_fast",
];

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

  const { task, prompt, systemPrompt, temperature, maxTokens } =
    body as Record<string, unknown>;

  if (!task || typeof task !== "string") {
    return NextResponse.json(
      { success: false, error: 'Thiếu trường "task".' },
      { status: 400 }
    );
  }

  if (!VALID_TASKS.includes(task as AITask)) {
    return NextResponse.json(
      {
        success: false,
        error: `Task "${task}" không hợp lệ. Các task hợp lệ: ${VALID_TASKS.join(", ")}`,
      },
      { status: 400 }
    );
  }

  if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
    return NextResponse.json(
      { success: false, error: 'Thiếu trường "prompt".' },
      { status: 400 }
    );
  }

  try {
    const result = await generateText({
      task: task as AITask,
      prompt,
      systemPrompt: typeof systemPrompt === "string" ? systemPrompt : undefined,
      temperature: typeof temperature === "number" ? temperature : undefined,
      maxTokens: typeof maxTokens === "number" ? maxTokens : undefined,
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
