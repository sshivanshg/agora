# Contributing to Agora

Thank you for your interest in contributing. Agora is open-source and we welcome contributions of all kinds.

## Getting started

1. Fork the repo and create a branch: `git checkout -b feat/your-feature`
2. Follow the [Quickstart](README.md#quickstart) to get a working dev environment
3. Make your changes. One PR = one logical change.
4. Run `pnpm lint && pnpm typecheck && pnpm test` before pushing
5. Open a PR with a clear description of what and why

## Commit messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add libertarian-socialist persona
fix: debate stream drops connection after 60s
docs: update architecture diagram
chore: bump langgraph to 0.3
```

## Adding a persona

This is the most common contribution and requires no TypeScript knowledge:

1. Copy an existing file from `packages/personas/specs/`
2. Update the frontmatter (id, name, worldview_tag, etc.)
3. Write a substantive system prompt — 400–600 words — grounded in a real intellectual tradition
4. The persona is available immediately; `pnpm db:seed` will load it

Personas must be:
- Intellectual archetypes, not simulations of real people
- Grounded in a real, named tradition (not vague)
- Written with genuine familiarity with that tradition's primary texts
- Honest about their blind spots (the `blind_spots` frontmatter field)

## Code style

- TypeScript strict mode. No `any`. Use `unknown` and narrow.
- Server components by default; `"use client"` only when you need interactivity.
- No clever metaprogramming. Clear names over terse names.
- No abstraction until you have three concrete uses.
- Biome handles formatting — just run `pnpm format`.

## PR guidelines

- Keep PRs focused. A bug fix should not also refactor unrelated code.
- Include a test if you're adding a new orchestrator state transition.
- Screenshots or screen recordings help for UI changes.
- Be patient — maintainers will review within a few days.

## Questions?

Open a [GitHub Discussion](https://github.com/your-org/agora/discussions) rather than an issue for questions.
