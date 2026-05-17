import "server-only";

import type { SupabaseClient } from '@supabase/supabase-js';
import { AvatarRepository } from '../repositories';
import { AvatarStorageService } from './avatar-storage.service';
import { kolEventBus } from '../events';
import { getDefaultAvatarProvider } from '../providers';
import type { AvatarProvider } from '../providers';
import type {
  AvatarGenerationRecord,
  AvatarReferenceImageRecord,
  AvatarReferenceRole,
  JsonData,
} from '../types';

/**
 * Avatar Generation Service
 *
 * Orchestrates the full avatar generation workflow:
 * 1. Manage avatar sessions
 * 2. Upload reference images
 * 3. Call provider (NanoBanana) for generation
 * 4. Persist outputs to storage
 * 5. Track generation history (parent → child chain)
 */
export class AvatarGenerationService {
  private repo: AvatarRepository;
  private storage: AvatarStorageService;
  private provider: AvatarProvider;

  constructor(private db: SupabaseClient, provider?: AvatarProvider) {
    this.repo = new AvatarRepository(db);
    this.storage = new AvatarStorageService();
    this.provider = provider ?? getDefaultAvatarProvider();
  }

  // ── Session lifecycle ───────────────────────────────────

  async getOrCreateActiveSession(kolId: string, userId: string) {
    const existing = await this.repo.findActiveSessionByKol(kolId);
    if (existing) return existing;
    return this.repo.createSession(kolId, userId);
  }

  async getSession(sessionId: string) {
    return this.repo.findSession(sessionId);
  }

  async listGenerations(sessionId: string) {
    return this.repo.listGenerations(sessionId);
  }

  async listReferenceImages(sessionId: string) {
    return this.repo.listReferenceImages(sessionId);
  }

  // ── Reference image upload ──────────────────────────────

  async uploadReferenceImage(input: {
    sessionId: string;
    userId: string;
    kolId: string;
    file: File;
    role: AvatarReferenceRole;
    displayOrder?: number;
  }): Promise<AvatarReferenceImageRecord> {
    const path = this.storage.buildPath({
      userId: input.userId,
      kolId: input.kolId,
      sessionId: input.sessionId,
      kind: 'reference',
      fileName: input.file.name,
    });

    const stored = await this.storage.uploadFile({
      path,
      file: input.file,
    });

    return this.repo.createReferenceImage({
      session_id: input.sessionId,
      role: input.role,
      storage_bucket: this.storage.bucket,
      storage_path: stored.path,
      file_url: stored.publicUrl,
      file_name: input.file.name,
      mime_type: stored.mimeType,
      file_size: stored.size,
      display_order: input.displayOrder ?? 0,
    });
  }

  async deleteReferenceImage(id: string, storagePath?: string) {
    if (storagePath) {
      try {
        await this.storage.delete(storagePath);
      } catch {
        // best effort
      }
    }
    return this.repo.deleteReferenceImage(id);
  }

  // ── Generation ──────────────────────────────────────────

  /**
   * Run a generation round.
   * Resolves parent image (if any), gathers reference images,
   * calls provider, stores outputs, persists generation record.
   */
  async generate(input: {
    sessionId: string;
    userId: string;
    kolId: string;
    prompt: string;
    parentGenerationId?: string | null;
    candidateCount?: number;
    referenceImageIds?: string[];
    settings?: JsonData;
  }): Promise<AvatarGenerationRecord> {
    const candidateCount = Math.max(1, Math.min(4, input.candidateCount ?? 1));
    const version = await this.repo.getNextVersion(input.sessionId);

    // 1) Persist queued generation record
    const queued = await this.repo.createGeneration({
      session_id: input.sessionId,
      parent_generation_id: input.parentGenerationId || null,
      version,
      prompt: input.prompt,
      candidate_count: candidateCount,
      provider: this.provider.name,
      settings: input.settings,
    });

    // 2) Resolve parent image URL
    let parentImageUrl: string | undefined;
    if (input.parentGenerationId) {
      const parent = await this.repo.findGeneration(input.parentGenerationId);
      if (parent && parent.output_urls.length > 0) {
        const idx = parent.selected_candidate_index ?? 0;
        parentImageUrl = parent.output_urls[idx] || parent.output_urls[0];
      }
    }

    // 3) Resolve reference images
    const allRefs = await this.repo.listReferenceImages(input.sessionId);
    const filteredRefs = input.referenceImageIds
      ? allRefs.filter((r) => input.referenceImageIds!.includes(r.id))
      : allRefs;

    const providerRefs = filteredRefs
      .filter((r) => r.file_url)
      .map((r) => ({ url: r.file_url as string, role: r.role }));

    // 4) Mark generation as processing
    await this.repo.updateGeneration(queued.id, {
      status: 'processing',
      started_at: new Date().toISOString(),
    });

    try {
      // 5) Call provider
      const result = await this.provider.generate({
        prompt: input.prompt,
        candidateCount,
        referenceImages: providerRefs,
        parentImageUrl,
        settings: input.settings,
      });

      // 6) Store all output images to bucket
      const storedPaths: string[] = [];
      const storedUrls: string[] = [];

      for (let i = 0; i < result.outputUrls.length; i++) {
        const url = result.outputUrls[i];
        const path = this.storage.buildPath({
          userId: input.userId,
          kolId: input.kolId,
          sessionId: input.sessionId,
          kind: 'generation',
          fileName: `v${version}_c${i}.png`,
        });
        const stored = await this.storage.fetchAndStore({ sourceUrl: url, path });
        storedPaths.push(stored.path);
        storedUrls.push(stored.publicUrl);
      }

      // 7) Persist completed generation
      const completed = await this.repo.updateGeneration(queued.id, {
        status: 'completed',
        model: result.model,
        output_urls: storedUrls,
        output_storage_paths: storedPaths,
        raw_response: result.rawResponse,
        generation_time_ms: result.generationTimeMs,
        completed_at: new Date().toISOString(),
      });

      // 8) Update session current_version
      await this.repo.updateSession(input.sessionId, {
        current_version: version,
      });

      // 9) Emit event
      await kolEventBus.emit({
        type: 'kol.visual_anchor.created',
        payload: completed,
        metadata: {
          userId: input.userId,
          kolId: input.kolId,
          timestamp: new Date().toISOString(),
        },
      });

      return completed;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await this.repo.updateGeneration(queued.id, {
        status: 'failed',
        error_message: errorMessage,
        completed_at: new Date().toISOString(),
      });
      throw error;
    }
  }

  /**
   * Mark a specific candidate from a generation as the selected one.
   * Used when the user picks one of the 1–4 outputs to continue from.
   */
  async selectCandidate(generationId: string, candidateIndex: number) {
    return this.repo.markSelected(generationId, candidateIndex);
  }
}
