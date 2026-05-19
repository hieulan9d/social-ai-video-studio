import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { WorkspaceService } from "./workspace.service";
import { KolService } from "./kol.service";
import { CampaignService } from "./campaign.service";
import { IdentityLockService } from "./identity-lock.service";
import { KolDnaService } from "./kol-dna.service";

/**
 * React-cached service accessors.
 *
 * React `cache()` deduplicates calls within the SAME server request.
 * If multiple components call `getCachedKol("abc")` during one render,
 * the DB is only hit once.
 */

export const getCachedWorkspaces = cache(async (userId: string) => {
  const supabase = await createClient();
  const service = new WorkspaceService(supabase);
  return service.getUserWorkspaces(userId);
});

export const getCachedKol = cache(async (kolId: string) => {
  const supabase = await createClient();
  const service = new KolService(supabase);
  return service.getKol(kolId);
});

export const getCachedWorkspaceKols = cache(async (workspaceId: string) => {
  const supabase = await createClient();
  const service = new KolService(supabase);
  return service.getWorkspaceKols(workspaceId);
});

export const getCachedKolCampaigns = cache(async (kolId: string) => {
  const supabase = await createClient();
  const service = new CampaignService(supabase);
  return service.getKolCampaigns(kolId);
});

export const getCachedCampaign = cache(async (campaignId: string) => {
  const supabase = await createClient();
  const service = new CampaignService(supabase);
  return service.getCampaign(campaignId);
});

export const getCachedIdentityLock = cache(async (kolId: string) => {
  const supabase = await createClient();
  const service = new IdentityLockService(supabase);
  return service.getLock(kolId).catch(() => null);
});

export const getCachedDnaProfile = cache(async (kolId: string) => {
  const supabase = await createClient();
  const service = new KolDnaService(supabase);
  return service.getFullDnaProfile(kolId);
});
