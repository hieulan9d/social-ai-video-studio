import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Coins, Sparkles } from "lucide-react";
import { getPublicPricingData } from "@/lib/pricing/public";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Credit packages and dynamic feature costs for Social AI Video Studio.",
};

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const pricing = await getPublicPricingData();

  return (
    <main className="min-h-screen px-6 py-6 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-12">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" className="text-sm font-semibold">
            Social AI Video Studio
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/auth" className="text-sm text-[var(--muted-foreground)]">
              Login
            </Link>
            <Link
              href="/wallet"
              className="rounded-2xl bg-[var(--foreground)] px-4 py-3 text-sm font-medium text-[var(--background)]"
            >
              Top up
            </Link>
          </div>
        </header>

        <section className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--muted-foreground)]">
              <Coins className="h-4 w-4 text-[var(--accent)]" />
              Database-managed pricing
            </div>
            <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">
              Pay with credits only when production work runs.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--muted-foreground)]">
              Credit packages and feature costs are loaded from the database, so launch
              pricing can change without deploying frontend code.
            </p>
          </div>

          <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)]">
            <p className="text-sm font-medium text-[var(--muted-foreground)]">
              Feature costs
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {pricing.featurePrices.map((item) => (
                <div
                  key={item.feature_key}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4"
                >
                  <p className="font-medium">{item.name}</p>
                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                    {item.description}
                  </p>
                  <p className="mt-3 text-2xl font-semibold">
                    {item.credit_cost} credits
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-3">
          {pricing.packages.map((item) => (
            <article
              key={item.id}
              className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-soft)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold">{item.name}</h2>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                    {item.description}
                  </p>
                </div>
                <Sparkles className="h-5 w-5 text-[var(--accent)]" />
              </div>
              <p className="mt-6 text-4xl font-semibold">
                {item.currency} {item.priceAmount.toFixed(2)}
              </p>
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                {item.credits} credits included
              </p>
              <div className="mt-6 space-y-3 text-sm">
                {["Webhook-confirmed top-up", "Audited credit ledger", "Refund path for failed jobs"].map(
                  (benefit) => (
                    <div key={benefit} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[var(--accent)]" />
                      {benefit}
                    </div>
                  ),
                )}
              </div>
              <Link
                href="/wallet"
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--foreground)] px-5 py-3 text-sm font-medium text-[var(--background)]"
              >
                Choose package
                <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
