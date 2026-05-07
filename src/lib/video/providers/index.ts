import "server-only";

import { GoogleVeoProvider } from "@/lib/video/providers/google-veo-provider";
import { MockVideoProvider } from "@/lib/video/providers/mock-provider";
import type { VideoProvider } from "@/lib/video/types";

const providers: Record<string, () => VideoProvider> = {
  "google-veo": () => new GoogleVeoProvider(),
  mock: () => new MockVideoProvider(),
};

export function getVideoProvider(name = process.env.VIDEO_PROVIDER ?? "mock") {
  const factory = providers[name];

  if (!factory) {
    throw new Error(`Unsupported video provider: ${name}`);
  }

  return factory();
}
