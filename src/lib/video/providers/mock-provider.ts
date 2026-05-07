import type {
  DownloadedVideo,
  PolledVideoRender,
  StartEndImageTransitionInput,
  StartImageToVideoInput,
  StartedVideoRender,
  StartTextToVideoInput,
  VideoProvider,
} from "@/lib/video/types";

export class MockVideoProvider implements VideoProvider {
  readonly name = "mock";
  readonly model = "mock-text-to-video";

  async startTextToVideo(input: StartTextToVideoInput): Promise<StartedVideoRender> {
    const providerJobId = `mock_render_${crypto.randomUUID()}`;

    return {
      providerJobId,
      operationName: providerJobId,
      status: "completed",
      videoUri: `mock://generated-video/${providerJobId}`,
      mimeType: "video/mp4",
      rawResponse: {
        provider: this.name,
        model: this.model,
        prompt: input.prompt,
        aspectRatio: input.aspectRatio,
        durationSeconds: input.durationSeconds,
      },
    };
  }

  async startImageToVideo(input: StartImageToVideoInput): Promise<StartedVideoRender> {
    const providerJobId = `mock_image_render_${crypto.randomUUID()}`;

    return {
      providerJobId,
      operationName: providerJobId,
      status: "completed",
      videoUri: `mock://generated-image-video/${providerJobId}`,
      mimeType: "video/mp4",
      rawResponse: {
        provider: this.name,
        model: this.model,
        prompt: input.prompt,
        aspectRatio: input.aspectRatio,
        durationSeconds: input.durationSeconds,
        sourceMimeType: input.image.mimeType,
      },
    };
  }

  async startEndImageTransition(
    input: StartEndImageTransitionInput,
  ): Promise<StartedVideoRender> {
    const providerJobId = `mock_transition_render_${crypto.randomUUID()}`;

    return {
      providerJobId,
      operationName: providerJobId,
      status: "completed",
      videoUri: `mock://generated-transition-video/${providerJobId}`,
      mimeType: "video/mp4",
      rawResponse: {
        provider: this.name,
        model: this.model,
        prompt: input.prompt,
        aspectRatio: input.aspectRatio,
        durationSeconds: input.durationSeconds,
        startMimeType: input.startImage.mimeType,
        endMimeType: input.endImage.mimeType,
      },
    };
  }

  async getRenderStatus(): Promise<PolledVideoRender> {
    return {
      status: "completed",
      videoUri: `mock://generated-video/${crypto.randomUUID()}`,
      mimeType: "video/mp4",
      rawResponse: {
        provider: this.name,
        model: this.model,
      },
    };
  }

  async downloadVideo(): Promise<DownloadedVideo> {
    return {
      data: new Blob(["Mock video output for render pipeline testing."], {
        type: "video/mp4",
      }),
      mimeType: "video/mp4",
    };
  }
}
