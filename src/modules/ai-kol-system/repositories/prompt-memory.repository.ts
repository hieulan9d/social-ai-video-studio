import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  PromptMemoryRecord,
  CreatePromptMemoryInput,
  PromptMemoryType,
} from '../types';

export class PromptMemoryRepository {
  constructor(private db: SupabaseClient) {}

  async findByKol(kolId: string): Promise<PromptMemoryRecord[]> {
    const { data, error } = await this.db
      .from('kol_prompt_memories')
      .select('*')
      .eq('kol_id', kolId)
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('priority', { ascending: false });

    if (error) throw error;
    return (data || []) as PromptMemoryRecord[];
  }

  async findByType(kolId: string, memoryType: PromptMemoryType): Promise<PromptMemoryRecord[]> {
    const { data, error } = await this.db
      .from('kol_prompt_memories')
      .select('*')
      .eq('kol_id', kolId)
      .eq('memory_type', memoryType)
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('priority', { ascending: false });

    if (error) throw error;
    return (data || []) as PromptMemoryRecord[];
  }

  async findInjectable(kolId: string): Promise<PromptMemoryRecord[]> {
    const { data, error } = await this.db
      .from('kol_prompt_memories')
      .select('*')
      .eq('kol_id', kolId)
      .eq('is_injectable', true)
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('priority', { ascending: false });

    if (error) throw error;
    return (data || []) as PromptMemoryRecord[];
  }

  async create(input: CreatePromptMemoryInput): Promise<PromptMemoryRecord> {
    const { data, error } = await this.db
      .from('kol_prompt_memories')
      .insert({
        ...input,
        prompt_data: input.prompt_data || {},
        is_injectable: input.is_injectable ?? true,
        priority: input.priority ?? 0,
      })
      .select()
      .single();

    if (error) throw error;
    return data as PromptMemoryRecord;
  }

  async update(id: string, input: Partial<CreatePromptMemoryInput>): Promise<PromptMemoryRecord> {
    const { data, error } = await this.db
      .from('kol_prompt_memories')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as PromptMemoryRecord;
  }

  async softDelete(id: string): Promise<void> {
    const { error } = await this.db
      .from('kol_prompt_memories')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  }
}
