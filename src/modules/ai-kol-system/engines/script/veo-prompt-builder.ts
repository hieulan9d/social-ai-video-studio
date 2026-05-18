/**
 * Veo Prompt Builder — V3.2 Knowledge System
 *
 * Builds self-contained scene prompts with:
 * - KOL_VISUAL_ANCHOR injection
 * - CONSISTENCY LOCK block
 * - NEGATIVE PROMPT MASTER
 * - OUTFIT LOCK
 * - BACKGROUND LOCK
 * - PRODUCT LOCK
 * - VOICE LOCK
 */

import type { JsonData } from '../../types';

// ══════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════

export type VeoSceneV3 = {
  scene: number;
  duration: string;
  visual_prompt: string;
  kol_visual_anchor: string;
  kol_image_upload_note: string;
  kol_lock: string;
  outfit_lock: string;
  background_lock: string;
  product_reference: string;
  product_visibility: string;
  voice_lock: string;
  voice_over_vi: string;
  voice_timing: string;
  shot_type: string;
  camera: string;
  camera_movement: string;
  facial_expression: string;
  transition: string;
  broll_insert: string;
  platform_type: string;
  negative_prompt: string;
};

export type KolVisualAnchor = {
  gender: string;
  age_appearance: string;
  ethnicity: string;
  skin_tone: string;
  skin_undertone: string;
  face_shape: string;
  forehead: string;
  cheekbones: string;
  jawline: string;
  chin: string;
  eye_shape: string;
  eye_size: string;
  eye_spacing: string;
  eyebrow_shape: string;
  eyebrow_thickness: string;
  nose_bridge: string;
  nose_width: string;
  lip_shape: string;
  upper_lip: string;
  hairstyle: string;
  hair_color: string;
  hair_length: string;
  hair_texture: string;
  hair_parting: string;
  body_type: string;
  height_estimate: string;
  overall_impression: string;
};

export type OutfitPlan = {
  outfit_id: string;
  location: string;
  top: string;
  bottom: string;
  accessories: string;
  color_palette: string;
  style: string;
};

export type BackgroundPlan = {
  bg_id: string;
  location_type: string;
  specific_location: string;
  time_of_day: string;
  lighting: string;
  color_tone: string;
  key_props: string;
};

export type ProductReference = {
  product_name: string;
  packaging_type: string;
  shape: string;
  primary_color: string;
  secondary_color: string;
  label_description: string;
  logo_description: string;
  logo_position: string;
  material_appearance: string;
};

export type SceneBuildInput = {
  sceneNumber: number;
  duration: number;
  action: string;
  voiceOverVi: string;
  shotType: string;
  camera: string;
  cameraMovement: string;
  facialExpression: string;
  transition: string;
  productVisibility: string;
  brollInsert: string;
  platform: string;
  kolAnchor: KolVisualAnchor;
  outfit: OutfitPlan;
  background: BackgroundPlan;
  product: ProductReference | null;
};

// ══════════════════════════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════════════════════════

export const NEGATIVE_PROMPT_MASTER = `face drift, face change, different person, age change, hairstyle change, hair color change, skin tone change, body morphing, different body type, outfit change, clothing color change, accessory change, wardrobe inconsistency, background change, random props, lighting inconsistency, color temperature shift, product distortion, packaging warp, logo distortion, logo blur, wrong product color, label change, voice change, accent change, language switch, bad hands, extra fingers, missing fingers, deformed hands, floating hands, animation style, cartoon style, CGI human, unrealistic skin, plastic skin, over-smoothed face, beauty filter, robotic expression, blank face, exaggerated acting, unnatural movement, unrealistic physics, floating objects, warped proportions, subtitles, text overlay, watermark`;

// ══════════════════════════════════════════════════════════
// BUILDER
// ══════════════════════════════════════════════════════════

export class VeoPromptBuilder {
  /**
   * Build the KOL Visual Anchor string for injection.
   */
  buildAnchorString(anchor: KolVisualAnchor): string {
    return `Vietnamese ${anchor.gender}, ${anchor.age_appearance} years old appearance, ${anchor.skin_tone} ${anchor.skin_undertone}-undertone skin, ${anchor.face_shape} face, ${anchor.forehead} forehead, ${anchor.cheekbones} cheekbones, ${anchor.jawline} jawline, ${anchor.chin} chin, ${anchor.eye_shape} ${anchor.eye_size} eyes ${anchor.eye_spacing}-set, ${anchor.eyebrow_shape} ${anchor.eyebrow_thickness} eyebrows, ${anchor.nose_bridge} nose bridge ${anchor.nose_width} width, ${anchor.lip_shape} lips ${anchor.upper_lip} upper lip, ${anchor.hairstyle} ${anchor.hair_color} ${anchor.hair_length} ${anchor.hair_texture} hair ${anchor.hair_parting} parting — THIS DESCRIPTION OVERRIDES ALL REFERENCE IMAGE VARIATIONS — face must be 100% consistent across all scenes regardless of which reference image is used`;
  }

  /**
   * Build the Consistency Lock block.
   */
  buildConsistencyLock(input: {
    anchor: KolVisualAnchor;
    outfit: OutfitPlan;
    background: BackgroundPlan;
    product: ProductReference | null;
  }): string {
    const parts: string[] = [];

    // KOL anchor lock
    parts.push(`KOL VISUAL ANCHOR: Vietnamese ${input.anchor.gender}, ${input.anchor.age_appearance}yo, ${input.anchor.skin_tone} ${input.anchor.skin_undertone}-undertone skin, ${input.anchor.face_shape} face, ${input.anchor.eye_shape} ${input.anchor.eye_size} eyes, ${input.anchor.eyebrow_shape} eyebrows, ${input.anchor.nose_bridge} nose, ${input.anchor.lip_shape} lips, ${input.anchor.hairstyle} ${input.anchor.hair_color} ${input.anchor.hair_length} hair — no face drift, no hairstyle change, no age change, no skin tone change`);

    // Outfit lock
    parts.push(`OUTFIT LOCK: ${input.outfit.outfit_id} — ${input.outfit.top}, ${input.outfit.bottom}, ${input.outfit.accessories}, ${input.outfit.color_palette} — must remain exactly the same throughout all scenes in this location, no color change, no style drift`);

    // Background lock
    parts.push(`BACKGROUND LOCK: ${input.background.bg_id} — ${input.background.specific_location}, ${input.background.lighting}, ${input.background.color_tone}, ${input.background.key_props} — must remain consistent, no random prop changes, no lighting drift`);

    // Product lock
    if (input.product) {
      parts.push(`PRODUCT LOCK: ${input.product.packaging_type}, ${input.product.shape}, ${input.product.primary_color} with ${input.product.secondary_color} accents, ${input.product.label_description}, ${input.product.logo_description} at ${input.product.logo_position}, ${input.product.material_appearance} finish — product must match reference image exactly, no packaging distortion, no logo warp`);
    }

    // Voice + Style lock
    parts.push(`VOICE LOCK: same Vietnamese voice throughout entire video, no voice switching, no accent change`);
    parts.push(`STYLE LOCK: ultra realistic human, real skin texture, natural lighting, natural motion — no animation, no CGI, no cartoon`);

    return `[CONSISTENCY LOCK — ${parts.join(' / ')}]`;
  }

  /**
   * Build a complete V3.2 scene with all fields.
   */
  buildScene(input: SceneBuildInput): VeoSceneV3 {
    const anchorString = this.buildAnchorString(input.kolAnchor);
    const consistencyLock = this.buildConsistencyLock({
      anchor: input.kolAnchor,
      outfit: input.outfit,
      background: input.background,
      product: input.product,
    });

    // Build the full visual prompt
    const visualPromptParts: string[] = [
      `Ultra realistic Vietnamese ${input.kolAnchor.gender}, ${input.kolAnchor.age_appearance} years old, ${input.kolAnchor.skin_tone} ${input.kolAnchor.skin_undertone}-undertone skin, ${input.kolAnchor.face_shape} face, ${input.kolAnchor.hairstyle} ${input.kolAnchor.hair_color} ${input.kolAnchor.hair_length} hair`,
      `wearing ${input.outfit.top}, ${input.outfit.bottom}, ${input.outfit.accessories}`,
      `in ${input.background.specific_location}, ${input.background.lighting} lighting, ${input.background.color_tone} tone`,
      input.action,
      `${input.shotType}, ${input.cameraMovement}`,
      `facial expression: ${input.facialExpression}`,
    ];

    // Product in prompt if visible
    if (input.product && input.productVisibility !== 'not visible') {
      visualPromptParts.push(
        `holding ${input.product.product_name} — ${input.product.packaging_type}, ${input.product.primary_color}, ${input.product.label_description}`
      );
    }

    // Inject anchor + consistency lock at end
    visualPromptParts.push(`— [KOL VISUAL ANCHOR: ${anchorString}]`);
    visualPromptParts.push(`— ${consistencyLock}`);

    const visual_prompt = visualPromptParts.join(', ');

    return {
      scene: input.sceneNumber,
      duration: `${input.duration}s`,
      visual_prompt,
      kol_visual_anchor: anchorString,
      kol_image_upload_note: `Upload ảnh KOL scene ${input.sceneNumber} — ảnh phải rõ mặt, đủ sáng, cùng người với các scene khác — tránh filter, ngược sáng, góc nghiêng > 45 độ`,
      kol_lock: `${input.kolAnchor.gender}, ${input.kolAnchor.age_appearance} Vietnamese, ${input.kolAnchor.skin_tone} skin, ${input.kolAnchor.face_shape} face, ${input.kolAnchor.hairstyle} ${input.kolAnchor.hair_color} ${input.kolAnchor.hair_length} hair — no face drift, no age change, no hairstyle change`,
      outfit_lock: `${input.outfit.outfit_id} — ${input.outfit.top}, ${input.outfit.bottom}, ${input.outfit.accessories}, ${input.outfit.color_palette} — must not change in this location`,
      background_lock: `${input.background.bg_id} — ${input.background.specific_location}, ${input.background.lighting}, ${input.background.color_tone}, ${input.background.key_props} — must remain consistent`,
      product_reference: input.product
        ? `${input.product.packaging_type}, ${input.product.shape}, ${input.product.primary_color}, ${input.product.label_description}, ${input.product.logo_description} — match reference image exactly`
        : 'not visible in this scene',
      product_visibility: input.productVisibility,
      voice_lock: `fixed preset — same Vietnamese voice used in scene 1 of this video, no voice switching, no accent change, no language switch throughout entire video`,
      voice_over_vi: input.voiceOverVi,
      voice_timing: `voice-over must fill the full ${input.duration}s scene with continuous natural Vietnamese speech, no silent gap`,
      shot_type: input.shotType,
      camera: input.camera,
      camera_movement: input.cameraMovement,
      facial_expression: input.facialExpression,
      transition: input.transition,
      broll_insert: input.brollInsert,
      platform_type: input.platform,
      negative_prompt: NEGATIVE_PROMPT_MASTER,
    };
  }

  /**
   * Build default KOL anchor from identity DNA data.
   */
  buildAnchorFromDna(dna: JsonData): KolVisualAnchor {
    return {
      gender: String(dna.gender || 'female'),
      age_appearance: String(dna.age_appearance || '25-30'),
      ethnicity: String(dna.ethnicity || 'Vietnamese'),
      skin_tone: String(dna.skin_tone || 'medium'),
      skin_undertone: String(dna.skin_undertone || 'warm'),
      face_shape: String(dna.face_shape || 'oval'),
      forehead: String(dna.forehead || 'medium'),
      cheekbones: String(dna.cheekbones || 'medium'),
      jawline: String(dna.jawline || 'soft'),
      chin: String(dna.chin || 'rounded'),
      eye_shape: String(dna.eye_shape || 'almond'),
      eye_size: String(dna.eye_size || 'medium'),
      eye_spacing: String(dna.eye_spacing || 'medium'),
      eyebrow_shape: String(dna.eyebrow_shape || 'arched'),
      eyebrow_thickness: String(dna.eyebrow_thickness || 'medium'),
      nose_bridge: String(dna.nose_bridge || 'medium'),
      nose_width: String(dna.nose_width || 'medium'),
      lip_shape: String(dna.lip_shape || 'medium'),
      upper_lip: String(dna.upper_lip || 'soft cupids bow'),
      hairstyle: String(dna.hairstyle || 'straight'),
      hair_color: String(dna.hair_color || 'black'),
      hair_length: String(dna.hair_length || 'long'),
      hair_texture: String(dna.hair_texture || 'straight'),
      hair_parting: String(dna.hair_parting || 'center'),
      body_type: String(dna.body_type || 'slim'),
      height_estimate: String(dna.height_estimate || 'average'),
      overall_impression: String(dna.overall_impression || 'natural Vietnamese beauty'),
    };
  }
}
