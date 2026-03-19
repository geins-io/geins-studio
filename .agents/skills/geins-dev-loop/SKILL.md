---
name: geins-dev-loop
description: "Start development, run fast checks, and verify changes locally in Geins Studio. Use when starting the dev server, running lint/typecheck/tests, or following the local development workflow. Trigger on: start dev, dev server, run checks, fast checks, local development, pnpm dev, lint, typecheck, test."
---

# Geins Studio — Dev Loop

Start development quickly, make a change, and verify it locally. See `CLAUDE.md` → "Commands" and "Workflow Rules" for the canonical reference.

## Before writing code

- If this work comes from a Linear issue, set the issue to `In Progress` before writing code.
- Ask whether to keep working on the current branch or create a new one.
- If creating a branch, base it on `next` and use `feat/{linear-issue-number}-{short-description}` or `fix/{linear-issue-number}-{short-description}`.
- Read the issue against `CLAUDE.md` and the relevant skill first. If the issue is missing codebase-specific execution detail, update it before implementing.

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

## When the user says task done

- Update `CLAUDE.md` with new learnings (and remove stale info).
- Keep `/docs` up to date if you changed patterns or architecture.
- If the work came from a Linear issue, set the issue to `Done`.
