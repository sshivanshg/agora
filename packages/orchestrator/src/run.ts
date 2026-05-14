import {
  db,
  debatePersonas,
  debateTurns,
  debates,
  eq,
  instanceConfig,
  personas as personasTable,
} from "@agora/db";
import type { Persona } from "@agora/personas";
import { personaFrontmatterSchema } from "@agora/personas";
import { createId } from "@paralleldrive/cuid2";
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

const DEFAULT_PER_DEBATE_CEILING_USD = 0.5;
const DEFAULT_PER_DAY_CEILING_USD = 5.0;

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

async function readNumericConfig(key: string, fallback: number): Promise<number> {
  const [row] = await db.select().from(instanceConfig).where(eq(instanceConfig.key, key)).limit(1);
  if (!row) return fallback;
  const v = row.value as unknown;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

export async function readCostCeilings(): Promise<{
  perDebateUsd: number;
  perDayUsd: number;
}> {
  const [perDebateUsd, perDayUsd] = await Promise.all([
    readNumericConfig("cost_ceiling_per_debate_usd", DEFAULT_PER_DEBATE_CEILING_USD),
    readNumericConfig("cost_ceiling_per_day_usd", DEFAULT_PER_DAY_CEILING_USD),
  ]);
  return { perDebateUsd, perDayUsd };
}

export async function* runDebate(input: RunDebateInput): AsyncGenerator<DebateStreamEvent, void> {
  const { debateId } = input;

  try {
    const [debate] = await db.select().from(debates).where(eq(debates.id, debateId)).limit(1);
    if (!debate) throw new Error(`Debate ${debateId} not found`);

    const { perDebateUsd: ceilingPerDebate } = await readCostCeilings();
    const softCeiling = ceilingPerDebate * 0.8;

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
        modelPreference: p.modelPreference ?? "claude-haiku-4-5",
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
    let truncatedForCost = false;

    const emit = async (event: DebateStreamEvent): Promise<DebateStreamEvent> => {
      seqNo += 1;
      await recordEvent(debateId, seqNo, event);
      return event;
    };

    for (const phase of PHASE_SEQUENCE) {
      // Hard ceiling: abort entirely
      if (state.totalCostUsd >= ceilingPerDebate) {
        await db
          .update(debates)
          .set({
            status: "failed",
            errorMessage: "cost_ceiling_exceeded",
            totalCost: state.totalCostUsd,
            wasCostTruncated: true,
          })
          .where(eq(debates.id, debateId));
        yield await emit({ type: "error", message: "cost_ceiling_exceeded" });
        return;
      }

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
        const gen = synthesize(state, turnId, { truncated: truncatedForCost });
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
        // Soft ceiling: jump to synthesis after current accumulation
        if (state.totalCostUsd >= softCeiling) {
          truncatedForCost = true;
          break;
        }
        // Hard ceiling check mid-phase
        if (state.totalCostUsd >= ceilingPerDebate) {
          truncatedForCost = true;
          break;
        }

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

      // If we decided to truncate mid-phase, fast-forward through remaining
      // debater phases — only the synthesis phase will still run, with the
      // truncated flag set so the synthesizer is informed.
      if (truncatedForCost) continue;
    }

    state.isComplete = true;
    await db
      .update(debates)
      .set({
        status: "completed",
        completedAt: new Date(),
        totalCost: state.totalCostUsd,
        wasCostTruncated: truncatedForCost,
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
