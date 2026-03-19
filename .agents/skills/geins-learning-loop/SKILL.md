---
name: geins-learning-loop
description: "Capture durable repo-specific learnings after implementation work in Geins Studio. Use when a task exposed a repeated mistake, hidden gotcha, missing rule, stale skill guidance, or any pattern the agent should remember next time. Trigger on: task done, retrospective, mistake, gotcha, learned, update CLAUDE, update skill, recurring bug, hidden requirement."
---

# Geins Studio — Learning Loop

Use this skill when implementation work exposed a repo-specific mistake, hidden requirement, stale instruction, or repeated gotcha that future agents should avoid.

See `CLAUDE.md` → "Workflow Rules" and the relevant domain skill for the canonical implementation rules.

## Goal

Turn one task's mistake into reusable repo guidance without filling the docs with noise.

## When to use this skill

Use it when:
- A task failed or slowed down because the issue was missing Geins-specific context
- The agent followed a stale pattern from a skill or doc
- The codebase had a non-obvious gotcha that should be documented
- A bug came from a repeated class of mistake, not a one-off typo
- The user says the task is done and the work revealed a durable new pattern

Do **not** use it for:
- One-off implementation details that are unlikely to recur
- Generic TypeScript/Vue knowledge that is not repo-specific
- Temporary workarounds that should not become standard guidance

## Workflow

1. Identify the root mistake.
   - What assumption was wrong?
   - Which file, skill, or issue failed to prevent it?
   - Was the real problem missing guidance, stale guidance, or missing verification?

2. Decide whether the learning is durable.
   - Add it only if it is likely to recur across tasks or agents.
   - Prefer updating an existing section instead of adding a new isolated rule.

3. Update the right source of truth.
   - `CLAUDE.md` for durable repo rules, conventions, and workflow requirements
   - The relevant skill in `.agents/skills/` for task-specific runbooks
   - `/docs` only when the learning affects architecture, onboarding, or broader developer workflows
   - The Linear issue if future implementers need the missing context there too

4. Remove drift while you are there.
   - Fix stale examples
   - Remove contradictory wording
   - Prefer existing naming and structure over inventing new taxonomy

5. Re-check for duplication.
   - If the same rule now exists in multiple places, align the wording
   - Keep `CLAUDE.md` canonical and make skills point back to it

## What to capture

- Repo-specific API/repository conventions
- Entity/page/table/i18n patterns
- Hidden workflow requirements (branching, Linear readiness, verification gates)
- Non-obvious framework gotchas that caused real implementation mistakes
- Places where agents tend to invent patterns not used in this repo

## Good learning updates

- "This endpoint looks like CRUD but its list shape is non-standard, so use a custom `list()` instead of `entityListRepo`."
- "List pages should use `fetchError` + retry instead of fatal fetch errors."
- "Response types in this repo usually use `{Entity}`, not `{Entity}Response`."

## Bad learning updates

- "Be careful."
- "TypeScript can be tricky."
- "Remember to write correct code."

## Finish checklist

- [ ] The learning is repo-specific and likely to recur
- [ ] `CLAUDE.md` was updated if this is a durable repo rule
- [ ] The relevant skill was updated if task guidance drifted
- [ ] Any stale/conflicting wording was cleaned up
- [ ] Verification requirements still match current repo workflow
