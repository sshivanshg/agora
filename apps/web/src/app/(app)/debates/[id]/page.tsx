import { db, debatePersonas, debateTurns, debates, personas } from "@agora/db";
import { asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { DebateStream } from "./debate-stream";

export default async function DebatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [debate] = await db.select().from(debates).where(eq(debates.id, id)).limit(1);
  if (!debate) notFound();

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
  );
}
