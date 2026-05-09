import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/get-current-user";
import { adjustCredits } from "@/lib/credits/credit-service";
import { apiErrorResponse, apiSuccessResponse, AppError } from "@/lib/errors";

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = (await request.json()) as {
      userId?: unknown;
      newBalance?: unknown;
      reason?: unknown;
    };
    const newBalance = Number(body.newBalance);

    if (typeof body.userId !== "string" || !body.userId) {
      throw new AppError("Thiếu userId.", 400);
    }

    if (!Number.isInteger(newBalance) || newBalance < 0) {
      throw new AppError("Số dư mới không hợp lệ.", 400);
    }

    const result = await adjustCredits({
      userId: body.userId,
      newBalance,
      reason:
        typeof body.reason === "string" && body.reason.trim()
          ? body.reason.trim().slice(0, 500)
          : "Admin điều chỉnh credit",
      metadata: {
        admin_user_id: admin.user.id,
      },
    });

    if (!result.success) {
      throw new AppError(result.error ?? "Không thể điều chỉnh credit.", 400);
    }

    return apiSuccessResponse({ credits: result });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
