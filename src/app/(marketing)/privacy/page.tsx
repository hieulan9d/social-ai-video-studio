import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy policy for Social AI Video Studio.",
};

const sections = [
  {
    title: "Data we process",
    body: "We process account details, project briefs, uploaded assets, generated scripts, render metadata, wallet records, payments, and operational analytics needed to run the product.",
  },
  {
    title: "How data is used",
    body: "Data is used to authenticate users, protect private projects, generate AI production assets, process credit transactions, troubleshoot failed jobs, and improve product reliability.",
  },
  {
    title: "Assets and outputs",
    body: "Uploaded files and generated videos are scoped to the owning user and project. Access should be controlled by database policies, signed URLs, and backend authorization checks.",
  },
  {
    title: "Service providers",
    body: "The platform may use Supabase, payment providers, AI text providers, Google Veo, storage providers, and hosting infrastructure to deliver the service.",
  },
  {
    title: "Retention",
    body: "Operational records are retained while needed for billing, audit, support, product integrity, and legal obligations. Financial ledger records should not be deleted casually.",
  },
];

export default function PrivacyPage() {
  return <LegalPage title="Privacy Policy" updated="May 7, 2026" sections={sections} />;
}

function LegalPage({
  title,
  updated,
  sections,
}: {
  title: string;
  updated: string;
  sections: Array<{ title: string; body: string }>;
}) {
  return (
    <main className="min-h-screen px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm font-semibold">
          Social AI Video Studio
        </Link>
        <p className="mt-12 text-sm text-[var(--muted-foreground)]">
          Last updated: {updated}
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">{title}</h1>
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
