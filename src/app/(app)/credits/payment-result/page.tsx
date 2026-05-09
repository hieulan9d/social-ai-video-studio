import { PayosPaymentResultClient } from "@/components/payments/PayosPaymentResultClient";

export default async function PaymentResultPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const { orderId } = await searchParams;
  return <PayosPaymentResultClient orderId={orderId ?? null} />;
}
