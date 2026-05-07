import "server-only";

import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type AnalyticsEventInput = {
  eventName: string;
  path?: string | null;
  referrer?: string | null;
  metadata?: Record<string, unknown>;
};

const MAX_EVENT_NAME_LENGTH = 80;
const MAX_PATH_LENGTH = 500;

export async function trackAnalyticsEvent(input: AnalyticsEventInput) {
  const eventName = normalizeText(input.eventName, MAX_EVENT_NAME_LENGTH);

  if (!eventName) {
    return;
  }

  try {
    const [supabase, headerStore] = await Promise.all([createClient(), headers()]);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const admin = createAdminClient();
    await admin.from("analytics_events").insert({
      user_id: user?.id ?? null,
      event_name: eventName,
      path: normalizeText(input.path, MAX_PATH_LENGTH),
      referrer: normalizeText(input.referrer, MAX_PATH_LENGTH),
      metadata: {
        ...sanitizeMetadata(input.metadata),
        userAgent: normalizeText(headerStore.get("user-agent"), 300),
      },
    });
  } catch {
    // Analytics should never block product workflows.
  }
}

function normalizeText(value: unknown, maxLength: number) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().slice(0, maxLength);
  return normalized.length > 0 ? normalized : null;
}

function sanitizeMetadata(metadata: Record<string, unknown> | undefined) {
  if (!metadata) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(metadata)
      .slice(0, 20)
      .filter(([, value]) =>
        ["string", "number", "boolean"].includes(typeof value) || value === null,
      ),
  );
}
