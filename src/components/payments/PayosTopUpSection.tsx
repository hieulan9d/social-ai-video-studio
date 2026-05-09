"use client";

import { useState } from "react";
import {
  PayosPaymentModal,
  type PayosPaymentLink,
  type PayosPaymentOrder,
} from "@/components/payments/PayosPaymentModal";

export type PayosCreditPackage = {
  id: string;
  name: string;
  credits: number;
  bonusCredits: number;
  totalCredits: number;
  priceVnd: number;
};

export function PayosTopUpSection({ packages }: { packages: PayosCreditPackage[] }) {
  const [loadingPackageId, setLoadingPackageId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [modalData, setModalData] = useState<{
    order: PayosPaymentOrder;
    payment: PayosPaymentLink;
  } | null>(null);

  async function createPayment(packageId: string) {
    setLoadingPackageId(packageId);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/billing/payos/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId }),
      });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? "Không thể tạo thanh toán PayOS.");
      }

      setModalData({
        order: {
          orderId: payload.order.orderId,
          orderCode: payload.order.orderCode,
          amountVnd: payload.order.amountVnd,
          totalCredits: payload.order.totalCredits,
        },
        payment: {
          checkoutUrl: payload.payment.checkoutUrl,
          qrCode: payload.payment.qrCode,
        },
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Không thể tạo thanh toán PayOS.",
      );
    } finally {
      setLoadingPackageId(null);
    }
  }

  return (
    <section className="rounded-[var(--radius-card)] border bg-[var(--surface)] p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-medium text-[var(--heading)]">Nạp credit</h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Chọn gói credit và thanh toán bằng PayOS. Credit chỉ được cộng sau webhook
            hợp lệ từ PayOS.
          </p>
        </div>
      </div>

      {errorMessage ? (
        <div className="mt-4 rounded-[12px] border border-[rgba(248,113,113,0.35)] bg-[rgba(248,113,113,0.08)] px-4 py-3 text-sm text-[var(--danger)]">
          {errorMessage}
        </div>
      ) : null}

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {packages.map((item) => (
          <div
            key={item.id}
            className="rounded-[16px] border bg-[var(--surface-muted)] p-4"
          >
            <p className="text-sm font-medium text-[var(--heading)]">{item.name}</p>
            <p className="mt-3 text-3xl font-medium text-[var(--foreground)]">
              {item.totalCredits.toLocaleString("vi-VN")}
            </p>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">credit</p>
            {item.bonusCredits > 0 ? (
              <p className="mt-2 text-xs text-[var(--success)]">
                Bao gồm +{item.bonusCredits} bonus
              </p>
            ) : null}
            <p className="mt-4 text-lg font-medium text-[#fbbf24]">
              {item.priceVnd.toLocaleString("vi-VN")}đ
            </p>
            <button
              type="button"
              disabled={loadingPackageId === item.id}
              onClick={() => void createPayment(item.id)}
              className="mt-4 w-full rounded-[12px] bg-[var(--accent)] px-4 py-3 text-sm font-medium text-[var(--accent-foreground)] disabled:opacity-60"
            >
              {loadingPackageId === item.id ? "Đang tạo đơn..." : "Thanh toán"}
            </button>
          </div>
        ))}
      </div>

      {modalData ? (
        <PayosPaymentModal
          order={modalData.order}
          payment={modalData.payment}
          onClose={() => setModalData(null)}
        />
      ) : null}
    </section>
  );
}
