/**
 * AI Client - connects to 9Router (OpenAI-compatible endpoint)
 * Chỉ dùng trên server. Không expose ra client component.
 */

export interface AIClientConfig {
  baseURL: string;
  apiKey: string;
}

function getClientConfig(): AIClientConfig {
  const baseURL = process.env.AI_BASE_URL;
  const apiKey = process.env.AI_API_KEY;

  if (!baseURL) {
    throw new Error(
      "[AI Client] Thiếu biến môi trường AI_BASE_URL. " +
        "Vui lòng thêm AI_BASE_URL=http://localhost:20128/v1 vào file .env"
    );
  }

  if (!apiKey) {
    throw new Error(
      "[AI Client] Thiếu biến môi trường AI_API_KEY. " +
        "Vui lòng thêm AI_API_KEY=<your_9router_key> vào file .env"
    );
  }

  return { baseURL, apiKey };
}

/** Gọi Chat Completions endpoint (OpenAI-compatible) */
export async function chatCompletion(params: {
  model: string;
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  temperature?: number;
  max_tokens?: number;
}): Promise<{ content: string; model: string }> {
  const { baseURL, apiKey } = getClientConfig();

  const res = await fetch(`${baseURL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: params.model,
      messages: params.messages,
      temperature: params.temperature ?? 0.7,
      max_tokens: params.max_tokens ?? 2048,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText);
    throw new Error(
      `[AI Client] Chat completion lỗi ${res.status}: ${errText}`
    );
  }

  const data = await res.json();
  const content: string =
    data?.choices?.[0]?.message?.content ?? "";

  return { content, model: data?.model ?? params.model };
}

/** Gọi Image Generation endpoint (OpenAI-compatible) */
export async function imageGeneration(params: {
  model: string;
  prompt: string;
  size?: string;
  quality?: string;
  response_format?: string;
  n?: number;
}): Promise<{ imageBase64?: string; imageUrl?: string; model: string }> {
  const { baseURL, apiKey } = getClientConfig();

  const body: Record<string, unknown> = {
    model: params.model,
    prompt: params.prompt,
    n: params.n ?? 1,
    size: params.size ?? "1024x1024",
    response_format: params.response_format ?? "b64_json",
  };

  if (params.quality) body.quality = params.quality;

  const res = await fetch(`${baseURL}/images/generations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText);
    throw new Error(
      `[AI Client] Image generation lỗi ${res.status}: ${errText}`
    );
  }

  const data = await res.json();
  const item = data?.data?.[0];

  return {
    imageBase64: item?.b64_json,
    imageUrl: item?.url,
    model: params.model,
  };
}

/** Gọi Video Generation endpoint — tách riêng để dễ swap endpoint sau này */
export async function videoGeneration(params: {
  model: string;
  prompt: string;
  startImageBase64?: string;
  endImageBase64?: string;
  duration?: number;
  aspectRatio?: string;
}): Promise<{ videoUrl?: string; jobId?: string; status: string; model: string }> {
  const { baseURL, apiKey } = getClientConfig();

  // 9Router/Veo dùng endpoint /videos/generations (hoặc tương tự)
  // Nếu chưa stable, trả về jobId để poll sau
  const body: Record<string, unknown> = {
    model: params.model,
    prompt: params.prompt,
    duration: params.duration ?? 5,
    aspect_ratio: params.aspectRatio ?? "16:9",
  };

  if (params.startImageBase64) body.start_image = params.startImageBase64;
  if (params.endImageBase64) body.end_image = params.endImageBase64;

  const res = await fetch(`${baseURL}/videos/generations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText);
    throw new Error(
      `[AI Client] Video generation lỗi ${res.status}: ${errText}`
    );
  }

  const data = await res.json();

  return {
    videoUrl: data?.video_url ?? data?.data?.[0]?.url,
    jobId: data?.id ?? data?.job_id,
    status: data?.status ?? "submitted",
    model: params.model,
  };
}
