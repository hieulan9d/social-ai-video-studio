import type { SupabaseClient } from '@supabase/supabase-js';
import { CampaignRepository } from '../repositories';
import { kolEventBus } from '../events';
import { mapCampaign } from '../utils/mappers';
import { validateRequired } from '../utils/validation';
import type {
  Campaign,
  CreateCampaignInput,
  UpdateCampaignInput,
  CampaignScriptRecord,
  CreateCampaignScriptInput,
  CampaignSceneRecord,
  CreateCampaignSceneInput,
  CampaignPromptRecord,
  CreateCampaignPromptInput,
  CampaignVideoRecord,
  CampaignAssetRecord,
  CreateCampaignAssetInput,
  CampaignQaReportRecord,
} from '../types';

export class CampaignService {
  private repo: CampaignRepository;

  constructor(private db: SupabaseClient) {
    this.repo = new CampaignRepository(db);
  }

  // ── Campaign CRUD ───────────────────────────────────────

  async getCampaign(id: string): Promise<Campaign | null> {
    const record = await this.repo.findById(id);
    return record ? mapCampaign(record) : null;
  }

  async getKolCampaigns(kolId: string): Promise<Campaign[]> {
    const records = await this.repo.findByKol(kolId);
    return records.map(mapCampaign);
  }

  async createCampaign(userId: string, input: CreateCampaignInput): Promise<Campaign> {
    const validation = validateRequired(input as Record<string, unknown>, ['kol_id', 'workspace_id', 'name']);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    const record = await this.repo.create(userId, input);
    const campaign = mapCampaign(record);

    await kolEventBus.emit({
      type: 'campaign.created',
      payload: campaign,
      metadata: {
        userId,
        workspaceId: campaign.workspaceId,
        kolId: campaign.kolId,
        campaignId: campaign.id,
        timestamp: new Date().toISOString(),
      },
    });

    return campaign;
  }

  async updateCampaign(id: string, userId: string, input: UpdateCampaignInput): Promise<Campaign> {
    const record = await this.repo.update(id, input);
    const campaign = mapCampaign(record);

    if (input.status) {
      await kolEventBus.emit({
        type: 'campaign.status_changed',
        payload: { campaign, newStatus: input.status },
        metadata: {
          userId,
          workspaceId: campaign.workspaceId,
          kolId: campaign.kolId,
          campaignId: campaign.id,
          timestamp: new Date().toISOString(),
        },
      });
    }

    return campaign;
  }

  async deleteCampaign(id: string, userId: string): Promise<void> {
    const campaign = await this.repo.findById(id);
    await this.repo.softDelete(id);

    await kolEventBus.emit({
      type: 'campaign.deleted',
      payload: { id },
      metadata: {
        userId,
        workspaceId: campaign?.workspace_id,
        kolId: campaign?.kol_id,
        campaignId: id,
        timestamp: new Date().toISOString(),
      },
    });
  }

  // ── Scripts ─────────────────────────────────────────────

  async getScripts(campaignId: string): Promise<CampaignScriptRecord[]> {
    return this.repo.getScripts(campaignId);
  }

  async getActiveScript(campaignId: string): Promise<CampaignScriptRecord | null> {
    return this.repo.getActiveScript(campaignId);
  }

  async createScript(userId: string, input: CreateCampaignScriptInput): Promise<CampaignScriptRecord> {
    const result = await this.repo.createScript(input);

    await kolEventBus.emit({
      type: 'campaign.script.generated',
      payload: result,
      metadata: {
        userId,
        kolId: input.kol_id,
        campaignId: input.campaign_id,
        timestamp: new Date().toISOString(),
      },
    });

    return result;
  }

  // ── Scenes ──────────────────────────────────────────────

  async getScenes(campaignId: string): Promise<CampaignSceneRecord[]> {
    return this.repo.getScenes(campaignId);
  }

  async createScene(userId: string, input: CreateCampaignSceneInput): Promise<CampaignSceneRecord> {
    const result = await this.repo.createScene(input);

    await kolEventBus.emit({
      type: 'campaign.scene.created',
      payload: result,
      metadata: {
        userId,
        campaignId: input.campaign_id,
        timestamp: new Date().toISOString(),
      },
    });

    return result;
  }

  async createScenes(userId: string, inputs: CreateCampaignSceneInput[]): Promise<CampaignSceneRecord[]> {
    return this.repo.createScenes(inputs);
  }

  async updateScene(id: string, userId: string, input: Partial<CreateCampaignSceneInput>): Promise<CampaignSceneRecord> {
    const result = await this.repo.updateScene(id, input);

    await kolEventBus.emit({
      type: 'campaign.scene.updated',
      payload: result,
      metadata: {
        userId,
        campaignId: result.campaign_id,
        timestamp: new Date().toISOString(),
      },
    });

    return result;
  }

  // ── Prompts ─────────────────────────────────────────────

  async getPrompts(campaignId: string): Promise<CampaignPromptRecord[]> {
    return this.repo.getPrompts(campaignId);
  }

  async createPrompt(userId: string, input: CreateCampaignPromptInput): Promise<CampaignPromptRecord> {
    const result = await this.repo.createPrompt(input);

    await kolEventBus.emit({
      type: 'campaign.prompt.generated',
      payload: result,
      metadata: {
        userId,
        campaignId: input.campaign_id,
        timestamp: new Date().toISOString(),
      },
    });

    return result;
  }

  // ── Assets ──────────────────────────────────────────────

  async getAssets(campaignId: string): Promise<CampaignAssetRecord[]> {
    return this.repo.getAssets(campaignId);
  }

  async createAsset(input: CreateCampaignAssetInput): Promise<CampaignAssetRecord> {
    return this.repo.createAsset(input);
  }

  // ── Videos ──────────────────────────────────────────────

  async getVideos(campaignId: string): Promise<CampaignVideoRecord[]> {
    return this.repo.getVideos(campaignId);
  }

  // ── QA Reports ──────────────────────────────────────────

  async getQaReports(campaignId: string): Promise<CampaignQaReportRecord[]> {
    return this.repo.getQaReports(campaignId);
  }
}
