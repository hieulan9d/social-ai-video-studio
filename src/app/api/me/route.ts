import { apiErrorResponse, apiSuccessResponse } from "@/lib/errors";
import { requireUser } from "@/lib/auth/get-current-user";
import { getCurrentUserProfile } from "@/lib/auth/server";
import { getUserCredits } from "@/lib/credits/credit-service";
import { AppError, USER_DATA_NOT_FOUND_MESSAGE } from "@/lib/errors";

export async function GET() {
  try {
    const user = await requireUser();
    const profile = await getCurrentUserProfile();

    if (!profile) {
      throw new AppError(USER_DATA_NOT_FOUND_MESSAGE, 404);
    }

    const credits = await getUserCredits(user.id);

    return apiSuccessResponse({
      user: {
        id: user.id,
        email: user.email ?? null,
      },
      profile: {
        id: profile.id,
        email: profile.email,
        full_name: profile.fullName,
        avatar_url: profile.avatarUrl,
        role: profile.role,
        plan: profile.plan,
      },
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
