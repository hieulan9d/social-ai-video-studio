import { NextResponse } from "next/server";

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
  }
}

export function getSafeErrorMessage(error: unknown, fallback = "Đã có lỗi xảy ra.") {
  if (error instanceof AppError || error instanceof Error) {
    return error.message;
  }

  return fallback;
}

export function apiErrorResponse(error: unknown) {
  const statusCode = error instanceof AppError ? error.statusCode : 500;
  const message = getSafeErrorMessage(error);

  if (!(error instanceof AppError)) {
    console.error("API error:", error);
  }

  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    { status: statusCode },
  );
}

export function apiSuccessResponse<T>(data: T, status = 200) {
  return NextResponse.json(
    {
      success: true,
      ...data,
    },
    { status },
  );
}

export const AUTH_REQUIRED_MESSAGE = "Bạn cần đăng nhập để sử dụng chức năng này.";
export const ADMIN_REQUIRED_MESSAGE = "Bạn không có quyền thực hiện thao tác này.";
export const USER_DATA_NOT_FOUND_MESSAGE = "Không tìm thấy dữ liệu người dùng.";
export const INSUFFICIENT_CREDIT_MESSAGE = "Không đủ credit.";
