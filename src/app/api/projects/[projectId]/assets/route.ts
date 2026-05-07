import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getCurrentUserProfile } from "@/lib/auth/server";
import {
  listProjectAssets,
  uploadProjectAsset,
} from "@/lib/assets/server";
import { validateAssetType } from "@/lib/assets/validation";

function errorResponse(error: unknown, status = 400) {
  return NextResponse.json(
    {
      ok: false,
      error: error instanceof Error ? error.message : "Asset request failed.",
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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const user = await getApiUser();
    const { projectId } = await params;
    const assets = await listProjectAssets(projectId, user.id);

    return NextResponse.json({
      ok: true,
      assets,
    });
  } catch (error) {
    return errorResponse(
      error,
      error instanceof Error && error.message === "Unauthorized." ? 401 : 400,
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const user = await getApiUser();
    const { projectId } = await params;
    const formData = await request.formData();
    const rawAssetType = formData.get("assetType");
    const rawFile = formData.get("file");

    if (typeof rawAssetType !== "string") {
      throw new Error("Asset type is required.");
    }

    if (!(rawFile instanceof File)) {
      throw new Error("Asset file is required.");
    }

    const asset = await uploadProjectAsset({
      projectId,
      userId: user.id,
      assetType: validateAssetType(rawAssetType),
      file: rawFile,
    });

    revalidatePath(`/projects/${projectId}`);

    return NextResponse.json({
      ok: true,
      asset,
    });
  } catch (error) {
    return errorResponse(
      error,
      error instanceof Error && error.message === "Unauthorized." ? 401 : 400,
    );
  }
}
