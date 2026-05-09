import "server-only";

import { cache } from "react";
import { listQuickGenerations, type QuickGenerationRecord } from "@/lib/ai/quick-generations";
import { getUserCredits } from "@/lib/credits/credit-service";
import { getFeaturePricing } from "@/lib/pricing/server";
import { buildFeatureCostMap, formatCreditRangeEstimate } from "@/lib/pricing/ui";
import { getProjectCount, getRecentProjects } from "@/lib/projects/server";
import type { Project } from "@/lib/projects/types";
import { getWalletTransactions } from "@/lib/wallet/server";

export type DashboardActivityItem = {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  time: string;
};

export type DashboardSummary = {
  walletBalance: number;
  projectCount: number;
  workflowEstimate: string;
  stats: Array<{
    label: string;
    value: string;
    note: string;
    tone: "success" | "pending";
  }>;
  recentProjects: Project[];
  recentOutputs: QuickGenerationRecord[];
  activity: DashboardActivityItem[];
};

export const getDashboardSummary = cache(async (userId: string): Promise<DashboardSummary> => {
  const [credits, projectCount, recentProjects, outputs, transactions, featurePricing] =
    await Promise.all([
      getUserCredits(userId),
      getProjectCount(userId),
      getRecentProjects(userId, 3),
      listQuickGenerations({ userId, limit: 12 }),
      getWalletTransactions(userId, 12),
      getFeaturePricing(),
    ]);

  const featureCosts = buildFeatureCostMap(featurePricing);
  const workflowEstimate = formatCreditRangeEstimate(
    Math.min(
      featureCosts.veo_render,
      featureCosts.image_to_video,
      featureCosts.transition_video,
    ),
    Math.max(
      featureCosts.veo_render,
      featureCosts.image_to_video,
      featureCosts.transition_video,
    ),
  );

  const imageCount = outputs.filter((item) => item.type === "image").length;
  const videoCount = outputs.filter((item) => item.type === "video").length;
  const promptCount = outputs.filter((item) => item.type === "prompt").length;
  const creditsUsed = credits.total_used;

  const activity = [
    ...outputs.slice(0, 6).map((item) => ({
      id: item.id,
      title: formatGenerationTitle(item.type),
      subtitle: `${item.model} · ${item.aspect_ratio ?? "auto"} · ${
        item.duration_seconds ? `${item.duration_seconds}s` : "single pass"
      }`,
      status: item.status,
      time: item.created_at,
    })),
    ...transactions.slice(0, 4).map((item) => ({
      id: item.id,
      title: item.amountCredit > 0 ? "Nạp credits" : "Sử dụng credits",
      subtitle: `${item.transactionType} · ${Math.abs(item.amountCredit)} credits · ví`,
      status: item.amountCredit > 0 ? "completed" : "processing",
      time: item.createdAt,
    })),
  ].slice(0, 8);

  return {
    walletBalance: credits.balance,
    projectCount,
    workflowEstimate,
    stats: [
      {
        label: "Video đã tạo",
        value: videoCount.toString(),
        note: "Trong lịch sử gần đây",
        tone: "success",
      },
      {
        label: "Ảnh đã tạo",
        value: imageCount.toString(),
        note: "Trong lịch sử gần đây",
        tone: "success",
      },
      {
        label: "Prompt đã tạo",
        value: promptCount.toString(),
        note: "Không tốn credits",
        tone: "success",
      },
      {
        label: "Credits đã dùng",
        value: creditsUsed.toString(),
        note: `${credits.balance} còn lại`,
        tone: "pending",
      },
    ],
    recentProjects,
    recentOutputs: outputs.slice(0, 8),
    activity,
  };
});

function formatGenerationTitle(type: QuickGenerationRecord["type"]) {
  if (type === "image") return "Ảnh";
  if (type === "video") return "Video";
  return "Prompt";
}
