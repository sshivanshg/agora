import { createHash } from "node:crypto";
import { createId } from "@paralleldrive/cuid2";
import { eq, inArray } from "drizzle-orm";
import { db } from "./client.js";
import { debatePersonas, debateTurns, debates, personas } from "./schema/index.js";

function sha256(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

const personaData = [
  {
    slug: "classical-liberal",
    name: "The Classical Liberal",
    worldviewTag: "Liberty & Rule of Law",
    specContent:
      "Champion of individual freedoms, limited government, free markets, and the rule of law as the foundation of a just society.",
  },
  {
    slug: "progressive-reformer",
    name: "The Progressive Reformer",
    worldviewTag: "Justice & Collective Action",
    specContent:
      "Advocate for systemic change, social equity, collective action, and using democratic institutions to address structural injustices.",
  },
  {
    slug: "conservative-traditionalist",
    name: "The Conservative Traditionalist",
    worldviewTag: "Order & Continuity",
    specContent:
      "Defender of time-tested institutions, cultural continuity, social order, and gradual reform grounded in inherited wisdom.",
  },
  {
    slug: "technocrat",
    name: "The Technocrat",
    worldviewTag: "Evidence & Efficiency",
    specContent:
      "Pursuer of evidence-based policy, rational optimization, data-driven governance, and measurable outcomes over ideological commitments.",
  },
] as const;

const openingContents: Record<string, string> = {
  "classical-liberal":
    "Mandating labels on AI-generated political content is a well-intentioned but ultimately dangerous overreach by the state into the realm of free expression. The marketplace of ideas has always been the proper arena for citizens to evaluate the credibility of information, and government-imposed labels create both chilling effects on innovation and perverse incentives for regulatory capture. We should trust individuals with the tools to discern, not deputize bureaucrats to pre-judge speech.",
  "progressive-reformer":
    "The proliferation of unlabeled AI-generated political content poses an existential threat to informed democratic participation, particularly for communities already marginalized by information asymmetries. Corporations and bad actors currently exploit this gap to manufacture consent without accountability, and labeling requirements are a minimal, proportionate intervention to restore epistemic fairness. Transparency is not censorship — it is the prerequisite for genuine free speech.",
  "conservative-traditionalist":
    "Our democratic traditions rest on citizens knowing who is speaking and why, a norm that AI-generated content silently dissolves by severing the link between authentic human authorship and political persuasion. While government mandates always carry risk of overreach, the alternative — allowing machines to invisibly reshape political discourse — represents a more radical rupture with the civic inheritance we have a duty to preserve. Prudent, narrowly-scoped disclosure requirements can safeguard that inheritance without surrendering it to bureaucratic excess.",
  technocrat:
    "The empirical evidence on disclosure effects is mixed, but the measurable harms from covert AI-generated political content — including documented influence operations and measurable erosion of institutional trust — justify a labeling requirement as a cost-effective intervention. Implementation should be grounded in technical standards such as cryptographic provenance verification rather than subjective editorial judgments, and effectiveness must be continuously evaluated against defined metrics. Any regulation enacted should include mandatory sunset clauses tied to evidence reviews.",
};

async function seed() {
  console.log("Seeding personas...");

  const insertedPersonas = await db
    .insert(personas)
    .values(
      personaData.map((p) => ({
        id: createId(),
        slug: p.slug,
        name: p.name,
        worldviewTag: p.worldviewTag,
        specContent: p.specContent,
        specHash: sha256(p.specContent),
      })),
    )
    .onConflictDoNothing()
    .returning();

  console.log(`Inserted ${insertedPersonas.length} personas (skipped existing).`);

  // Fetch all personas by slug to get their IDs (handles re-runs where insert is skipped)
  const allPersonas = await db.query.personas.findMany({
    where: inArray(
      personas.slug,
      personaData.map((x) => x.slug),
    ),
  });

  if (allPersonas.length !== 4) {
    throw new Error(`Expected 4 personas, got ${allPersonas.length}`);
  }

  console.log("Seeding example debate...");

  const debateId = createId();

  const insertedDebates = await db
    .insert(debates)
    .values({
      id: debateId,
      resolution: "Should AI-generated political content be labeled by law?",
      status: "completed",
      format: "oxford_lite",
      totalCost: 0,
    })
    .onConflictDoNothing()
    .returning();

  // If debate was already inserted, fetch its id
  const debateRow =
    insertedDebates[0] ??
    (await db.query.debates.findFirst({
      where: eq(debates.resolution, "Should AI-generated political content be labeled by law?"),
    }));

  if (!debateRow) {
    throw new Error("Failed to insert or find debate");
  }

  const activeDebateId = debateRow.id;

  console.log("Seeding debate personas...");

  await db
    .insert(debatePersonas)
    .values(
      allPersonas.map((persona, i) => ({
        debateId: activeDebateId,
        personaId: persona.id,
        order: i,
      })),
    )
    .onConflictDoNothing();

  console.log("Seeding debate turns...");

  await db
    .insert(debateTurns)
    .values(
      allPersonas.map((persona, i) => ({
        id: createId(),
        debateId: activeDebateId,
        personaId: persona.id,
        phase: "opening" as const,
        role: "debater" as const,
        content: openingContents[persona.slug] ?? "",
        turnOrder: i,
        tokenCount: 0,
        costUsd: 0,
      })),
    )
    .onConflictDoNothing();

  console.log("Seed complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
