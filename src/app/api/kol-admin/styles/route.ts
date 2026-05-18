import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/auth/server";

/**
 * GET /api/kol-admin/styles — List all style templates
 * POST /api/kol-admin/styles — Create a new style template
 */

export async function GET() {
  try {
    const user = await getCurrentUserProfile();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("kol_style_templates")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ templates: data || [] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserProfile();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { name, description, category, promptTemplate, variables, defaultSettings } = body;

    if (!name || !promptTemplate) {
      return NextResponse.json({ error: "name và promptTemplate bắt buộc" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("kol_style_templates")
      .insert({
        user_id: user.id,
        name,
        description: description || null,
        category: category || "general",
        prompt_template: promptTemplate,
        variables: variables || [],
        default_settings: defaultSettings || {},
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ template: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
