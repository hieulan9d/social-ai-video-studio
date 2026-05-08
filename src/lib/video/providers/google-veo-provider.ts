import "server-only";

import type {
  DownloadedVideo,
  PolledVideoRender,
  StartEndImageTransitionInput,
  StartImageToVideoInput,
  StartedVideoRender,
  StartTextToVideoInput,
  VideoProvider,
} from "@/lib/video/types";

const DEFAULT_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

function getApiKey() {
  const apiKey = process.env.GOOGLE_VEO_API_KEY ?? process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing GOOGLE_VEO_API_KEY for Google Veo rendering.");
  }

  return apiKey;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function findVideoCandidate(response: Record<string, unknown>) {
  const generateVideoResponse = asRecord(response.generateVideoResponse);
  const generatedSamples = Array.isArray(generateVideoResponse.generatedSamples)
    ? generateVideoResponse.generatedSamples
    : [];
  const sample = asRecord(generatedSamples[0]);
  const video = asRecord(sample.video);

  return {
    uri: typeof video.uri === "string" ? video.uri : null,
    mimeType: typeof video.mimeType === "string" ? video.mimeType : "video/mp4",
  };
}

async function blobToBase64(blob: Blob) {
  const buffer = Buffer.from(await blob.arrayBuffer());
  return buffer.toString("base64");
}

export class GoogleVeoProvider implements VideoProvider {
  readonly name = "google-veo";
  readonly model: string;
  private readonly apiKey = getApiKey();
  private readonly baseUrl = process.env.GOOGLE_VEO_BASE_URL ?? DEFAULT_BASE_URL;

  constructor(modelOverride?: string) {
    this.model =
      modelOverride?.trim() ||
      process.env.GOOGLE_VEO_MODEL ||
      "veo-3.1-fast-generate-preview";
  }

  async startTextToVideo(input: StartTextToVideoInput): Promise<StartedVideoRender> {
    const requestBody = {
      instances: [{ prompt: input.prompt }],
      parameters: {
        aspectRatio: input.aspectRatio,
        durationSeconds: input.durationSeconds,
        ...(input.negativePrompt ? { negativePrompt: input.negativePrompt } : {}),
      },
    };

    const response = await fetch(`${this.baseUrl}/models/${this.model}:predictLongRunning`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": this.apiKey,
      },
      body: JSON.stringify(requestBody),
      cache: "no-store",
    });

    const rawResponse = (await response.json()) as Record<string, unknown>;

    if (!response.ok) {
      throw new Error(
        `Google Veo request failed: ${response.status} ${JSON.stringify(rawResponse)}`,
      );
    }

    const operationName = String(rawResponse.name ?? "");

    if (!operationName) {
      throw new Error("Google Veo did not return an operation name.");
    }

    return {
      providerJobId: operationName,
      operationName,
      status: "processing",
      rawResponse,
    };
  }

  async startImageToVideo(input: StartImageToVideoInput): Promise<StartedVideoRender> {
    const requestBody = {
      instances: [
        {
          prompt: input.prompt,
          image: {
            bytesBase64Encoded: await blobToBase64(input.image.data),
            mimeType: input.image.mimeType,
          },
        },
      ],
      parameters: {
        aspectRatio: input.aspectRatio,
        durationSeconds: input.durationSeconds,
        ...(input.negativePrompt ? { negativePrompt: input.negativePrompt } : {}),
      },
    };

    const response = await fetch(`${this.baseUrl}/models/${this.model}:predictLongRunning`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": this.apiKey,
      },
      body: JSON.stringify(requestBody),
      cache: "no-store",
    });

    const rawResponse = (await response.json()) as Record<string, unknown>;

    if (!response.ok) {
      throw new Error(
        `Google Veo image-to-video request failed: ${response.status} ${JSON.stringify(rawResponse)}`,
      );
    }

    const operationName = String(rawResponse.name ?? "");

    if (!operationName) {
      throw new Error("Google Veo did not return an operation name.");
    }

    return {
      providerJobId: operationName,
      operationName,
      status: "processing",
      rawResponse,
    };
  }

  async startEndImageTransition(
    input: StartEndImageTransitionInput,
  ): Promise<StartedVideoRender> {
    const requestBody = {
      instances: [
        {
          prompt: input.prompt,
          image: {
            bytesBase64Encoded: await blobToBase64(input.startImage.data),
            mimeType: input.startImage.mimeType,
          },
          lastFrame: {
            bytesBase64Encoded: await blobToBase64(input.endImage.data),
            mimeType: input.endImage.mimeType,
          },
        },
      ],
      parameters: {
        aspectRatio: input.aspectRatio,
        durationSeconds: input.durationSeconds,
        ...(input.negativePrompt ? { negativePrompt: input.negativePrompt } : {}),
      },
    };

    const response = await fetch(`${this.baseUrl}/models/${this.model}:predictLongRunning`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": this.apiKey,
      },
      body: JSON.stringify(requestBody),
      cache: "no-store",
    });

    const rawResponse = (await response.json()) as Record<string, unknown>;

    if (!response.ok) {
      throw new Error(
        `Google Veo start-end transition request failed: ${response.status} ${JSON.stringify(rawResponse)}`,
      );
    }

    const operationName = String(rawResponse.name ?? "");

    if (!operationName) {
      throw new Error("Google Veo did not return an operation name.");
    }

    return {
      providerJobId: operationName,
      operationName,
      status: "processing",
      rawResponse,
    };
  }

  async getRenderStatus(input: {
    operationName: string;
    providerJobId?: string | null;
  }): Promise<PolledVideoRender> {
    const response = await fetch(`${this.baseUrl}/${input.operationName}`, {
      method: "GET",
      headers: {
        "x-goog-api-key": this.apiKey,
      },
      cache: "no-store",
    });
    const rawResponse = (await response.json()) as Record<string, unknown>;

    if (!response.ok) {
      return {
        status: "failed",
        rawResponse,
        errorMessage: `Google Veo status request failed: ${response.status}`,
      };
    }

    const error = asRecord(rawResponse.error);

    if (Object.keys(error).length > 0) {
      return {
        status: "failed",
        rawResponse,
        errorMessage:
          typeof error.message === "string"
            ? error.message
            : "Google Veo render failed.",
      };
    }

    if (rawResponse.done !== true) {
      return {
        status: "processing",
        rawResponse,
      };
    }

    const finalResponse = asRecord(rawResponse.response);
    const video = findVideoCandidate(finalResponse);

    if (!video.uri) {
      return {
        status: "failed",
        rawResponse,
        errorMessage: "Google Veo completed without a downloadable video URI.",
      };
    }

    return {
      status: "completed",
      rawResponse,
      videoUri: video.uri,
      mimeType: video.mimeType,
    };
  }

  async downloadVideo(input: { videoUri: string }): Promise<DownloadedVideo> {
    const response = await fetch(input.videoUri, {
      headers: {
        "x-goog-api-key": this.apiKey,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Google Veo video download failed: ${response.status}`);
    }

    return {
      data: await response.blob(),
      mimeType: response.headers.get("content-type") ?? "video/mp4",
    };
  }
}
