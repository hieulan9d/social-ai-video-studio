/**
 * Error formatting utilities.
 * Supabase errors are plain objects, not Error instances,
 * so we need special handling to extract useful information.
 */

export type FormattedError = {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
  isMissingTable: boolean;
};

export function formatError(error: unknown): FormattedError {
  if (!error) {
    return { message: "Unknown error", isMissingTable: false };
  }

  if (error instanceof Error) {
    return { message: error.message, isMissingTable: false };
  }

  if (typeof error === "object") {
    const e = error as Record<string, unknown>;
    const code = e.code ? String(e.code) : undefined;
    const message = e.message ? String(e.message) : "Unknown error";
    const details = e.details ? String(e.details) : undefined;
    const hint = e.hint ? String(e.hint) : undefined;

    // PostgreSQL "table does not exist" error
    // 42P01 = PostgreSQL native; PGRST205 = PostgREST schema cache miss
    const isMissingTable =
      code === "42P01" ||
      code === "PGRST205" ||
      message.includes("does not exist") ||
      message.includes("Could not find the table");

    return { message, code, details, hint, isMissingTable };
  }

  return { message: String(error), isMissingTable: false };
}
