"use client";

import { type TheaterMode, TheaterModeToggle } from "@agora/ui";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

interface DebatePageShellProps {
  debateId: string;
  mode: TheaterMode;
  children: React.ReactNode;
}

const STORAGE_KEY = "agora.debate-mode";

export function DebatePageShell({ debateId, mode, children }: DebatePageShellProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const buildUrl = (next: TheaterMode) => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (next === "read") params.set("mode", "read");
    else params.delete("mode");
    const qs = params.toString();
    return `/debates/${debateId}${qs ? `?${qs}` : ""}`;
  };

  const handleModeChange = (next: TheaterMode) => {
    if (next === mode) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore — private mode etc
    }
    router.replace(buildUrl(next));
  };

  // Keyboard shortcut: R toggles modes (when not focused in a form field)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "r" && e.key !== "R") return;
      const tgt = e.target as HTMLElement | null;
      if (tgt && (tgt.tagName === "INPUT" || tgt.tagName === "TEXTAREA" || tgt.isContentEditable))
        return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const next: TheaterMode = mode === "watch" ? "read" : "watch";
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // ignore
      }
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      if (next === "read") params.set("mode", "read");
      else params.delete("mode");
      const qs = params.toString();
      router.replace(`/debates/${debateId}${qs ? `?${qs}` : ""}`);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mode, debateId, router, searchParams]);

  const [breadcrumb, setBreadcrumb] = useState<{
    label: string;
    target: string;
    sameOrigin: boolean;
  }>({ label: "Back to Today", target: "/today", sameOrigin: false });

  useEffect(() => {
    let referrer = "";
    try {
      referrer = document.referrer;
    } catch {
      // ignore
    }
    let sameOrigin = false;
    let pathname = "";
    if (referrer) {
      try {
        const url = new URL(referrer);
        sameOrigin = url.origin === window.location.origin;
        pathname = url.pathname;
      } catch {
        // ignore
      }
    }
    if (pathname.endsWith("/today")) {
      setBreadcrumb({ label: "Back to Today", target: "/today", sameOrigin });
    } else if (pathname.endsWith("/debates") || pathname.startsWith("/debates")) {
      setBreadcrumb({ label: "Back to Archive", target: "/debates", sameOrigin });
    } else if (pathname.endsWith("/workshop")) {
      setBreadcrumb({ label: "Back to Workshop", target: "/workshop", sameOrigin });
    } else {
      setBreadcrumb({ label: "Back to Today", target: "/today", sameOrigin });
    }
  }, []);

  const handleBack = useMemo(
    () => (e: React.MouseEvent) => {
      if (breadcrumb.sameOrigin) {
        e.preventDefault();
        router.back();
      }
      // else: let the Link navigate normally
    },
    [breadcrumb.sameOrigin, router],
  );

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-50 flex items-center justify-between gap-4 p-4">
        <a
          href={breadcrumb.target}
          onClick={handleBack}
          className="pointer-events-auto font-mono text-xs text-[var(--color-muted)] transition-colors hover:text-[var(--color-fg)]"
        >
          ← {breadcrumb.label}
        </a>
        <div className="pointer-events-auto">
          <TheaterModeToggle mode={mode} onModeChange={handleModeChange} />
        </div>
      </div>
      {children}
    </div>
  );
}
