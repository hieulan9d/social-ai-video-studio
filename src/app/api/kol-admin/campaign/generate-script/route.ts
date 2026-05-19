import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/auth/server";
import { CampaignService, KolDnaService } from "@/modules/ai-kol-system";
import { ScenePlanner } from "@/modules/ai-kol-system";
import {
  VeoPromptBuilder,
  NEGATIVE_PROMPT_MASTER,
} from "@/modules/ai-kol-system/engines/script/veo-prompt-builder";
import type {
  KolVisualAnchor,
  OutfitPlan,
  BackgroundPlan,
  ProductReference,
  VeoSceneV3,
} from "@/modules/ai-kol-system/engines/script/veo-prompt-builder";

/**
 * POST /api/kol-admin/campaign/generate-script
 *
 * Generates a V3.2 compliant script with full:
 * - KOL_VISUAL_ANCHOR injection
 * - CONSISTENCY LOCK per scene
 * - NEGATIVE PROMPT MASTER
 * - Self-contained scene JSON
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserProfile();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      campaignId, kolId, idea, product, platform, contentType,
      duration, hookStyle, ctaGoal, targetAudience, emotionStyle,
      sceneDescription, language,
    } = body;

    if (!campaignId || !kolId || !idea) {
      return NextResponse.json({ error: "campaignId, kolId, idea required" }, { status: 400 });
    }

    const supabase = await createClient();
    const campaignService = new CampaignService(supabase);
    const dnaService = new KolDnaService(supabase);
    const builder = new VeoPromptBuilder();

    // Load KOL DNA
    const dnaProfile = await dnaService.getFullDnaProfile(kolId);

    // Build KOL Visual Anchor from DNA
    const kolAnchor: KolVisualAnchor = dnaProfile.identityDna
      ? builder.buildAnchorFromDna(dnaProfile.identityDna as unknown as Record<string, unknown>)
      : builder.buildAnchorFromDna({});

    // Plan scenes
    const planner = new ScenePlanner();
    const totalDuration = duration || 30;
    const sceneCount = planner.calculateSceneCount(totalDuration);
    const durations = planner.planDurations(totalDuration, sceneCount);

    // Build outfit plan
    const outfit: OutfitPlan = {
      outfit_id: "outfit_A",
      location: sceneDescription || "modern indoor",
      top: "white blouse",
      bottom: "light beige pants",
      accessories: "minimal gold earrings",
      color_palette: "white, beige, gold",
      style: "casual professional",
    };

    // Build background plan
    const background: BackgroundPlan = {
      bg_id: "bg_A",
      location_type: "indoor",
      specific_location: sceneDescription || "modern bright room",
      time_of_day: "morning",
      lighting: "natural soft warm light from window",
      color_tone: "warm neutral",
      key_props: "clean minimal furniture",
    };

    // Build product reference
    let productRef: ProductReference | null = null;
    if (product) {
      productRef = {
        product_name: product,
        packaging_type: "bottle",
        shape: "standard",
        primary_color: "brand color",
        secondary_color: "white",
        label_description: product,
        logo_description: "brand logo centered",
        logo_position: "center",
        material_appearance: "glossy",
      };
    }

    // Scene framework based on V3.2 knowledge
    const sceneFramework = buildSceneFramework(sceneCount, hookStyle || "curiosity", ctaGoal || "engagement");

    // Try AI generation for voiceovers, fallback to templates
    let voiceovers: string[] = [];
    try {
      const { generateText } = await import("@/lib/ai/text");
      const voPrompt = buildVoiceoverPrompt({
        idea, product, targetAudience, emotionStyle,
        sceneCount, durations, hookStyle, ctaGoal, language,
        sceneFramework,
      });

      const result = await generateText({
        task: "script",
        prompt: voPrompt,
        systemPrompt: `You are a Vietnamese short-form video script writer. Write voiceovers in ${language === "en" ? "English" : "Vietnamese"}. Each voiceover must fill the full scene duration with continuous natural speech. Output ONLY a JSON array of strings, one per scene.`,
        temperature: 0.8,
        maxTokens: 4096,
      });

      if (result.success) {
        try {
          const match = result.text.match(/\[[\s\S]*\]/);
          if (match) voiceovers = JSON.parse(match[0]);
        } catch { /* fallback below */ }
      }
    } catch { /* AI not available, use fallback */ }

    // Fallback voiceovers if AI failed
    if (voiceovers.length < sceneCount) {
      voiceovers = sceneFramework.map((sf, i) => {
        if (i === 0) return `${idea} — bạn có biết không?`;
        if (i === sceneCount - 1) return `Inbox để được tư vấn kỹ hơn nhé.`;
        if (sf.purpose === "product_reveal") return `Đây chính là ${product || "sản phẩm"} mà mình muốn giới thiệu với mọi người.`;
        return `${idea} — ${sf.emotion}`;
      });
    }

    // Build V3.2 scenes
    const veoScenes: VeoSceneV3[] = durations.map((dur, i) => {
      const sf = sceneFramework[i] || sceneFramework[sceneFramework.length - 1];
      const showProduct = sf.purpose === "product_reveal" || sf.purpose === "proof";

      return builder.buildScene({
        sceneNumber: i + 1,
        duration: dur,
        action: sf.action,
        voiceOverVi: voiceovers[i] || "",
        shotType: sf.shotType,
        camera: sf.camera,
        cameraMovement: sf.cameraMovement,
        facialExpression: sf.expression,
        transition: sf.transition,
        productVisibility: showProduct ? "in hand" : "not visible",
        brollInsert: sf.broll || "none",
        platform: platform || "TikTok Organic",
        kolAnchor,
        outfit,
        background,
        product: showProduct ? productRef : null,
      });
    });

    // Build full script content
    const scriptContent = veoScenes.map((s) =>
      `Scene ${s.scene} (${s.duration}):\n  Shot: ${s.shot_type}\n  Camera: ${s.camera_movement}\n  Visual: ${s.visual_prompt.slice(0, 200)}...\n  VO: ${s.voice_over_vi}\n  Expression: ${s.facial_expression}`
    ).join("\n\n");

    // Save script to DB
    const script = await campaignService.createScript(user.id, {
      campaign_id: campaignId,
      kol_id: kolId,
      title: `Script V3.2: ${idea.slice(0, 50)}`,
      content: scriptContent,
      structured_content: {
        version: "3.2",
        kol_visual_anchor: kolAnchor,
        outfit_plan: outfit,
        background_plan: background,
        product_reference: productRef,
        scenes: veoScenes,
      },
      generation_input: body,
      generation_output: { scenes: veoScenes },
      provider: "veo-prompt-builder-v3.2",
      model: "local",
    });

    // Save scenes to DB with full visual_prompt
    const sceneInputs = veoScenes.map((s) => ({
      campaign_id: campaignId,
      script_id: script.id,
      scene_order: s.scene,
      duration_seconds: parseInt(s.duration),
      visual_prompt: s.visual_prompt,
      camera_angle: s.camera,
      camera_movement: s.camera_movement,
      voiceover: s.voice_over_vi,
      transition: s.transition,
      negative_prompt: s.negative_prompt,
      scene_data: s as unknown as Record<string, unknown>,
      status: "prompt_ready" as const,
    }));

    const scenes = await campaignService.createScenes(user.id, sceneInputs);

    // Update campaign status
    await campaignService.updateCampaign(campaignId, user.id, { status: "planning" });

    return NextResponse.json({ script, scenes, veoScenes });
  } catch (error) {
    console.error("[generate-script]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// ══════════════════════════════════════════════════════════
// SCENE FRAMEWORK — V3.2 Knowledge System
// ══════════════════════════════════════════════════════════

type SceneFrame = {
  purpose: string;
  emotion: string;
  action: string;
  shotType: string;
  camera: string;
  cameraMovement: string;
  expression: string;
  transition: string;
  broll: string;
};

function buildSceneFramework(sceneCount: number, hookStyle: string, ctaGoal: string): SceneFrame[] {
  const frames: SceneFrame[] = [];

  for (let i = 0; i < sceneCount; i++) {
    if (i === 0) {
      // Hook scene
      frames.push({
        purpose: "hook",
        emotion: "curiosity",
        action: `looking directly at camera with ${hookStyle} expression, slight head tilt`,
        shotType: "medium close up talking shot",
        camera: "medium close up",
        cameraMovement: "slight handheld, slow push in",
        expression: getHookExpression(hookStyle),
        transition: "natural cut",
        broll: "none",
      });
    } else if (i === 1) {
      // Story/Problem
      frames.push({
        purpose: "story",
        emotion: "empathy",
        action: "talking naturally with hand gestures, sharing personal experience",
        shotType: "medium talking shot",
        camera: "medium shot",
        cameraMovement: "slow pull out, natural follow",
        expression: "honest, relatable, slightly emotional",
        transition: "dissolve",
        broll: "none",
      });
    } else if (i === sceneCount - 2) {
      // Product reveal
      frames.push({
        purpose: "product_reveal",
        emotion: "excitement",
        action: "holding product naturally, showing label to camera, confident smile",
        shotType: "product macro shot transitioning to medium shot",
        camera: "close up to medium",
        cameraMovement: "slow orbit, slight zoom in",
        expression: "excited, confident, genuine smile",
        transition: "zoom in",
        broll: "product detail insert",
      });
    } else if (i === sceneCount - 1) {
      // CTA
      frames.push({
        purpose: "cta",
        emotion: "trust",
        action: `looking at camera warmly, ${getCTAAction(ctaGoal)}`,
        shotType: "medium close up talking shot",
        camera: "medium close up",
        cameraMovement: "static, slow push in",
        expression: "warm, inviting, trustworthy smile",
        transition: "fade to black",
        broll: "none",
      });
    } else {
      // Middle scenes — alternate between story/education/proof
      const middleTypes = ["story", "education", "proof", "lifestyle"];
      const type = middleTypes[(i - 2) % middleTypes.length];
      frames.push(getMiddleFrame(type));
    }
  }

  return frames;
}

function getHookExpression(hookStyle: string): string {
  const map: Record<string, string> = {
    curiosity: "curious, slightly surprised, engaging eye contact",
    question: "questioning, raised eyebrow, direct eye contact",
    shock: "surprised, wide eyes, urgent expression",
    pain_point: "concerned, empathetic, understanding",
    story: "reflective, about to share something personal",
    confession: "honest, vulnerable, confessional",
    transformation: "confident, before/after energy",
    statistic: "serious, authoritative, informative",
  };
  return map[hookStyle] || "curious, engaging, direct eye contact";
}

function getCTAAction(ctaGoal: string): string {
  const map: Record<string, string> = {
    engagement: "inviting viewers to comment and share",
    purchase: "gently suggesting to try the product",
    follow: "asking viewers to follow for more",
    share: "encouraging viewers to share with friends",
    visit: "pointing to link in bio",
    download: "showing how to access",
  };
  return map[ctaGoal] || "inviting viewers to take action";
}

function getMiddleFrame(type: string): SceneFrame {
  switch (type) {
    case "education":
      return {
        purpose: "education",
        emotion: "trust",
        action: "explaining with natural hand gestures, educational tone",
        shotType: "medium talking shot",
        camera: "medium shot",
        cameraMovement: "static tripod, subtle tracking",
        expression: "calm, trustworthy, expert-like",
        transition: "swipe left",
        broll: "none",
      };
    case "proof":
      return {
        purpose: "proof",
        emotion: "trust",
        action: "demonstrating product usage, showing results",
        shotType: "hand detail shot",
        camera: "close up",
        cameraMovement: "slow zoom in",
        expression: "satisfied, genuine",
        transition: "natural cut",
        broll: "product detail",
      };
    case "lifestyle":
      return {
        purpose: "lifestyle",
        emotion: "aspiration",
        action: "natural daily routine moment, relaxed and authentic",
        shotType: "full body walking shot",
        camera: "wide to medium",
        cameraMovement: "natural follow, slight handheld",
        expression: "relaxed, natural, content",
        transition: "dissolve",
        broll: "environment detail",
      };
    default:
      return {
        purpose: "story",
        emotion: "connection",
        action: "talking naturally, sharing experience",
        shotType: "medium talking shot",
        camera: "medium shot",
        cameraMovement: "slow pull out",
        expression: "genuine, relatable",
        transition: "natural cut",
        broll: "none",
      };
  }
}

function buildVoiceoverPrompt(input: {
  idea: string;
  product: string;
  targetAudience: string;
  emotionStyle: string;
  sceneCount: number;
  durations: number[];
  hookStyle: string;
  ctaGoal: string;
  language: string;
  sceneFramework: SceneFrame[];
}): string {
  const lang = input.language === "en" ? "English" : "Vietnamese";
  const scenes = input.sceneFramework.map((sf, i) =>
    `Scene ${i + 1} (${input.durations[i]}s): purpose=${sf.purpose}, emotion=${sf.emotion}`
  ).join("\n");

  return `Write ${input.sceneCount} voiceovers in ${lang} for a ${input.durations.reduce((a, b) => a + b, 0)}s video.

Product: ${input.product || "N/A"}
Idea: ${input.idea}
Target: ${input.targetAudience || "general"}
Emotion: ${input.emotionStyle || "natural"}
Hook style: ${input.hookStyle}
CTA: ${input.ctaGoal}

Scene breakdown:
${scenes}

RULES:
- Each voiceover MUST fill the full scene duration (${input.durations[0]}-${input.durations[input.durations.length - 1]}s of continuous speech)
- NO short sentences. Each must be long enough for the duration.
- Scene 1 = strong hook
- Last scene = soft CTA (inbox để được tư vấn)
- Natural conversational tone
- No hard sell

Output: JSON array of ${input.sceneCount} strings. Example: ["voiceover 1", "voiceover 2", ...]`;
}
