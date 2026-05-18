import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/auth/server";

/**
 * DELETE /api/kol-admin/styles/[styleId] — Delete a style template
 * PUT /api/kol-admin/styles/[styleId] — Update a style template
 */

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ styleId: string }> }
) {
  try {
    const user = await getCurrentUserProfile();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { styleId } = await params;
    const supabase = await createClient();

    const { error } = await supabase
      .from("kol_style_templates")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", styleId)
      .eq("user_id", user.id);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ styleId: string }> }
) {
  try {
    const user = await getCurrentUserProfile();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { styleId } = await params;
    const body = await req.json();

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("kol_style_templates")
      .update({
        name: body.name,
        description: body.description,
        category: body.category,
        prompt_template: body.promptTemplate,
        variables: body.variables,
        default_settings: body.defaultSettings,
      })
      .eq("id", styleId)
      .eq("user_id", user.id)
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
