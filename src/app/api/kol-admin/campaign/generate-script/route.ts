import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/auth/server";
import { CampaignService, KolDnaService } from "@/modules/ai-kol-system";
import { ScriptEngine, ScenePlanner } from "@/modules/ai-kol-system";

/**
 * POST /api/kol-admin/campaign/generate-script
 *
 * Generates a script + scenes for a campaign using the Script Engine.
 * Uses the existing AI provider (9router/OpenAI) for text generation.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserProfile();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();

    const { campaignId, kolId, idea, product, platform, contentType, duration, hookStyle, ctaGoal, targetAudience, emotionStyle, sceneDescription, language } = body;

    if (!campaignId || !kolId || !idea) {
      return NextResponse.json({ error: "campaignId, kolId, idea required" }, { status: 400 });
    }

    const supabase = await createClient();
    const campaignService = new CampaignService(supabase);
    const dnaService = new KolDnaService(supabase);

    // Load KOL DNA for context
    const dnaProfile = await dnaService.getFullDnaProfile(kolId);

    // Plan scenes
    const planner = new ScenePlanner();
    const sceneCount = planner.calculateSceneCount(duration || 30);
    const durations = planner.planDurations(duration || 30, sceneCount);
    const cameras = planner.planCameraProgression(sceneCount);
    const transitions = planner.planTransitions(sceneCount);

    // Build AI prompt for script generation
    const systemPrompt = buildSystemPrompt({
      platform: platform || "TikTok",
      contentType: contentType || "commercial",
      duration: duration || 30,
      hookStyle: hookStyle || "curiosity",
      ctaGoal: ctaGoal || "engagement",
      sceneCount,
      dnaProfile,
      targetAudience: targetAudience || "",
      emotionStyle: emotionStyle || "",
      sceneDescription: sceneDescription || "",
      language: language || "vi",
    });

    const userPrompt = buildUserPrompt({
      idea,
      product: product || "",
      sceneCount,
      durations,
      targetAudience: targetAudience || "",
      emotionStyle: emotionStyle || "",
      sceneDescription: sceneDescription || "",
      language: language || "vi",
    });

    // Call AI provider for script generation
    let scriptContent = "";
    let structuredContent: Record<string, unknown> = {};
    let provider = "mock";
    let model = "mock";

    try {
      // Try to use the existing AI text generation
      const { generateText } = await import("@/lib/ai/text");
      const result = await generateText({
        task: "script",
        prompt: userPrompt,
        systemPrompt,
        temperature: 0.8,
        maxTokens: 4096,
      });

      if (result.success) {
        scriptContent = result.text;
        provider = "ai";
        model = result.model || "unknown";
      } else {
        throw new Error(result.error);
      }

      // Try to parse structured JSON from the response
      try {
        const jsonMatch = scriptContent.match(/```json\n?([\s\S]*?)\n?```/);
        if (jsonMatch) {
          structuredContent = JSON.parse(jsonMatch[1]);
        }
      } catch {
        // Not JSON, keep as plain text
      }
    } catch {
      // Fallback: generate a mock script if AI provider not available
      scriptContent = generateMockScript({ idea, product, platform, sceneCount, durations, hookStyle, ctaGoal });
      provider = "mock";
      model = "fallback";
    }

    // Save script to DB
    const script = await campaignService.createScript(user.id, {
      campaign_id: campaignId,
      kol_id: kolId,
      title: `Script: ${idea.slice(0, 50)}`,
      content: scriptContent,
      structured_content: structuredContent,
      generation_input: { idea, product, platform, contentType, duration, hookStyle, ctaGoal },
      generation_output: { raw: scriptContent },
      provider,
      model,
    });

    // Create scenes
    const sceneInputs = durations.map((dur, i) => ({
      campaign_id: campaignId,
      script_id: script.id,
      scene_order: i + 1,
      duration_seconds: dur,
      camera_angle: cameras[i],
      transition: transitions[i],
      visual_prompt: `Scene ${i + 1}: ${idea}`,
      status: "draft" as const,
    }));

    const scenes = await campaignService.createScenes(user.id, sceneInputs);

    // Update campaign status
    await campaignService.updateCampaign(campaignId, user.id, { status: "planning" });

    return NextResponse.json({ script, scenes });
  } catch (error) {
    console.error("[generate-script]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// ── Helper functions ──────────────────────────────────────

function buildSystemPrompt(input: {
  platform: string;
  contentType: string;
  duration: number;
  hookStyle: string;
  ctaGoal: string;
  sceneCount: number;
  dnaProfile: Awaited<ReturnType<typeof import("@/modules/ai-kol-system").KolDnaService.prototype.getFullDnaProfile>>;
  targetAudience: string;
  emotionStyle: string;
  sceneDescription: string;
  language: string;
}): string {
  const parts = [
    "You are a professional Vietnamese short-form video script writer.",
    `Platform: ${input.platform}`,
    `Content type: ${input.contentType}`,
    `Total duration: ${input.duration} seconds`,
    `Number of scenes: ${input.sceneCount}`,
    `Hook style: ${input.hookStyle}`,
    `CTA goal: ${input.ctaGoal}`,
    `Language: ${input.language === "vi" ? "Vietnamese" : "English"}`,
    "",
    "RULES:",
    `- Write the script in ${input.language === "vi" ? "Vietnamese" : "English"}`,
    "- Each scene should be 4-8 seconds",
    "- Include a strong hook in the first scene",
    "- End with a clear CTA",
    "- Format: provide both a readable script AND a scene-by-scene breakdown",
    "- For each scene include: visual description (English, cinematic), voiceover text, camera angle, camera movement, transition",
    "- Visual descriptions must be detailed enough for AI video generation (Veo prompt)",
    "- Optimize for short-form social media ads",
    "- Maintain emotional arc throughout the video",
  ];

  if (input.targetAudience) {
    parts.push(``, `TARGET AUDIENCE: ${input.targetAudience}`);
  }

  if (input.emotionStyle) {
    parts.push(`EMOTION STYLE: ${input.emotionStyle}`);
  }

  if (input.sceneDescription) {
    parts.push(``, `SCENE/SETTING DESCRIPTION:`, input.sceneDescription);
  }

  if (input.dnaProfile.identityDna) {
    const dna = input.dnaProfile.identityDna;
    parts.push("", "KOL IDENTITY (use in visual descriptions):");
    if (dna.gender) parts.push(`- Gender: ${dna.gender}`);
    if (dna.age_appearance) parts.push(`- Age: ${dna.age_appearance}`);
    if (dna.ethnicity) parts.push(`- Ethnicity: ${dna.ethnicity}`);
    if (dna.hairstyle) parts.push(`- Hairstyle: ${dna.hairstyle}`);
    if (dna.body_type) parts.push(`- Body type: ${dna.body_type}`);
  }

  return parts.join("\n");
}

function buildUserPrompt(input: {
  idea: string;
  product: string;
  sceneCount: number;
  durations: number[];
  targetAudience: string;
  emotionStyle: string;
  sceneDescription: string;
  language: string;
}): string {
  const lang = input.language === "vi" ? "tiếng Việt" : "English";
  const parts = [
    `Ý tưởng video: ${input.idea}`,
  ];

  if (input.product) {
    parts.push(`Sản phẩm/Dịch vụ: ${input.product}`);
  }

  if (input.targetAudience) {
    parts.push(`Đối tượng: ${input.targetAudience}`);
  }

  if (input.emotionStyle) {
    parts.push(`Cảm xúc: ${input.emotionStyle}`);
  }

  if (input.sceneDescription) {
    parts.push(`Bối cảnh: ${input.sceneDescription}`);
  }

  parts.push(
    "",
    `Hãy viết kịch bản ${input.sceneCount} cảnh, mỗi cảnh ${input.durations[0]}-${input.durations[input.durations.length - 1]} giây.`,
    "",
    "Cho mỗi scene, cung cấp:",
    "1. Scene number + duration",
    `2. Visual prompt (English, cinematic, chi tiết đủ để AI tạo video — mô tả chủ thể, hành động, background, lighting, camera angle, camera movement)`,
    `3. Voiceover (${lang})`,
    "4. Camera angle (close-up, medium shot, wide shot, etc.)",
    "5. Camera movement (static, pan left, zoom in, tracking, etc.)",
    "6. Transition to next scene (cut, dissolve, swipe, etc.)",
    "",
    "QUAN TRỌNG:",
    "- Visual prompt phải đủ chi tiết để AI video generator (Veo) hiểu chính xác cần render gì",
    "- Mỗi scene phải tự đứng được (self-contained) vì AI video không có memory giữa các scene",
    "- Bao gồm mô tả KOL trong mỗi visual prompt (ngoại hình, trang phục, hành động)",
  );

  return parts.join("\n");
}

function generateMockScript(input: {
  idea: string;
  product: string;
  platform: string;
  sceneCount: number;
  durations: number[];
  hookStyle: string;
  ctaGoal: string;
}): string {
  const scenes = input.durations.map((dur, i) => {
    const isFirst = i === 0;
    const isLast = i === input.durations.length - 1;

    let voiceover = "";
    if (isFirst) voiceover = `[HOOK - ${input.hookStyle}] Bạn có biết...? ${input.idea}`;
    else if (isLast) voiceover = `[CTA - ${input.ctaGoal}] Hãy thử ngay hôm nay!`;
    else voiceover = `${input.product || input.idea} - Scene ${i + 1}`;

    return `Scene ${i + 1} (${dur}s):\n  Visual: ${input.idea}\n  Voiceover: ${voiceover}\n  Camera: medium shot`;
  });

  return [
    `=== KỊCH BẢN: ${input.idea} ===`,
    `Platform: ${input.platform}`,
    `Tổng thời lượng: ${input.durations.reduce((a, b) => a + b, 0)}s`,
    `Số cảnh: ${input.sceneCount}`,
    "",
    "--- SCRIPT ---",
    "",
    ...scenes,
    "",
    `[Note: Đây là mock script. Kết nối AI provider (9Router) để generate kịch bản thực.]`,
  ].join("\n");
}
