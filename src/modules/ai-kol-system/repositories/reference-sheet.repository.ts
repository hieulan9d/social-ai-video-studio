import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  ReferenceSheetRecord,
  CreateReferenceSheetInput,
  ReferenceSheetType,
} from '../types';

export class ReferenceSheetRepository {
  constructor(private db: SupabaseClient) {}

  async findByKol(kolId: string): Promise<ReferenceSheetRecord[]> {
    const { data, error } = await this.db
      .from('kol_reference_sheets')
      .select('*')
      .eq('kol_id', kolId)
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as ReferenceSheetRecord[];
  }

  async findByType(kolId: string, sheetType: ReferenceSheetType): Promise<ReferenceSheetRecord[]> {
    const { data, error } = await this.db
      .from('kol_reference_sheets')
      .select('*')
      .eq('kol_id', kolId)
      .eq('sheet_type', sheetType)
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('version', { ascending: false });

    if (error) throw error;
    return (data || []) as ReferenceSheetRecord[];
  }

  async create(input: CreateReferenceSheetInput): Promise<ReferenceSheetRecord> {
    const { data, error } = await this.db
      .from('kol_reference_sheets')
      .insert({
        ...input,
        sheet_data: input.sheet_data || {},
        tags: input.tags || [],
        version: 1,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    return data as ReferenceSheetRecord;
  }

  async createNewVersion(id: string, input: Partial<CreateReferenceSheetInput>): Promise<ReferenceSheetRecord> {
    // Get current record
    const { data: current } = await this.db
      .from('kol_reference_sheets')
      .select('*')
      .eq('id', id)
      .single();

    if (!current) throw new Error('Reference sheet not found');

    // Deactivate current
    await this.db
      .from('kol_reference_sheets')
      .update({ is_active: false })
      .eq('id', id);

    // Create new version
    const { data, error } = await this.db
      .from('kol_reference_sheets')
      .insert({
        kol_id: current.kol_id,
        sheet_type: current.sheet_type,
        name: input.name || current.name,
        description: input.description ?? current.description,
        image_url: input.image_url ?? current.image_url,
        storage_path: input.storage_path ?? current.storage_path,
        sheet_data: input.sheet_data || current.sheet_data,
        tags: input.tags || current.tags,
        version: current.version + 1,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    return data as ReferenceSheetRecord;
  }

  async softDelete(id: string): Promise<void> {
    const { error } = await this.db
      .from('kol_reference_sheets')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  }
}
