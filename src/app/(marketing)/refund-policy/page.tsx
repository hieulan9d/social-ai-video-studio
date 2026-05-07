import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Refund Policy",
  description: "Credit refund policy for Social AI Video Studio.",
};

const policies = [
  "Credits deducted for platform-owned generation or render failures should be refunded automatically when no usable output is produced.",
  "Payment refunds, chargebacks, or manual credit adjustments are handled by admins through auditable wallet transactions.",
  "Credits are not refunded for user mistakes such as incorrect prompts, wrong uploaded assets, or approved outputs that do not match subjective creative preference.",
  "Failed payment attempts do not add credits and do not require wallet refunds.",
];

export default function RefundPolicyPage() {
  return (
    <main className="min-h-screen px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm font-semibold">
          Social AI Video Studio
        </Link>
        <p className="mt-12 text-sm text-[var(--muted-foreground)]">
          Last updated: May 7, 2026
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">Refund Policy</h1>
        <p className="mt-5 leading-8 text-[var(--muted-foreground)]">
          Social AI Video Studio uses a credit-backed workflow. The platform is
          designed to refund credits when paid platform work fails after deduction.
        </p>
        <div className="mt-10 space-y-4">
          {policies.map((policy) => (
            <div
              key={policy}
              className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm leading-6 text-[var(--muted-foreground)]"
            >
              {policy}
            </div>
          ))}
        </div>
        <p className="mt-10 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm leading-6 text-[var(--muted-foreground)]">
          This page is launch-ready product copy and should be reviewed by counsel
          before paid public release.
        </p>
      </div>
    </main>
  );
}
