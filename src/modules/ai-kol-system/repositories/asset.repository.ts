import type { SupabaseClient } from '@supabase/supabase-js';
import type { KolAssetRecord, CreateKolAssetInput } from '../types';

export class AssetRepository {
  constructor(private db: SupabaseClient) {}

  async findByKol(kolId: string): Promise<KolAssetRecord[]> {
    const { data, error } = await this.db
      .from('kol_assets')
      .select('*')
      .eq('kol_id', kolId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as KolAssetRecord[];
  }

  async findByCategory(kolId: string, category: string): Promise<KolAssetRecord[]> {
    const { data, error } = await this.db
      .from('kol_assets')
      .select('*')
      .eq('kol_id', kolId)
      .eq('asset_category', category)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as KolAssetRecord[];
  }

  async create(input: CreateKolAssetInput): Promise<KolAssetRecord> {
    const { data, error } = await this.db
      .from('kol_assets')
      .insert({
        ...input,
        metadata: input.metadata || {},
        tags: input.tags || [],
      })
      .select()
      .single();

    if (error) throw error;
    return data as KolAssetRecord;
  }

  async softDelete(id: string): Promise<void> {
    const { error } = await this.db
      .from('kol_assets')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  }
}
