import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  CampaignRecord,
  CreateCampaignInput,
  UpdateCampaignInput,
  CampaignScriptRecord,
  CreateCampaignScriptInput,
  CampaignSceneRecord,
  CreateCampaignSceneInput,
  CampaignPromptRecord,
  CreateCampaignPromptInput,
  CampaignVideoRecord,
  CampaignQaReportRecord,
  CampaignAssetRecord,
  CreateCampaignAssetInput,
} from '../types';

export class CampaignRepository {
  constructor(private db: SupabaseClient) {}

  // ── Campaign CRUD ───────────────────────────────────────

  async findById(id: string): Promise<CampaignRecord | null> {
    const { data, error } = await this.db
      .from('kol_campaigns')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error) return null;
    return data as CampaignRecord;
  }

  async findByKol(kolId: string): Promise<CampaignRecord[]> {
    const { data, error } = await this.db
      .from('kol_campaigns')
      .select('*')
      .eq('kol_id', kolId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as CampaignRecord[];
  }

  async create(userId: string, input: CreateCampaignInput): Promise<CampaignRecord> {
    const { data, error } = await this.db
      .from('kol_campaigns')
      .insert({ ...input, user_id: userId })
      .select()
      .single();

    if (error) throw error;
    return data as CampaignRecord;
  }

  async update(id: string, input: UpdateCampaignInput): Promise<CampaignRecord> {
    const { data, error } = await this.db
      .from('kol_campaigns')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as CampaignRecord;
  }

  async softDelete(id: string): Promise<void> {
    const { error } = await this.db
      .from('kol_campaigns')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  }

  // ── Scripts ─────────────────────────────────────────────

  async getScripts(campaignId: string): Promise<CampaignScriptRecord[]> {
    const { data, error } = await this.db
      .from('kol_campaign_scripts')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('version', { ascending: false });

    if (error) throw error;
    return (data || []) as CampaignScriptRecord[];
  }

  async getActiveScript(campaignId: string): Promise<CampaignScriptRecord | null> {
    const { data, error } = await this.db
      .from('kol_campaign_scripts')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('is_active', true)
      .order('version', { ascending: false })
      .limit(1)
      .single();

    if (error) return null;
    return data as CampaignScriptRecord;
  }

  async createScript(input: CreateCampaignScriptInput): Promise<CampaignScriptRecord> {
    // Deactivate previous versions
    await this.db
      .from('kol_campaign_scripts')
      .update({ is_active: false })
      .eq('campaign_id', input.campaign_id);

    // Get next version
    const { count } = await this.db
      .from('kol_campaign_scripts')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', input.campaign_id);

    const { data, error } = await this.db
      .from('kol_campaign_scripts')
      .insert({
        ...input,
        version: (count || 0) + 1,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    return data as CampaignScriptRecord;
  }

  // ── Scenes ──────────────────────────────────────────────

  async getScenes(campaignId: string): Promise<CampaignSceneRecord[]> {
    const { data, error } = await this.db
      .from('kol_campaign_scenes')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('scene_order', { ascending: true });

    if (error) throw error;
    return (data || []) as CampaignSceneRecord[];
  }

  async createScene(input: CreateCampaignSceneInput): Promise<CampaignSceneRecord> {
    const { data, error } = await this.db
      .from('kol_campaign_scenes')
      .insert(input)
      .select()
      .single();

    if (error) throw error;
    return data as CampaignSceneRecord;
  }

  async createScenes(inputs: CreateCampaignSceneInput[]): Promise<CampaignSceneRecord[]> {
    const { data, error } = await this.db
      .from('kol_campaign_scenes')
      .insert(inputs)
      .select();

    if (error) throw error;
    return (data || []) as CampaignSceneRecord[];
  }

  async updateScene(id: string, input: Partial<CreateCampaignSceneInput>): Promise<CampaignSceneRecord> {
    const { data, error } = await this.db
      .from('kol_campaign_scenes')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as CampaignSceneRecord;
  }

  // ── Prompts ─────────────────────────────────────────────

  async getPrompts(campaignId: string): Promise<CampaignPromptRecord[]> {
    const { data, error } = await this.db
      .from('kol_campaign_prompts')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data || []) as CampaignPromptRecord[];
  }

  async createPrompt(input: CreateCampaignPromptInput): Promise<CampaignPromptRecord> {
    // Deactivate previous prompts for same scene + type
    if (input.scene_id) {
      await this.db
        .from('kol_campaign_prompts')
        .update({ is_active: false })
        .eq('campaign_id', input.campaign_id)
        .eq('scene_id', input.scene_id)
        .eq('prompt_type', input.prompt_type);
    }

    const { data, error } = await this.db
      .from('kol_campaign_prompts')
      .insert({ ...input, version: 1, is_active: true })
      .select()
      .single();

    if (error) throw error;
    return data as CampaignPromptRecord;
  }

  // ── Videos ──────────────────────────────────────────────

  async getVideos(campaignId: string): Promise<CampaignVideoRecord[]> {
    const { data, error } = await this.db
      .from('kol_campaign_videos')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as CampaignVideoRecord[];
  }

  // ── Assets ──────────────────────────────────────────────

  async getAssets(campaignId: string): Promise<CampaignAssetRecord[]> {
    const { data, error } = await this.db
      .from('kol_campaign_assets')
      .select('*')
      .eq('campaign_id', campaignId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as CampaignAssetRecord[];
  }

  async createAsset(input: CreateCampaignAssetInput): Promise<CampaignAssetRecord> {
    const { data, error } = await this.db
      .from('kol_campaign_assets')
      .insert(input)
      .select()
      .single();

    if (error) throw error;
    return data as CampaignAssetRecord;
  }

  // ── QA Reports ──────────────────────────────────────────

  async getQaReports(campaignId: string): Promise<CampaignQaReportRecord[]> {
    const { data, error } = await this.db
      .from('kol_campaign_qa_reports')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as CampaignQaReportRecord[];
  }
}
