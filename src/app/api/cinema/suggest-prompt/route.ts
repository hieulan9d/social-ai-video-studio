import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/lib/auth/server";

/**
 * POST /api/cinema/suggest-prompt
 *
 * AI analyzes start + end frames and suggests a transition prompt.
 * Uses Gemini text model to describe the motion between frames.
 *
 * Body: { startFrameDescription?: string, endFrameDescription?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserProfile();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();

    // Try to use AI text generation for smart suggestion
    try {
      const { generateText } = await import("@/lib/ai/text");
      const result = await generateText({
        task: "prompt",
        prompt: `You are a cinematic video transition expert. Suggest a short, specific prompt (1-2 sentences in English) describing smooth camera movement and natural motion for a video transition between two frames.

${body.startFrameDescription ? `Start frame: ${body.startFrameDescription}` : "Start frame: a person or scene"}
${body.endFrameDescription ? `End frame: ${body.endFrameDescription}` : "End frame: same subject, different angle or pose"}

Requirements:
- Describe camera movement (dolly, pan, zoom, crane, etc.)
- Describe subject motion (turns, walks, gestures, etc.)
- Keep it cinematic and smooth
- No morphing or unnatural transitions
- Output ONLY the prompt text, nothing else`,
        temperature: 0.9,
        maxTokens: 150,
      });

      if (result.success) {
        return NextResponse.json({ suggestion: result.text.trim() });
      }
    } catch { /* fallback below */ }

    // Fallback: random high-quality suggestions
    const suggestions = [
      "Smooth cinematic dolly forward, subject gradually shifts pose with natural motion, soft depth of field transition",
      "Camera slowly orbits 45 degrees while subject turns head naturally, maintaining eye contact, warm lighting shift",
      "Gentle push-in with parallax depth, subject's expression transitions from neutral to confident smile",
      "Slow crane up revealing the full scene, subject walks forward naturally with cinematic motion blur",
      "Camera tracks laterally while subject rotates, seamless wardrobe transition with consistent lighting",
      "Pull focus from foreground to subject, natural breathing motion, subtle environment change",
    ];

    const suggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
    return NextResponse.json({ suggestion });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
