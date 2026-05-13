"use client";
import { ThemeToggle } from "@agora/ui";
import {
  FlaskConical,
  Info,
  LayoutDashboard,
  Menu,
  MessageSquare,
  Settings,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

const NAV_ITEMS = [
  { href: "/home", label: "Today", icon: LayoutDashboard },
  { href: "/debates", label: "Debates", icon: MessageSquare },
  { href: "/workshop", label: "Workshop", icon: FlaskConical },
  { href: "/personas", label: "Personas", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/about", label: "About", icon: Info },
];

function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const pathname = usePathname();
  return (
    <aside
      className={cn(
        "hidden md:flex flex-col border-r border-[var(--color-border)] bg-[var(--color-bg)] transition-all duration-200",
        collapsed ? "w-14" : "w-52",
      )}
    >
      <div className="flex h-14 items-center justify-between border-b border-[var(--color-border)] px-3">
        {!collapsed && (
          <Link
            href="/"
            className="font-mono text-sm lowercase tracking-[0.08em] text-[var(--color-fg)]"
          >
            agora
          </Link>
        )}
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            "text-[var(--color-muted)] transition-colors hover:text-[var(--color-fg)]",
            collapsed && "mx-auto",
          )}
        >
          {collapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </button>
      </div>
      <nav className="flex flex-col gap-1 p-2 flex-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/home" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors",
                active
                  ? "bg-[var(--color-bg-elev)] text-[var(--color-fg)]"
                  : "text-[var(--color-muted)] hover:bg-[var(--color-bg-elev)] hover:text-[var(--color-fg)]",
                collapsed && "justify-center",
              )}
              title={collapsed ? label : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative z-10 flex w-64 flex-col border-r border-[var(--color-border)] bg-[var(--color-bg)]">
            <div className="flex h-14 items-center justify-between border-b border-[var(--color-border)] px-4">
              <Link
                href="/"
                className="font-mono text-sm lowercase tracking-[0.08em] text-[var(--color-fg)]"
              >
                agora
              </Link>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="text-[var(--color-muted)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav className="flex flex-col gap-1 p-2">
              {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || (href !== "/home" && pathname.startsWith(href));
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                      active
                        ? "bg-[var(--color-bg-elev)] text-[var(--color-fg)]"
                        : "text-[var(--color-muted)] hover:bg-[var(--color-bg-elev)] hover:text-[var(--color-fg)]",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--color-border)] px-4">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="text-[var(--color-muted)] transition-colors hover:text-[var(--color-fg)] md:hidden"
          >
            <Menu className="h-4 w-4" />
          </button>
          <div className="flex-1" />
          <ThemeToggle />
        </header>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
