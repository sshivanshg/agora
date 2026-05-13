import { db, debatePersonas, debates, personas } from "@agora/db";
import { runDebate } from "@agora/orchestrator";
import { eq } from "drizzle-orm";

const PERSONA_COLORS: Record<string, string> = {
  "classical-liberal": "\x1b[33m",
  "progressive-reformer": "\x1b[31m",
  "conservative-traditionalist": "\x1b[34m",
  technocrat: "\x1b[36m",
};
const RESET = "\x1b[0m";
const DIM = "\x1b[2m";
const BOLD = "\x1b[1m";

async function main() {
  const resolution = process.argv.slice(2).join(" ").trim();
  if (!resolution || resolution.split(/\s+/).length < 8) {
    console.error('Usage: pnpm debate "<resolution of at least 8 words>"');
    process.exit(1);
  }

  const allPersonas = await db.select().from(personas).where(eq(personas.isActive, true));
  if (allPersonas.length < 2) {
    console.error("No active personas in DB. Run `pnpm personas:sync` first.");
    process.exit(1);
  }

  console.log(`${DIM}Resolution:${RESET} ${BOLD}${resolution}${RESET}`);
  console.log(`${DIM}Personas:${RESET} ${allPersonas.map((p) => p.name).join(", ")}\n`);

  const inserted = await db
    .insert(debates)
    .values({ resolution, format: "oxford_lite", country: "global", status: "pending" })
    .returning();
  const created = inserted[0];
  if (!created) {
    console.error("Failed to create debate row.");
    process.exit(1);
  }

  await db
    .insert(debatePersonas)
    .values(allPersonas.map((p, i) => ({ debateId: created.id, personaId: p.id, order: i })));

  const start = Date.now();

  try {
    for await (const ev of runDebate({ debateId: created.id })) {
      switch (ev.type) {
        case "phase_change":
          console.log(`\n${DIM}── ${ev.phase.toUpperCase()} ──${RESET}\n`);
          break;
        case "turn_start": {
          const slug = ev.personaSlug;
          const color = slug ? (PERSONA_COLORS[slug] ?? "") : "";
          const name =
            ev.role === "moderator"
              ? "MODERATOR"
              : ev.role === "synthesizer"
                ? "SYNTHESIZER"
                : (slug ?? "SPEAKER");
          process.stdout.write(`${color}${BOLD}[${name}]${RESET} `);
          break;
        }
        case "turn_chunk":
          process.stdout.write(ev.delta);
          break;
        case "synthesis_chunk":
          process.stdout.write(ev.delta);
          break;
        case "turn_end":
          process.stdout.write(
            `\n${DIM}(${ev.tokenCount} tokens, $${ev.costUsd.toFixed(5)})${RESET}\n\n`,
          );
          break;
        case "complete":
          console.log(`\n${BOLD}Debate complete.${RESET}`);
          console.log(`${DIM}Total cost: $${ev.totalCostUsd.toFixed(4)}${RESET}`);
          console.log(`${DIM}Duration: ${((Date.now() - start) / 1000).toFixed(1)}s${RESET}`);
          break;
        case "error":
          console.error(`\n${BOLD}ERROR:${RESET} ${ev.message}`);
          process.exit(1);
      }
    }
  } catch (err) {
    console.error("Debate run crashed:", err);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
