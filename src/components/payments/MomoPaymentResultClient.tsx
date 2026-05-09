"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCredits } from "@/hooks/useCredits";

export function MomoPaymentResultClient({ orderId }: { orderId: string | null }) {
  const { refreshCredits } = useCredits();
  const [message, setMessage] = useState(
    orderId
      ? "Chúng tôi đang xác nhận thanh toán từ MoMo."
      : "Không tìm thấy mã đơn thanh toán.",
  );
  const [status, setStatus] = useState<"pending" | "success" | "failed">(
    orderId ? "pending" : "failed",
  );

  useEffect(() => {
    if (!orderId) {
      return;
    }

    let attempts = 0;
    const timer = window.setInterval(async () => {
      attempts += 1;

      try {
        const response = await fetch(`/api/payments/momo/status/${orderId}`, {
          cache: "no-store",
        });
        const payload = await response.json();

        if (!response.ok || !payload.success) {
          return;
        }

        if (payload.order.status === "credited") {
          window.clearInterval(timer);
          setStatus("success");
          setMessage("Thanh toán thành công. Credit đã được cộng.");
          await refreshCredits();
          return;
        }

        if (
          payload.order.status === "failed" ||
          payload.order.status === "cancelled" ||
          payload.order.status === "expired"
        ) {
          window.clearInterval(timer);
          setStatus("failed");
          setMessage("Thanh toán thất bại hoặc đã hủy.");
        }
      } catch {
        // Keep polling until attempts are exhausted.
      }

      if (attempts >= 20) {
        window.clearInterval(timer);
        setMessage(
          "Chúng tôi đang xác nhận thanh toán từ MoMo. Credit sẽ được cộng tự động sau khi hệ thống nhận được IPN.",
        );
      }
    }, 3000);

    return () => window.clearInterval(timer);
  }, [orderId, refreshCredits]);

  return (
    <div className="mx-auto max-w-2xl rounded-[24px] border bg-[var(--surface)] p-6">
      <h1 className="text-2xl font-medium text-[var(--heading)]">
        Kết quả thanh toán MoMo
      </h1>
      <p
        className={[
          "mt-4 rounded-[12px] border px-4 py-3 text-sm",
          status === "success"
            ? "border-[rgba(34,197,94,0.35)] text-[var(--success)]"
            : status === "failed"
              ? "border-[rgba(248,113,113,0.35)] text-[var(--danger)]"
              : "border-[rgba(245,158,11,0.35)] text-[var(--pending)]",
        ].join(" ")}
      >
        {message}
      </p>
      <p className="mt-4 text-sm text-[var(--muted-foreground)]">
        Trang này không tự cộng credit. Credit chỉ được cộng sau khi server nhận
        IPN hợp lệ từ MoMo.
      </p>
      <Link
        href="/credits"
        className="mt-6 inline-flex rounded-[12px] bg-[var(--accent)] px-4 py-3 text-sm font-medium text-[var(--accent-foreground)]"
      >
        Quay lại trang credit
      </Link>
    </div>
  );
}
