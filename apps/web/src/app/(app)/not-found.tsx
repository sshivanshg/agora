import Link from "next/link";

export const metadata = { title: "Not found" };

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <h1 className="font-serif text-4xl text-[var(--color-fg)]">Not found.</h1>
      <p className="mt-3 font-mono text-xs uppercase tracking-[0.08em] text-[var(--color-muted)]">
        The page you asked for doesn't exist (or doesn't yet).
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          href="/today"
          className="rounded-md border border-[var(--color-border)] px-4 py-2 font-mono text-xs lowercase tracking-[0.04em] text-[var(--color-muted)] transition-colors hover:border-[var(--color-muted)] hover:text-[var(--color-fg)]"
        >
          Today
        </Link>
        <Link
          href="/"
          className="rounded-md border border-[var(--color-border)] px-4 py-2 font-mono text-xs lowercase tracking-[0.04em] text-[var(--color-muted)] transition-colors hover:border-[var(--color-muted)] hover:text-[var(--color-fg)]"
        >
          Marketing
        </Link>
      </div>
    </div>
  );
}
