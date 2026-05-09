import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/get-current-user";
import { addCredits } from "@/lib/credits/credit-service";
import { apiErrorResponse, apiSuccessResponse, AppError } from "@/lib/errors";

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = (await request.json()) as {
      userId?: unknown;
      amount?: unknown;
      reason?: unknown;
    };
    const amount = Number(body.amount);

    if (typeof body.userId !== "string" || !body.userId) {
      throw new AppError("Thiếu userId.", 400);
    }

    if (!Number.isInteger(amount) || amount <= 0) {
      throw new AppError("Số credit phải là số nguyên lớn hơn 0.", 400);
    }

    const result = await addCredits({
      userId: body.userId,
      amount,
      reason:
        typeof body.reason === "string" && body.reason.trim()
          ? body.reason.trim().slice(0, 500)
          : "Admin cộng credit",
      metadata: {
        admin_user_id: admin.user.id,
      },
    });

    if (!result.success) {
      throw new AppError(result.error ?? "Không thể cộng credit.", 400);
    }

    return apiSuccessResponse({ credits: result });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
