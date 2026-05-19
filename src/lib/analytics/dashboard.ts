import "server-only";

import { getUserCredits } from "@/lib/credits/credit-service";
import { getPaymentHistory } from "@/lib/payments/server";
import { getProjects } from "@/lib/projects/server";
import { createClient } from "@/lib/supabase/server";
import { listQuickGenerations, type QuickGenerationRecord } from "@/lib/ai/quick-generations";

type RenderAnalyticsRecord = {
  id: string;
  provider: string | null;
  render_mode: string;
  status: "queued" | "processing" | "completed" | "failed";
  credit_cost: number;
  created_at: string;
};

type CreditTransactionRow = {
  id: string;
  user_id: string;
  transaction_type: string;
  amount_credit: number;
  balance_after: number;
  reason: string | null;
  reference_type: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

type AnalyticsTransaction = {
  id: string;
  userId: string;
  type: string;
  amount: number;
  balanceAfter: number;
  reason: string | null;
  referenceType: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

type UsageBar = {
  label: string;
  value: number;
  tone: string;
};

type DayPoint = {
  label: string;
  image: number;
  video: number;
  prompt: number;
};

type ActivityItem = {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  createdAt: string;
};

type ProviderCard = {
  label: string;
  value: number;
  note: string;
};

type ModelCard = {
  label: string;
  value: number;
};

export type AnalyticsDashboardSummary = {
  walletBalance: number;
  projectCount: number;
  windowLabel: string;
  stats: Array<{
    label: string;
    value: string;
    note: string;
  }>;
  usageByFeature: UsageBar[];
  outputsByDay: DayPoint[];
  providerUsage: ProviderCard[];
  modelUsage: ModelCard[];
  activity: ActivityItem[];
};

const DAY_WINDOW = 30;
const CHART_DAYS = 7;
const FEATURE_TONES = {
  image: "bg-[#2dd4bf]",
  video: "bg-[#60a5fa]",
  prompt: "bg-[#a78bfa]",
  script: "bg-[#fbbf24]",
} as const;

function isCancelledQueryError(error: unknown) {
  return (
    !!error &&
    typeof error === "object" &&
    "code" in error &&
    (error as { code?: string }).code === "57014"
  );
}

export async function getAnalyticsDashboardSummary(userId: string): Promise<AnalyticsDashboardSummary> {
  const supabase = await createClient();
  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - DAY_WINDOW);
  const sinceIso = sinceDate.toISOString();

  const [credits, projects, quickGenerations, transactions, payments, renderJobs] = await Promise.all([
    getUserCredits(userId),
    getProjects(userId).catch(() => []),
    listQuickGenerations({ userId, limit: 120 }).catch(() => []),
    getAnalyticsTransactions(supabase, userId, sinceIso),
    getPaymentHistory(userId, 50).catch(() => []),
    getRecentRenderJobs(supabase, userId, sinceIso).catch(() => []),
  ]);

  const quickWithinWindow = quickGenerations.filter((item) => item.created_at >= sinceIso);
  const transactionsWithinWindow = transactions.filter((item) => item.createdAt >= sinceIso);
  const paymentsWithinWindow = payments.filter((item) => item.createdAt >= sinceIso);

  const quickImageCount = quickWithinWindow.filter((item) => item.type === "image").length;
  const quickVideoCount = quickWithinWindow.filter((item) => item.type === "video").length;
  const promptCount = quickWithinWindow.filter((item) => item.type === "prompt").length;
  const completedRenderCount = renderJobs.filter((item) => item.status === "completed").length;
  const videoCount = quickVideoCount + completedRenderCount;
  const creditsUsed = transactionsWithinWindow
    .filter((item) => item.amount < 0)
    .reduce((total, item) => total + Math.abs(item.amount), 0);
  const creditsAdded = transactionsWithinWindow
    .filter((item) => item.amount > 0)
    .reduce((total, item) => total + item.amount, 0);

  return {
    walletBalance: credits.balance,
    projectCount: projects.length,
    windowLabel: `30 ngày gần đây`,
    stats: [
      {
        label: "Ảnh đã tạo",
        value: quickImageCount.toLocaleString("vi-VN"),
        note: "Quick Image / Image to Image",
      },
      {
        label: "Video đã tạo",
        value: videoCount.toLocaleString("vi-VN"),
        note: `${completedRenderCount} job từ dự án`,
      },
      {
        label: "Prompt đã tạo",
        value: promptCount.toLocaleString("vi-VN"),
        note: `${projects.length.toLocaleString("vi-VN")} dự án đang hoạt động`,
      },
      {
        label: "Credits đã dùng",
        value: creditsUsed.toLocaleString("vi-VN"),
        note: `${credits.balance.toLocaleString("vi-VN")} credits còn lại`,
      },
    ],
    usageByFeature: [
      {
        label: "Tạo ảnh",
        value: sumFeatureUsage(transactionsWithinWindow, ["image_generation"]),
        tone: FEATURE_TONES.image,
      },
      {
        label: "Tạo video",
        value: sumFeatureUsage(transactionsWithinWindow, [
          "video_generation",
          "veo_render",
          "image_to_video",
          "transition_video",
        ]),
        tone: FEATURE_TONES.video,
      },
      {
        label: "Prompt AI",
        value: sumFeatureUsage(transactionsWithinWindow, ["prompt_generation"]),
        tone: FEATURE_TONES.prompt,
      },
      {
        label: "Kịch bản AI",
        value: sumFeatureUsage(transactionsWithinWindow, [
          "text_generation",
          "scene_generation",
        ]),
        tone: FEATURE_TONES.script,
      },
    ],
    outputsByDay: buildOutputsByDay(quickWithinWindow, renderJobs),
    providerUsage: buildProviderUsage(quickWithinWindow, renderJobs, creditsAdded),
    modelUsage: buildModelUsage(quickWithinWindow),
    activity: buildRecentActivity({
      quickGenerations: quickWithinWindow,
      renderJobs,
      payments: paymentsWithinWindow.map((item) => ({
        id: item.id,
        title: "Nạp credits",
        subtitle: `${item.provider.toUpperCase()} · ${item.creditsPurchased} credits`,
        status: item.status === "success" ? "completed" : item.status,
        createdAt: item.createdAt,
      })),
      transactions: transactionsWithinWindow.map((item) => ({
        id: item.id,
        title: item.amount > 0 ? "Cộng credits" : "Trừ credits",
        subtitle: `${item.type} · ${Math.abs(item.amount)} credits`,
        status: item.amount > 0 ? "completed" : "processing",
        createdAt: item.createdAt,
      })),
    }),
  };
}

async function getRecentRenderJobs(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  sinceIso: string,
) {
  const { data, error } = await supabase
    .from("render_jobs")
    .select("id, provider, render_mode, status, credit_cost, created_at")
    .eq("user_id", userId)
    .gte("created_at", sinceIso)
    .order("created_at", { ascending: false })
    .limit(120)
    .returns<RenderAnalyticsRecord[]>();

  if (error) {
    if (isCancelledQueryError(error)) {
      return [];
    }

    throw error;
  }

  return data ?? [];
}

async function getAnalyticsTransactions(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  sinceIso: string,
): Promise<AnalyticsTransaction[]> {
  const { data, error } = await supabase
    .from("credit_transactions")
    .select("id, user_id, transaction_type, amount_credit, balance_after, reason, reference_type, metadata, created_at")
    .eq("user_id", userId)
    .gte("created_at", sinceIso)
    .order("created_at", { ascending: false })
    .limit(160)
    .returns<CreditTransactionRow[]>();

  if (error) {
    if (isCancelledQueryError(error)) {
      return [];
    }

    throw error;
  }

  return (data ?? []).map((item) => ({
    id: item.id,
    userId: item.user_id,
    type: item.transaction_type,
    amount: item.amount_credit,
    balanceAfter: item.balance_after,
    reason: item.reason,
    referenceType: item.reference_type,
    metadata: item.metadata,
    createdAt: item.created_at,
  }));
}

function sumFeatureUsage(
  transactions: AnalyticsTransaction[],
  featureKeys: string[],
) {
  return transactions
    .filter((item) => item.amount < 0)
    .filter((item) => {
      const referenceType = item.referenceType ?? "";
      const reason = item.reason ?? "";
      return featureKeys.some(
        (key) => referenceType.includes(key) || reason.includes(key),
      );
    })
    .reduce((total, item) => total + Math.abs(item.amount), 0);
}

function buildOutputsByDay(
  quickGenerations: QuickGenerationRecord[],
  renderJobs: RenderAnalyticsRecord[],
) {
  const today = new Date();
  const points = Array.from({ length: CHART_DAYS }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (CHART_DAYS - 1 - index));
    return {
      key: toDayKey(date.toISOString()),
      label: date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }),
      image: 0,
      video: 0,
      prompt: 0,
    };
  });

  const pointMap = new Map(points.map((item) => [item.key, item]));

  for (const item of quickGenerations) {
    const bucket = pointMap.get(toDayKey(item.created_at));

    if (!bucket) {
      continue;
    }

    if (item.type === "image") {
      bucket.image += item.quantity;
      continue;
    }

    if (item.type === "video") {
      bucket.video += item.quantity;
      continue;
    }

    bucket.prompt += 1;
  }

  for (const item of renderJobs) {
    const bucket = pointMap.get(toDayKey(item.created_at));

    if (!bucket) {
      continue;
    }

    bucket.video += 1;
  }

  return points;
}

function buildProviderUsage(
  quickGenerations: QuickGenerationRecord[],
  renderJobs: RenderAnalyticsRecord[],
  creditsAdded: number,
) {
  const providerCounts = new Map<string, number>([
    ["Google", 0],
    ["OpenAI", 0],
    ["9Router", 0],
  ]);

  for (const item of quickGenerations) {
    const provider = inferProviderFromModel(item.model);
    providerCounts.set(provider, (providerCounts.get(provider) ?? 0) + 1);
  }

  for (const item of renderJobs) {
    const provider = normalizeProvider(item.provider);
    providerCounts.set(provider, (providerCounts.get(provider) ?? 0) + 1);
  }

  return [
    {
      label: "Google",
      value: providerCounts.get("Google") ?? 0,
      note: "Gemini / Veo direct",
    },
    {
      label: "OpenAI",
      value: providerCounts.get("OpenAI") ?? 0,
      note: "Prompt / image workflows",
    },
    {
      label: "9Router",
      value: providerCounts.get("9Router") ?? 0,
      note: `${creditsAdded.toLocaleString("vi-VN")} credits đã nạp`,
    },
  ];
}

function buildModelUsage(quickGenerations: QuickGenerationRecord[]) {
  const counts = new Map<string, number>();

  for (const item of quickGenerations) {
    const key = item.model.trim();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, 5)
    .map(([label, value]) => ({ label, value }));
}

function buildRecentActivity({
  quickGenerations,
  renderJobs,
  payments,
  transactions,
}: {
  quickGenerations: QuickGenerationRecord[];
  renderJobs: RenderAnalyticsRecord[];
  payments: ActivityItem[];
  transactions: ActivityItem[];
}) {
  const activity: ActivityItem[] = [
    ...quickGenerations.map((item) => ({
      id: item.id,
      title: formatQuickGenerationTitle(item.type),
      subtitle: `${item.model} · ${item.aspect_ratio ?? "auto"}${item.duration_seconds ? ` · ${item.duration_seconds}s` : ""}`,
      status: item.status,
      createdAt: item.created_at,
    })),
    ...renderJobs.map((item) => ({
      id: item.id,
      title: "Render dự án",
      subtitle: `${normalizeProvider(item.provider)} · ${formatRenderMode(item.render_mode)} · ${item.credit_cost} credits`,
      status: item.status,
      createdAt: item.created_at,
    })),
    ...payments,
    ...transactions,
  ];

  return activity
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .slice(0, 12);
}

function formatQuickGenerationTitle(type: QuickGenerationRecord["type"]) {
  if (type === "image") return "Tạo ảnh nhanh";
  if (type === "video") return "Tạo video nhanh";
  return "Prompt AI";
}

function formatRenderMode(value: string) {
  const labels: Record<string, string> = {
    text_to_video: "Text to Video",
    image_to_video: "Image to Video",
    start_end_transition: "Start/End Image to Video",
  };

  return labels[value] ?? value;
}

function normalizeProvider(value: string | null) {
  if (!value) {
    return "9Router";
  }

  const normalized = value.toLowerCase();

  if (normalized.includes("google") || normalized.includes("gemini") || normalized.includes("veo")) {
    return "Google";
  }

  if (normalized.includes("openai") || normalized.includes("gpt")) {
    return "OpenAI";
  }

  return "9Router";
}

function inferProviderFromModel(model: string) {
  const normalized = model.toLowerCase();

  if (normalized.startsWith("gemini/") || normalized.includes("gemini")) {
    return "Google";
  }

  if (normalized.startsWith("openai/") || normalized.includes("gpt-image") || normalized.includes("gpt-")) {
    return "OpenAI";
  }

  return "9Router";
}

function toDayKey(value: string) {
  return value.slice(0, 10);
}
