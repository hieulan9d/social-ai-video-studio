import "server-only";

import type {
  GeneratedPrompt,
  GeneratedScene,
  GeneratedScript,
  ScriptGenerationInput,
} from "@/lib/ai/types";
import type { AITextProvider } from "@/lib/ai/providers/text-provider";

export type OpenAICompatibleTextProviderConfig = {
  name?: string;
  apiKey: string | undefined;
  baseUrl: string;
  model: string;
  missingApiKeyMessage?: string;
};

function getAiConfig(): OpenAICompatibleTextProviderConfig {
  const apiKey = process.env.OPENAI_API_KEY;
  const baseUrl = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
  const model = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";

  return { apiKey, baseUrl, model };
}

type ChatMessage = {
  role: "system" | "user";
  content: string;
};

export class OpenAICompatibleTextProvider implements AITextProvider {
  readonly name: string;
  readonly model: string;
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(config: OpenAICompatibleTextProviderConfig = getAiConfig()) {
    if (!config.apiKey) {
      throw new Error(
        config.missingApiKeyMessage ?? "Missing OPENAI_API_KEY for AI script generation.",
      );
    }

    this.name = config.name ?? "openai-compatible";
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
    this.model = config.model;
  }

  async generateScript(input: ScriptGenerationInput): Promise<GeneratedScript> {
    return this.requestJson<GeneratedScript>({
      messages: [
        {
          role: "system",
          content:
            "Bạn là chuyên gia viết kịch bản quảng cáo video ngắn bằng tiếng Việt. Luôn trả về JSON hợp lệ. Kịch bản phải tối ưu cho quảng cáo social dạng ngắn. Cấu trúc bắt buộc: Hook -> Problem -> Solution -> Product/Service -> CTA.",
        },
        {
          role: "user",
          content: [
            "Hãy tạo kịch bản video quảng cáo ngắn bằng tiếng Việt dựa trên dữ liệu sau:",
            `Nền tảng: ${input.platform}`,
            `Thời lượng: ${input.duration} giây`,
            `Phong cách: ${input.style}`,
            `Ngôn ngữ: ${input.language}`,
            `Loại sản phẩm/dịch vụ: ${input.productType}`,
            `Ý tưởng video: ${input.idea}`,
            "",
            "Trả về JSON với các trường:",
            "videoTitle, hook, targetAudience, problem, solution, productService, cta, voiceover, scenes",
            "Trong đó scenes phải là mảng object gồm: sceneNumber, durationSeconds, visualDescription, cameraAngle, cameraMovement, subjectAction, background, lighting, voiceScript, onScreenText, notes",
            "Tổng durationSeconds của scenes phải gần bằng thời lượng yêu cầu.",
          ].join("\n"),
        },
      ],
    });
  }

  async generateSceneBreakdown(input: {
    script: Omit<GeneratedScript, "scenes">;
    context: ScriptGenerationInput;
  }): Promise<GeneratedScene[]> {
    const result = await this.requestJson<{ scenes: GeneratedScene[] }>({
      messages: [
        {
          role: "system",
          content:
            "Bạn là đạo diễn nội dung social video. Luôn trả về JSON hợp lệ bằng tiếng Việt.",
        },
        {
          role: "user",
          content: [
            "Hãy chia breakdown scene cho video quảng cáo social ngắn này.",
            `Nền tảng: ${input.context.platform}`,
            `Thời lượng: ${input.context.duration} giây`,
            `Phong cách: ${input.context.style}`,
            `Ý tưởng: ${input.context.idea}`,
            `Hook: ${input.script.hook}`,
            `Problem: ${input.script.problem}`,
            `Solution: ${input.script.solution}`,
            `Product/Service: ${input.script.productService}`,
            `CTA: ${input.script.cta}`,
            `Voiceover: ${input.script.voiceover}`,
            "",
            "Trả về JSON dạng { scenes: [...] } với mỗi scene gồm:",
            "sceneNumber, durationSeconds, visualDescription, cameraAngle, cameraMovement, subjectAction, background, lighting, voiceScript, onScreenText, notes",
          ].join("\n"),
        },
      ],
    });

    return result.scenes;
  }

  async generatePrompt(input: {
    scene: GeneratedScene;
    context: ScriptGenerationInput;
    script: Omit<GeneratedScript, "scenes">;
    consistencyInstruction?: string;
  }): Promise<GeneratedPrompt> {
    const result = await this.requestJson<{ content: string }>({
      messages: [
        {
          role: "system",
          content:
            "Bạn là chuyên gia viết prompt video cinematic cho Google Veo 3. Luôn trả về JSON hợp lệ. Đầu ra cuối cùng phải là prompt tiếng Anh giàu chi tiết, rõ subject, environment, action, camera movement, lighting, mood, realism level, product consistency, negative instructions.",
        },
        {
          role: "user",
          content: [
            "Viết prompt video bằng tiếng Anh để tạo scene quảng cáo ngắn bằng AI, nhưng vẫn giữ insight từ brief tiếng Việt.",
            `Nền tảng: ${input.context.platform}`,
            `Phong cách: ${input.context.style}`,
            `Loại sản phẩm/dịch vụ: ${input.context.productType}`,
            `Title video: ${input.script.videoTitle}`,
            `Hook: ${input.script.hook}`,
            `Scene number: ${input.scene.sceneNumber}`,
            `Visual description: ${input.scene.visualDescription}`,
            `Camera angle: ${input.scene.cameraAngle}`,
            `Camera movement: ${input.scene.cameraMovement}`,
            `Subject action: ${input.scene.subjectAction}`,
            `Background: ${input.scene.background}`,
            `Lighting: ${input.scene.lighting}`,
            `Voice script: ${input.scene.voiceScript}`,
            `On-screen text: ${input.scene.onScreenText}`,
            `Notes: ${input.scene.notes}`,
            input.consistencyInstruction
              ? `Product consistency instruction: ${input.consistencyInstruction}`
              : "Product consistency instruction: keep the same product shape, packaging, color palette, logo placement, and label details consistent across the whole shot.",
            "",
            "Return JSON as { content: string }.",
            "The final prompt must be in English only.",
            "Include these parts naturally in one cinematic Veo-ready prompt: main subject, environment, action, camera movement, lighting, mood, realism level, product consistency instruction.",
            "Append a negative instructions sentence using this exact list of things to avoid: subtitles, watermark, distorted face, extra fingers, wrong product label, random text, logo changes.",
          ].join("\n"),
        },
      ],
    });

    return {
      sceneOrder: input.scene.sceneNumber,
      promptType: "veo",
      content: result.content,
    };
  }

  private async requestJson<T>({ messages }: { messages: ChatMessage[] }): Promise<T> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        temperature: 0.8,
        response_format: {
          type: "json_object",
        },
        messages,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI provider request failed: ${response.status} ${errorText}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{
        message?: {
          content?: string | null;
        };
      }>;
    };

    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("AI provider returned empty content.");
    }

    return JSON.parse(content) as T;
  }
}
