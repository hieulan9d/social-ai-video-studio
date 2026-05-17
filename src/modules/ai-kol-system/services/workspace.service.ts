import type { SupabaseClient } from '@supabase/supabase-js';
import { WorkspaceRepository } from '../repositories';
import { kolEventBus } from '../events';
import { mapWorkspace } from '../utils/mappers';
import { validateRequired } from '../utils/validation';
import type { Workspace, CreateWorkspaceInput, UpdateWorkspaceInput } from '../types';

export class WorkspaceService {
  private repo: WorkspaceRepository;

  constructor(private db: SupabaseClient) {
    this.repo = new WorkspaceRepository(db);
  }

  async getWorkspace(id: string): Promise<Workspace | null> {
    const record = await this.repo.findById(id);
    return record ? mapWorkspace(record) : null;
  }

  async getUserWorkspaces(userId: string): Promise<Workspace[]> {
    const records = await this.repo.findByUserId(userId);
    return records.map(mapWorkspace);
  }

  async createWorkspace(userId: string, input: CreateWorkspaceInput): Promise<Workspace> {
    const validation = validateRequired(input as Record<string, unknown>, ['name']);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    const record = await this.repo.create(userId, input);
    const workspace = mapWorkspace(record);

    await kolEventBus.emit({
      type: 'workspace.created',
      payload: workspace,
      metadata: {
        userId,
        workspaceId: workspace.id,
        timestamp: new Date().toISOString(),
      },
    });

    return workspace;
  }

  async updateWorkspace(id: string, userId: string, input: UpdateWorkspaceInput): Promise<Workspace> {
    const record = await this.repo.update(id, input);
    const workspace = mapWorkspace(record);

    await kolEventBus.emit({
      type: 'workspace.updated',
      payload: workspace,
      metadata: {
        userId,
        workspaceId: workspace.id,
        timestamp: new Date().toISOString(),
      },
    });

    return workspace;
  }

  async deleteWorkspace(id: string, userId: string): Promise<void> {
    await this.repo.softDelete(id);

    await kolEventBus.emit({
      type: 'workspace.deleted',
      payload: { id },
      metadata: {
        userId,
        workspaceId: id,
        timestamp: new Date().toISOString(),
      },
    });
  }
}
