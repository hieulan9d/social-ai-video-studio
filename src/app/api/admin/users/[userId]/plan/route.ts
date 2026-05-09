import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/get-current-user";
import { apiErrorResponse, apiSuccessResponse, AppError } from "@/lib/errors";
import { createAdminClient } from "@/lib/supabase/admin";

const PLANS = ["free", "pro", "business"] as const;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    await requireAdmin();
    const { userId } = await params;
    const body = (await request.json()) as { plan?: unknown };
    const plan = body.plan;

    if (!PLANS.includes(plan as (typeof PLANS)[number])) {
      throw new AppError("Gói tài khoản không hợp lệ.", 400);
    }

    const admin = createAdminClient();
    const { error } = await admin.from("profiles").update({ plan }).eq("id", userId);
    if (error) throw error;

    return apiSuccessResponse({ plan });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
