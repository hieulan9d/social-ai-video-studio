import { NextResponse } from "next/server";
import { trackAnalyticsEvent } from "@/lib/analytics/server";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      eventName?: unknown;
      path?: unknown;
      referrer?: unknown;
      metadata?: unknown;
    };

    if (typeof body.eventName !== "string") {
      return NextResponse.json({ error: "Missing eventName." }, { status: 400 });
    }

    await trackAnalyticsEvent({
      eventName: body.eventName,
      path: typeof body.path === "string" ? body.path : null,
      referrer: typeof body.referrer === "string" ? body.referrer : null,
      metadata:
        body.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata)
          ? (body.metadata as Record<string, unknown>)
          : {},
    });

    return new NextResponse(null, { status: 204 });
  } catch {
    return new NextResponse(null, { status: 204 });
  }
}
