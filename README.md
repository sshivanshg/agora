# Agora

**A self-hostable, open-source multi-agent AI debate platform.**

AI personas with distinct intellectual worldviews debate current topics in structured, fact-checked rounds. Runs entirely on your own API keys. No central server, no SaaS lock-in.

---

## Quickstart

```bash
git clone https://github.com/your-org/agora.git && cd agora
cp .env.example .env && pnpm gen:encryption-key   # paste output into .env
pnpm install && pnpm db:push && pnpm db:seed
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) — the setup wizard walks you through adding your first API key.

**Requires:** Node.js 20+, PostgreSQL 16+ with pgvector, Docker (for local postgres).

```bash
# Start local postgres
docker compose -f docker/docker-compose.yml up -d
```

> Docker image and one-click deploys are coming in a later release.

---

## Philosophy

1. **OSS-first.** Every decision is weighed for contributor ergonomics, self-hostability, and the ability of a stranger to clone, run, and modify in under five minutes.
2. **BYOK.** Users supply their own API keys for Anthropic, OpenAI, Google, Groq, or local Ollama. Keys are encrypted AES-256-GCM before touching the database and never leave the instance in plaintext.
3. **Single-user by default.** No login, no signup. One env-var flip enables multi-user mode for teams.
4. **No Redis.** Postgres only. One fewer moving part to operate.
5. **Boring infra, exciting product.** Mature, well-documented dependencies. The novelty is in the orchestration and the writing, not the stack.

---

## How it works

A LangGraph state machine drives every debate through phases:

```
INIT → FRAMING → OPENING → CROSS-EXAMINATION → REBUTTALS → CLOSING → SYNTHESIS
```

Each phase invokes the right agent (Moderator, Debater, Fact-Checker, Synthesizer) with the right context. Debate output streams to the browser over SSE. State is persisted to Postgres at every transition — debates are resumable and inspectable.

**Personas** live as markdown files in `packages/personas/specs/`. Adding a persona = adding one `.md` file. No code changes.

---

## Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js 15 (App Router) + Tailwind CSS v4 |
| API | Hono on Node.js |
| Orchestration | LangGraph.js + Vercel AI SDK |
| Database | PostgreSQL 16 + pgvector + Drizzle ORM |
| Queue | Inngest |
| Auth (opt-in) | Better Auth — email magic links |
| Styling | shadcn/ui + Geist fonts + OKLCH tokens |

---

## Deploy

> One-click deploy buttons will be added when the Docker image is published (Phase 6+).

**Planned targets:** Vercel (web) + Railway/Fly.io (API), single-server Docker Compose, bare metal.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). The fastest contribution is a new persona spec — it's a markdown file, no code required. See [CONTRIBUTING.md](CONTRIBUTING.md) for the format.

Commit convention: [Conventional Commits](https://www.conventionalcommits.org/).

## License

[Apache 2.0](LICENSE)
