import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  AvatarSessionRecord,
  AvatarGenerationRecord,
  AvatarReferenceImageRecord,
  IdentityLockRecord,
  AvatarReferenceRole,
  JsonData,
} from '../types';

export class AvatarRepository {
  constructor(private db: SupabaseClient) {}

  // ── Sessions ────────────────────────────────────────────

  async createSession(kolId: string, userId: string): Promise<AvatarSessionRecord> {
    const { data, error } = await this.db
      .from('kol_avatar_sessions')
      .insert({ kol_id: kolId, user_id: userId, status: 'active' })
      .select()
      .single();
    if (error) throw error;
    return data as AvatarSessionRecord;
  }

  async findSession(id: string): Promise<AvatarSessionRecord | null> {
    const { data, error } = await this.db
      .from('kol_avatar_sessions')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return null;
    return data as AvatarSessionRecord;
  }

  async findActiveSessionByKol(kolId: string): Promise<AvatarSessionRecord | null> {
    const { data, error } = await this.db
      .from('kol_avatar_sessions')
      .select('*')
      .eq('kol_id', kolId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    if (error) return null;
    return data as AvatarSessionRecord;
  }

  async updateSession(id: string, updates: Partial<AvatarSessionRecord>): Promise<AvatarSessionRecord> {
    const { data, error } = await this.db
      .from('kol_avatar_sessions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as AvatarSessionRecord;
  }

  async finalizeSession(id: string, generationId: string): Promise<AvatarSessionRecord> {
    return this.updateSession(id, {
      status: 'finalized',
      finalized_avatar_id: generationId,
      finalized_at: new Date().toISOString(),
    });
  }

  // ── Generations ─────────────────────────────────────────

  async createGeneration(input: {
    session_id: string;
    parent_generation_id?: string | null;
    version: number;
    prompt: string;
    candidate_count: number;
    settings?: JsonData;
    provider: string;
  }): Promise<AvatarGenerationRecord> {
    const { data, error } = await this.db
      .from('kol_avatar_generations')
      .insert({
        ...input,
        status: 'queued',
        settings: input.settings || {},
      })
      .select()
      .single();
    if (error) throw error;
    return data as AvatarGenerationRecord;
  }

  async updateGeneration(id: string, updates: Partial<AvatarGenerationRecord>): Promise<AvatarGenerationRecord> {
    const { data, error } = await this.db
      .from('kol_avatar_generations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as AvatarGenerationRecord;
  }

  async findGeneration(id: string): Promise<AvatarGenerationRecord | null> {
    const { data, error } = await this.db
      .from('kol_avatar_generations')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return null;
    return data as AvatarGenerationRecord;
  }

  async listGenerations(sessionId: string): Promise<AvatarGenerationRecord[]> {
    const { data, error } = await this.db
      .from('kol_avatar_generations')
      .select('*')
      .eq('session_id', sessionId)
      .order('version', { ascending: true });
    if (error) throw error;
    return (data || []) as AvatarGenerationRecord[];
  }

  async getNextVersion(sessionId: string): Promise<number> {
    const { count } = await this.db
      .from('kol_avatar_generations')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId);
    return (count || 0) + 1;
  }

  async markSelected(generationId: string, candidateIndex: number): Promise<AvatarGenerationRecord> {
    const gen = await this.findGeneration(generationId);
    if (!gen) throw new Error('Generation not found');

    // Unselect all other generations in this session
    await this.db
      .from('kol_avatar_generations')
      .update({ selected: false, selected_candidate_index: null })
      .eq('session_id', gen.session_id);

    // Mark this one as selected
    return this.updateGeneration(generationId, {
      selected: true,
      selected_candidate_index: candidateIndex,
    });
  }

  // ── Reference Images ────────────────────────────────────

  async createReferenceImage(input: {
    session_id: string;
    generation_id?: string | null;
    role: AvatarReferenceRole;
    storage_bucket: string;
    storage_path: string;
    file_url?: string | null;
    file_name: string;
    mime_type: string;
    file_size: number;
    width?: number | null;
    height?: number | null;
    display_order?: number;
    metadata?: JsonData;
  }): Promise<AvatarReferenceImageRecord> {
    const { data, error } = await this.db
      .from('kol_avatar_reference_images')
      .insert({
        ...input,
        storage_provider: 'supabase',
        display_order: input.display_order ?? 0,
        metadata: input.metadata || {},
      })
      .select()
      .single();
    if (error) throw error;
    return data as AvatarReferenceImageRecord;
  }

  async listReferenceImages(sessionId: string): Promise<AvatarReferenceImageRecord[]> {
    const { data, error } = await this.db
      .from('kol_avatar_reference_images')
      .select('*')
      .eq('session_id', sessionId)
      .order('display_order', { ascending: true });
    if (error) throw error;
    return (data || []) as AvatarReferenceImageRecord[];
  }

  async deleteReferenceImage(id: string): Promise<void> {
    const { error } = await this.db
      .from('kol_avatar_reference_images')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  // ── Identity Locks ──────────────────────────────────────

  async findIdentityLock(kolId: string): Promise<IdentityLockRecord | null> {
    const { data, error } = await this.db
      .from('kol_identity_locks')
      .select('*')
      .eq('kol_id', kolId)
      .single();
    if (error) return null;
    return data as IdentityLockRecord;
  }

  async upsertIdentityLock(input: Partial<IdentityLockRecord> & { kol_id: string; user_id: string; official_avatar_url: string; official_avatar_storage_path: string }): Promise<IdentityLockRecord> {
    const { data, error } = await this.db
      .from('kol_identity_locks')
      .upsert(input, { onConflict: 'kol_id' })
      .select()
      .single();
    if (error) throw error;
    return data as IdentityLockRecord;
  }
}
