import { chatCompletion } from "./client";
import { getModelCandidatesByTask, type AITask } from "./model-router";

export interface GenerateTextParams {
  task: AITask;
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  imageDataUrls?: string[];
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
  params: GenerateTextParams,
): Promise<GenerateTextResult | GenerateTextError> {
  const { task, prompt, systemPrompt, temperature, maxTokens, imageDataUrls } = params;

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
      error: `Task "${task}" không phải text task.`,
    };
  }

  const messages: Array<{
    role: "system" | "user";
    content:
      | string
      | Array<
          | { type: "text"; text: string }
          | { type: "image_url"; image_url: { url: string } }
        >;
  }> = [];

  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }
  if (imageDataUrls && imageDataUrls.length > 0) {
    messages.push({
      role: "user",
      content: [
        { type: "text", text: prompt },
        ...imageDataUrls.map((url) => ({
          type: "image_url" as const,
          image_url: { url },
        })),
      ],
    });
  } else {
    messages.push({ role: "user", content: prompt });
  }

  try {
    const { models, settings } = await getModelCandidatesByTask(task);
    const candidates = settings.autoFallbackOnError ? models : models.slice(0, 1);
    let lastError: unknown = null;

    for (const model of candidates) {
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
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}
