import "server-only";

import { OpenAICompatibleTextProvider } from "@/lib/ai/providers/openai-compatible-provider";

const DEFAULT_9ROUTER_BASE_URL = "http://localhost:20128/v1";

function getNineRouterConfig() {
  const apiKey = process.env.NINE_ROUTER_API_KEY || process.env["9ROUTER_API_KEY"];
  const baseUrl =
    process.env.NINE_ROUTER_BASE_URL ||
    process.env["9ROUTER_BASE_URL"] ||
    DEFAULT_9ROUTER_BASE_URL;
  const model = process.env["9ROUTER_DEFAULT_MODEL"];

  if (!model) {
    throw new Error("Missing 9ROUTER_DEFAULT_MODEL for 9router AI generation.");
  }

  return {
    name: "9router",
    apiKey,
    baseUrl,
    model,
    missingApiKeyMessage: "Missing 9ROUTER_API_KEY for 9router AI generation.",
  };
}

export class NineRouterTextProvider extends OpenAICompatibleTextProvider {
  constructor() {
    super(getNineRouterConfig());
  }
}
