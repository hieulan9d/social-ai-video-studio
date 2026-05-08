import { NextResponse } from "next/server";
import { generateText } from "@/lib/ai/text";
import { generateImage } from "@/lib/ai/image";
import { getAllModelConfig } from "@/lib/ai/model-router";

export async function GET() {
  const config = getAllModelConfig();

  const results: Record<string, { ok: boolean; model?: string; error?: string }> =
    {};

  // Test ChatGPT text (chat)
  try {
    const r = await generateText({
      task: "chat",
      prompt: "Trả lời đúng 1 từ: OK",
      maxTokens: 10,
      temperature: 0,
    });
    results.chatgpt_text = r.success
      ? { ok: true, model: r.model }
      : { ok: false, error: r.error };
  } catch (e) {
    results.chatgpt_text = {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }

  // Test Gemini text
  try {
    const r = await generateText({
      task: "gemini_fast",
      prompt: "Trả lời đúng 1 từ: OK",
      maxTokens: 10,
      temperature: 0,
    });
    results.gemini_text = r.success
      ? { ok: true, model: r.model }
      : { ok: false, error: r.error };
  } catch (e) {
    results.gemini_text = {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }

  // Test GPT Image — dùng prompt đơn giản để tránh tốn credits
  try {
    const r = await generateImage({
      prompt: "a small red circle on white background",
      size: "1024x1024",
      quality: "low",
    });
    results.gpt_image = r.success
      ? { ok: true, model: r.model }
      : { ok: false, error: r.error };
  } catch (e) {
    results.gpt_image = {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }

  // Video: chỉ báo cấu hình, không gọi thật (tốn credits)
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
