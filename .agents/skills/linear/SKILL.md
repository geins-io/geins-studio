---
name: linear
description: "Manage Linear-backed implementation work in Geins Studio. Use when starting from a Linear issue, reviewing whether an issue is implementation-ready, updating issue details to match codebase conventions, or closing out a completed issue. Trigger on: Linear issue, STU-, issue readiness, update issue, set in progress, set done, branch from issue."
metadata:
  short-description: Geins Studio Linear workflow
---

# Geins Studio - Linear Workflow

Use this skill when work starts from a Linear issue or when a Linear issue needs to be made implementation-ready. See `CLAUDE.md` -> "Workflow Rules" for the canonical reference.

## Before writing code

1. Read the issue carefully.
2. Compare it against `CLAUDE.md` and the relevant Geins skill for the task.
3. If the issue is missing codebase-specific instructions, update the issue first so another agent can execute it reliably.
4. Set the issue status to `In Progress` before writing code.
5. Ask whether to keep working on the current branch or create a new one.
6. If creating a branch, base it on `next` and use:
   - `feat/{linear-issue-number}-{short-description}`
   - `fix/{linear-issue-number}-{short-description}`

## What to look for in issue readiness

- Missing repository/type conventions
- Missing registration steps (`shared/types/index.ts`, `app/utils/repos.ts`, `app/composables/useGeinsRepository.ts`)
- Missing page-pattern requirements (`useEntityEdit`, list-page fetch error handling, etc.)
- Missing i18n/doc follow-up expectations
- Missing verification steps (`pnpm lint:check`, `pnpm typecheck`, `pnpm test --run` when tests exist)

## While implementing

- Keep the issue aligned with the real codebase patterns.
- If you discover a hidden requirement that will materially affect implementation, update the issue rather than keeping the knowledge only in the chat.

## When the user says task done

1. Update `CLAUDE.md` with any durable learnings and remove stale guidance.
2. Update `/docs` if architecture or established patterns changed.
3. Set the Linear issue status to `Done`.
