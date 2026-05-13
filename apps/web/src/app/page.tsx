import { db, debateTurns, debates, instanceConfig, personas } from "@agora/db";
import { DebateMessage, PhaseBar, Resolution, Separator } from "@agora/ui";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

const DEBATE_PHASES = [
  "Framing",
  "Opening",
  "Cross-Examination",
  "Rebuttal",
  "Closing",
  "Synthesis",
];
const PHASE_ORDER = ["framing", "opening", "cross_examination", "rebuttal", "closing", "synthesis"];

export default async function HomePage() {
  // Check setup completion
  const [setup] = await db
    .select()
    .from(instanceConfig)
    .where(eq(instanceConfig.key, "setup_completed"))
    .limit(1);

  if (!setup || setup.value !== true) {
    redirect("/setup");
  }

  // Fetch most recent completed debate
  const [debate] = await db
    .select()
    .from(debates)
    .where(eq(debates.status, "completed"))
    .orderBy(debates.createdAt)
    .limit(1);

  if (!debate) {
    return (
      <div className="mx-auto max-w-[720px] px-6 py-24">
        <p className="font-mono text-sm text-[oklch(0.55_0_0)]">No debates yet.</p>
      </div>
    );
  }

  // Fetch turns
  const turns = await db
    .select({
      id: debateTurns.id,
      phase: debateTurns.phase,
      role: debateTurns.role,
      content: debateTurns.content,
      turnOrder: debateTurns.turnOrder,
      personaId: debateTurns.personaId,
    })
    .from(debateTurns)
    .where(eq(debateTurns.debateId, debate.id))
    .orderBy(debateTurns.turnOrder);

  // Fetch all personas
  const allPersonas = await db.select().from(personas);
  const personaMap = new Map(allPersonas.map((p) => [p.id, p]));

  // Determine current phase index (for PhaseBar)
  const lastPhase = turns.at(-1)?.phase ?? "framing";
  const phaseIndex = PHASE_ORDER.indexOf(lastPhase) + 1;

  return (
    <div className="mx-auto max-w-[720px] px-6 py-16">
      {/* Phase bar */}
      <PhaseBar phases={DEBATE_PHASES} currentIndex={phaseIndex} className="mb-12" />

      {/* Resolution */}
      <Resolution text={debate.resolution} className="mb-12" />
      <Separator className="mb-12" />

      {/* Debate turns */}
      <div>
        {turns.map((turn, i) => {
          const persona = turn.personaId ? personaMap.get(turn.personaId) : undefined;
          const name = persona?.name ?? (turn.role === "moderator" ? "Moderator" : "Synthesizer");
          const phaseLabel = turn.phase.replace(/_/g, " ");
          return (
            <div key={turn.id}>
              <DebateMessage personaName={name} phase={phaseLabel} content={turn.content} />
              {i < turns.length - 1 && <Separator />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
