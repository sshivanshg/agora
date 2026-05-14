import { Accordion, CodeBlock, Terminal } from "@agora/ui";
import Link from "next/link";

export const metadata = { title: { absolute: "Agora — Watch every side argue" } };

const FAQ_ITEMS = [
  {
    question: "Is Agora really free and open source?",
    answer:
      "Yes. Agora is MIT-licensed. You run it yourself, you own your data, and you bring your own API keys. There is no cloud subscription.",
  },
  {
    question: "Which AI providers are supported?",
    answer:
      "Anthropic (Claude), OpenAI (GPT-4o, o1, o3), Google (Gemini), Groq, and any OpenAI-compatible local endpoint like Ollama. You configure them in the Settings screen.",
  },
  {
    question: "How does a debate work?",
    answer:
      "You write a resolution — a proposition to be argued. Agora assigns personas to each side, runs them through six phases (Framing → Opening → Cross-Examination → Rebuttal → Closing → Synthesis), and produces a structured transcript with a synthesis at the end.",
  },
  {
    question: "Can I run it locally without Docker?",
    answer:
      "Yes. You need Node.js 20+, pnpm, and a PostgreSQL database with the pgvector extension. The quickstart uses Docker Compose for convenience but it is not required.",
  },
  {
    question: "Does Agora store my API keys securely?",
    answer:
      "API keys are encrypted at rest using AES-256-GCM with a key you generate and control. Keys are never transmitted in plaintext after initial input.",
  },
  {
    question: "Can multiple people use one Agora instance?",
    answer:
      "By default Agora runs in single-user mode with no authentication required. Multi-user mode with magic-link auth is available by setting ENABLE_AUTH=true.",
  },
];

const TERMINAL_LINES = [
  { type: "comment" as const, text: "clone and start in under 2 minutes" },
  { type: "command" as const, text: "git clone https://github.com/your-org/agora && cd agora" },
  { type: "command" as const, text: "cp .env.example .env" },
  { type: "command" as const, text: "pnpm install" },
  { type: "command" as const, text: "docker compose up -d" },
  { type: "command" as const, text: "pnpm db:push && pnpm db:seed" },
  { type: "command" as const, text: "pnpm dev" },
  { type: "output" as const, text: "✓ API ready at http://localhost:4000" },
  { type: "output" as const, text: "✓ Web ready at http://localhost:3000" },
];

const CAST = [
  {
    name: "The Empiricist",
    worldview: "Evidence-first · data-driven",
    initials: "TE",
    color: "oklch(0.65 0.15 260)",
  },
  {
    name: "The Utilitarian",
    worldview: "Greatest good · consequentialist",
    initials: "TU",
    color: "oklch(0.65 0.15 145)",
  },
  {
    name: "The Libertarian",
    worldview: "Individual liberty · minimal state",
    initials: "TL",
    color: "oklch(0.65 0.15 75)",
  },
  {
    name: "The Communitarian",
    worldview: "Collective · tradition · place",
    initials: "TC",
    color: "oklch(0.65 0.15 25)",
  },
  {
    name: "The Technologist",
    worldview: "Progress · innovation · systems",
    initials: "TT",
    color: "oklch(0.65 0.15 200)",
  },
  {
    name: "The Ethicist",
    worldview: "Virtue · duty · rights",
    initials: "TE",
    color: "oklch(0.65 0.15 320)",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Write a resolution",
    description:
      'State a proposition in plain language. "AI systems should require human approval for all consequential decisions."',
  },
  {
    step: "02",
    title: "Assemble the cast",
    description:
      "Pick 2–6 personas. Each has a distinct worldview, rhetorical style, and model preference.",
  },
  {
    step: "03",
    title: "Watch it unfold",
    description:
      "Six structured phases. Real-time streaming. A synthesis that finds what each side got right.",
  },
];

export default function MarketingPage() {
  return (
    <div className="overflow-x-hidden">
      {/* Hero */}
      <section className="relative flex min-h-[88vh] flex-col items-center justify-center px-6 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,var(--color-accent)/8%,transparent)]" />
        <div className="relative">
          <p className="mb-6 font-mono text-xs uppercase tracking-[0.15em] text-[var(--color-accent)]">
            Open-source · Self-hostable · BYOK
          </p>
          <h1
            className="font-serif text-5xl leading-[1.1] tracking-tight text-[var(--color-fg)] md:text-7xl lg:text-8xl"
            style={{ textWrap: "balance" }}
          >
            Watch every side
            <br />
            argue.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-[var(--color-muted)] md:text-lg">
            Agora runs structured multi-agent debates between AI personas with distinct worldviews.
            Host it yourself. Own your data. Bring your own keys.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/today"
              className="rounded-md bg-[var(--color-accent)] px-6 py-3 font-mono text-sm lowercase tracking-[0.04em] text-[var(--color-bg)] transition-opacity hover:opacity-90"
            >
              Open Agora →
            </Link>
            <Link
              href="https://github.com/your-org/agora"
              className="rounded-md border border-[var(--color-border)] px-6 py-3 font-mono text-sm lowercase tracking-[0.04em] text-[var(--color-fg)] transition-colors hover:border-[var(--color-muted)]"
            >
              Star on GitHub
            </Link>
          </div>
        </div>
      </section>

      {/* Live debate preview */}
      <section className="border-y border-[var(--color-border)] bg-[var(--color-bg-elev)] px-6 py-24">
        <div className="mx-auto max-w-[800px]">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--color-accent)]">
            live preview
          </p>
          <h2 className="mb-12 font-serif text-3xl text-[var(--color-fg)] md:text-4xl">
            A debate in progress
          </h2>
          <div className="space-y-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-8">
            <div className="flex items-start gap-4">
              <div className="h-8 w-8 shrink-0 rounded-full bg-[oklch(0.65_0.15_260_/_15%)] flex items-center justify-center">
                <span className="font-mono text-[10px] text-[oklch(0.65_0.15_260)]">TE</span>
              </div>
              <div>
                <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--color-muted)]">
                  The Empiricist · Opening
                </p>
                <p className="text-sm leading-relaxed text-[var(--color-fg)]">
                  The evidence from 47 peer-reviewed studies is unambiguous: algorithmic
                  decision-making without human oversight produces systematically worse outcomes for
                  marginalized communities. We are not debating philosophy — we are debating
                  demonstrated harm.
                </p>
              </div>
            </div>
            <div className="h-px bg-[var(--color-border)]" />
            <div className="flex items-start gap-4">
              <div className="h-8 w-8 shrink-0 rounded-full bg-[oklch(0.65_0.15_75_/_15%)] flex items-center justify-center">
                <span className="font-mono text-[10px] text-[oklch(0.65_0.15_75)]">TL</span>
              </div>
              <div>
                <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--color-muted)]">
                  The Libertarian · Opening
                </p>
                <p className="text-sm leading-relaxed text-[var(--color-fg)]">
                  Human approval requirements presuppose that human judgment is reliable. It is not.
                  The same cognitive biases that produced redlining, stop-and-frisk, and sentencing
                  disparities will corrupt any oversight layer. The question is not whether to have
                  errors — it is whose errors we prefer.
                </p>
              </div>
            </div>
            <div className="h-px bg-[var(--color-border)]" />
            <div className="flex items-start gap-4 opacity-50">
              <div className="h-8 w-8 shrink-0 rounded-full bg-[var(--color-bg-elev)] border border-[var(--color-border)] flex items-center justify-center">
                <span className="font-mono text-[10px] text-[var(--color-muted)]">•••</span>
              </div>
              <div>
                <p className="text-sm text-[var(--color-muted)]">4 more personas are responding…</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cast grid */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-[1100px]">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--color-accent)]">
            the cast
          </p>
          <h2 className="mb-4 font-serif text-3xl text-[var(--color-fg)] md:text-4xl">
            Every worldview gets a voice
          </h2>
          <p className="mb-12 max-w-xl text-sm leading-relaxed text-[var(--color-muted)]">
            Each persona has a distinct philosophical stance, rhetorical style, and preferred model.
            You can edit them or create your own.
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {CAST.map((persona) => (
              <div
                key={persona.name}
                className="flex flex-col gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-4 transition-colors hover:border-[var(--color-muted)]"
              >
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full font-mono text-xs font-medium"
                  style={{
                    backgroundColor: `${persona.color}22`,
                    color: persona.color,
                    border: `1px solid ${persona.color}44`,
                  }}
                >
                  {persona.initials}
                </div>
                <div>
                  <p className="text-xs font-medium text-[var(--color-fg)]">{persona.name}</p>
                  <p className="mt-0.5 font-mono text-[9px] uppercase leading-tight tracking-[0.06em] text-[var(--color-muted)]">
                    {persona.worldview}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-[var(--color-border)] bg-[var(--color-bg-elev)] px-6 py-24">
        <div className="mx-auto max-w-[800px]">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--color-accent)]">
            how it works
          </p>
          <h2 className="mb-12 font-serif text-3xl text-[var(--color-fg)] md:text-4xl">
            Three steps to structured argument
          </h2>
          <div className="space-y-12">
            {HOW_IT_WORKS.map((item) => (
              <div key={item.step} className="flex gap-8">
                <div className="shrink-0">
                  <span className="font-mono text-3xl font-bold text-[var(--color-border)]">
                    {item.step}
                  </span>
                </div>
                <div>
                  <h3 className="mb-2 text-base font-semibold text-[var(--color-fg)]">
                    {item.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-[var(--color-muted)]">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Open source */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-[800px]">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--color-accent)]">
            open source
          </p>
          <h2 className="mb-4 font-serif text-3xl text-[var(--color-fg)] md:text-4xl">
            Yours to run, fork, and extend
          </h2>
          <p className="mb-8 text-sm leading-relaxed text-[var(--color-muted)]">
            Agora is MIT-licensed. The entire platform — debate engine, API, UI — is open. No
            telemetry by default. No vendor lock-in.
          </p>
          <CodeBlock
            language="bash"
            code={
              "# MIT License\n# Copyright (c) 2025 Agora Contributors\n\ngit clone https://github.com/your-org/agora\ncd agora && cp .env.example .env\n# Add your API keys, then:\npnpm install && pnpm db:push && pnpm dev"
            }
          />
        </div>
      </section>

      {/* Quickstart terminal */}
      <section className="border-y border-[var(--color-border)] bg-[var(--color-bg-elev)] px-6 py-24">
        <div className="mx-auto max-w-[800px]">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--color-accent)]">
            quickstart
          </p>
          <h2 className="mb-4 font-serif text-3xl text-[var(--color-fg)] md:text-4xl">
            Up in two minutes
          </h2>
          <p className="mb-8 text-sm leading-relaxed text-[var(--color-muted)]">
            Requires Docker, Node 20+, and pnpm. Bring your own API keys — Anthropic, OpenAI, Groq,
            Google, or any local Ollama endpoint.
          </p>
          <Terminal lines={TERMINAL_LINES} />
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-[720px]">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--color-accent)]">
            faq
          </p>
          <h2 className="mb-12 font-serif text-3xl text-[var(--color-fg)] md:text-4xl">
            Common questions
          </h2>
          <Accordion items={FAQ_ITEMS} />
        </div>
      </section>

      {/* CTA + footer */}
      <section className="border-t border-[var(--color-border)] bg-[var(--color-bg-elev)] px-6 py-24 text-center">
        <div className="mx-auto max-w-[600px]">
          <h2 className="mb-4 font-serif text-4xl text-[var(--color-fg)] md:text-5xl">
            Start the argument.
          </h2>
          <p className="mb-10 text-sm leading-relaxed text-[var(--color-muted)]">
            Self-host Agora in minutes. No subscriptions. No tracking. Just ideas in conflict.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/today"
              className="rounded-md bg-[var(--color-accent)] px-8 py-3.5 font-mono text-sm lowercase tracking-[0.04em] text-[var(--color-bg)] transition-opacity hover:opacity-90"
            >
              Open Agora →
            </Link>
            <Link
              href="https://github.com/your-org/agora"
              className="rounded-md border border-[var(--color-border)] px-8 py-3.5 font-mono text-sm lowercase tracking-[0.04em] text-[var(--color-fg)] transition-colors hover:border-[var(--color-muted)]"
            >
              Star on GitHub
            </Link>
          </div>
        </div>
        <div className="mt-24 border-t border-[var(--color-border)] pt-8">
          <p className="font-mono text-xs text-[var(--color-muted)]">
            © {new Date().getFullYear()} Agora contributors — MIT License
          </p>
        </div>
      </section>
    </div>
  );
}
