"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useDeferredValue, useState } from "react";
import { Bell, Plus, Search } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { appNavigation } from "@/lib/navigation";
import type { Project } from "@/lib/projects/types";

function matchesProject(project: Project, query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return false;
  }

  return [
    project.title,
    project.brief ?? "",
    project.platform,
    project.videoType,
    project.language,
    project.style ?? "",
  ].some((value) => value.toLowerCase().includes(normalizedQuery));
}

export function AppTopbar({ projects }: { projects: Project[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAuth();
  const userLabel = user.fullName || user.workspaceName || user.email;
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const deferredSearch = useDeferredValue(search);
  const matchedProjects = deferredSearch.trim()
    ? projects.filter((project) => matchesProject(project, deferredSearch)).slice(0, 6)
    : [];

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
    <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--background)]/85 backdrop-blur">
      <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1">
            <form
              onSubmit={handleSubmit}
              className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3"
            >
              <Search className="h-4 w-4 text-[var(--muted-foreground)]" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tim du an, brief..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--muted-foreground)]"
              />
            </form>

            {deferredSearch.trim() ? (
              <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 overflow-hidden rounded-3xl border border-slate-200 bg-white p-2 shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
                {matchedProjects.length > 0 ? (
                  <div className="space-y-1">
                    {matchedProjects.map((project) => (
                      <Link
                        key={project.id}
                        href={`/projects/${project.id}`}
                        className="block rounded-2xl px-4 py-3 transition hover:bg-slate-50"
                      >
                        <p className="text-sm font-semibold text-slate-900">
                          {project.title}
                        </p>
                        <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                          {project.brief || `${project.platform} · ${project.videoType.replaceAll("_", " ")}`}
                        </p>
                      </Link>
                    ))}
                    <Link
                      href={`/projects?search=${encodeURIComponent(search.trim())}`}
                      className="block w-full rounded-2xl px-4 py-3 text-left text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    >
                      Xem tat ca ket qua cho &quot;{search.trim()}&quot;
                    </Link>
                  </div>
                ) : (
                  <div className="rounded-2xl px-4 py-4 text-sm text-slate-500">
                    Khong tim thay du an phu hop.
                  </div>
                )}
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-3">
            <button className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 text-[var(--muted-foreground)]">
              <Bell className="h-4 w-4" />
            </button>
            <div className="hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-right md:block">
              <p className="max-w-44 truncate text-sm font-medium">{userLabel}</p>
              <p className="max-w-44 truncate text-xs text-[var(--muted-foreground)]">
                {user.email}
              </p>
            </div>
            <Link
              href="/projects/new"
              className="inline-flex items-center gap-2 rounded-2xl bg-[var(--foreground)] px-4 py-3 text-sm font-medium text-[var(--background)]"
            >
              <Plus className="h-4 w-4" />
              Du an moi
            </Link>
          </div>
        </div>

        <nav className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
          {appNavigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--muted-foreground)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
