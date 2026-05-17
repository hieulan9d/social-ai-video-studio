import type { SupabaseClient } from '@supabase/supabase-js';
import { KolRepository } from '../repositories';
import { PromptMemoryRepository } from '../repositories';
import { ReferenceSheetRepository } from '../repositories';
import type {
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
  PromptMemoryRecord,
  ReferenceSheetRecord,
  JsonData,
} from '../types';

/**
 * KOL DNA Service — Phase 2
 *
 * Manages the complete DNA profile of an AI KOL:
 * - Identity DNA (appearance, personality)
 * - Visual Anchor (face consistency data)
 * - Voice DNA (voice characteristics)
 * - Outfit Library
 * - Motion Styles
 *
 * This service provides a unified API for managing
 * all aspects of a KOL's persistent identity.
 */
export class KolDnaService {
  private kolRepo: KolRepository;
  private memoryRepo: PromptMemoryRepository;
  private sheetRepo: ReferenceSheetRepository;

  constructor(private db: SupabaseClient) {
    this.kolRepo = new KolRepository(db);
    this.memoryRepo = new PromptMemoryRepository(db);
    this.sheetRepo = new ReferenceSheetRepository(db);
  }

  // ══════════════════════════════════════════════════════════
  // FULL DNA PROFILE
  // ══════════════════════════════════════════════════════════

  /**
   * Get the complete DNA profile for a KOL.
   * Used by generation engines to build consistency context.
   */
  async getFullDnaProfile(kolId: string): Promise<KolDnaProfile> {
    const [identityDna, visualAnchor, voiceDna, outfits, motionStyles, memories, sheets] =
      await Promise.all([
        this.kolRepo.getIdentityDna(kolId),
        this.kolRepo.getActiveVisualAnchor(kolId),
        this.kolRepo.getVoiceDna(kolId),
        this.kolRepo.getOutfits(kolId),
        this.kolRepo.getMotionStyles(kolId),
        this.memoryRepo.findInjectable(kolId),
        this.sheetRepo.findByKol(kolId),
      ]);

    return {
      kolId,
      identityDna,
      visualAnchor,
      voiceDna,
      outfits,
      motionStyles,
      promptMemories: memories,
      referenceSheets: sheets,
    };
  }

  // ══════════════════════════════════════════════════════════
  // IDENTITY DNA
  // ══════════════════════════════════════════════════════════

  async getIdentityDna(kolId: string): Promise<IdentityDnaRecord | null> {
    return this.kolRepo.getIdentityDna(kolId);
  }

  async upsertIdentityDna(kolId: string, input: Omit<CreateIdentityDnaInput, 'kol_id'>): Promise<IdentityDnaRecord> {
    return this.kolRepo.upsertIdentityDna({ ...input, kol_id: kolId });
  }

  // ══════════════════════════════════════════════════════════
  // VISUAL ANCHOR
  // ══════════════════════════════════════════════════════════

  async getActiveVisualAnchor(kolId: string): Promise<VisualAnchorRecord | null> {
    return this.kolRepo.getActiveVisualAnchor(kolId);
  }

  async createVisualAnchor(kolId: string, input: Omit<CreateVisualAnchorInput, 'kol_id'>): Promise<VisualAnchorRecord> {
    return this.kolRepo.createVisualAnchor({ ...input, kol_id: kolId });
  }

  /**
   * Build visual anchor as structured injection data.
   * Used by consistency engine to inject into prompts.
   */
  async buildVisualAnchorInjection(kolId: string): Promise<JsonData | null> {
    const anchor = await this.kolRepo.getActiveVisualAnchor(kolId);
    if (!anchor) return null;

    return {
      face_shape: anchor.face_shape,
      eye_shape: anchor.eye_shape,
      eye_color: anchor.eye_color,
      nose_shape: anchor.nose_shape,
      lip_shape: anchor.lip_shape,
      jawline: anchor.jawline,
      skin_texture: anchor.skin_texture,
      hair_color: anchor.hair_color,
      hair_length: anchor.hair_length,
      hair_texture: anchor.hair_texture,
      distinguishing_features: anchor.distinguishing_features,
      ...anchor.full_anchor_data,
    };
  }

  // ══════════════════════════════════════════════════════════
  // VOICE DNA
  // ══════════════════════════════════════════════════════════

  async getVoiceDna(kolId: string): Promise<VoiceDnaRecord | null> {
    return this.kolRepo.getVoiceDna(kolId);
  }

  async upsertVoiceDna(kolId: string, input: Omit<CreateVoiceDnaInput, 'kol_id'>): Promise<VoiceDnaRecord> {
    return this.kolRepo.upsertVoiceDna({ ...input, kol_id: kolId });
  }

  /**
   * Build voice lock injection data.
   */
  async buildVoiceLockInjection(kolId: string): Promise<JsonData | null> {
    const voice = await this.kolRepo.getVoiceDna(kolId);
    if (!voice) return null;

    return {
      voice_preset: voice.voice_preset,
      accent: voice.accent,
      pacing: voice.pacing,
      emotion_style: voice.emotion_style,
      tone_profiles: voice.tone_profiles,
      pitch: voice.pitch,
      warmth: voice.warmth,
      energy: voice.energy,
      ...voice.custom_attributes,
    };
  }

  // ══════════════════════════════════════════════════════════
  // OUTFIT LIBRARY
  // ══════════════════════════════════════════════════════════

  async getOutfits(kolId: string): Promise<OutfitRecord[]> {
    return this.kolRepo.getOutfits(kolId);
  }

  async getOutfitsByCategory(kolId: string, category: string): Promise<OutfitRecord[]> {
    const outfits = await this.kolRepo.getOutfits(kolId);
    return outfits.filter((o) => o.category === category);
  }

  async getCompatibleOutfits(kolId: string, environment: string): Promise<OutfitRecord[]> {
    const outfits = await this.kolRepo.getOutfits(kolId);
    return outfits.filter((o) =>
      (o.compatible_environments as string[]).includes(environment)
    );
  }

  async createOutfit(kolId: string, input: Omit<CreateOutfitInput, 'kol_id'>): Promise<OutfitRecord> {
    return this.kolRepo.createOutfit({ ...input, kol_id: kolId });
  }

  async deleteOutfit(id: string): Promise<void> {
    return this.kolRepo.deleteOutfit(id);
  }

  // ══════════════════════════════════════════════════════════
  // MOTION STYLES
  // ══════════════════════════════════════════════════════════

  async getMotionStyles(kolId: string): Promise<MotionStyleRecord[]> {
    return this.kolRepo.getMotionStyles(kolId);
  }

  async getDefaultMotionStyle(kolId: string): Promise<MotionStyleRecord | null> {
    const styles = await this.kolRepo.getMotionStyles(kolId);
    return styles.find((s) => s.is_default) || styles[0] || null;
  }

  async createMotionStyle(kolId: string, input: Omit<CreateMotionStyleInput, 'kol_id'>): Promise<MotionStyleRecord> {
    return this.kolRepo.createMotionStyle({ ...input, kol_id: kolId });
  }
}

// ══════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════

export type KolDnaProfile = {
  kolId: string;
  identityDna: IdentityDnaRecord | null;
  visualAnchor: VisualAnchorRecord | null;
  voiceDna: VoiceDnaRecord | null;
  outfits: OutfitRecord[];
  motionStyles: MotionStyleRecord[];
  promptMemories: PromptMemoryRecord[];
  referenceSheets: ReferenceSheetRecord[];
};
