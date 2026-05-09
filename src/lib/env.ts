const missingEnvMessage =
  "Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY).";

function readIntegerEnv(key: string, fallback: number) {
  const raw = process.env[key];

  if (!raw) {
    return fallback;
  }

  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) ? value : fallback;
}

export function getSupabaseUrl() {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!value) {
    throw new Error(missingEnvMessage);
  }

  return value;
}

export function getSupabasePublishableKey() {
  const value =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!value) {
    throw new Error(missingEnvMessage);
  }

  return value;
}

export function getSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_VERCEL_URL?.replace(/^/, "https://") ??
    "http://localhost:3000"
  );
}

export function getSupabaseServiceRoleKey() {
  if (typeof window !== "undefined") {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY chỉ được dùng ở server.");
  }

  const value = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!value) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY.");
  }

  return value;
}

export const env = {
  get supabaseUrl() {
    return getSupabaseUrl();
  },
  get supabaseAnonKey() {
    return getSupabasePublishableKey();
  },
  get supabaseServiceRoleKey() {
    return getSupabaseServiceRoleKey();
  },
  creditSignupBonus: readIntegerEnv("CREDIT_SIGNUP_BONUS", 100),
  costs: {
    image: 0,
    prompt: 0,
    voice: 0,
    video5s: 0,
    video10s: 0,
    video15s: 0,
    veoRender: readIntegerEnv("DEFAULT_VEO_RENDER_COST", 5),
    imageToVideo: readIntegerEnv("DEFAULT_IMAGE_TO_VIDEO_COST", 6),
    transitionVideo: readIntegerEnv("DEFAULT_TRANSITION_VIDEO_COST", 7),
  },
};
