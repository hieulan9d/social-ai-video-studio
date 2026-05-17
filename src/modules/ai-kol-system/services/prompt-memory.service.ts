import type { SupabaseClient } from '@supabase/supabase-js';
import { PromptMemoryRepository } from '../repositories';
import { kolEventBus } from '../events';
import type {
  PromptMemoryRecord,
  CreatePromptMemoryInput,
  PromptMemoryType,
  PromptInjectionContext,
  ResolvedPromptMemory,
} from '../types';

export class PromptMemoryService {
  private repo: PromptMemoryRepository;

  constructor(private db: SupabaseClient) {
    this.repo = new PromptMemoryRepository(db);
  }

  async getMemories(kolId: string): Promise<PromptMemoryRecord[]> {
    return this.repo.findByKol(kolId);
  }

  async getByType(kolId: string, type: PromptMemoryType): Promise<PromptMemoryRecord[]> {
    return this.repo.findByType(kolId, type);
  }

  async createMemory(userId: string, input: CreatePromptMemoryInput): Promise<PromptMemoryRecord> {
    const result = await this.repo.create(input);

    await kolEventBus.emit({
      type: 'kol.prompt_memory.created',
      payload: result,
      metadata: {
        userId,
        kolId: input.kol_id,
        timestamp: new Date().toISOString(),
      },
    });

    return result;
  }

  async updateMemory(id: string, userId: string, kolId: string, input: Partial<CreatePromptMemoryInput>): Promise<PromptMemoryRecord> {
    const result = await this.repo.update(id, input);

    await kolEventBus.emit({
      type: 'kol.prompt_memory.updated',
      payload: result,
      metadata: { userId, kolId, timestamp: new Date().toISOString() },
    });

    return result;
  }

  async deleteMemory(id: string, userId: string, kolId: string): Promise<void> {
    await this.repo.softDelete(id);

    await kolEventBus.emit({
      type: 'kol.prompt_memory.deleted',
      payload: { id },
      metadata: { userId, kolId, timestamp: new Date().toISOString() },
    });
  }

  /**
   * Build the full injection context for a KOL.
   * This is the core method used by generation engines
   * to assemble consistency locks before prompt generation.
   */
  async buildInjectionContext(kolId: string): Promise<PromptInjectionContext> {
    const memories = await this.repo.findInjectable(kolId);

    const context: PromptInjectionContext = {
      visualAnchor: null,
      productLock: null,
      voiceLock: null,
      negativePompt: null,
      consistencyLock: null,
      stylePresets: [],
      cameraPresets: [],
      customMemories: [],
    };

    for (const memory of memories) {
      switch (memory.memory_type) {
        case 'visual_anchor':
          context.visualAnchor = memory.prompt_data;
          break;
        case 'product_lock':
          context.productLock = memory.prompt_data;
          break;
        case 'voice_lock':
          context.voiceLock = memory.prompt_data;
          break;
        case 'negative_prompt':
          context.negativePompt = memory.prompt_data;
          break;
        case 'consistency_lock':
          context.consistencyLock = memory.prompt_data;
          break;
        case 'style_preset':
          context.stylePresets.push(memory.prompt_data);
          break;
        case 'camera_preset':
          context.cameraPresets.push(memory.prompt_data);
          break;
        case 'custom':
          context.customMemories.push(memory.prompt_data);
          break;
      }
    }

    return context;
  }

  /**
   * Resolve memories into a flat list for orchestration.
   */
  async resolveMemories(kolId: string): Promise<ResolvedPromptMemory[]> {
    const memories = await this.repo.findInjectable(kolId);

    return memories.map((m) => ({
      id: m.id,
      kolId: m.kol_id,
      memoryType: m.memory_type,
      name: m.name,
      promptData: m.prompt_data,
      priority: m.priority,
    }));
  }
}
