import { NineRouterTextProvider } from "@/lib/ai/providers/nine-router-provider";
import { OpenAICompatibleTextProvider } from "@/lib/ai/providers/openai-compatible-provider";
import type { AITextProvider } from "@/lib/ai/providers/text-provider";

export function getAITextProvider(): AITextProvider {
  if (process.env.NINE_ROUTER_API_KEY || process.env["9ROUTER_API_KEY"]) {
    return new NineRouterTextProvider();
  }

  return new OpenAICompatibleTextProvider();
}

export function getAITextProviderMetadata() {
  const provider = getAITextProvider();

  return {
    provider: provider.name,
    model: provider.model,
  };
}
