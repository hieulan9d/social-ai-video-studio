import { NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/lib/auth/server";
import { deleteQuickGeneration } from "@/lib/ai/quick-generations";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ generationId: string }> },
) {
  const user = await getCurrentUserProfile();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Bạn cần đăng nhập." }, { status: 401 });
  }

  const { generationId } = await params;
  await deleteQuickGeneration({ userId: user.id, generationId });

  return NextResponse.json({ ok: true });
}
