import { notFound } from "next/navigation";
import { ServerDataFallback } from "@/components/ui/server-data-fallback";
import { SurfaceCard } from "@/components/ui/surface-card";
import { requireUserProfile } from "@/lib/auth/server";
import { rethrowNextServerError } from "@/lib/next-server-errors";
import { completeMockCheckout } from "@/lib/payments/actions";
import { formatMoneyVnd } from "@/lib/payments/format";
import { getPaymentForUser } from "@/lib/payments/server";

export default async function MockCheckoutPage({
  params,
}: {
  params: Promise<{ paymentId: string }>;
}) {
  let pageData;

  try {
    const user = await requireUserProfile();
    const { paymentId } = await params;

    let payment;

    try {
      payment = await getPaymentForUser(paymentId, user.id);
    } catch (error) {
      rethrowNextServerError(error);
      notFound();
    }

    pageData = { payment };
  } catch (error) {
    rethrowNextServerError(error);
    console.error("Mock checkout page load failed:", error);
    return <ServerDataFallback />;
  }

  const { payment } = pageData;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-[var(--muted-foreground)]">
          Mock provider
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Hoàn tất checkout thử nghiệm
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted-foreground)]">
          Trang này mô phỏng checkout do provider lưu trữ. Tín dụng không được
          cộng trực tiếp tại đây. Nút bên dưới kích hoạt cùng luồng xử lý webhook
          như các provider thật.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
        <SurfaceCard>
          <div className="space-y-4">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-4">
              <p className="text-sm text-[var(--muted-foreground)]">ID thanh toán</p>
              <p className="mt-2 break-all text-sm font-medium">{payment.id}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-[var(--border)] px-4 py-4">
                <p className="text-sm text-[var(--muted-foreground)]">Số tiền</p>
                <p className="mt-2 text-xl font-semibold">
                  {formatMoneyVnd(payment.amount, payment.currency)}
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--border)] px-4 py-4">
                <p className="text-sm text-[var(--muted-foreground)]">Tín dụng</p>
                <p className="mt-2 text-xl font-semibold">{payment.creditsPurchased}</p>
              </div>
              <div className="rounded-2xl border border-[var(--border)] px-4 py-4">
                <p className="text-sm text-[var(--muted-foreground)]">Trạng thái</p>
                <p className="mt-2 text-xl font-semibold capitalize">{payment.status}</p>
              </div>
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard>
          <h2 className="text-xl font-semibold">Mô phỏng thanh toán thành công</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">
            Thao tác này gửi một sự kiện mock webhook đã ký. Webhook handler sẽ
            xác minh chữ ký, đánh dấu thanh toán thành công và cộng tín dụng đúng một lần.
          </p>
          <form action={completeMockCheckout} className="mt-6">
            <input type="hidden" name="paymentId" value={payment.id} />
            <button
              type="submit"
              className="rounded-2xl bg-[var(--foreground)] px-5 py-3 text-sm font-medium text-[var(--background)]"
            >
              Xác nhận thanh toán mock
            </button>
          </form>
        </SurfaceCard>
      </div>
    </div>
  );
}
