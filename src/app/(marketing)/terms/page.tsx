import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of service for Social AI Video Studio.",
};

const sections = [
  {
    title: "Use of the service",
    body: "Users are responsible for the briefs, prompts, uploaded assets, generated outputs, and campaigns they create through the platform.",
  },
  {
    title: "Credits and billing",
    body: "Credits are prepaid usage units stored in the database. Purchases are credited only after verified payment confirmation, and paid actions may deduct credits before work begins.",
  },
  {
    title: "AI generation and rendering",
    body: "AI outputs can vary. The platform stores render and generation status, and may refund credits for platform-owned failures where no usable output is produced.",
  },
  {
    title: "User content",
    body: "Users must have rights to upload and process their images, logos, music, voiceover, subtitles, and other campaign materials.",
  },
  {
    title: "Operational limits",
    body: "The service may enforce usage limits, provider availability limits, file validation, storage policies, and account restrictions to protect platform integrity.",
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm font-semibold">
          Social AI Video Studio
        </Link>
        <p className="mt-12 text-sm text-[var(--muted-foreground)]">
          Last updated: May 7, 2026
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">Terms of Service</h1>
        <div className="mt-10 space-y-8">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-xl font-semibold">{section.title}</h2>
              <p className="mt-3 leading-8 text-[var(--muted-foreground)]">
                {section.body}
              </p>
            </section>
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
