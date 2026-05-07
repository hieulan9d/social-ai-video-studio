"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";

export default function AppError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="rounded-[28px] border border-rose-500/20 bg-rose-500/10 p-6">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl bg-rose-500/15 p-3 text-rose-300">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-medium text-rose-300">Yêu cầu thất bại</p>
          <h1 className="mt-2 text-2xl font-semibold">Chưa tải được dữ liệu workspace.</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">
            Ứng dụng giữ lỗi ngay tại trang này để bạn không bị chuyển hướng bất
            ngờ. Hãy thử lại sau khi kiểm tra kết nối cơ sở dữ liệu hoặc trạng
            thái provider.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-[var(--foreground)] px-4 py-3 text-sm font-medium text-[var(--background)]"
          >
            <RotateCcw className="h-4 w-4" />
            Thử lại
          </button>
        </div>
      </div>
    </div>
  );
}
