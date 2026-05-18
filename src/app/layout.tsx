import type { Metadata } from "next";
import { Suspense } from "react";
import { AnalyticsTracker } from "@/components/analytics/analytics-tracker";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Social AI Video Studio",
    template: "%s | Social AI Video Studio",
  },
  description: "Nền tảng SaaS tạo ảnh và video AI đa model cho workflow social content.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning className="h-full antialiased">
      <head>
        <link rel="dns-prefetch" href="https://ggeduhkvxukjyowfdacs.supabase.co" />
        <link rel="preconnect" href="https://ggeduhkvxukjyowfdacs.supabase.co" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://generativelanguage.googleapis.com" />
        <link rel="preconnect" href="https://generativelanguage.googleapis.com" crossOrigin="anonymous" />
      </head>
      <body suppressHydrationWarning className="min-h-full bg-[var(--background)] text-[var(--foreground)]">
        <Suspense fallback={null}>
          <AnalyticsTracker />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
