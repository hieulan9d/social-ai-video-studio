"use server";

import { requireAdminProfile } from "@/lib/auth/server";
import {
  getSmartRoutingSettings,
  normalizeSmartRoutingSettings,
  updateSmartRoutingSettings,
} from "@/lib/ai/smart-routing";

export async function saveSmartRoutingSettingsAction(input: {
  preferCheapest: boolean;
  preferFastest: boolean;
  autoFallbackOnError: boolean;
  dailyCreditLimitEnabled: boolean;
  dailyCreditLimit: number | null;
  perUserCreditLimitEnabled: boolean;
  perUserCreditLimit: number | null;
}) {
  const profile = await requireAdminProfile();
  const normalized = normalizeSmartRoutingSettings(input);
  const settings = await updateSmartRoutingSettings({
    ...normalized,
    updatedBy: profile.id,
  });

  return {
    ok: true as const,
    settings,
  };
}

export async function getSmartRoutingSettingsAction() {
  await requireAdminProfile();
  return getSmartRoutingSettings();
}
