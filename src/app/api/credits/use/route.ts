import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth/get-current-user";
import { useCredits as spendCredits } from "@/lib/credits/credit-service";
import { apiErrorResponse, apiSuccessResponse, AppError } from "@/lib/errors";

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = (await request.json()) as {
      amount?: unknown;
      reason?: unknown;
      metadata?: unknown;
    };
    const amount = Number(body.amount);
    const reason =
      typeof body.reason === "string" && body.reason.trim()
        ? body.reason.trim().slice(0, 500)
        : "Test trừ credit";

    if (!Number.isInteger(amount) || amount <= 0) {
      throw new AppError("Số credit phải là số nguyên lớn hơn 0.", 400);
    }

    const result = await spendCredits({
      userId: user.id,
      amount,
      reason,
      metadata:
        body.metadata && typeof body.metadata === "object"
          ? (body.metadata as Record<string, unknown>)
          : {},
    });

    if (!result.success) {
      throw new AppError(result.error ?? "Không đủ credit.", 402);
    }

    return apiSuccessResponse({ credits: result });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
