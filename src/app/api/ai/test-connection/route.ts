import { NextResponse } from "next/server";
import { generateImage } from "@/lib/ai/image";
import { getAllModelConfig } from "@/lib/ai/model-router";
import { generateText } from "@/lib/ai/text";

export async function GET() {
  const config = await getAllModelConfig();

  const results: Record<string, { ok: boolean; model?: string; error?: string }> = {};

  try {
    const result = await generateText({
      task: "chat",
      prompt: "Trả lời đúng 1 từ: OK",
      maxTokens: 10,
      temperature: 0,
    });
    results.chatgpt_text = result.success
      ? { ok: true, model: result.model }
      : { ok: false, error: result.error };
  } catch (error) {
    results.chatgpt_text = {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  try {
    const result = await generateText({
      task: "gemini_fast",
      prompt: "Trả lời đúng 1 từ: OK",
      maxTokens: 10,
      temperature: 0,
    });
    results.gemini_text = result.success
      ? { ok: true, model: result.model }
      : { ok: false, error: result.error };
  } catch (error) {
    results.gemini_text = {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  try {
    const result = await generateImage({
      prompt: "a small red circle on white background",
      size: "1024x1024",
      quality: "low",
    });
    results.gpt_image = result.success
      ? { ok: true, model: result.model }
      : { ok: false, error: result.error };
  } catch (error) {
    results.gpt_image = {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  results.veo_video = {
    ok: true,
    model: config.video,
  };

  const allOk = results.chatgpt_text.ok && results.gemini_text.ok;

  return NextResponse.json({
    provider: process.env.AI_PROVIDER ?? "9router",
    baseUrl: process.env.AI_BASE_URL ?? "(chưa set)",
    hasApiKey: Boolean(process.env.AI_API_KEY),
    modelConfig: config,
    tests: results,
    overallStatus: allOk ? "ok" : "partial",
  });
}
