import { db, streamEvents } from "@agora/db";
import { and, asc, eq, gt, sql } from "drizzle-orm";
import type { DebateStreamEvent } from "./state";

function channelFor(debateId: string): string {
  return `debate_${debateId.replace(/[^a-z0-9]/gi, "")}`;
}

export async function recordEvent(
  debateId: string,
  seqNo: number,
  event: DebateStreamEvent,
): Promise<void> {
  await db.insert(streamEvents).values({ debateId, seqNo, event });
  try {
    const channel = channelFor(debateId);
    await db.execute(sql.raw(`NOTIFY ${channel}, '${seqNo}'`));
  } catch {
    /* ignore */
  }
}

export async function readEventsSince(
  debateId: string,
  lastSeqNo: number,
): Promise<Array<{ seqNo: number; event: DebateStreamEvent }>> {
  const rows = await db
    .select()
    .from(streamEvents)
    .where(and(eq(streamEvents.debateId, debateId), gt(streamEvents.seqNo, lastSeqNo)))
    .orderBy(asc(streamEvents.seqNo));
  return rows.map((r) => ({ seqNo: r.seqNo, event: r.event as DebateStreamEvent }));
}
