---
name: geins-dev-loop
description: "Start development, run fast checks, and verify changes locally in Geins Studio. Use when starting the dev server, running lint/typecheck/tests, or following the local development workflow. Trigger on: start dev, dev server, run checks, fast checks, local development, pnpm dev, lint, typecheck, test."
---

# Geins Studio — Dev Loop

Start development quickly, make a change, and verify it locally. See `CLAUDE.md` → "Commands" and "Workflow Rules" for the canonical reference.

## Start

```bash
pnpm dev
```

App available at http://localhost:3000.

## Fast checks (pick what matches your change)

| Command | Purpose |
|---------|---------|
| `pnpm lint` | ESLint with auto-fix |
| `pnpm lint:check` | ESLint read-only (CI-safe) |
| `pnpm typecheck` | Nuxi typecheck |
| `pnpm test --run` | Vitest single run (CI-safe) |

## While working (non-negotiables)

- Follow established patterns and conventions from `CLAUDE.md`.
- Never use `console.log` — use `useGeinsLog('scope')` scoped loggers.
- Be mindful of performance implications (data fetching, state, rendering).

## After finishing a task

- Update `CLAUDE.md` with new learnings (and remove stale info).
- Keep `/docs` up to date if you changed patterns or architecture.
