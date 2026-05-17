import "server-only";

import type { SupabaseClient } from '@supabase/supabase-js';
import { AvatarRepository } from '../repositories';
import { KolRepository } from '../repositories';
import { AvatarStorageService } from './avatar-storage.service';
import { kolEventBus } from '../events';
import type {
  IdentityLockRecord,
  FinalizeAvatarInput,
  JsonData,
} from '../types';

/**
 * Identity Lock Service
 *
 * Finalizes a KOL's avatar — locking it as the official identity reference
 * for all future generations.
 *
 * Once locked, the avatar cannot be regenerated without explicit unlock.
 */
export class IdentityLockService {
  private avatarRepo: AvatarRepository;
  private kolRepo: KolRepository;
  private storage: AvatarStorageService;

  constructor(private db: SupabaseClient) {
    this.avatarRepo = new AvatarRepository(db);
    this.kolRepo = new KolRepository(db);
    this.storage = new AvatarStorageService();
  }

  async getLock(kolId: string): Promise<IdentityLockRecord | null> {
    return this.avatarRepo.findIdentityLock(kolId);
  }

  /**
   * Finalize avatar — creates the identity lock and updates the KOL.
   */
  async finalizeAvatar(input: FinalizeAvatarInput & { userId: string; kolId: string }): Promise<IdentityLockRecord> {
    const session = await this.avatarRepo.findSession(input.session_id);
    if (!session) throw new Error('Avatar session not found');

    const generation = await this.avatarRepo.findGeneration(input.generation_id);
    if (!generation) throw new Error('Generation not found');
    if (generation.status !== 'completed') {
      throw new Error('Cannot finalize incomplete generation');
    }

    const candidateUrl = generation.output_urls[input.candidate_index];
    const candidatePath = generation.output_storage_paths[input.candidate_index];

    if (!candidateUrl || !candidatePath) {
      throw new Error('Selected candidate not found in generation outputs');
    }

    // Copy candidate to "official" path so locked avatar has its own location
    const officialPath = this.storage.buildPath({
      userId: input.userId,
      kolId: input.kolId,
      sessionId: input.session_id,
      kind: 'official',
      fileName: 'avatar.png',
    });

    let officialUrl = candidateUrl;
    let officialStoragePath = candidatePath;

    try {
      const stored = await this.storage.fetchAndStore({
        sourceUrl: candidateUrl,
        path: officialPath,
      });
      officialUrl = stored.publicUrl;
      officialStoragePath = stored.path;
    } catch {
      // If copy fails, keep the candidate path (still valid)
    }

    // Build full history snapshots
    const allGenerations = await this.avatarRepo.listGenerations(input.session_id);
    const allReferences = await this.avatarRepo.listReferenceImages(input.session_id);

    const promptHistory: Record<string, unknown>[] = allGenerations.map((g) => ({
      version: g.version,
      prompt: g.prompt,
      enhanced_prompt: g.enhanced_prompt,
      created_at: g.created_at,
    }));

    const generationHistory: Record<string, unknown>[] = allGenerations.map((g) => ({
      id: g.id,
      version: g.version,
      parent_id: g.parent_generation_id,
      prompt: g.prompt,
      output_urls: g.output_urls,
      selected: g.selected,
      created_at: g.created_at,
    }));

    const referenceImages: Record<string, unknown>[] = allReferences.map((r) => ({
      id: r.id,
      role: r.role,
      url: r.file_url,
      file_name: r.file_name,
    }));

    // Build default visual anchor & consistency rules
    const visualAnchor: JsonData = {
      official_avatar_url: officialUrl,
      face_lock: true,
      identity_locked: true,
      ...(input.visual_anchor || {}),
    };

    const consistencyRules: JsonData = {
      preserve_face: true,
      preserve_age: true,
      preserve_ethnicity: true,
      preserve_facial_structure: true,
      ...(input.consistency_rules || {}),
    };

    const faceLock: JsonData = {
      source_avatar_url: officialUrl,
      enforce_in_image_generation: true,
      enforce_in_video_generation: true,
      enforce_in_outfit_transfer: true,
      enforce_in_scene_generation: true,
    };

    // Persist identity lock
    const lock = await this.avatarRepo.upsertIdentityLock({
      kol_id: input.kolId,
      user_id: input.userId,
      session_id: input.session_id,
      source_generation_id: input.generation_id,
      official_avatar_url: officialUrl,
      official_avatar_storage_path: officialStoragePath,
      official_avatar_bucket: 'kol-avatars',
      visual_anchor: visualAnchor,
      consistency_rules: consistencyRules,
      face_lock: faceLock,
      reference_images: referenceImages,
      prompt_history: promptHistory,
      generation_history: generationHistory,
      is_locked: true,
      version: 1,
      locked_at: new Date().toISOString(),
    });

    // Mark this generation as the selected one
    await this.avatarRepo.markSelected(input.generation_id, input.candidate_index);

    // Finalize the session
    await this.avatarRepo.finalizeSession(input.session_id, input.generation_id);

    // Update KOL avatar_url and status
    try {
      await this.kolRepo.update(input.kolId, {
        avatar_url: officialUrl,
        status: 'active',
      });
    } catch {
      // Non-fatal
    }

    // Emit event
    await kolEventBus.emit({
      type: 'kol.activated',
      payload: lock,
      metadata: {
        userId: input.userId,
        kolId: input.kolId,
        timestamp: new Date().toISOString(),
      },
    });

    return lock;
  }

  /**
   * Unlock avatar (allow new generation session).
   */
  async unlock(kolId: string, userId: string): Promise<IdentityLockRecord | null> {
    const existing = await this.avatarRepo.findIdentityLock(kolId);
    if (!existing) return null;

    return this.avatarRepo.upsertIdentityLock({
      ...existing,
      user_id: userId,
      is_locked: false,
      unlocked_at: new Date().toISOString(),
    });
  }

  /**
   * Build the consistency injection context for downstream generation.
   * This is what the ConsistencyEngine should call to get face lock data.
   */
  async buildConsistencyInjection(kolId: string): Promise<JsonData | null> {
    const lock = await this.avatarRepo.findIdentityLock(kolId);
    if (!lock || !lock.is_locked) return null;

    return {
      official_avatar_url: lock.official_avatar_url,
      visual_anchor: lock.visual_anchor,
      face_lock: lock.face_lock,
      consistency_rules: lock.consistency_rules,
    };
  }
}
