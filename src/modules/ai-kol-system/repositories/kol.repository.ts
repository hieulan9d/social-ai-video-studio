import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  KolMasterRecord,
  CreateKolInput,
  UpdateKolInput,
  IdentityDnaRecord,
  CreateIdentityDnaInput,
  VisualAnchorRecord,
  CreateVisualAnchorInput,
  VoiceDnaRecord,
  CreateVoiceDnaInput,
  OutfitRecord,
  CreateOutfitInput,
  MotionStyleRecord,
  CreateMotionStyleInput,
} from '../types';

export class KolRepository {
  constructor(private db: SupabaseClient) {}

  // ── KOL Master ──────────────────────────────────────────

  async findById(id: string): Promise<KolMasterRecord | null> {
    const { data, error } = await this.db
      .from('kol_masters')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error) return null;
    return data as KolMasterRecord;
  }

  async findByWorkspace(workspaceId: string): Promise<KolMasterRecord[]> {
    const { data, error } = await this.db
      .from('kol_masters')
      .select('*')
      .eq('workspace_id', workspaceId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as KolMasterRecord[];
  }

  async create(userId: string, input: CreateKolInput): Promise<KolMasterRecord> {
    const { data, error } = await this.db
      .from('kol_masters')
      .insert({
        workspace_id: input.workspace_id,
        user_id: userId,
        name: input.name,
        slug: input.slug || null,
        avatar_url: input.avatar_url || null,
        settings: input.settings || {},
        metadata: input.metadata || {},
      })
      .select()
      .single();

    if (error) throw error;
    return data as KolMasterRecord;
  }

  async update(id: string, input: UpdateKolInput): Promise<KolMasterRecord> {
    const { data, error } = await this.db
      .from('kol_masters')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as KolMasterRecord;
  }

  async softDelete(id: string): Promise<void> {
    const { error } = await this.db
      .from('kol_masters')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  }

  // ── Identity DNA ────────────────────────────────────────

  async getIdentityDna(kolId: string): Promise<IdentityDnaRecord | null> {
    const { data, error } = await this.db
      .from('kol_identity_dna')
      .select('*')
      .eq('kol_id', kolId)
      .single();

    if (error) return null;
    return data as IdentityDnaRecord;
  }

  async upsertIdentityDna(input: CreateIdentityDnaInput): Promise<IdentityDnaRecord> {
    const { data, error } = await this.db
      .from('kol_identity_dna')
      .upsert(input, { onConflict: 'kol_id' })
      .select()
      .single();

    if (error) throw error;
    return data as IdentityDnaRecord;
  }

  // ── Visual Anchor ───────────────────────────────────────

  async getActiveVisualAnchor(kolId: string): Promise<VisualAnchorRecord | null> {
    const { data, error } = await this.db
      .from('kol_visual_anchors')
      .select('*')
      .eq('kol_id', kolId)
      .eq('is_active', true)
      .order('version', { ascending: false })
      .limit(1)
      .single();

    if (error) return null;
    return data as VisualAnchorRecord;
  }

  async createVisualAnchor(input: CreateVisualAnchorInput): Promise<VisualAnchorRecord> {
    // Deactivate previous versions
    await this.db
      .from('kol_visual_anchors')
      .update({ is_active: false })
      .eq('kol_id', input.kol_id);

    // Get next version number
    const { count } = await this.db
      .from('kol_visual_anchors')
      .select('*', { count: 'exact', head: true })
      .eq('kol_id', input.kol_id);

    const { data, error } = await this.db
      .from('kol_visual_anchors')
      .insert({
        ...input,
        version: (count || 0) + 1,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    return data as VisualAnchorRecord;
  }

  // ── Voice DNA ───────────────────────────────────────────

  async getVoiceDna(kolId: string): Promise<VoiceDnaRecord | null> {
    const { data, error } = await this.db
      .from('kol_voice_dna')
      .select('*')
      .eq('kol_id', kolId)
      .single();

    if (error) return null;
    return data as VoiceDnaRecord;
  }

  async upsertVoiceDna(input: CreateVoiceDnaInput): Promise<VoiceDnaRecord> {
    const { data, error } = await this.db
      .from('kol_voice_dna')
      .upsert(input, { onConflict: 'kol_id' })
      .select()
      .single();

    if (error) throw error;
    return data as VoiceDnaRecord;
  }

  // ── Outfits ─────────────────────────────────────────────

  async getOutfits(kolId: string): Promise<OutfitRecord[]> {
    const { data, error } = await this.db
      .from('kol_outfits')
      .select('*')
      .eq('kol_id', kolId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as OutfitRecord[];
  }

  async createOutfit(input: CreateOutfitInput): Promise<OutfitRecord> {
    const { tags, ...outfitData } = input;
    const { data, error } = await this.db
      .from('kol_outfits')
      .insert(outfitData)
      .select()
      .single();

    if (error) throw error;

    // Insert tags if provided
    if (tags && tags.length > 0) {
      await this.db.from('kol_outfit_tags').insert(
        tags.map((tag) => ({ outfit_id: data.id, tag }))
      );
    }

    return data as OutfitRecord;
  }

  async deleteOutfit(id: string): Promise<void> {
    const { error } = await this.db
      .from('kol_outfits')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  }

  // ── Motion Styles ───────────────────────────────────────

  async getMotionStyles(kolId: string): Promise<MotionStyleRecord[]> {
    const { data, error } = await this.db
      .from('kol_motion_styles')
      .select('*')
      .eq('kol_id', kolId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as MotionStyleRecord[];
  }

  async createMotionStyle(input: CreateMotionStyleInput): Promise<MotionStyleRecord> {
    const { data, error } = await this.db
      .from('kol_motion_styles')
      .insert(input)
      .select()
      .single();

    if (error) throw error;
    return data as MotionStyleRecord;
  }
}
