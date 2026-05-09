import { requireUser } from "@/lib/auth/get-current-user";
import { getUserCredits } from "@/lib/credits/credit-service";
import { apiErrorResponse, apiSuccessResponse } from "@/lib/errors";

export async function GET() {
  try {
    const user = await requireUser();
    const credits = await getUserCredits(user.id);

    return apiSuccessResponse({
      credits: {
        balance: credits.balance,
        total_added: credits.total_added,
        total_used: credits.total_used,
      },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
