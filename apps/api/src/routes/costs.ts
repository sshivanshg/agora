import { db, debates, gte, sql } from "@agora/db";
import { readCostCeilings } from "@agora/orchestrator";
import { Hono } from "hono";
import type { OwnerEnv } from "../middleware/owner.js";

export const costsRouter = new Hono<OwnerEnv>();

function dayStart(d: Date): Date {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

interface Window {
  spentUsd: number;
  debateCount: number;
  ceilingUsd: number;
  percentUsed: number;
}

costsRouter.get("/summary", async (c) => {
  const { perDebateUsd, perDayUsd } = await readCostCeilings();

  const now = new Date();
  const today = dayStart(now);
  const weekStart = new Date(today);
  weekStart.setUTCDate(today.getUTCDate() - 6);
  const monthStart = new Date(today);
  monthStart.setUTCDate(today.getUTCDate() - 29);

  async function aggregate(since: Date): Promise<{ spentUsd: number; debateCount: number }> {
    const [row] = await db
      .select({
        total: sql<number>`coalesce(sum(${debates.totalCost}), 0)`,
        count: sql<number>`count(*)::int`,
      })
      .from(debates)
      .where(gte(debates.createdAt, since));
    return {
      spentUsd: Number(row?.total ?? 0),
      debateCount: Number(row?.count ?? 0),
    };
  }

  const [t, w, m] = await Promise.all([
    aggregate(today),
    aggregate(weekStart),
    aggregate(monthStart),
  ]);

  // Daily breakdown — last 30 days
  const dailyRows = await db
    .select({
      date: sql<string>`to_char(${debates.createdAt} at time zone 'UTC', 'YYYY-MM-DD')`,
      spentUsd: sql<number>`coalesce(sum(${debates.totalCost}), 0)`,
      debateCount: sql<number>`count(*)::int`,
    })
    .from(debates)
    .where(gte(debates.createdAt, monthStart))
    .groupBy(sql`to_char(${debates.createdAt} at time zone 'UTC', 'YYYY-MM-DD')`)
    .orderBy(sql`to_char(${debates.createdAt} at time zone 'UTC', 'YYYY-MM-DD') desc`);

  const todayWindow: Window = {
    spentUsd: t.spentUsd,
    debateCount: t.debateCount,
    ceilingUsd: perDayUsd,
    percentUsed: perDayUsd > 0 ? t.spentUsd / perDayUsd : 0,
  };
  const weekCeiling = perDayUsd * 7;
  const monthCeiling = perDayUsd * 30;
  const weekWindow: Window = {
    spentUsd: w.spentUsd,
    debateCount: w.debateCount,
    ceilingUsd: weekCeiling,
    percentUsed: weekCeiling > 0 ? w.spentUsd / weekCeiling : 0,
  };
  const monthWindow: Window = {
    spentUsd: m.spentUsd,
    debateCount: m.debateCount,
    ceilingUsd: monthCeiling,
    percentUsed: monthCeiling > 0 ? m.spentUsd / monthCeiling : 0,
  };

  return c.json({
    today: todayWindow,
    week: weekWindow,
    month: monthWindow,
    perDebateCeiling: perDebateUsd,
    perDayCeiling: perDayUsd,
    daily: dailyRows.map((r) => ({
      date: r.date,
      spentUsd: Number(r.spentUsd),
      debateCount: Number(r.debateCount),
    })),
  });
});
