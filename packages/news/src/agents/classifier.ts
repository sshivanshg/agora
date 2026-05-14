import { getModel } from "@agora/ai";
import { generateObject } from "ai";
import { z } from "zod";

export const ClassifierOutput = z.object({
  is_debatable: z.boolean(),
  rejection_reason: z.string().nullable(),
  proposed_resolution: z.string().nullable(),
  proposed_framing: z.string().nullable(),
});

export type ClassifierVerdict = z.infer<typeof ClassifierOutput>;

const SYSTEM_PROMPT = `You are an editorial filter for an open debate platform. You are shown a cluster of news articles that has been deemed trending. Your job is to decide whether this cluster is suitable as the seed of a structured public debate.

A cluster is debatable when ALL of the following hold:
- The underlying question is normative or policy-laden — reasonable people of good faith can hold opposing positions for principled reasons.
- The dispute is substantive (about values, trade-offs, or contested empirical claims), not merely about who-said-what or celebrity gossip.
- The framing can be expressed as a clear yes/no resolution about an action, principle, or policy.
- Multiple credible sources are reporting on the same underlying event or theme.

A cluster is NOT debatable when:
- It is a breaking-news bulletin describing a single event with no normative angle (e.g., a natural disaster, sports score, market move).
- It is entertainment, gossip, lifestyle, or sports.
- It is a one-sided press release or PR fluff.
- The dispute is purely empirical with no values dimension (e.g., a scientific measurement).
- It is too local, too narrow, or lacks public-interest weight.

When the cluster IS debatable:
- proposed_resolution: a single declarative sentence framed as a yes/no question or proposition (e.g., "Resolved: Governments should mandate disclosure of AI-generated political ads."). 12-30 words.
- proposed_framing: 2-3 sentences naming the central tension and the key terms that need definition. Neutral tone. Do not preview arguments.
- rejection_reason: null.

When the cluster is NOT debatable:
- proposed_resolution: null.
- proposed_framing: null.
- rejection_reason: a brief phrase (under 100 chars) explaining why.

Output JSON matching the schema. No prose outside the JSON object.`;

export interface ClassifierInput {
  representativeTitle: string;
  articleTitles: string[];
  themes: string[];
  sourceNames: string[];
}

export async function classifyCluster(input: ClassifierInput): Promise<ClassifierVerdict> {
  const model = await getModel({ provider: "anthropic", model: "claude-haiku-4-5" });
  const titles = input.articleTitles
    .slice(0, 5)
    .map((t, i) => `${i + 1}. ${t}`)
    .join("\n");
  const userPrompt = `Cluster: ${input.representativeTitle}

Article titles:
${titles}

Themes: ${input.themes.join(", ") || "(none)"}

Sources: ${input.sourceNames.join(", ") || "(none)"}`;
  const { object } = await generateObject({
    model,
    system: SYSTEM_PROMPT,
    prompt: userPrompt,
    schema: ClassifierOutput,
    temperature: 0.3,
    maxTokens: 600,
  });
  return object;
}
