import {
  and,
  asc,
  db,
  debatePersonas,
  debateTurns,
  debates,
  desc,
  eq,
  factChecks,
  gt,
  gte,
  inArray,
  personas as personasTable,
  sql,
  streamEvents,
} from "@agora/db";
import { readCostCeilings, runDebate } from "@agora/orchestrator";
import type { DebateStreamEvent } from "@agora/orchestrator";
import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { z } from "zod";

const createDebateBody = z.object({
  resolution: z
    .string()
    .min(10)
    .max(300)
    .refine((s) => s.trim().split(/\s+/).length >= 8, "Resolution must contain at least 8 words"),
  framingNotes: z.string().max(1000).optional().default(""),
  personaSlugs: z.array(z.string()).min(2).max(5),
  format: z.enum(["oxford_lite", "socratic", "lincoln_douglas"]).default("oxford_lite"),
  modelId: z.object({
    provider: z.enum(["anthropic", "openai", "google", "groq", "ollama"]),
    model: z.string().min(1),
  }),
  country: z.enum(["global", "in", "us", "uk", "eu", "br", "other"]).default("global"),
});

const dryRunBody = createDebateBody.pick({
  resolution: true,
  framingNotes: true,
  personaSlugs: true,
});

export const debatesRouter = new Hono();

/** Per-debate active SSE viewer count. */
const watchingCounts = new Map<string, number>();
function incWatching(id: string): number {
  const n = (watchingCounts.get(id) ?? 0) + 1;
  watchingCounts.set(id, n);
  return n;
}
function decWatching(id: string): number {
  const n = Math.max(0, (watchingCounts.get(id) ?? 0) - 1);
  if (n === 0) watchingCounts.delete(id);
  else watchingCounts.set(id, n);
  return n;
}

// POST /debates  -> creates debate, kicks off run in background
debatesRouter.post("/", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const parsed = createDebateBody.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "validation_failed", details: parsed.error.flatten() }, 400);
  }
  const { resolution, framingNotes, personaSlugs, format, country } = parsed.data;

  // Per-day cost ceiling check
  const { perDayUsd: ceilingPerDay } = await readCostCeilings();
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  const todaySpend = await db
    .select({ total: sql<number>`coalesce(sum(${debates.totalCost}), 0)` })
    .from(debates)
    .where(gte(debates.createdAt, todayStart));
  const spentToday = Number(todaySpend[0]?.total ?? 0);
  if (spentToday >= ceilingPerDay) {
    return c.json(
      {
        error: "daily_cost_ceiling_exceeded",
        spent: spentToday,
        ceiling: ceilingPerDay,
      },
      429,
    );
  }

  const matched = await db
    .select()
    .from(personasTable)
    .where(and(inArray(personasTable.slug, personaSlugs), eq(personasTable.isActive, true)));
  if (matched.length !== personaSlugs.length) {
    return c.json(
      { error: "personas_not_found", requested: personaSlugs, found: matched.map((p) => p.slug) },
      400,
    );
  }

  const [created] = await db
    .insert(debates)
    .values({ resolution, framingNotes, format, country, status: "pending" })
    .returning();
  if (!created) {
    return c.json({ error: "create_failed" }, 500);
  }

  // Preserve order
  await db.insert(debatePersonas).values(
    personaSlugs.map((slug, i) => {
      const persona = matched.find((p) => p.slug === slug);
      if (!persona) throw new Error("impossible");
      return { debateId: created.id, personaId: persona.id, order: i };
    }),
  );

  // Fire and forget — run consumes orchestrator generator entirely
  (async () => {
    try {
      for await (const _ of runDebate({ debateId: created.id })) {
        // events are already persisted to stream_events by the orchestrator
      }
    } catch (err) {
      console.error(`[debate ${created.id}] run crashed:`, err);
    }
  })();

  return c.json({ debateId: created.id }, 201);
});

// POST /debates/dry-run -> return what the agent system prompts would look like, no model call
debatesRouter.post("/dry-run", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const parsed = dryRunBody.safeParse(body);
  if (!parsed.success)
    return c.json({ error: "validation_failed", details: parsed.error.flatten() }, 400);

  const found = await db
    .select()
    .from(personasTable)
    .where(inArray(personasTable.slug, parsed.data.personaSlugs));
  return c.json({
    resolution: parsed.data.resolution,
    framingNotes: parsed.data.framingNotes,
    personas: found.map((p) => ({
      slug: p.slug,
      name: p.name,
      worldviewTag: p.worldviewTag,
      modelPreference: p.modelPreference,
      systemPromptPreview: p.specContent.slice(0, 800),
    })),
  });
});

// GET /debates  -> list (for archive)
debatesRouter.get("/", async (c) => {
  const limit = Number(c.req.query("limit") ?? "50");
  const country = c.req.query("country");
  const format = c.req.query("format");

  const conditions = [];
  if (country) conditions.push(eq(debates.country, country));
  if (format) conditions.push(eq(debates.format, format));

  const query = conditions.length
    ? db
        .select()
        .from(debates)
        .where(and(...conditions))
        .orderBy(desc(debates.createdAt))
        .limit(limit)
    : db.select().from(debates).orderBy(desc(debates.createdAt)).limit(limit);

  return c.json({ debates: await query });
});

// GET /debates/:id -> metadata + turns + fact checks
debatesRouter.get("/:id", async (c) => {
  const id = c.req.param("id");
  const [debate] = await db.select().from(debates).where(eq(debates.id, id)).limit(1);
  if (!debate) return c.json({ error: "not_found" }, 404);

  const turns = await db
    .select()
    .from(debateTurns)
    .where(eq(debateTurns.debateId, id))
    .orderBy(asc(debateTurns.turnOrder));
  const personasInDebate = await db
    .select({
      personaId: debatePersonas.personaId,
      order: debatePersonas.order,
      slug: personasTable.slug,
      name: personasTable.name,
      worldviewTag: personasTable.worldviewTag,
    })
    .from(debatePersonas)
    .innerJoin(personasTable, eq(personasTable.id, debatePersonas.personaId))
    .where(eq(debatePersonas.debateId, id))
    .orderBy(asc(debatePersonas.order));
  const checks = await db.select().from(factChecks).where(eq(factChecks.debateId, id));

  return c.json({ debate, turns, personas: personasInDebate, factChecks: checks });
});

// GET /debates/:id/watching -> { count }
debatesRouter.get("/:id/watching", (c) => {
  const id = c.req.param("id");
  return c.json({ count: watchingCounts.get(id) ?? 0 });
});

// GET /debates/:id/stream -> SSE
debatesRouter.get("/:id/stream", (c) => {
  const id = c.req.param("id");

  return streamSSE(c, async (stream) => {
    let lastSeq = Number(c.req.query("lastSeq") ?? "0");

    const [debate] = await db.select().from(debates).where(eq(debates.id, id)).limit(1);
    if (!debate) {
      await stream.writeSSE({
        event: "error",
        data: JSON.stringify({ type: "error", message: "not_found" }),
      });
      return;
    }

    incWatching(id);
    let watchingDecremented = false;
    const releaseWatching = () => {
      if (watchingDecremented) return;
      watchingDecremented = true;
      decWatching(id);
    };
    const abortSignal = c.req.raw.signal;
    if (abortSignal) {
      abortSignal.addEventListener("abort", releaseWatching, { once: true });
    }

    let heartbeat: ReturnType<typeof setInterval> | null = null;
    let closed = false;

    const sendBatch = async () => {
      const events = await db
        .select()
        .from(streamEvents)
        .where(and(eq(streamEvents.debateId, id), gt(streamEvents.seqNo, lastSeq)))
        .orderBy(asc(streamEvents.seqNo));
      for (const ev of events) {
        await stream.writeSSE({
          id: String(ev.seqNo),
          data: JSON.stringify(ev.event),
        });
        lastSeq = ev.seqNo;
        const e = ev.event as DebateStreamEvent;
        if (e.type === "complete" || e.type === "error") {
          closed = true;
        }
      }
    };

    // Initial replay
    await sendBatch();

    if (closed || debate.status === "completed" || debate.status === "failed") {
      return;
    }

    // Heartbeat every 15s
    heartbeat = setInterval(() => {
      stream.writeSSE({ event: "ping", data: "" }).catch(() => {});
    }, 15_000);

    // Poll for new events every 500ms until complete
    while (!closed) {
      await new Promise((r) => setTimeout(r, 500));
      await sendBatch();
      if (closed) break;
      // Re-check debate status as fallback
      const [d] = await db.select().from(debates).where(eq(debates.id, id)).limit(1);
      if (!d || d.status === "completed" || d.status === "failed") {
        await sendBatch(); // final flush
        closed = true;
      }
    }

    if (heartbeat) clearInterval(heartbeat);
  });
});
