import { db, debatePersonas, debateTurns, debates, personas } from "@agora/db";
import type { TheaterMode } from "@agora/ui";
import { asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { DebatePageShell } from "./debate-page-shell";
import { DebateStream } from "./debate-stream";
import { TheaterPreview } from "./theater-preview";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [debate] = await db.select().from(debates).where(eq(debates.id, id)).limit(1);
  if (!debate) return { title: "Debate" };
  const short =
    debate.resolution.length > 60 ? `${debate.resolution.slice(0, 57)}…` : debate.resolution;
  return { title: short };
}

export default async function DebatePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const { id } = await params;
  const { mode } = await searchParams;
  const [debate] = await db.select().from(debates).where(eq(debates.id, id)).limit(1);
  if (!debate) notFound();

  const resolvedMode: TheaterMode = mode === "read" ? "read" : "watch";
  if (resolvedMode === "watch") {
    return (
      <DebatePageShell debateId={id} mode="watch">
        <TheaterPreview debateId={id} resolution={debate.resolution} />
      </DebatePageShell>
    );
  }

  const turns = await db
    .select({
      id: debateTurns.id,
      phase: debateTurns.phase,
      role: debateTurns.role,
      content: debateTurns.content,
      turnOrder: debateTurns.turnOrder,
      personaId: debateTurns.personaId,
      tokenCount: debateTurns.tokenCount,
      costUsd: debateTurns.costUsd,
    })
    .from(debateTurns)
    .where(eq(debateTurns.debateId, id))
    .orderBy(asc(debateTurns.turnOrder));

  const personasInDebate = await db
    .select({
      id: personas.id,
      slug: personas.slug,
      name: personas.name,
      worldviewTag: personas.worldviewTag,
    })
    .from(debatePersonas)
    .innerJoin(personas, eq(personas.id, debatePersonas.personaId))
    .where(eq(debatePersonas.debateId, id))
    .orderBy(asc(debatePersonas.order));

  return (
    <DebatePageShell debateId={id} mode="read">
      <DebateStream
        debateId={id}
        initialDebate={{
          id: debate.id,
          resolution: debate.resolution,
          status: debate.status,
          totalCost: debate.totalCost,
          country: debate.country,
        }}
        initialTurns={turns.map((t) => ({ ...t, isStreaming: false }))}
        personas={personasInDebate}
      />
    </DebatePageShell>
  );
}
