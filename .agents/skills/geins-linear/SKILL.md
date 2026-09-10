---
name: geins-linear
description: "Manage Linear-backed work in Geins Studio end to end: prep an issue to implementation-ready, run the build → review → merge → status lifecycle consistently, and file follow-up issues cleanly. Use when starting from a Linear issue, drafting/prepping an issue, reviewing readiness, or closing out completed work. Read `.agents/skills/implementation-plan/SKILL.md` before implementation planning/coding. For planning a whole feature into a project + milestones, read `.agents/skills/geins-linear-planning/SKILL.md`. Trigger on: Linear issue, STU-, build issue STU-, prep issue STU-, issue readiness, update issue, set in progress, merge issue, close out issue, branch from issue, follow-up issue, new project issue."
metadata:
  short-description: Geins Studio Linear workflow (full lifecycle)
---

# Geins Studio — Linear Workflow

The single runbook for how we work with Linear issues, projects, and the code that closes them. Canonical conventions live in `CLAUDE.md` → "Workflow Rules"; this skill is the step-by-step. For any planning/coding flow, read `.agents/skills/implementation-plan/SKILL.md` first. To plan a whole feature into a project + milestones, read `.agents/skills/geins-linear-planning/SKILL.md`.

## Ground rules (always)

- **Never commit or push without explicit user approval.** Present a diff-shaped summary first; wait for a clear "yes / merge".
- **Never `git push --force` to `main` or `next`.** Feature-branch force-push (after amend) is fine.
- **Feature work targets `next`, never `main`.** The `next → main` release is a separate squash flow.
- **One issue → one branch → one squash-merged PR.** Keep PRs diff-shaped and scoped to the issue.

## Status lifecycle

`Todo` → **In Progress** (before writing code) → **Ready for QA testing** (after merge). QA moves it to `Done` — we do **not** set `Done` ourselves. Cancelled/blocked work: leave a comment saying why.

## 1. Start / prep an issue

1. `get_issue` — read it fully. Read it against `CLAUDE.md` + the matching Geins skill.
   - **Check for a `Context group:` marker.** If the issue names sibling issues to build together and they're still open, offer to build them back-to-back **in this same context** (before compacting/handing off) — re-exploring the shared prototype/inventory in a fresh context per issue wastes tokens. Respect blocked-by order. No marker → default to a fresh context per issue; don't drag an unrelated prior issue's transcript along.
2. Check the Linear **project plan + issue** for Figma links; if a design exists, fetch it (`get_design_context`) and match the layout before coding.
3. **Readiness check** — the issue must carry enough codebase-specific guidance to execute without inventing patterns. Look for gaps: repo/type conventions, registration steps (`shared/types/index.ts`, `app/utils/repos.ts`, `useGeinsRepository.ts`), page patterns (`useEntityEdit`, list-page fetch-error handling), i18n + VitePress doc follow-ups, verification steps. If gaps exist, **update the issue first**.
4. **Confirm scope-changing decisions with the user before building** — when a choice materially changes the work (data source, extra fetch, which API), ask (AskUserQuestion) with a recommendation. Don't guess on those.
5. Set status → **In Progress**, and **assign it to the current developer** — pass `assignee: "me"` to `save_issue` (the Linear MCP resolves `"me"` to the authenticated user, so it's correct per developer, no hardcoded name).
6. Branch from `next`: `feat/{issue}-{short-desc}` or `fix/{issue}-{short-desc}`. **Never use Linear's suggested `gitBranchName`** (e.g. `olivia/stu-…`) and don't surface it as an option — always use this convention. Only ask the user if it's genuinely unclear whether the work is a `feat` or a `fix`.
7. Run `.agents/skills/implementation-plan/SKILL.md` for non-trivial work.

## 2. While building

- Follow `CLAUDE.md` patterns; if you break one, document why.
- **If the issue cites a prototype reference, open it and build from it** — match the actual layout, states, and copy in the referenced file/section. Don't build from the issue summary or memory alone; that's how details get missed or invented. Re-check the prototype as you implement, not just while planning.
- **Reuse before hand-rolling.** Before building any UI from scratch, check for an existing **shadcn-vue** primitive (install via the CLI, never hand-create) or an existing app component/composable that already solves it (`geins-ui-components`, and grep the codebase). Extend an existing one over inventing a new bespoke thing.
- **Docs travel with the code, always** — every new/changed component or composable gets its VitePress doc page updated + registered in `docs/.vitepress/config.mts`, in the *same* PR (not deferred). Same for `/docs` domain/architecture pages when business rules or established patterns change.
- User-facing text → i18n key in BOTH `en.json` + `sv.json`, sentence case. Reuse entity keys before adding new ones.
- Temporary / phase-gated code → add a `// cutover:` marker + a row in `docs/domains/assets-cutover.md`.
- If a hidden requirement surfaces that changes implementation, update the issue — don't leave the knowledge only in chat.
- Out-of-scope things you notice → **file a follow-up issue** (see §5), don't bloat the current PR.

## 3. Preflight (before presenting)

Run and get them all green:

```bash
pnpm lint:check && pnpm typecheck && pnpm test --run
```

- Add `pnpm build` when the change touches i18n messages or template syntax (only `build` catches bad message/literal-brace syntax).
- **Verification when the UI is login-walled:** verify at the data layer (curl / the composable's data) or ask the user to check in their browser (HMR). After repo/composable changes, do a real app-boot smoke — auto-import failures crash at runtime, not in curl/typecheck.

## 4. Present → approve → merge

1. **Present** a diff-shaped summary: what changed + file paths, verification results, any follow-ups filed.
2. On explicit approval:
   - `git add -A`; commit with a Conventional Commit (`feat(scope): …` / `fix(scope): …`), body explains the *why* when non-obvious, end with the `Co-Authored-By` trailer.
   - `git push -u origin {branch}`.
   - `gh pr create --base next` — body: what/why, a **Verification** section (lint/typecheck/build/tests + manual), and the Claude Code footer.
   - `gh pr merge {n} --squash --delete-branch`.
   - `git checkout next && git pull --ff-only`.
3. If pre-commit hooks (prettier/eslint) reformat a file, re-check the result — Vue whitespace/`{{ ' ' }}` separators and import order can shift. Amend + force-push the feature branch if needed.
4. Set status → **Ready for QA testing**.

## 5. Projects, milestones & follow-up issues

- Every issue lives in a **project** (e.g. "Assets library", team "Studio") and usually a **milestone** — an ordered `Phase N — <theme>` (e.g. "Phase 8 — Real API alignment"). See `.agents/skills/geins-linear-planning/SKILL.md` for the phase model.
- **Creating a follow-up** (scope creep, a "maybe later", an out-of-scope fix): `save_issue` with `team`, `project`, `milestone`, a clear title, and a description that **links the parent issue** and states why it's separate + what data/design it needs.
- Prefer one project + milestones over many projects for a coherent effort.

## 6. Keep the repo's shared knowledge current

Part of every change, and always before/at merge:

- **VitePress + `/docs`** — ship in the same PR as the code (§2).
- **`CLAUDE.md` is the team's shared memory.** Durable, repo-relevant learnings (a convention, a gotcha, a pattern) land in `CLAUDE.md` or `/docs` — personal agent memory isn't visible to other developers, so the repo must carry it too.
- **Keep `CLAUDE.md` lean.** Add durable learnings, but dedup, group, and prune stale guidance rather than appending; do a quick staleness pass when touching it (`claude-md-management` / `revise-claude-md` helps).
- Record user preferences/feedback in memory too (why + how to apply).

## One-line shortcuts

- `build issue STU-52` / `prep issue STU-*` → pull issue → readiness checks → `implementation-plan` → update the issue with the ready plan.
- `merge issue` → run §3 preflight, then §4 (present → on approval → PR → squash-merge → Ready for QA).
