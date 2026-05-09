"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Bell, Menu, Plus, Search } from "lucide-react";
import { CreditBalance } from "@/components/credits/CreditBalance";
import { useAuth } from "@/hooks/use-auth";

type SearchProjectResult = {
  id: string;
  title: string;
  brief: string | null;
  platform: string;
  videoType: string;
  language: string;
};

function getPageMeta(pathname: string) {
  if (pathname.startsWith("/quick-create/prompt")) {
    return {
      title: "Prompt AI",
      subtitle: "Tối ưu ý tưởng thành prompt và shot list có cấu trúc.",
    };
  }

  if (pathname.startsWith("/quick-create/image")) {
    return {
      title: "Tạo ảnh",
      subtitle: "Text to Image và Image to Image trong vài bước.",
    };
  }

  if (pathname.startsWith("/quick-create/video")) {
    return {
      title: "Tạo video",
      subtitle: "Text to Video, Image to Video và Start/End workflow.",
    };
  }

  if (pathname.startsWith("/quick-ai")) {
    return {
      title: "Tạo nhanh AI",
      subtitle: "Tạo ảnh, video, prompt hoặc kịch bản mà không cần mở dự án.",
    };
  }

  if (pathname.startsWith("/projects/")) {
    return {
      title: "Project Workspace",
      subtitle: "Quản lý asset, preview, render và lịch sử tạo trong một nơi.",
    };
  }

  if (pathname.startsWith("/projects")) {
    return {
      title: "Dự án",
      subtitle: "Theo dõi các workspace sáng tạo và trạng thái sản xuất.",
    };
  }

  if (pathname.startsWith("/wallet") || pathname.startsWith("/credits")) {
    return {
      title: "Credits",
      subtitle: "Theo dõi số dư, gói nạp và lịch sử sử dụng theo tính năng.",
    };
  }

  if (pathname.startsWith("/analytics")) {
    return {
      title: "Analytics",
      subtitle: "Theo dõi nhịp tạo nội dung, credits và hiệu suất workflow gần đây.",
    };
  }

  if (pathname.startsWith("/settings")) {
    return {
      title: "Cài đặt AI",
      subtitle: "Quản lý provider, model mapping, API key và routing.",
    };
  }

  return {
    title: "Dashboard",
    subtitle: "Trang chủ vận hành cho studio AI đa model.",
  };
}

export function AppTopbar({
  onOpenSidebar,
}: {
  onOpenSidebar: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAuth();
  const meta = useMemo(() => getPageMeta(pathname), [pathname]);
  const userLabel = user.fullName || user.workspaceName || user.email;
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [matchedProjects, setMatchedProjects] = useState<SearchProjectResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const deferredSearch = useDeferredValue(search);
  const [debouncedSearch, setDebouncedSearch] = useState(deferredSearch);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(deferredSearch);
    }, 220);

    return () => window.clearTimeout(timer);
  }, [deferredSearch]);

  useEffect(() => {
    const query = debouncedSearch.trim();

    if (!query) {
      return;
    }

    const controller = new AbortController();

    void fetch(`/api/projects/search?q=${encodeURIComponent(query)}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = await response.json();

        if (!response.ok || !payload.ok) {
          throw new Error(payload.error ?? "Search failed.");
        }

        setMatchedProjects(payload.projects as SearchProjectResult[]);
      })
      .catch((error) => {
        if (controller.signal.aborted) {
          return;
        }

        console.error("Topbar search error:", error);
        setMatchedProjects([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setSearchLoading(false);
        }
      });

    return () => controller.abort();
  }, [debouncedSearch]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = search.trim();

    if (!query) {
      router.push("/projects");
      return;
    }

    router.push(`/projects?search=${encodeURIComponent(query)}`);
  }

  return (
    <header className="sticky top-0 z-20 border-b bg-[rgba(10,15,26,0.9)] backdrop-blur">
      <div className="space-y-4 px-4 py-4 sm:px-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <button
              type="button"
              onClick={onOpenSidebar}
              className="mt-1 rounded-[8px] border border-[var(--border)] bg-[var(--surface)] p-2 text-[var(--muted-foreground)] lg:hidden"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-medium text-[var(--heading)]">
                {meta.title}
              </h1>
              <p className="mt-1 truncate text-sm text-[var(--muted-foreground)]">
                {meta.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:block">
              <CreditBalance />
            </div>
            <button className="rounded-[8px] border border-[rgba(96,165,250,0.16)] bg-[color:color-mix(in_srgb,var(--surface)_90%,var(--accent-soft)_10%)] p-2.5 text-[var(--muted-foreground)]">
              <Bell className="h-4 w-4" />
            </button>
            <div className="hidden min-w-[160px] rounded-[12px] border border-[rgba(96,165,250,0.14)] bg-[color:color-mix(in_srgb,var(--surface)_92%,var(--surface-tint)_8%)] px-3 py-2.5 md:block">
              <p className="truncate text-right text-[12px] font-medium text-[var(--heading)]">
                {userLabel}
              </p>
              <p className="truncate text-right text-[11px] text-[var(--muted-foreground)]">
                {user.email}
              </p>
            </div>
            <Link
              href="/projects/new"
              className="inline-flex items-center gap-2 rounded-[8px] border border-[rgba(96,165,250,0.16)] bg-[color:color-mix(in_srgb,var(--accent)_82%,var(--highlight-teal)_18%)] px-3 py-2.5 text-[12px] font-medium text-[var(--accent-foreground)]"
            >
              <Plus className="h-4 w-4" />
              Tạo mới
            </Link>
          </div>
        </div>

        <div className="relative">
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-3 rounded-[20px] border border-[rgba(96,165,250,0.14)] bg-[color:color-mix(in_srgb,var(--surface)_90%,var(--surface-tint)_10%)] px-4 py-3"
          >
            <Search className="h-4 w-4 text-[var(--muted-foreground)]" />
            <input
              value={search}
              onChange={(event) => {
                const nextValue = event.target.value;
                setSearch(nextValue);
                setSearchLoading(nextValue.trim().length > 0);

                if (!nextValue.trim()) {
                  setMatchedProjects([]);
                }
              }}
              placeholder="Tìm dự án, kịch bản, render..."
              className="w-full bg-transparent text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]"
            />
          </form>

          {search.trim() ? (
            <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 overflow-hidden rounded-[20px] border border-[rgba(96,165,250,0.14)] bg-[color:color-mix(in_srgb,var(--surface)_90%,var(--surface-tint)_10%)] p-2">
              {searchLoading ? (
                <div className="rounded-[12px] px-4 py-4 text-sm text-[var(--muted-foreground)]">
                  Đang tìm dự án...
                </div>
              ) : matchedProjects.length > 0 ? (
                <div className="space-y-1">
                  {matchedProjects.map((project) => (
                    <Link
                      key={project.id}
                      href={`/projects/${project.id}`}
                      className="block rounded-[12px] border border-transparent px-4 py-3 hover:border-[var(--border)] hover:bg-[var(--surface-muted)]"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate text-sm font-medium text-[var(--heading)]">
                          {project.title}
                        </p>
                        <span className="rounded-full border border-[var(--border)] px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                          {project.platform}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-1 text-xs text-[var(--muted-foreground)]">
                        {project.brief ||
                          `${project.videoType.replaceAll("_", " ")} · ${project.language}`}
                      </p>
                    </Link>
                  ))}
                  <Link
                    href={`/projects?search=${encodeURIComponent(search.trim())}`}
                    className="block rounded-[12px] border border-transparent px-4 py-3 text-xs font-medium text-[var(--highlight)] hover:border-[var(--border)] hover:bg-[var(--surface-muted)]"
                  >
                    Xem tất cả kết quả cho &quot;{search.trim()}&quot;
                  </Link>
                </div>
              ) : (
                <div className="rounded-[12px] px-4 py-4 text-sm text-[var(--muted-foreground)]">
                  Không tìm thấy dự án phù hợp.
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
