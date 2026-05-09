import "server-only";

import crypto from "node:crypto";
import { getSiteUrl } from "@/lib/env";

type MomoConfig = {
  partnerCode: string;
  accessKey: string;
  secretKey: string;
  endpoint: string;
  queryEndpoint: string;
  ipnUrl: string;
  redirectUrl: string;
};

export type CreateMomoPaymentInput = {
  orderId: string;
  requestId: string;
  amount: number;
  orderInfo: string;
  redirectUrl?: string;
  ipnUrl?: string;
  extraData: string;
};

export type MomoCreatePaymentResponse = {
  partnerCode?: string;
  orderId?: string;
  requestId?: string;
  amount?: number;
  responseTime?: number;
  message?: string;
  resultCode?: number;
  payUrl?: string;
  deeplink?: string;
  qrCodeUrl?: string;
  signature?: string;
  [key: string]: unknown;
};

export type MomoIpnPayload = {
  partnerCode?: string;
  orderId?: string;
  requestId?: string;
  amount?: number;
  orderInfo?: string;
  orderType?: string;
  transId?: number | string;
  resultCode?: number;
  message?: string;
  payType?: string;
  responseTime?: number;
  extraData?: string;
  signature?: string;
  [key: string]: unknown;
};

function getMomoConfig(): MomoConfig {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? getSiteUrl();
  const partnerCode = process.env.MOMO_PARTNER_CODE;
  const accessKey = process.env.MOMO_ACCESS_KEY;
  const secretKey = process.env.MOMO_SECRET_KEY;

  if (!partnerCode || !accessKey || !secretKey) {
    throw new Error("Thiếu cấu hình MoMo trên server.");
  }

  return {
    partnerCode,
    accessKey,
    secretKey,
    endpoint:
      process.env.MOMO_ENDPOINT ??
      "https://test-payment.momo.vn/v2/gateway/api/create",
    queryEndpoint:
      process.env.MOMO_QUERY_ENDPOINT ??
      "https://test-payment.momo.vn/v2/gateway/api/query",
    ipnUrl: process.env.MOMO_IPN_URL ?? `${appUrl}/api/payments/momo/ipn`,
    redirectUrl:
      process.env.MOMO_REDIRECT_URL ?? `${appUrl}/credits/payment-result`,
  };
}

function hmacSha256(raw: string, secretKey: string) {
  return crypto.createHmac("sha256", secretKey).update(raw).digest("hex");
}

export function createMomoSignature(rawSignature: string): string {
  return hmacSha256(rawSignature, getMomoConfig().secretKey);
}

export function verifyMomoSignature(payload: MomoIpnPayload): boolean {
  if (!payload.signature) {
    return false;
  }

  const config = getMomoConfig();
  const rawSignature = [
    `accessKey=${config.accessKey}`,
    `amount=${payload.amount ?? ""}`,
    `extraData=${payload.extraData ?? ""}`,
    `message=${payload.message ?? ""}`,
    `orderId=${payload.orderId ?? ""}`,
    `orderInfo=${payload.orderInfo ?? ""}`,
    `orderType=${payload.orderType ?? ""}`,
    `partnerCode=${payload.partnerCode ?? ""}`,
    `payType=${payload.payType ?? ""}`,
    `requestId=${payload.requestId ?? ""}`,
    `responseTime=${payload.responseTime ?? ""}`,
    `resultCode=${payload.resultCode ?? ""}`,
    `transId=${payload.transId ?? ""}`,
  ].join("&");
  const expectedSignature = hmacSha256(rawSignature, config.secretKey);

  const expected = Buffer.from(expectedSignature);
  const received = Buffer.from(payload.signature);

  if (expected.length !== received.length) {
    return false;
  }

  return crypto.timingSafeEqual(expected, received);
}

export async function createMomoPayment(input: CreateMomoPaymentInput) {
  const config = getMomoConfig();
  const requestType = "captureWallet";
  const redirectUrl = input.redirectUrl ?? config.redirectUrl;
  const ipnUrl = input.ipnUrl ?? config.ipnUrl;
  const rawSignature = [
    `accessKey=${config.accessKey}`,
    `amount=${input.amount}`,
    `extraData=${input.extraData}`,
    `ipnUrl=${ipnUrl}`,
    `orderId=${input.orderId}`,
    `orderInfo=${input.orderInfo}`,
    `partnerCode=${config.partnerCode}`,
    `redirectUrl=${redirectUrl}`,
    `requestId=${input.requestId}`,
    `requestType=${requestType}`,
  ].join("&");
  const signature = hmacSha256(rawSignature, config.secretKey);
  const body = {
    partnerCode: config.partnerCode,
    partnerName: "Social AI Video Studio",
    storeId: "SocialAIVideoStudio",
    requestId: input.requestId,
    amount: input.amount,
    orderId: input.orderId,
    orderInfo: input.orderInfo,
    redirectUrl,
    ipnUrl,
    lang: "vi",
    requestType,
    extraData: input.extraData,
    autoCapture: true,
    signature,
  };

  if (process.env.NODE_ENV === "development") {
    console.info("MoMo create rawSignature:", rawSignature);
  }

  const response = await fetch(config.endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const data = (await response.json()) as MomoCreatePaymentResponse;

  if (!response.ok) {
    throw new Error(data.message || "Không thể tạo thanh toán MoMo.");
  }

  return data;
}

export async function queryMomoPayment(orderId: string, requestId: string) {
  const config = getMomoConfig();
  const rawSignature = [
    `accessKey=${config.accessKey}`,
    `orderId=${orderId}`,
    `partnerCode=${config.partnerCode}`,
    `requestId=${requestId}`,
  ].join("&");
  const signature = hmacSha256(rawSignature, config.secretKey);
  const response = await fetch(config.queryEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      partnerCode: config.partnerCode,
      requestId,
      orderId,
      lang: "vi",
      signature,
    }),
    cache: "no-store",
  });

  return (await response.json()) as Record<string, unknown>;
}
