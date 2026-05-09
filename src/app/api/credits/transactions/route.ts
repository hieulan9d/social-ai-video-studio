import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth/get-current-user";
import { getUserCreditTransactions } from "@/lib/credits/credit-service";
import { apiErrorResponse, apiSuccessResponse } from "@/lib/errors";
import type { CreditTransactionType } from "@/types/user";

const CREDIT_TYPES: CreditTransactionType[] = ["add", "use", "refund", "adjust", "bonus"];

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    const searchParams = request.nextUrl.searchParams;
    const page = Number.parseInt(searchParams.get("page") ?? "1", 10);
    const limit = Number.parseInt(searchParams.get("limit") ?? "20", 10);
    const rawType = searchParams.get("type");
    const type = CREDIT_TYPES.includes(rawType as CreditTransactionType)
      ? (rawType as CreditTransactionType)
      : null;
    const items = await getUserCreditTransactions(user.id, { page, limit, type });

    return apiSuccessResponse({
      items,
      page: Math.max(1, Number.isFinite(page) ? page : 1),
      limit: Math.min(100, Math.max(1, Number.isFinite(limit) ? limit : 20)),
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
