import type { SupabaseClient } from '@supabase/supabase-js';
import { KolRepository } from '../repositories';
import { kolEventBus } from '../events';
import { mapKolMaster } from '../utils/mappers';
import { validateRequired, createSlug } from '../utils/validation';
import type {
  KolMaster,
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

export class KolService {
  private repo: KolRepository;

  constructor(private db: SupabaseClient) {
    this.repo = new KolRepository(db);
  }

  // ── KOL Master ──────────────────────────────────────────

  async getKol(id: string): Promise<KolMaster | null> {
    const record = await this.repo.findById(id);
    return record ? mapKolMaster(record) : null;
  }

  async getWorkspaceKols(workspaceId: string): Promise<KolMaster[]> {
    const records = await this.repo.findByWorkspace(workspaceId);
    return records.map(mapKolMaster);
  }

  async createKol(userId: string, input: CreateKolInput): Promise<KolMaster> {
    const validation = validateRequired(input as Record<string, unknown>, ['workspace_id', 'name']);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Auto-generate slug if not provided
    const slug = input.slug || createSlug(input.name);
    const record = await this.repo.create(userId, { ...input, slug });
    const kol = mapKolMaster(record);

    await kolEventBus.emit({
      type: 'kol.created',
      payload: kol,
      metadata: {
        userId,
        workspaceId: kol.workspaceId,
        kolId: kol.id,
        timestamp: new Date().toISOString(),
      },
    });

    return kol;
  }

  async updateKol(id: string, userId: string, input: UpdateKolInput): Promise<KolMaster> {
    const record = await this.repo.update(id, input);
    const kol = mapKolMaster(record);

    await kolEventBus.emit({
      type: 'kol.updated',
      payload: kol,
      metadata: {
        userId,
        workspaceId: kol.workspaceId,
        kolId: kol.id,
        timestamp: new Date().toISOString(),
      },
    });

    return kol;
  }

  async deleteKol(id: string, userId: string): Promise<void> {
    const kol = await this.repo.findById(id);
    await this.repo.softDelete(id);

    await kolEventBus.emit({
      type: 'kol.deleted',
      payload: { id },
      metadata: {
        userId,
        workspaceId: kol?.workspace_id,
        kolId: id,
        timestamp: new Date().toISOString(),
      },
    });
  }

  // ── Identity DNA ────────────────────────────────────────

  async getIdentityDna(kolId: string): Promise<IdentityDnaRecord | null> {
    return this.repo.getIdentityDna(kolId);
  }

  async upsertIdentityDna(kolId: string, userId: string, input: CreateIdentityDnaInput): Promise<IdentityDnaRecord> {
    const result = await this.repo.upsertIdentityDna({ ...input, kol_id: kolId });

    await kolEventBus.emit({
      type: 'kol.identity_dna.updated',
      payload: result,
      metadata: { userId, kolId, timestamp: new Date().toISOString() },
    });

    return result;
  }

  // ── Visual Anchor ───────────────────────────────────────

  async getActiveVisualAnchor(kolId: string): Promise<VisualAnchorRecord | null> {
    return this.repo.getActiveVisualAnchor(kolId);
  }

  async createVisualAnchor(kolId: string, userId: string, input: CreateVisualAnchorInput): Promise<VisualAnchorRecord> {
    const result = await this.repo.createVisualAnchor({ ...input, kol_id: kolId });

    await kolEventBus.emit({
      type: 'kol.visual_anchor.created',
      payload: result,
      metadata: { userId, kolId, timestamp: new Date().toISOString() },
    });

    return result;
  }

  // ── Voice DNA ───────────────────────────────────────────

  async getVoiceDna(kolId: string): Promise<VoiceDnaRecord | null> {
    return this.repo.getVoiceDna(kolId);
  }

  async upsertVoiceDna(kolId: string, userId: string, input: CreateVoiceDnaInput): Promise<VoiceDnaRecord> {
    const result = await this.repo.upsertVoiceDna({ ...input, kol_id: kolId });

    await kolEventBus.emit({
      type: 'kol.voice_dna.updated',
      payload: result,
      metadata: { userId, kolId, timestamp: new Date().toISOString() },
    });

    return result;
  }

  // ── Outfits ─────────────────────────────────────────────

  async getOutfits(kolId: string): Promise<OutfitRecord[]> {
    return this.repo.getOutfits(kolId);
  }

  async createOutfit(kolId: string, userId: string, input: CreateOutfitInput): Promise<OutfitRecord> {
    const result = await this.repo.createOutfit({ ...input, kol_id: kolId });

    await kolEventBus.emit({
      type: 'kol.outfit.created',
      payload: result,
      metadata: { userId, kolId, timestamp: new Date().toISOString() },
    });

    return result;
  }

  async deleteOutfit(id: string, userId: string, kolId: string): Promise<void> {
    await this.repo.deleteOutfit(id);

    await kolEventBus.emit({
      type: 'kol.outfit.deleted',
      payload: { id },
      metadata: { userId, kolId, timestamp: new Date().toISOString() },
    });
  }

  // ── Motion Styles ───────────────────────────────────────

  async getMotionStyles(kolId: string): Promise<MotionStyleRecord[]> {
    return this.repo.getMotionStyles(kolId);
  }

  async createMotionStyle(kolId: string, userId: string, input: CreateMotionStyleInput): Promise<MotionStyleRecord> {
    const result = await this.repo.createMotionStyle({ ...input, kol_id: kolId });
    return result;
  }
}
