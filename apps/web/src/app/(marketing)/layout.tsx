import { ThemeToggle } from "@agora/ui";
import Link from "next/link";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="fixed top-0 z-40 w-full border-b border-[var(--color-border)] bg-[var(--color-bg)]/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between px-6">
          <Link
            href="/"
            className="font-mono text-sm lowercase tracking-[0.08em] text-[var(--color-fg)]"
          >
            agora
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <Link
              href="/personas"
              className="text-sm text-[var(--color-muted)] transition-colors hover:text-[var(--color-fg)]"
            >
              Personas
            </Link>
            <Link
              href="/about"
              className="text-sm text-[var(--color-muted)] transition-colors hover:text-[var(--color-fg)]"
            >
              About
            </Link>
            <Link
              href="https://github.com/your-org/agora"
              className="text-sm text-[var(--color-muted)] transition-colors hover:text-[var(--color-fg)]"
            >
              GitHub
            </Link>
            <ThemeToggle />
            <Link
              href="/today"
              className="rounded-md bg-[var(--color-accent)] px-4 py-1.5 font-mono text-xs lowercase tracking-[0.04em] text-[var(--color-bg)] transition-opacity hover:opacity-90"
            >
              Open Agora →
            </Link>
          </nav>
          <div className="flex items-center gap-3 md:hidden">
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="flex-1 pt-14">{children}</main>
    </div>
  );
}
