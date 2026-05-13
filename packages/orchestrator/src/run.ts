import { db, debatePersonas, debateTurns, debates, personas as personasTable } from "@agora/db";
import type { Persona } from "@agora/personas";
import { personaFrontmatterSchema } from "@agora/personas";
import { createId } from "@paralleldrive/cuid2";
import { eq } from "drizzle-orm";
import matter from "gray-matter";
import { speak } from "./agents/debater";
import { checkTurn } from "./agents/factchecker";
import { frame, synthesize } from "./agents/moderator";
import { recordEvent } from "./events";
import type {
  DebateFormat,
  DebatePhase,
  DebateState,
  DebateStreamEvent,
  RecordedTurn,
} from "./state";

export interface RunDebateInput {
  debateId: string;
}

const PHASE_SEQUENCE: DebatePhase[] = [
  "framing",
  "opening",
  "cross_examination",
  "rebuttal",
  "closing",
  "synthesis",
];

function orderForPhase(phase: DebatePhase, openingOrder: Persona[]): Persona[] {
  switch (phase) {
    case "opening":
      return openingOrder;
    case "cross_examination": {
      if (openingOrder.length === 0) return [];
      const first = openingOrder[0];
      if (!first) return [];
      return [...openingOrder.slice(1), first];
    }
    case "rebuttal":
      return openingOrder;
    case "closing":
      return [...openingOrder].reverse();
    default:
      return [];
  }
}

export async function* runDebate(input: RunDebateInput): AsyncGenerator<DebateStreamEvent, void> {
  const { debateId } = input;

  try {
    const [debate] = await db.select().from(debates).where(eq(debates.id, debateId)).limit(1);
    if (!debate) throw new Error(`Debate ${debateId} not found`);

    const dbPersonas = await db
      .select()
      .from(personasTable)
      .innerJoin(debatePersonas, eq(personasTable.id, debatePersonas.personaId))
      .where(eq(debatePersonas.debateId, debateId))
      .orderBy(debatePersonas.order);

    const personasInDebate: Persona[] = dbPersonas.map(({ personas: p }) => {
      const parsed = matter(p.specContent);
      const fmResult = personaFrontmatterSchema.safeParse(parsed.data);
      if (!fmResult.success) {
        throw new Error(`Invalid persona frontmatter for ${p.slug}`);
      }
      return {
        slug: p.slug,
        name: p.name,
        worldviewTag: p.worldviewTag,
        modelPreference: p.modelPreference ?? "claude-sonnet-4-5",
        temperature: p.temperature,
        specContent: p.specContent,
        specHash: p.specHash,
        frontmatter: fmResult.data,
        body: parsed.content,
      };
    });

    const personaDbIds: Record<string, string> = {};
    for (const { personas: p } of dbPersonas) personaDbIds[p.slug] = p.id;

    await db.update(debates).set({ status: "running" }).where(eq(debates.id, debateId));

    const state: DebateState = {
      debateId,
      resolution: debate.resolution,
      framingNotes: debate.framingNotes ?? "",
      personas: personasInDebate,
      personaDbIds,
      format: (debate.format as DebateFormat) ?? "oxford_lite",
      phase: "framing",
      turns: [],
      totalCostUsd: 0,
      isComplete: false,
    };

    let turnOrder = 0;
    let seqNo = 0;

    const emit = async (event: DebateStreamEvent): Promise<DebateStreamEvent> => {
      seqNo += 1;
      await recordEvent(debateId, seqNo, event);
      return event;
    };

    for (const phase of PHASE_SEQUENCE) {
      state.phase = phase;
      yield await emit({ type: "phase_change", phase });

      if (phase === "framing") {
        const turnId = createId();
        await db.insert(debateTurns).values({
          id: turnId,
          debateId,
          personaId: null,
          phase: "framing",
          role: "moderator",
          content: "",
          turnOrder: turnOrder++,
        });
        yield await emit({
          type: "turn_start",
          turnId,
          personaSlug: null,
          role: "moderator",
          phase: "framing",
        });
        let buf = "";
        const gen = frame(state, turnId);
        while (true) {
          const r = await gen.next();
          if (r.done) {
            await db.update(debateTurns).set({ content: buf }).where(eq(debateTurns.id, turnId));
            state.totalCostUsd += r.value.costUsd;
            yield await emit({
              type: "turn_end",
              turnId,
              tokenCount: r.value.tokenCount,
              costUsd: r.value.costUsd,
            });
            break;
          }
          buf += r.value;
          yield await emit({ type: "turn_chunk", turnId, delta: r.value });
        }
        state.turns.push({
          id: turnId,
          personaId: null,
          personaSlug: null,
          role: "moderator",
          phase: "framing",
          content: buf,
          turnOrder: turnOrder - 1,
        });
        continue;
      }

      if (phase === "synthesis") {
        const turnId = createId();
        await db.insert(debateTurns).values({
          id: turnId,
          debateId,
          personaId: null,
          phase: "synthesis",
          role: "synthesizer",
          content: "",
          turnOrder: turnOrder++,
        });
        yield await emit({
          type: "turn_start",
          turnId,
          personaSlug: null,
          role: "synthesizer",
          phase: "synthesis",
        });
        let buf = "";
        const gen = synthesize(state, turnId);
        while (true) {
          const r = await gen.next();
          if (r.done) {
            await db.update(debateTurns).set({ content: buf }).where(eq(debateTurns.id, turnId));
            state.totalCostUsd += r.value.costUsd;
            yield await emit({
              type: "turn_end",
              turnId,
              tokenCount: r.value.tokenCount,
              costUsd: r.value.costUsd,
            });
            break;
          }
          buf += r.value;
          yield await emit({ type: "synthesis_chunk", delta: r.value });
        }
        state.turns.push({
          id: turnId,
          personaId: null,
          personaSlug: null,
          role: "synthesizer",
          phase: "synthesis",
          content: buf,
          turnOrder: turnOrder - 1,
        });
        continue;
      }

      const speakers = orderForPhase(phase, personasInDebate);
      for (const persona of speakers) {
        const turnId = createId();
        await db.insert(debateTurns).values({
          id: turnId,
          debateId,
          personaId: personaDbIds[persona.slug] ?? null,
          phase,
          role: "debater",
          content: "",
          turnOrder: turnOrder++,
        });
        yield await emit({
          type: "turn_start",
          turnId,
          personaSlug: persona.slug,
          role: "debater",
          phase,
        });

        let buf = "";
        const gen = speak({
          persona,
          phase,
          resolution: state.resolution,
          framingNotes: state.framingNotes,
          transcript: state.turns,
          turnId,
        });
        while (true) {
          const r = await gen.next();
          if (r.done) {
            await db.update(debateTurns).set({ content: buf }).where(eq(debateTurns.id, turnId));
            state.totalCostUsd += r.value.costUsd;
            yield await emit({
              type: "turn_end",
              turnId,
              tokenCount: r.value.tokenCount,
              costUsd: r.value.costUsd,
            });
            const recorded: RecordedTurn = {
              id: turnId,
              personaId: personaDbIds[persona.slug] ?? null,
              personaSlug: persona.slug,
              role: "debater",
              phase,
              content: buf,
              turnOrder: turnOrder - 1,
            };
            state.turns.push(recorded);
            checkTurn(recorded, debateId).catch(() => {
              /* ignore */
            });
            break;
          }
          buf += r.value;
          yield await emit({ type: "turn_chunk", turnId, delta: r.value });
        }
      }
    }

    state.isComplete = true;
    await db
      .update(debates)
      .set({
        status: "completed",
        completedAt: new Date(),
        totalCost: state.totalCostUsd,
      })
      .where(eq(debates.id, debateId));
    yield await emit({ type: "complete", totalCostUsd: state.totalCostUsd });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    try {
      await db
        .update(debates)
        .set({ status: "failed", errorMessage: message })
        .where(eq(debates.id, debateId));
    } catch {
      /* ignore */
    }
    yield { type: "error", message };
  }
}
