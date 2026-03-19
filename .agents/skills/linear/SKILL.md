---
name: linear
description: "Manage Linear-backed implementation work in Geins Studio. Use when starting from a Linear issue, building/drafting an issue from Linear context, reviewing whether an issue is implementation-ready, updating issue details to match codebase conventions, or closing out a completed issue. Always invoke `.agents/skills/implementation-plan/SKILL.md` before implementation planning/coding. Trigger on: Linear issue, STU-, build issue STU-, build issue from Linear, draft issue from Linear, prep issue STU-, issue readiness, implementation-ready issue, update issue, set in progress, set done, branch from issue."
metadata:
  short-description: Geins Studio Linear workflow
---

# Geins Studio - Linear Workflow

Use this skill when work starts from a Linear issue or when a Linear issue needs to be made implementation-ready. See `CLAUDE.md` -> "Workflow Rules" for the canonical reference.
For any implementation planning or coding flow, this skill MUST invoke `.agents/skills/implementation-plan/SKILL.md` first.

## One-line shortcut trigger

If the user prompt matches a shorthand like `build issue STU-52` (or any `build issue STU-*` / `prep issue STU-*` phrasing), treat it as a full Linear issue preparation workflow:
- pull issue from Linear
- apply readiness checks
- invoke `.agents/skills/implementation-plan/SKILL.md`
- update the issue with the full implementation-ready plan

## Before writing code

1. Read the issue carefully.
2. Set the issue status to `In Progress` before writing code.
3. Ask whether to keep working on the current branch or create a new one.
4. If creating a branch, base it on `next` and use:
   - `feat/{linear-issue-number}-{short-description}`
   - `fix/{linear-issue-number}-{short-description}`
5. Compare the issue against `CLAUDE.md` and the relevant Geins skill for the task.
6. If the issue is missing codebase-specific instructions, update the issue first so another agent can execute it reliably.
7. Run `.agents/skills/implementation-plan/SKILL.md` and produce a repo-grounded implementation plan before coding.

## When asked to build/draft an issue from Linear

1. Pull the issue context from Linear.
2. Apply the readiness checks in this skill.
3. Invoke `.agents/skills/implementation-plan/SKILL.md` to generate a repo-grounded implementation plan section for the issue.
4. Update or draft the issue so another agent can execute it without inventing patterns.

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
