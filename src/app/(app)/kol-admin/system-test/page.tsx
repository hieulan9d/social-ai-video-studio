import Link from "next/link";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { createClient } from "@/lib/supabase/server";
import { ShowMigrationButton } from "./show-migration";

type CheckResult = {
  name: string;
  status: "ok" | "error" | "warning";
  message: string;
  detail?: string;
};

const KOL_TABLES = [
  "kol_workspaces",
  "kol_masters",
  "kol_identity_dna",
  "kol_visual_anchors",
  "kol_voice_dna",
  "kol_outfits",
  "kol_outfit_tags",
  "kol_reference_sheets",
  "kol_prompt_memories",
  "kol_motion_styles",
  "kol_campaigns",
  "kol_campaign_scripts",
  "kol_campaign_assets",
  "kol_campaign_scenes",
  "kol_campaign_prompts",
  "kol_campaign_videos",
  "kol_campaign_qa_reports",
  "kol_avatar_sessions",
  "kol_avatar_generations",
  "kol_avatar_reference_images",
  "kol_identity_locks",
];

async function runChecks(): Promise<CheckResult[]> {
  const results: CheckResult[] = [];

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  results.push({
    name: "Supabase URL",
    status: url ? "ok" : "error",
    message: url ? "Configured" : "Missing NEXT_PUBLIC_SUPABASE_URL",
    detail: url,
  });

  results.push({
    name: "Supabase Anon Key",
    status: key ? "ok" : "error",
    message: key ? "Configured" : "Missing NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  });

  if (!url || !key) return results;

  let supabase;
  try {
    supabase = await createClient();
    results.push({
      name: "Supabase Client",
      status: "ok",
      message: "Initialized successfully",
    });
  } catch (error) {
    results.push({
      name: "Supabase Client",
      status: "error",
      message: "Failed to create client",
      detail: error instanceof Error ? error.message : String(error),
    });
    return results;
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      results.push({
        name: "Auth Connection",
        status: "warning",
        message: "Auth API responded with error",
        detail: error.message,
      });
    } else {
      results.push({
        name: "Auth Connection",
        status: "ok",
        message: user ? `Authenticated as ${user.email}` : "Connected (no session)",
      });
    }
  } catch (error) {
    results.push({
      name: "Auth Connection",
      status: "error",
      message: "Failed to reach Supabase auth",
      detail: error instanceof Error ? error.message : String(error),
    });
  }

  for (const table of KOL_TABLES) {
    try {
      const { error } = await supabase.from(table).select("id").limit(1);
      if (error) {
        const isMissing =
          error.code === "42P01" ||
          error.code === "PGRST205" ||
          error.message?.includes("does not exist") ||
          error.message?.includes("Could not find the table");

        if (isMissing) {
          results.push({
            name: `Table: ${table}`,
            status: "error",
            message: "Table does not exist",
            detail: error.message || "Run migration 001_core_foundation.sql",
          });
        } else {
          results.push({
            name: `Table: ${table}`,
            status: "warning",
            message: error.message || "Query failed",
            detail: error.code ? `Code: ${error.code}` : undefined,
          });
        }
      } else {
        results.push({
          name: `Table: ${table}`,
          status: "ok",
          message: "Exists and accessible",
        });
      }
    } catch (error) {
      results.push({
        name: `Table: ${table}`,
        status: "error",
        message: "Connection error",
        detail: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return results;
}

async function loadMigrationSQL(): Promise<{ core: string | null; rls: string | null; avatar: string | null }> {
  const base = join(process.cwd(), "src/modules/ai-kol-system/database/migrations");
  let core: string | null = null;
  let rls: string | null = null;
  let avatar: string | null = null;

  try {
    core = await readFile(join(base, "001_core_foundation.sql"), "utf-8");
  } catch {}
  try {
    rls = await readFile(join(base, "002_rls_policies.sql"), "utf-8");
  } catch {}
  try {
    avatar = await readFile(join(base, "003_avatar_generation.sql"), "utf-8");
  } catch {}

  return { core, rls, avatar };
}

export default async function SystemTestPage() {
  const [results, migrations] = await Promise.all([runChecks(), loadMigrationSQL()]);

  const okCount = results.filter((r) => r.status === "ok").length;
  const errorCount = results.filter((r) => r.status === "error").length;
  const warningCount = results.filter((r) => r.status === "warning").length;

  const hasMissingTables = results.some(
    (r) => r.status === "error" && r.message === "Table does not exist"
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">System Test</h1>
        <p className="text-sm text-gray-500">Database and Supabase connection status</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="border border-green-500/30 bg-green-500/10 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-400">{okCount}</div>
          <div className="text-sm text-gray-400">OK</div>
        </div>
        <div className="border border-yellow-500/30 bg-yellow-500/10 rounded-lg p-4">
          <div className="text-2xl font-bold text-yellow-400">{warningCount}</div>
          <div className="text-sm text-gray-400">Warnings</div>
        </div>
        <div className="border border-red-500/30 bg-red-500/10 rounded-lg p-4">
          <div className="text-2xl font-bold text-red-400">{errorCount}</div>
          <div className="text-sm text-gray-400">Errors</div>
        </div>
      </div>

      {migrations.core && (
        <div className={`border rounded-lg p-4 space-y-3 ${
          hasMissingTables
            ? "border-yellow-500/40 bg-yellow-500/5"
            : "border-white/10 bg-white/5"
        }`}>
          <div>
            <div className="font-semibold">
              {hasMissingTables ? "⚠ Migration 1: Core Foundation (CHƯA CHẠY)" : "✅ Migration 1: Core Foundation"}
            </div>
            <div className="text-sm text-gray-400 mt-1">
              Tạo 17 tables, indexes, triggers, soft delete.
            </div>
          </div>
          <ShowMigrationButton sql={migrations.core} label="Migration 1 SQL" />
        </div>
      )}

      {migrations.rls && (
        <div className="border border-orange-500/40 bg-orange-500/5 rounded-lg p-4 space-y-3">
          <div>
            <div className="font-semibold text-orange-300">🔐 Migration 2: RLS Policies</div>
            <div className="text-sm text-gray-400 mt-1">
              Cấp quyền cho user truy cập tables thông qua Row Level Security.
              <br />
              <span className="text-orange-300">
                Bắt buộc chạy sau Migration 1 để fix lỗi 42501 (insufficient_privilege).
              </span>
            </div>
          </div>
          <ShowMigrationButton sql={migrations.rls} label="Migration 2 SQL" />
        </div>
      )}

      {migrations.avatar && (
        <div className="border border-purple-500/40 bg-purple-500/5 rounded-lg p-4 space-y-3">
          <div>
            <div className="font-semibold text-purple-300">🎨 Migration 3: Avatar Generation</div>
            <div className="text-sm text-gray-400 mt-1">
              Tables for KOL Avatar Generation System: avatar sessions, generations,
              reference images, identity locks. Also creates the <code>kol-avatars</code> storage bucket.
            </div>
          </div>
          <ShowMigrationButton sql={migrations.avatar} label="Migration 3 SQL" />
        </div>
      )}

      <div className="text-sm text-gray-400 border border-white/10 rounded-lg p-4">
        <div className="font-medium mb-1">🔗 Mở Supabase SQL Editor</div>
        <a
          href="https://supabase.com/dashboard/project/_/sql"
          target="_blank"
          rel="noopener noreferrer"
          className="underline text-blue-400"
        >
          https://supabase.com/dashboard/project/_/sql
        </a>
      </div>

      <div className="space-y-2">
        {results.map((r, i) => (
          <div
            key={i}
            className={`border rounded-lg p-3 ${
              r.status === "ok"
                ? "border-green-500/30 bg-green-500/5"
                : r.status === "warning"
                ? "border-yellow-500/30 bg-yellow-500/5"
                : "border-red-500/30 bg-red-500/5"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{r.name}</div>
                <div className="text-sm text-gray-400">{r.message}</div>
                {r.detail && (
                  <div className="text-xs text-gray-500 mt-1 font-mono">{r.detail}</div>
                )}
              </div>
              <span
                className={`text-xs px-2 py-1 rounded ${
                  r.status === "ok"
                    ? "bg-green-500/20 text-green-400"
                    : r.status === "warning"
                    ? "bg-yellow-500/20 text-yellow-400"
                    : "bg-red-500/20 text-red-400"
                }`}
              >
                {r.status.toUpperCase()}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="text-xs text-gray-500 pt-4">
        <Link href="/kol-admin" className="underline">
          ← Back to KOL Admin
        </Link>
      </div>
    </div>
  );
}
