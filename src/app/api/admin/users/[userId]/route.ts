import { requireAdmin } from "@/lib/auth/get-current-user";
import { apiErrorResponse, apiSuccessResponse, AppError } from "@/lib/errors";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    await requireAdmin();
    const { userId } = await params;
    const admin = createAdminClient();
    const profileQuery = admin
      .from("profiles")
      .select("id, email, full_name, avatar_url, role, plan, created_at, updated_at")
      .eq("id", userId)
      .maybeSingle();

    const [initialProfileResult, walletResult, transactionsResult] = await Promise.all([
      profileQuery,
      admin
        .from("wallets")
        .select("id, user_id, balance_credit, created_at, updated_at")
        .eq("user_id", userId)
        .maybeSingle(),
      admin
        .from("credit_transactions")
        .select("id, user_id, transaction_type, amount_credit, balance_after, reason, metadata, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);
    let profileResult = initialProfileResult;

    if (profileResult.error && profileResult.error.code === "42703") {
      profileResult = await admin
        .from("profiles")
        .select("id, email, full_name, avatar_url, role, created_at, updated_at")
        .eq("id", userId)
        .maybeSingle();
    }

    if (profileResult.error) throw profileResult.error;
    if (walletResult.error) throw walletResult.error;
    if (transactionsResult.error) throw transactionsResult.error;
    if (!profileResult.data) throw new AppError("Không tìm thấy người dùng.", 404);

    const wallet = walletResult.data;
    const transactions = transactionsResult.data ?? [];
    const credits = {
      id: wallet?.id ?? "",
      user_id: userId,
      balance: wallet?.balance_credit ?? 0,
      total_added: transactions
        .filter((item) => item.amount_credit > 0)
        .reduce((total, item) => total + item.amount_credit, 0),
      total_used: transactions
        .filter((item) => item.amount_credit < 0)
        .reduce((total, item) => total + Math.abs(item.amount_credit), 0),
      created_at: wallet?.created_at ?? "",
      updated_at: wallet?.updated_at ?? "",
    };

    return apiSuccessResponse({ profile: profileResult.data, credits, transactions });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
