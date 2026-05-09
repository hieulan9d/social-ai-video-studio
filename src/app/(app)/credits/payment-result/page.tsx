import { PayosPaymentResultClient } from "@/components/payments/PayosPaymentResultClient";
import { ServerDataFallback } from "@/components/ui/server-data-fallback";
import { rethrowNextServerError } from "@/lib/next-server-errors";

export default async function PaymentResultPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  try {
    const { orderId } = await searchParams;
    return <PayosPaymentResultClient orderId={orderId ?? null} />;
  } catch (error) {
    rethrowNextServerError(error);
    console.error("Payment result page load failed:", error);
    return <ServerDataFallback />;
  }
}
