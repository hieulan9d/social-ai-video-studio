import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Coins, Sparkles } from "lucide-react";
import { getPublicPricingData } from "@/lib/pricing/public";

export const metadata: Metadata = {
  title: "Bảng giá",
  description: "Gói tín dụng và chi phí tính năng động của Social AI Video Studio.",
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
              Đăng nhập
            </Link>
            <Link
              href="/wallet"
              className="rounded-2xl bg-[var(--foreground)] px-4 py-3 text-sm font-medium text-[var(--background)]"
            >
              Nạp tín dụng
            </Link>
          </div>
        </header>

        <section className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--muted-foreground)]">
              <Coins className="h-4 w-4 text-[var(--accent)]" />
              Bảng giá quản lý bằng cơ sở dữ liệu
            </div>
            <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">
              Chỉ dùng tín dụng khi tác vụ sản xuất thật sự chạy.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--muted-foreground)]">
              Gói tín dụng và chi phí tính năng được đọc từ cơ sở dữ liệu, nên
              bạn có thể thay đổi giá launch mà không cần deploy lại frontend.
            </p>
          </div>

          <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)]">
            <p className="text-sm font-medium text-[var(--muted-foreground)]">
              Chi phí tính năng
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
                    {item.credit_cost} tín dụng
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
                Bao gồm {item.credits} tín dụng
              </p>
              <div className="mt-6 space-y-3 text-sm">
                {["Nạp tiền xác nhận bằng webhook", "Ledger tín dụng có thể audit", "Có luồng hoàn cho job lỗi"].map(
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
                Chọn gói
                <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
