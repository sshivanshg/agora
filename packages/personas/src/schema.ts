import { z } from "zod";

export const personaFrontmatterSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  worldview_tag: z.string().min(1),
  epistemic_style: z.string().min(1),
  core_values: z.array(z.string()).min(1),
  characteristic_concerns: z.array(z.string()).min(1),
  rhetorical_signature: z.string().min(1),
  blind_spots: z.array(z.string()).min(1),
  model_preference: z.string().min(1),
  temperature: z.number().min(0).max(2),
});
export type PersonaFrontmatter = z.infer<typeof personaFrontmatterSchema>;

export interface Persona {
  slug: string;
  name: string;
  worldviewTag: string;
  modelPreference: string;
  temperature: number;
  specContent: string;
  specHash: string;
  frontmatter: PersonaFrontmatter;
  body: string;
}
