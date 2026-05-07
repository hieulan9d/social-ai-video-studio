import { OpenAICompatibleTextProvider } from "@/lib/ai/providers/openai-compatible-provider";
import type { AITextProvider } from "@/lib/ai/providers/text-provider";

export function getAITextProvider(): AITextProvider {
  return new OpenAICompatibleTextProvider();
}
