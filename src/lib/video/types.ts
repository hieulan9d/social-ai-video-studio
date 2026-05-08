export const VIDEO_RENDER_STATUSES = [
  "queued",
  "processing",
  "completed",
  "failed",
] as const;

export type VideoRenderStatus = (typeof VIDEO_RENDER_STATUSES)[number];

export type StartTextToVideoInput = {
  prompt: string;
  aspectRatio: "9:16" | "16:9" | "1:1";
  durationSeconds: number;
  negativePrompt?: string;
};

export type StartImageToVideoInput = StartTextToVideoInput & {
  image: {
    data: Blob;
    mimeType: string;
  };
};

export type StartEndImageTransitionInput = StartTextToVideoInput & {
  startImage: {
    data: Blob;
    mimeType: string;
  };
  endImage: {
    data: Blob;
    mimeType: string;
  };
};

export type StartedVideoRender = {
  providerJobId: string;
  operationName: string;
  status: Extract<VideoRenderStatus, "queued" | "processing" | "completed">;
  rawResponse: Record<string, unknown>;
  videoUri?: string | null;
  mimeType?: string | null;
};

export type PolledVideoRender = {
  status: Extract<VideoRenderStatus, "processing" | "completed" | "failed">;
  rawResponse: Record<string, unknown>;
  videoUri?: string | null;
  mimeType?: string | null;
  errorMessage?: string | null;
};

export type DownloadedVideo = {
  data: Blob;
  mimeType: string;
};

export type VideoProvider = {
  readonly name: string;
  readonly model: string;
  startTextToVideo(input: StartTextToVideoInput): Promise<StartedVideoRender>;
  startImageToVideo(input: StartImageToVideoInput): Promise<StartedVideoRender>;
  startEndImageTransition(
    input: StartEndImageTransitionInput,
  ): Promise<StartedVideoRender>;
  getRenderStatus(input: {
    operationName: string;
    providerJobId?: string | null;
  }): Promise<PolledVideoRender>;
  downloadVideo(input: { videoUri: string }): Promise<DownloadedVideo>;
};
