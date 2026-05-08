import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type SmartRoutingSettingsRecord = {
  id: number;
  prefer_cheapest: boolean;
  prefer_fastest: boolean;
  auto_fallback_on_error: boolean;
  daily_credit_limit_enabled: boolean;
  daily_credit_limit: number | null;
  per_user_credit_limit_enabled: boolean;
  per_user_credit_limit: number | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export type SmartRoutingSettings = {
  preferCheapest: boolean;
  preferFastest: boolean;
  autoFallbackOnError: boolean;
  dailyCreditLimitEnabled: boolean;
  dailyCreditLimit: number | null;
  perUserCreditLimitEnabled: boolean;
  perUserCreditLimit: number | null;
  updatedBy: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export const DEFAULT_SMART_ROUTING_SETTINGS: SmartRoutingSettings = {
  preferCheapest: false,
  preferFastest: false,
  autoFallbackOnError: true,
  dailyCreditLimitEnabled: false,
  dailyCreditLimit: null,
  perUserCreditLimitEnabled: false,
  perUserCreditLimit: null,
  updatedBy: null,
  createdAt: null,
  updatedAt: null,
};

const SMART_ROUTING_SELECT =
  "id, prefer_cheapest, prefer_fastest, auto_fallback_on_error, daily_credit_limit_enabled, daily_credit_limit, per_user_credit_limit_enabled, per_user_credit_limit, updated_by, created_at, updated_at";

function isMissingTableError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const record = error as Record<string, unknown>;
  return `${record.message ?? ""} ${record.details ?? ""}`.includes("smart_routing_settings");
}

function normalizeLimit(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return null;
  }

  return Math.max(0, Math.trunc(value));
}

export function normalizeSmartRoutingSettings(
  input: Partial<SmartRoutingSettings>,
): SmartRoutingSettings {
  const preferCheapest = Boolean(input.preferCheapest);
  const preferFastest = preferCheapest ? false : Boolean(input.preferFastest);
  const dailyCreditLimitEnabled = Boolean(input.dailyCreditLimitEnabled);
  const perUserCreditLimitEnabled = Boolean(input.perUserCreditLimitEnabled);

  return {
    preferCheapest,
    preferFastest,
    autoFallbackOnError:
      typeof input.autoFallbackOnError === "boolean"
        ? input.autoFallbackOnError
        : DEFAULT_SMART_ROUTING_SETTINGS.autoFallbackOnError,
    dailyCreditLimitEnabled,
    dailyCreditLimit: dailyCreditLimitEnabled ? normalizeLimit(input.dailyCreditLimit) : null,
    perUserCreditLimitEnabled,
    perUserCreditLimit: perUserCreditLimitEnabled
      ? normalizeLimit(input.perUserCreditLimit)
      : null,
    updatedBy: input.updatedBy ?? null,
    createdAt: input.createdAt ?? null,
    updatedAt: input.updatedAt ?? null,
  };
}

function mapSettings(record: SmartRoutingSettingsRecord | null | undefined): SmartRoutingSettings {
  if (!record) {
    return DEFAULT_SMART_ROUTING_SETTINGS;
  }

  return normalizeSmartRoutingSettings({
    preferCheapest: record.prefer_cheapest,
    preferFastest: record.prefer_fastest,
    autoFallbackOnError: record.auto_fallback_on_error,
    dailyCreditLimitEnabled: record.daily_credit_limit_enabled,
    dailyCreditLimit: record.daily_credit_limit,
    perUserCreditLimitEnabled: record.per_user_credit_limit_enabled,
    perUserCreditLimit: record.per_user_credit_limit,
    updatedBy: record.updated_by,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  });
}

export async function getSmartRoutingSettings() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("smart_routing_settings")
    .select(SMART_ROUTING_SELECT)
    .eq("id", 1)
    .maybeSingle<SmartRoutingSettingsRecord>();

  if (error) {
    if (isMissingTableError(error)) {
      return DEFAULT_SMART_ROUTING_SETTINGS;
    }

    throw error;
  }

  return mapSettings(data);
}

export async function updateSmartRoutingSettings(input: {
  preferCheapest: boolean;
  preferFastest: boolean;
  autoFallbackOnError: boolean;
  dailyCreditLimitEnabled: boolean;
  dailyCreditLimit: number | null;
  perUserCreditLimitEnabled: boolean;
  perUserCreditLimit: number | null;
  updatedBy: string;
}) {
  const admin = createAdminClient();
  const normalized = normalizeSmartRoutingSettings(input);

  const payload = {
    id: 1,
    prefer_cheapest: normalized.preferCheapest,
    prefer_fastest: normalized.preferFastest,
    auto_fallback_on_error: normalized.autoFallbackOnError,
    daily_credit_limit_enabled: normalized.dailyCreditLimitEnabled,
    daily_credit_limit: normalized.dailyCreditLimit,
    per_user_credit_limit_enabled: normalized.perUserCreditLimitEnabled,
    per_user_credit_limit: normalized.perUserCreditLimit,
    updated_by: input.updatedBy,
  };

  const { data, error } = await admin
    .from("smart_routing_settings")
    .upsert(payload)
    .select(SMART_ROUTING_SELECT)
    .single<SmartRoutingSettingsRecord>();

  if (error) {
    throw error;
  }

  return mapSettings(data);
}

type RoutableTask =
  | "chat"
  | "prompt"
  | "script"
  | "reasoning"
  | "gemini_text"
  | "gemini_fast"
  | "image"
  | "video"
  | "video_fast";

const CHEAPEST_MODEL_BY_TASK: Record<RoutableTask, string> = {
  chat: "gpt-4o-mini",
  prompt: "gpt-4o-mini",
  script: "gemini-2.5-flash",
  reasoning: "gemini-2.5-flash",
  gemini_text: "gemini-2.5-flash",
  gemini_fast: "gemini-2.5-flash",
  image: "gemini/gemini-2.5-flash-image",
  video: "veo-3-fast",
  video_fast: "veo-3-fast",
};

const FASTEST_MODEL_BY_TASK: Record<RoutableTask, string> = {
  chat: "gpt-4o-mini",
  prompt: "gpt-4o-mini",
  script: "gemini-2.5-flash",
  reasoning: "gemini-2.5-flash",
  gemini_text: "gemini-2.5-flash",
  gemini_fast: "gemini-2.5-flash",
  image: "gemini/gemini-3.1-flash-image-preview",
  video: "veo-3-fast",
  video_fast: "veo-3-fast",
};

const FALLBACK_MODELS_BY_TASK: Record<RoutableTask, string[]> = {
  chat: ["gpt-4o-mini", "gemini-2.5-flash", "gemini-2.5-pro", "gpt-4.1"],
  prompt: ["gpt-4o-mini", "gemini-2.5-flash", "gemini-2.5-pro", "gpt-4.1"],
  script: ["gemini-2.5-pro", "gemini-2.5-flash", "gpt-4.1", "gpt-4o-mini"],
  reasoning: ["gemini-2.5-pro", "gemini-2.5-flash", "gpt-4.1", "gpt-4o-mini"],
  gemini_text: ["gemini-2.5-pro", "gemini-2.5-flash", "gpt-4o-mini"],
  gemini_fast: ["gemini-2.5-flash", "gemini-2.5-pro", "gpt-4o-mini"],
  image: [
    "gemini/gemini-3.1-flash-image-preview",
    "gemini/gemini-2.5-flash-image",
    "gemini/gemini-3-pro-image-preview",
  ],
  video: ["veo-3", "veo-3-fast", "veo"],
  video_fast: ["veo-3-fast", "veo-3", "veo"],
};

function uniqueModels(models: Array<string | null | undefined>) {
  return Array.from(new Set(models.filter((value): value is string => Boolean(value))));
}

export async function getRoutedModelCandidates(input: {
  task: RoutableTask;
  requestedModel: string;
}) {
  const settings = await getSmartRoutingSettings();
  const preferredModel = settings.preferCheapest
    ? CHEAPEST_MODEL_BY_TASK[input.task]
    : settings.preferFastest
      ? FASTEST_MODEL_BY_TASK[input.task]
      : input.requestedModel;

  return {
    settings,
    models: uniqueModels([
      preferredModel,
      input.requestedModel,
      ...FALLBACK_MODELS_BY_TASK[input.task],
    ]),
  };
}
