"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const path = `${pathname}${searchParams.size > 0 ? `?${searchParams}` : ""}`;
    const payload = JSON.stringify({
      eventName: "page_view",
      path,
      referrer: document.referrer || null,
    });

    const sent = navigator.sendBeacon?.(
      "/api/events/collect",
      new Blob([payload], { type: "application/json" }),
    );

    if (!sent) {
      fetch("/api/events/collect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
  }, [pathname, searchParams]);

  return null;
}
