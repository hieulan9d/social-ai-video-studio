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
      <body suppressHydrationWarning className="min-h-full bg-[var(--background)] text-[var(--foreground)]">
        <Suspense fallback={null}>
          <AnalyticsTracker />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
