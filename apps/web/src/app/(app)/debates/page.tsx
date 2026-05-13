import { db, debates } from "@agora/db";
import { EmptyState } from "@agora/ui";
import { desc } from "drizzle-orm";
import { MessageSquare } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Debates" };

export default async function DebatesPage() {
  const allDebates = await db.select().from(debates).orderBy(desc(debates.createdAt));

  if (allDebates.length === 0) {
    return (
      <div className="p-6">
        <h1 className="mb-8 text-xl font-semibold text-[var(--color-fg)]">Debates</h1>
        <EmptyState
          icon={<MessageSquare className="h-10 w-10" />}
          title="No debates yet"
          description="Use the Workshop to start your first debate."
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[800px] px-6 py-8">
      <h1 className="mb-8 text-xl font-semibold text-[var(--color-fg)]">Debates</h1>
      <div className="space-y-3">
        {allDebates.map((debate) => (
          <Link
            key={debate.id}
            href={`/debates/${debate.id}`}
            className="group flex flex-col gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-5 transition-colors hover:border-[var(--color-muted)]"
          >
            <div className="flex items-start justify-between gap-4">
              <p
                className="text-sm font-medium text-[var(--color-fg)] group-hover:text-[var(--color-accent)] transition-colors"
                style={{ textWrap: "balance" } as React.CSSProperties}
              >
                {debate.resolution}
              </p>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.06em] ${
                  debate.status === "completed"
                    ? "bg-[var(--color-success)]/15 text-[var(--color-success)]"
                    : debate.status === "running"
                      ? "bg-[var(--color-accent)]/15 text-[var(--color-accent)]"
                      : "bg-[var(--color-border)] text-[var(--color-muted)]"
                }`}
              >
                {debate.status}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--color-muted)]">
                {debate.format.replace(/_/g, " ")}
              </span>
              <span className="text-[var(--color-border)]">·</span>
              <span className="font-mono text-[10px] text-[var(--color-muted)]">
                {new Date(debate.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
