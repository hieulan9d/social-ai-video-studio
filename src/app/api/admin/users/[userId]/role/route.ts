import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/get-current-user";
import { apiErrorResponse, apiSuccessResponse, AppError } from "@/lib/errors";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const adminUser = await requireAdmin();
    const { userId } = await params;
    const body = (await request.json()) as { role?: unknown };
    const role = body.role;

    if (role !== "user" && role !== "admin") {
      throw new AppError("Role không hợp lệ.", 400);
    }

    const admin = createAdminClient();

    if (adminUser.user.id === userId && role === "user") {
      const { count, error: countError } = await admin
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "admin")
        .eq("account_status", "active");

      if (countError) throw countError;
      if ((count ?? 0) <= 1) {
        throw new AppError("Không thể hạ role admin duy nhất.", 400);
      }
    }

    const { error } = await admin.from("profiles").update({ role }).eq("id", userId);
    if (error) throw error;

    return apiSuccessResponse({ role });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
