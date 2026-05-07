import { notFound } from "next/navigation";
import { SurfaceCard } from "@/components/ui/surface-card";
import { requireUserProfile } from "@/lib/auth/server";
import { completeMockCheckout } from "@/lib/payments/actions";
import { getPaymentForUser } from "@/lib/payments/server";

export default async function MockCheckoutPage({
  params,
}: {
  params: Promise<{ paymentId: string }>;
}) {
  const user = await requireUserProfile();
  const { paymentId } = await params;

  let payment;

  try {
    payment = await getPaymentForUser(paymentId, user.id);
  } catch {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-[var(--muted-foreground)]">
          Mock provider
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Complete test checkout
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted-foreground)]">
          This page simulates a provider-hosted checkout. Credits are not added here
          directly. The button below triggers the same webhook processing path used by
          real providers.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
        <SurfaceCard>
          <div className="space-y-4">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-4">
              <p className="text-sm text-[var(--muted-foreground)]">Payment ID</p>
              <p className="mt-2 break-all text-sm font-medium">{payment.id}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-[var(--border)] px-4 py-4">
                <p className="text-sm text-[var(--muted-foreground)]">Amount</p>
                <p className="mt-2 text-xl font-semibold">
                  {payment.currency} {payment.amount.toFixed(2)}
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--border)] px-4 py-4">
                <p className="text-sm text-[var(--muted-foreground)]">Credits</p>
                <p className="mt-2 text-xl font-semibold">{payment.creditsPurchased}</p>
              </div>
              <div className="rounded-2xl border border-[var(--border)] px-4 py-4">
                <p className="text-sm text-[var(--muted-foreground)]">Status</p>
                <p className="mt-2 text-xl font-semibold capitalize">{payment.status}</p>
              </div>
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard>
          <h2 className="text-xl font-semibold">Simulate successful payment</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">
            This submits a signed mock webhook event. The webhook handler will verify
            the signature, mark the payment as successful, and add credits once.
          </p>
          <form action={completeMockCheckout} className="mt-6">
            <input type="hidden" name="paymentId" value={payment.id} />
            <button
              type="submit"
              className="rounded-2xl bg-[var(--foreground)] px-5 py-3 text-sm font-medium text-[var(--background)]"
            >
              Confirm mock payment
            </button>
          </form>
        </SurfaceCard>
      </div>
    </div>
  );
}
