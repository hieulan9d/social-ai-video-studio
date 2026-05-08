/**
 * AI Text Service
 * Xử lý tất cả task sinh text: chat, prompt, script, reasoning, gemini
 */

import { chatCompletion } from "./client";
import { getModelByTask, type AITask } from "./model-router";

export interface GenerateTextParams {
  task: AITask;
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface GenerateTextResult {
  success: true;
  text: string;
  model: string;
}

export type GenerateTextError = {
  success: false;
  error: string;
};

export async function generateText(
  params: GenerateTextParams
): Promise<GenerateTextResult | GenerateTextError> {
  const { task, prompt, systemPrompt, temperature, maxTokens } = params;

  const supportedTextTasks: AITask[] = [
    "chat",
    "prompt",
    "script",
    "reasoning",
    "gemini_text",
    "gemini_fast",
  ];

  if (!supportedTextTasks.includes(task)) {
    return {
      success: false,
      error: `Task "${task}" không phải text task. Dùng "chat", "prompt", "script", "reasoning", "gemini_text", hoặc "gemini_fast".`,
    };
  }

  const model = getModelByTask(task);

  const messages: Array<{ role: "system" | "user"; content: string }> = [];

  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }

  messages.push({ role: "user", content: prompt });

  try {
    const result = await chatCompletion({
      model,
      messages,
      temperature: temperature ?? 0.7,
      max_tokens: maxTokens ?? 2048,
    });

    return {
      success: true,
      text: result.content,
      model: result.model,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}
