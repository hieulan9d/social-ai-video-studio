import "server-only";

import {
  PayOS,
  type CreatePaymentLinkRequest,
  type CreatePaymentLinkResponse,
  type PaymentLinkItem,
  type Webhook,
  type WebhookData,
} from "@payos/node";
import { AppError } from "@/lib/errors";

type PayosConfig = {
  clientId: string;
  apiKey: string;
  checksumKey: string;
  partnerCode?: string;
  baseURL?: string;
};

export type CreatePayosPaymentInput = {
  orderCode: number;
  amount: number;
  description: string;
  returnUrl: string;
  cancelUrl: string;
  items?: PaymentLinkItem[];
};

export type PayosPaymentLink = Pick<
  CreatePaymentLinkResponse,
  "checkoutUrl" | "qrCode" | "paymentLinkId" | "status" | "orderCode" | "amount"
>;

function getPayosConfig(): PayosConfig {
  const clientId = process.env.PAYOS_CLIENT_ID;
  const apiKey = process.env.PAYOS_API_KEY;
  const checksumKey = process.env.PAYOS_CHECKSUM_KEY;

  if (!clientId || !apiKey || !checksumKey) {
    throw new AppError("Thiếu cấu hình PayOS trên server.", 500);
  }

  return {
    clientId,
    apiKey,
    checksumKey,
    partnerCode: process.env.PAYOS_PARTNER_CODE || undefined,
    baseURL: process.env.PAYOS_BASE_URL || undefined,
  };
}

export function createPayosClient() {
  return new PayOS({
    ...getPayosConfig(),
    logLevel: process.env.NODE_ENV === "development" ? "warn" : "error",
  });
}

export async function createPayosPaymentLink(
  input: CreatePayosPaymentInput,
): Promise<PayosPaymentLink> {
  if (!Number.isInteger(input.orderCode) || input.orderCode <= 0) {
    throw new AppError("Mã đơn PayOS không hợp lệ.", 400);
  }

  if (!Number.isInteger(input.amount) || input.amount <= 0) {
    throw new AppError("Số tiền thanh toán không hợp lệ.", 400);
  }

  const payos = createPayosClient();
  const paymentData: CreatePaymentLinkRequest = {
    orderCode: input.orderCode,
    amount: input.amount,
    description: input.description.slice(0, 25),
    returnUrl: input.returnUrl,
    cancelUrl: input.cancelUrl,
    items: input.items,
  };

  return payos.paymentRequests.create(paymentData);
}

export async function verifyPayosWebhook(payload: unknown): Promise<WebhookData> {
  if (!payload || typeof payload !== "object") {
    throw new AppError("Webhook PayOS không hợp lệ.", 400);
  }

  const payos = createPayosClient();
  return payos.webhooks.verify(payload as Webhook);
}
