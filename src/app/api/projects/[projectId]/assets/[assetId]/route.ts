import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getCurrentUserProfile } from "@/lib/auth/server";
import { deleteProjectAsset } from "@/lib/assets/server";

function errorResponse(error: unknown, status = 400) {
  return NextResponse.json(
    {
      ok: false,
      error: error instanceof Error ? error.message : "Asset delete failed.",
    },
    { status },
  );
}

async function getApiUser() {
  const user = await getCurrentUserProfile();

  if (!user) {
    throw new Error("Unauthorized.");
  }

  return user;
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string; assetId: string }> },
) {
  try {
    const user = await getApiUser();
    const { projectId, assetId } = await params;

    await deleteProjectAsset({
      projectId,
      userId: user.id,
      assetId,
    });

    revalidatePath(`/projects/${projectId}`);

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    return errorResponse(
      error,
      error instanceof Error && error.message === "Unauthorized." ? 401 : 400,
    );
  }
}
