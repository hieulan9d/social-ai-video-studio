"use client";

import { RotateCcw } from "lucide-react";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-lg rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-soft)]">
        <p className="text-sm font-medium text-rose-400">Đã có lỗi xảy ra</p>
        <h1 className="mt-3 text-3xl font-semibold">Trang chưa tải xong.</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">
          Đây thường là lỗi tạm thời từ API hoặc cơ sở dữ liệu. Hãy thử lại, nếu
          lỗi tiếp diễn thì kiểm tra log máy chủ.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[var(--foreground)] px-4 py-3 text-sm font-medium text-[var(--background)]"
        >
          <RotateCcw className="h-4 w-4" />
          Thử lại
        </button>
      </div>
    </main>
  );
}
