import type { SupabaseClient } from '@supabase/supabase-js';
import type { WorkspaceRecord, CreateWorkspaceInput, UpdateWorkspaceInput } from '../types';

const TABLE = 'kol_workspaces';

export class WorkspaceRepository {
  constructor(private db: SupabaseClient) {}

  async findById(id: string): Promise<WorkspaceRecord | null> {
    const { data, error } = await this.db
      .from(TABLE)
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error) return null;
    return data as WorkspaceRecord;
  }

  async findByUserId(userId: string): Promise<WorkspaceRecord[]> {
    const { data, error } = await this.db
      .from(TABLE)
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as WorkspaceRecord[];
  }

  async create(userId: string, input: CreateWorkspaceInput): Promise<WorkspaceRecord> {
    const { data, error } = await this.db
      .from(TABLE)
      .insert({
        user_id: userId,
        name: input.name,
        description: input.description || null,
        settings: input.settings || {},
      })
      .select()
      .single();

    if (error) throw error;
    return data as WorkspaceRecord;
  }

  async update(id: string, input: UpdateWorkspaceInput): Promise<WorkspaceRecord> {
    const { data, error } = await this.db
      .from(TABLE)
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as WorkspaceRecord;
  }

  async softDelete(id: string): Promise<void> {
    const { error } = await this.db
      .from(TABLE)
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  }
}
