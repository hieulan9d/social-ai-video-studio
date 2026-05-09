import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/get-current-user";
import { listAdminUsers } from "@/lib/credits/admin-users";
import { apiErrorResponse, apiSuccessResponse } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(searchParams.get("limit") ?? "20", 10) || 20),
    );
    const search = searchParams.get("search") ?? "";
    const result = await listAdminUsers({ search, page, limit });

    return apiSuccessResponse({
      items: result.items,
      page,
      limit,
      total: result.count,
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
