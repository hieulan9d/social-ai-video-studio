import { PageHeader } from "@/components/ui/page-header";
import { SurfaceCard } from "@/components/ui/surface-card";

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Workspace settings"
        title="Settings"
        description="Configure profile, brand defaults, platform preferences, and future integrations."
      />

      <div className="grid gap-5 xl:grid-cols-2">
        <SurfaceCard>
          <h2 className="text-xl font-semibold">Profile</h2>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <SettingField label="Workspace name" value="Hang Thu Media" />
            <SettingField label="Primary email" value="admin@hangthu.media" />
            <SettingField label="Default language" value="Vietnamese" />
            <SettingField label="Timezone" value="Asia/Bangkok" />
          </div>
        </SurfaceCard>

        <SurfaceCard>
          <h2 className="text-xl font-semibold">Brand defaults</h2>
          <div className="mt-6 space-y-4">
            {[
              "Primary CTA tone: urgent and direct",
              "Visual style: luxury, realistic, cinematic",
              "Default export format: 1080x1920 social video",
              "Subtitle style and brand color presets",
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3 text-sm text-[var(--muted-foreground)]"
              >
                {item}
              </div>
            ))}
          </div>
        </SurfaceCard>

        <SurfaceCard>
          <h2 className="text-xl font-semibold">Integrations</h2>
          <div className="mt-6 space-y-3">
            {[
              "Supabase database and auth",
              "OpenAI for script and prompt generation",
              "Google Veo for render jobs",
              "Cloud storage and queue workers",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center justify-between rounded-2xl border border-[var(--border)] px-4 py-3"
              >
                <span className="text-sm">{item}</span>
                <span className="rounded-full bg-[var(--surface-elevated)] px-3 py-1 text-xs text-[var(--muted-foreground)]">
                  Not connected
                </span>
              </div>
            ))}
          </div>
        </SurfaceCard>

        <SurfaceCard>
          <h2 className="text-xl font-semibold">Access and roles</h2>
          <div className="mt-6 space-y-3">
            {[
              "Owner: full billing and workspace control",
              "Editor: project and asset access",
              "Viewer: reporting and preview only",
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm text-[var(--muted-foreground)]"
              >
                {item}
              </div>
            ))}
          </div>
        </SurfaceCard>
      </div>
    </div>
  );
}

function SettingField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-[var(--muted-foreground)]">{label}</p>
      <div className="mt-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3 text-sm font-medium">
        {value}
      </div>
    </div>
  );
}
