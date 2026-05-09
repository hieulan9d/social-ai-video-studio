"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useCredits } from "@/hooks/useCredits";

export type MomoPaymentOrder = {
  orderId: string;
  amountVnd: number;
  totalCredits: number;
};

export type MomoPaymentLink = {
  payUrl: string | null;
  deeplink: string | null;
  qrCodeUrl: string | null;
};

export function MomoPaymentModal({
  order,
  payment,
  onClose,
}: {
  order: MomoPaymentOrder;
  payment: MomoPaymentLink;
  onClose: () => void;
}) {
  const { refreshCredits } = useCredits();
  const [status, setStatus] = useState<"pending" | "credited" | "failed">("pending");
  const [message, setMessage] = useState("Đang chờ thanh toán...");

  useEffect(() => {
    let stopped = false;
    const timer = window.setInterval(async () => {
      try {
        const response = await fetch(`/api/payments/momo/status/${order.orderId}`, {
          cache: "no-store",
        });
        const payload = await response.json();

        if (!response.ok || !payload.success) {
          return;
        }

        const nextStatus = payload.order.status as string;

        if (nextStatus === "credited") {
          stopped = true;
          window.clearInterval(timer);
          setStatus("credited");
          setMessage("Thanh toán thành công. Credit đã được cộng.");
          await refreshCredits();
        } else if (nextStatus === "failed" || nextStatus === "cancelled" || nextStatus === "expired") {
          stopped = true;
          window.clearInterval(timer);
          setStatus("failed");
          setMessage("Thanh toán thất bại hoặc đã hủy.");
        }
      } catch {
        // Keep polling; temporary network errors should not close the payment flow.
      }
    }, 3000);

    return () => {
      if (!stopped) {
        window.clearInterval(timer);
      }
    };
  }, [order.orderId, refreshCredits]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-lg rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-medium text-[var(--heading)]">
              Thanh toán bằng MoMo
            </h2>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              Sau khi thanh toán thành công, credit sẽ tự động cộng vào tài khoản.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[8px] border border-[var(--border)] px-3 py-1 text-sm"
          >
            Đóng
          </button>
        </div>

        <div className="mt-5 grid gap-3 rounded-[16px] border bg-[var(--surface-muted)] p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-[var(--muted-foreground)]">Số tiền</span>
            <span className="text-[var(--heading)]">
              {order.amountVnd.toLocaleString("vi-VN")}đ
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--muted-foreground)]">Credit nhận</span>
            <span className="text-[var(--heading)]">{order.totalCredits} credit</span>
          </div>
        </div>

        {payment.qrCodeUrl ? (
          <div className="mt-5 flex justify-center rounded-[16px] border bg-white p-4">
            <Image
              src={payment.qrCodeUrl}
              alt="MoMo QR"
              width={240}
              height={240}
              unoptimized
              className="h-60 w-60 object-contain"
            />
          </div>
        ) : null}

        {payment.payUrl || payment.deeplink ? (
          <a
            href={payment.deeplink ?? payment.payUrl ?? "#"}
            target="_blank"
            rel="noreferrer"
            className="mt-5 flex w-full items-center justify-center rounded-[12px] bg-[#a50064] px-4 py-3 text-sm font-medium text-white"
          >
            Mở MoMo để thanh toán
          </a>
        ) : null}

        <div
          className={[
            "mt-5 rounded-[12px] border px-4 py-3 text-sm",
            status === "credited"
              ? "border-[rgba(34,197,94,0.35)] text-[var(--success)]"
              : status === "failed"
                ? "border-[rgba(248,113,113,0.35)] text-[var(--danger)]"
                : "border-[rgba(245,158,11,0.35)] text-[var(--pending)]",
          ].join(" ")}
        >
          {message}
        </div>
      </div>
    </div>
  );
}
