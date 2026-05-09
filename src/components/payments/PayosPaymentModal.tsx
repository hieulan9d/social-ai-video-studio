"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { useCredits } from "@/hooks/useCredits";

export type PayosPaymentOrder = {
  orderId: string;
  orderCode: number;
  amountVnd: number;
  totalCredits: number;
};

export type PayosPaymentLink = {
  checkoutUrl: string;
  qrCode: string | null;
};

function isImageSource(value: string) {
  return value.startsWith("http://") || value.startsWith("https://") || value.startsWith("data:image/");
}

export function PayosPaymentModal({
  order,
  payment,
  onClose,
}: {
  order: PayosPaymentOrder;
  payment: PayosPaymentLink;
  onClose: () => void;
}) {
  const { refreshCredits } = useCredits();
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<"pending" | "credited" | "failed">("pending");
  const [message, setMessage] = useState("Đang chờ thanh toán...");

  useEffect(() => {
    let cancelled = false;

    async function renderQrCode() {
      if (!payment.qrCode) {
        setQrImageUrl(null);
        return;
      }

      if (isImageSource(payment.qrCode)) {
        setQrImageUrl(payment.qrCode);
        return;
      }

      const dataUrl = await QRCode.toDataURL(payment.qrCode, {
        width: 280,
        margin: 1,
        errorCorrectionLevel: "M",
      });

      if (!cancelled) {
        setQrImageUrl(dataUrl);
      }
    }

    void renderQrCode();

    return () => {
      cancelled = true;
    };
  }, [payment.qrCode]);

  useEffect(() => {
    const timer = window.setInterval(async () => {
      try {
        const response = await fetch(`/api/billing/payos/status/${order.orderId}`, {
          cache: "no-store",
        });
        const payload = await response.json();

        if (!response.ok || !payload.success) {
          return;
        }

        const nextStatus = payload.order.status as string;

        if (nextStatus === "credited") {
          window.clearInterval(timer);
          setStatus("credited");
          setMessage("Thanh toán thành công. Credit đã được cộng.");
          await refreshCredits();
        } else if (nextStatus === "failed" || nextStatus === "cancelled" || nextStatus === "expired") {
          window.clearInterval(timer);
          setStatus("failed");
          setMessage("Thanh toán thất bại hoặc đã hủy.");
        }
      } catch {
        // Keep polling; webhook delivery can be a few seconds behind the checkout page.
      }
    }, 3000);

    return () => window.clearInterval(timer);
  }, [order.orderId, refreshCredits]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-lg rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-medium text-[var(--heading)]">
              Thanh toán bằng PayOS
            </h2>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              Credit sẽ tự động cộng sau khi PayOS gửi webhook hợp lệ về server.
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
            <span className="text-[var(--muted-foreground)]">Mã đơn</span>
            <span className="text-[var(--heading)]">{order.orderCode}</span>
          </div>
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

        {qrImageUrl ? (
          <div className="mt-5 flex justify-center rounded-[16px] border bg-white p-4">
            <Image
              src={qrImageUrl}
              alt="PayOS QR"
              width={280}
              height={280}
              unoptimized
              className="h-[280px] w-[280px] object-contain"
            />
          </div>
        ) : null}

        <a
          href={payment.checkoutUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-5 flex w-full items-center justify-center rounded-[12px] bg-[var(--accent)] px-4 py-3 text-sm font-medium text-[var(--accent-foreground)]"
        >
          Mở trang thanh toán PayOS
        </a>

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
