import {
  Bot,
  Cable,
  ImageIcon,
  KeyRound,
  RefreshCcw,
  Video,
} from "lucide-react";
import { SmartRoutingSettingsCard } from "@/components/settings/smart-routing-settings";
import { PageHeader } from "@/components/ui/page-header";
import { SurfaceCard } from "@/components/ui/surface-card";
import { getSmartRoutingSettings } from "@/lib/ai/smart-routing";
import { requireUserProfile } from "@/lib/auth/server";

const providerCards = [
  {
    title: "OpenAI",
    status: process.env.OPENAI_API_KEY ? "Đã kết nối" : "Chưa cấu hình",
    models: "GPT Prompt Writer · GPT Image",
    checkedAt: "Theo file .env.local",
  },
  {
    title: "Google",
    status:
      process.env.GOOGLE_VEO_API_KEY || process.env.GEMINI_API_KEY
        ? "Đã kết nối"
        : "Chưa cấu hình",
    models: "Gemini Image · Veo 3 · Veo Fast",
    checkedAt: "Theo file .env.local",
  },
  {
    title: "9Router",
    status: process.env.NINE_ROUTER_API_KEY ? "Đã kết nối" : "Chưa cấu hình",
    models: "OpenAI / Google proxy routing",
    checkedAt:
      process.env.NINE_ROUTER_BASE_URL || process.env.AI_BASE_URL || "http://localhost:20128/v1",
  },
];

const featureMappings = [
  [
    "Tạo ảnh",
    "9Router",
    process.env.AI_IMAGE_MODEL || "gemini/gemini-3.1-flash-image-preview",
    "Hoạt động",
    "Mặc định",
    "2 credits",
  ],
  [
    "Tạo video",
    "Google",
    process.env.GOOGLE_VEO_MODEL || "veo-3.1-fast-generate-preview",
    "Hoạt động",
    "Mặc định",
    "5 credits",
  ],
  [
    "Tạo prompt",
    "9Router",
    process.env.AI_PROMPT_MODEL || "cx/gpt-5.2",
    "Hoạt động",
    "Mặc định",
    "0 credits",
  ],
  [
    "Viết kịch bản",
    "9Router",
    process.env.AI_SCRIPT_MODEL || "gemini/gemini-2.5-pro",
    "Hoạt động",
    "Mặc định",
    "0 credits",
  ],
  [
    "Tối ưu prompt",
    "9Router",
    process.env.AI_REASONING_MODEL || "gemini/gemini-2.5-pro",
    "Hoạt động",
    "Mặc định",
    "0 credits",
  ],
  [
    "Image to Video",
    "Google",
    process.env.GOOGLE_VEO_FAST_MODEL || "veo-3.1-fast-generate-preview",
    "Hoạt động",
    "Fallback",
    "5 credits",
  ],
  [
    "Start/End Image to Video",
    "Google",
    process.env.GOOGLE_VEO_MODEL || "veo-3.1-fast-generate-preview",
    "Hoạt động",
    "Mặc định",
    "5 credits",
  ],
];

export default async function SettingsPage() {
  const profile = await requireUserProfile();
  const smartRoutingSettings = await getSmartRoutingSettings();
  const canEdit = profile.role === "admin";

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Model system"
        title="Cài đặt AI"
        description="Quản lý provider, model mapping, khóa API và các rule routing cho image, video, prompt và script."
      />

      <div className="grid gap-4 xl:grid-cols-3">
        {providerCards.map((item) => (
          <SurfaceCard key={item.title}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-medium text-[var(--heading)]">{item.title}</p>
                <p className="mt-2 text-sm text-[var(--muted-foreground)]">{item.models}</p>
              </div>
              <span className="rounded-full border border-[rgba(34,197,94,0.35)] px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-[var(--success)]">
                {item.status}
              </span>
            </div>
            <div className="mt-5 space-y-3">
              <DetailRow label="Số model khả dụng" value={item.models} />
              <DetailRow label="Lần kiểm tra gần nhất" value={item.checkedAt} />
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-[8px] border border-[var(--border)] px-4 py-2.5 text-sm text-[var(--muted-foreground)]"
              >
                <RefreshCcw className="h-4 w-4 text-[var(--highlight)]" />
                Quản lý
              </button>
            </div>
          </SurfaceCard>
        ))}
      </div>

      <SurfaceCard className="rounded-[var(--radius-shell)]">
        <h2 className="text-lg font-medium text-[var(--heading)]">Model mapping</h2>
        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">
              <tr>
                {[
                  "Feature",
                  "Provider",
                  "Model",
                  "Status",
                  "Default",
                  "Estimated cost",
                  "Action",
                ].map((item) => (
                  <th key={item} className="border-b border-[var(--border)] px-3 py-3 font-medium">
                    {item}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {featureMappings.map((row) => (
                <tr key={row[0]} className="border-b border-[var(--border)] last:border-b-0">
                  {row.map((cell, index) => (
                    <td
                      key={`${row[0]}-${index}`}
                      className={[
                        "px-3 py-3 align-top",
                        index === 2 ? "font-mono text-[var(--highlight)]" : "text-[var(--foreground)]",
                        index === 3 ? "text-[var(--success)]" : "",
                      ].join(" ")}
                    >
                      {cell}
                    </td>
                  ))}
                  <td className="px-3 py-3">
                    <button className="rounded-[8px] border border-[var(--border)] px-3 py-2 text-xs text-[var(--muted-foreground)]">
                      Đổi model
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SurfaceCard>

      <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <SurfaceCard>
          <h2 className="text-lg font-medium text-[var(--heading)]">Model selector cards</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <ModelCard title="GPT Image" icon={ImageIcon} description="Tạo ảnh qua OpenAI image stack." />
            <ModelCard title="Gemini Image" icon={ImageIcon} description="Ảnh social và product creative qua Gemini." />
            <ModelCard title="Veo 3" icon={Video} description="Video chất lượng cao qua Google direct." />
            <ModelCard title="Veo Fast" icon={Video} description="Biến thể nhanh cho test motion." />
            <ModelCard title="GPT Prompt Writer" icon={Bot} description="Tối ưu prompt và reasoning." />
            <ModelCard title="Gemini Script Writer" icon={FileTextIcon} description="Viết script và scene breakdown." />
          </div>
        </SurfaceCard>

        <SurfaceCard>
          <h2 className="text-lg font-medium text-[var(--heading)]">API key settings</h2>
          <div className="mt-5 space-y-4">
            <MaskedField label="NINE_ROUTER_API_KEY" value={mask(process.env.NINE_ROUTER_API_KEY)} />
            <MaskedField
              label="GOOGLE_VEO_API_KEY"
              value={mask(process.env.GOOGLE_VEO_API_KEY || process.env.GEMINI_API_KEY)}
            />
            <MaskedField label="OPENAI_API_KEY" value={mask(process.env.OPENAI_API_KEY)} />

            <div className="flex flex-wrap gap-3">
              <button className="inline-flex items-center gap-2 rounded-[8px] border border-[var(--border)] px-4 py-2.5 text-sm text-[var(--muted-foreground)]">
                <Cable className="h-4 w-4 text-[var(--highlight)]" />
                Test connection
              </button>
              <button className="inline-flex items-center gap-2 rounded-[8px] bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-[var(--accent-foreground)]">
                <KeyRound className="h-4 w-4" />
                Lưu cấu hình
              </button>
            </div>

            <div className="rounded-[12px] border border-[rgba(245,158,11,0.35)] bg-[rgba(245,158,11,0.08)] px-4 py-3 text-sm text-[var(--pending)]">
              Không hiển thị API key sau khi lưu.
            </div>
          </div>
        </SurfaceCard>
      </div>

      <SurfaceCard>
        <h2 className="text-lg font-medium text-[var(--heading)]">Smart routing</h2>
        <div className="mt-5">
          <SmartRoutingSettingsCard initialSettings={smartRoutingSettings} canEdit={canEdit} />
        </div>
      </SurfaceCard>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[12px] border bg-[var(--surface-muted)] px-4 py-3">
      <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-sm text-[var(--foreground)]">{value}</p>
    </div>
  );
}

function ModelCard({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-[12px] border bg-[var(--surface-muted)] p-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[var(--accent-soft)] text-[var(--highlight)]">
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-4 text-sm font-medium text-[var(--heading)]">{title}</p>
      <p className="mt-2 text-xs leading-5 text-[var(--muted-foreground)]">{description}</p>
    </div>
  );
}

function MaskedField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[12px] border bg-[var(--surface-muted)] px-4 py-3">
      <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">{label}</p>
      <p className="mt-2 font-mono text-sm text-[var(--highlight)]">{value}</p>
    </div>
  );
}

function FileTextIcon({ className }: { className?: string }) {
  return <Bot className={className} />;
}

function mask(value?: string) {
  if (!value) {
    return "Chưa cấu hình";
  }

  if (value.length <= 8) {
    return "********";
  }

  return `${value.slice(0, 4)}********${value.slice(-4)}`;
}
