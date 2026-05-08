import "server-only";

type GenerateImageInput = {
  prompt: string;
  model: string;
  aspectRatio: string;
  quantity: number;
  referenceImage?: File | null;
};

type GenerateVideoInput = {
  prompt: string;
  model: string;
  aspectRatio: string;
  duration: number;
  referenceAsset?: File | null;
};

type GeneratedMediaOutput = {
  outputUrls: string[];
  rawResponse: Record<string, unknown>;
};

const DEFAULT_NINE_ROUTER_BASE_URL = "http://localhost:20128/v1";
const REQUEST_TIMEOUT_MS = 120_000;

function getNineRouterConfig() {
  const apiKey = process.env.NINE_ROUTER_API_KEY || process.env["9ROUTER_API_KEY"];
  const baseUrl =
    process.env.NINE_ROUTER_BASE_URL ||
    process.env["9ROUTER_BASE_URL"] ||
    DEFAULT_NINE_ROUTER_BASE_URL;

  if (!apiKey) {
    throw new Error("Thiếu NINE_ROUTER_API_KEY hoặc 9ROUTER_API_KEY.");
  }

  return {
    apiKey,
    baseUrl: baseUrl.replace(/\/$/, ""),
  };
}

async function fileToDataUrl(file?: File | null) {
  if (!file) {
    return undefined;
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  return `data:${file.type || "application/octet-stream"};base64,${buffer.toString("base64")}`;
}

function extractOutputUrls(response: Record<string, unknown>) {
  const data = response.data;
  const outputs: string[] = [];

  if (Array.isArray(data)) {
    for (const item of data) {
      if (!item || typeof item !== "object") {
        continue;
      }

      const record = item as Record<string, unknown>;
      const url =
        typeof record.url === "string"
          ? record.url
          : typeof record.output_url === "string"
            ? record.output_url
            : typeof record.video_url === "string"
              ? record.video_url
              : typeof record.b64_json === "string"
                ? `data:image/png;base64,${record.b64_json}`
                : null;

      if (url) {
        outputs.push(url);
      }
    }
  }

  for (const key of ["url", "output_url", "video_url"]) {
    const value = response[key];
    if (typeof value === "string") {
      outputs.push(value);
    }
  }

  const output = response.output;
  if (Array.isArray(output)) {
    outputs.push(...output.filter((item): item is string => typeof item === "string"));
  }

  return Array.from(new Set(outputs));
}

async function requestNineRouter(
  endpoint: "/images/generations" | "/videos/generations",
  body: Record<string, unknown>,
): Promise<GeneratedMediaOutput> {
  const { apiKey, baseUrl } = getNineRouterConfig();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: controller.signal,
    });

    const rawText = await response.text();
    const rawResponse = rawText
      ? (JSON.parse(rawText) as Record<string, unknown>)
      : {};

    if (!response.ok) {
      throw new Error(
        `9router generation failed: ${response.status} ${rawText || response.statusText}`,
      );
    }

    const outputUrls = extractOutputUrls(rawResponse);

    if (outputUrls.length === 0) {
      throw new Error("9router không trả về output URL hợp lệ.");
    }

    return {
      outputUrls,
      rawResponse,
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("9router API timeout. Vui lòng thử lại.");
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function generateImageWithNineRouter(input: GenerateImageInput) {
  return requestNineRouter("/images/generations", {
    model: input.model,
    prompt: input.prompt,
    n: input.quantity,
    size: input.aspectRatio,
    aspect_ratio: input.aspectRatio,
    response_format: "url",
    reference_image: await fileToDataUrl(input.referenceImage),
  });
}

export async function generateVideoWithNineRouter(input: GenerateVideoInput) {
  return requestNineRouter("/videos/generations", {
    model: input.model,
    prompt: input.prompt,
    duration: input.duration,
    aspect_ratio: input.aspectRatio,
    response_format: "url",
    reference_asset: await fileToDataUrl(input.referenceAsset),
  });
}
