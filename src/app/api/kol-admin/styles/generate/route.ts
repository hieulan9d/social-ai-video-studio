import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/auth/server";
import { GeminiImageProvider } from "@/modules/ai-kol-system/providers/gemini";
import { AvatarStorageService } from "@/modules/ai-kol-system";

/**
 * POST /api/kol-admin/styles/generate
 *
 * Generate image from a style template.
 * Body: { templateId, filledVariables, referenceImageUrl? }
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserProfile();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { templateId, filledVariables, referenceImageUrl } = body;

    if (!templateId) {
      return NextResponse.json({ error: "templateId bắt buộc" }, { status: 400 });
    }

    const supabase = await createClient();

    // Load template
    const { data: template, error: tplError } = await supabase
      .from("kol_style_templates")
      .select("*")
      .eq("id", templateId)
      .single();

    if (tplError || !template) {
      return NextResponse.json({ error: "Template không tồn tại" }, { status: 404 });
    }

    // Fill variables into prompt template
    let finalPrompt = template.prompt_template as string;
    const vars = filledVariables || {};
    for (const [key, value] of Object.entries(vars)) {
      finalPrompt = finalPrompt.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), String(value));
    }

    // Generate image
    const provider = new GeminiImageProvider();
    const refs = referenceImageUrl
      ? [{ url: referenceImageUrl, role: "general" as const }]
      : [];

    const result = await provider.generate({
      prompt: finalPrompt,
      candidateCount: 1,
      referenceImages: refs,
      parentImageUrl: referenceImageUrl || undefined,
    });

    if (result.outputUrls.length === 0) {
      return NextResponse.json({ error: "Không tạo được ảnh" }, { status: 500 });
    }

    // Store output
    const storage = new AvatarStorageService();
    const storedUrls: string[] = [];
    const storedPaths: string[] = [];

    for (let i = 0; i < result.outputUrls.length; i++) {
      const path = `styles/${user.id}/${templateId}/${Date.now()}_${i}.png`;
      const stored = await storage.fetchAndStore({ sourceUrl: result.outputUrls[i], path });
      storedUrls.push(stored.publicUrl);
      storedPaths.push(stored.path);
    }

    // Save generation record
    const { data: generation } = await supabase
      .from("kol_style_generations")
      .insert({
        user_id: user.id,
        template_id: templateId,
        filled_variables: vars,
        final_prompt: finalPrompt,
        reference_image_url: referenceImageUrl || null,
        output_urls: storedUrls,
        output_storage_paths: storedPaths,
        provider: "gemini",
        model: result.model,
        generation_time_ms: result.generationTimeMs,
        status: "completed",
      })
      .select()
      .single();

    // Increment usage count
    const { error: rpcError } = await supabase.rpc("increment_style_usage", { template_id: templateId });
    if (rpcError) {
      // Fallback if RPC doesn't exist
      await supabase
        .from("kol_style_templates")
        .update({ usage_count: (template.usage_count || 0) + 1 })
        .eq("id", templateId);
    }

    return NextResponse.json({
      outputUrls: storedUrls,
      generation,
      finalPrompt,
      generationTimeMs: result.generationTimeMs,
    });
  } catch (error) {
    console.error("[styles/generate]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
