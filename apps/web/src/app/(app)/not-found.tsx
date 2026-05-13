import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-6">
      <p className="font-mono text-6xl font-bold text-[var(--color-border)]">404</p>
      <h1 className="mt-4 text-lg font-semibold text-[var(--color-fg)]">Page not found</h1>
      <p className="mt-2 text-sm text-[var(--color-muted)]">
        The page you're looking for doesn't exist.
      </p>
      <Link
        href="/home"
        className="mt-8 font-mono text-sm text-[var(--color-accent)] hover:underline underline-offset-4"
      >
        ← Back home
      </Link>
    </div>
  );
}
