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
- **Never `git push --force` to `main` or `next`** — except the post-release reset of `next` in `geins-release` step 7. Feature-branch force-push (after amend) is fine.
- **Feature work targets `next`, never `main`.** The `next → main` release is a separate squash flow (`.agents/skills/geins-release/SKILL.md`).
- **One issue → one branch → one squash-merged PR** — or, for a `Context group:`, **one group → one branch → one rebase-merged PR** (§4a). Keep PRs diff-shaped and scoped to the issue(s).
- **CI gates the merge.** The local preflight (§3) runs only the tests affected by the branch and there is no pre-push hook; the full suite + `pnpm build` run in CI, and `next` requires that check. Merge with `--auto` so GitHub merges once CI is green — never merge around a red or pending check.

## Status lifecycle

`Todo` → **In Progress** (before writing code) → **Ready for QA testing** (after merge). QA moves it to `Done` — we do **not** set `Done` ourselves. Cancelled/blocked work: leave a comment saying why.

## 1. Start / prep an issue

1. `get_issue` — read it fully. Read it against `CLAUDE.md` + the matching Geins skill.
   - **Check for a `Context group:` marker.** If the issue names sibling issues to build together and they're still open, offer to build them back-to-back **in this same context and on one branch** (§4a) — re-exploring the shared prototype/inventory in a fresh context per issue wastes tokens. Respect blocked-by order. No marker → default to a fresh context per issue; don't drag an unrelated prior issue's transcript along.
2. Check the Linear **project plan + issue** for Figma links; if a design exists, fetch it (`get_design_context`) and match the layout before coding.
3. **Readiness check** — the issue must carry enough codebase-specific guidance to execute without inventing patterns. Look for gaps: repo/type conventions, registration steps (`shared/types/index.ts`, `app/utils/repos.ts`, `useGeinsRepository.ts`), page patterns (`useEntityEdit`, list-page fetch-error handling), i18n + VitePress doc follow-ups, verification steps. If gaps exist, **update the issue first**.
4. **Confirm scope-changing decisions with the user before building** — when a choice materially changes the work (data source, extra fetch, which API), ask (AskUserQuestion) with a recommendation. Don't guess on those.
5. Set status → **In Progress**, and **assign it to the current developer** — pass `assignee: "me"` to `save_issue` (the Linear MCP resolves `"me"` to the authenticated user, so it's correct per developer, no hardcoded name). In a group, do this per issue as you start it, not for the whole group up front.
6. Branch from `next`: `feat/{issue}-{short-desc}` or `fix/{issue}-{short-desc}`; a group branch is named after its first issue + the group (`feat/{first-issue}-{group-desc}`). **Never use Linear's suggested `gitBranchName`** (e.g. `olivia/stu-…`) and don't surface it as an option — always use this convention. Only ask the user if it's genuinely unclear whether the work is a `feat` or a `fix`.
7. Run `.agents/skills/implementation-plan/SKILL.md` for non-trivial work.

## 2. While building

- Follow `CLAUDE.md` patterns; if you break one, document why.
- **If the issue cites a prototype reference, open it and build from it** — match the actual layout, states, and copy in the referenced file/section. Don't build from the issue summary or memory alone; that's how details get missed or invented. Re-check the prototype as you implement, not just while planning.
- **Reuse before hand-rolling.** Before building any UI from scratch, check for an existing **shadcn-vue** primitive (install via the CLI, never hand-create) or an existing app component/composable that already solves it (`geins-ui-components`, and grep the codebase). Extend an existing one over inventing a new bespoke thing.
- **Docs travel with the code, always** — every new/changed component or composable gets its VitePress doc page updated + registered in `docs/.vitepress/config.mts`, in the *same* PR (not deferred). Same for `/docs` domain/architecture pages when business rules or established patterns change.
- User-facing text → i18n key in BOTH `en.json` + `sv.json`, sentence case. Reuse entity keys before adding new ones.
- **Tests: write them where they pay off, not for every change** — see `docs/guides/testing.md` → "What to test". A failing test you didn't change for this issue is a possible regression: stop and report it, don't rewrite its assertion.
- Temporary / phase-gated code → add a `// cutover:` marker + a row in `docs/domains/assets-cutover.md`.
- If a hidden requirement surfaces that changes implementation, update the issue — don't leave the knowledge only in chat.
- Out-of-scope things you notice → **file a follow-up issue** (see §5), don't bloat the current PR.

## 3. Preflight (before presenting)

Run and get them all green:

```bash
pnpm lint:check && pnpm typecheck && pnpm test:changed
```

- This runs only the tests whose module graph touches the branch's changes. It's the only local gate (no pre-push hook), so run it once. The full suite + `pnpm build` run in CI.
- Still run `pnpm build` locally when the change touches i18n messages or template syntax — only `build` catches bad message/literal-brace syntax, and a local catch beats a red CI round trip.
- **Verification when the UI is login-walled:** verify at the data layer (curl / the composable's data) or ask the user to check in their browser (HMR). After repo/composable changes, do a real app-boot smoke — auto-import failures crash at runtime, not in curl/typecheck.

## 4. Present → approve → merge

1. **Present** a diff-shaped summary: what changed + file paths, verification results, any follow-ups filed. Ask in the same message whether this one gets a **Claude PR review** (step 3). The user decides; offer it for bigger changes (new composables/components, data-flow or API changes, many files) and don't push it on small fixes.
2. On explicit approval:
   - `git add -A`; commit with a Conventional Commit (`feat(scope): …` / `fix(scope): …`), body explains the *why* when non-obvious, end with the `Co-Authored-By` trailer.
   - `git push -u origin {branch}`.
   - `gh pr create --base next` — body: what/why, a **Verification** section (lint/typecheck/build/tests + manual), and the Claude Code footer.
   - No review requested → straight to merge (step 4).
3. **Claude PR review** (only when the user asked for it):
   - `gh pr comment {n} --body "@claude review"` — this triggers `.github/workflows/claude.yml`, which answers as a PR comment.
   - Don't poll or sleep-loop for it. Tell the user it's requested; when they say it's done (or on their next message), read it with `gh pr view {n} --comments`.
   - **Triage every finding yourself** — implement, or skip with a one-line reason (out of scope → follow-up issue per §5; wrong/nitpick → say why). Present the triage as a short table (finding → decision → why) before pushing fixes.
   - Fixes: new commit on the branch (not an amend), re-run §3 preflight, push. Then merge — the user's PR approval covers merging after the triage unless a fix changes behaviour beyond the review's scope, in which case confirm first.
4. Merge: `gh pr merge {n} --squash --auto` — GitHub merges once the required CI check is green. If `--auto` is rejected, the repo's auto-merge setting or `next` ruleset is missing: tell the user, and **never fall back to a plain merge** (that skips the CI gate).
   - **Don't poll or sleep-loop on CI.** End the turn with "auto-merge armed" (step 7 can be done now). If CI goes red, fix with a new commit + push; auto-merge stays armed.
   - **On the user's next message**, check `gh pr view {n} --json state`. Once it says `MERGED`: delete the remote branch with `git push origin --delete {branch}` → `git checkout next && git pull --ff-only && git branch -D {branch}` → step 6. Auto-delete of head branches stays off — it would delete `next` after every release PR.
   - **In a worktree**, `next` is usually checked out in another worktree, so skip the checkout: `git fetch`, start the next branch from `origin/next` (`git checkout -b {new-branch} origin/next`, or `git checkout --detach origin/next`), then `git branch -D {branch}`.
5. If pre-commit hooks (prettier/eslint) reformat a file, re-check the result — Vue whitespace/`{{ ' ' }}` separators and import order can shift. Amend + force-push the feature branch if needed.
6. Once merged, set status → **Ready for QA testing**.
7. **Always end with the next issue.** Look at the project's open issues in milestone order, skip blocked ones (check `blockedBy`), respect `Context group:` markers, and name **one** recommended next issue with a one-line why — plus whether it should continue in this context (same context group) or start in a fresh one. If it's a fresh context, give a ready-to-paste opener (e.g. `build issue STU-123`). Fix stale text in that issue (phase names, line refs, things since built) while you have the context, if the user agrees.

## 4a. Context group → one branch, one PR

Sibling issues under one `Context group:` marker are built on **one branch** and reviewed + merged as **one PR**, so the review sees the whole feature and CI, preview and QA run once.

1. Build the issues back-to-back in blocked-by order (§1 per issue: In Progress + assignee as you start it).
2. **Per issue:** run §3 preflight, present that issue's diff, and on approval **commit locally** — one Conventional Commit per issue with its id (`feat(scope): … (STU-123)`). **Don't push yet.**
3. **After the last issue:** push once, then `gh pr create --base next` with a group title. The body lists each issue + its commit and ends with `Part of STU-a, STU-b, STU-c` — the branch name only links the first issue, and the non-closing `Part of` leaves statuses to us (step 6).
4. **Offer the Claude PR review by default** — a whole-feature review is the point of grouping. Triage as in §4 step 3; name fix commits `fix(scope): review feedback (STU-a, STU-b)`.
5. Merge with `gh pr merge {n} --rebase --auto` — **rebase, not squash**, so `next` keeps one commit per issue (traceable, revertable on its own). Then §4 steps 4–6 for every issue in the group.
6. **Size cap:** ~3–4 issues or ~1,500 changed lines. Past that the review gets shallow — split the group at a natural seam into two branches and PR the first while building the second.

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

## 7. Parallel worktrees (chips)

When the user asks what can run in parallel (separate worktrees / spawned task chips):

1. **Pick for low conflict.** For each candidate issue, check against the work already in flight:
   - **Files:** the pages, components and repos it will touch. Shared hot spots — `i18n/locales/*.json`, `docs/domains/*.md`, `docs/.vitepress/config.mts` — conflict trivially; overlap in the same component/page block is a real risk.
   - **Dependencies:** `blockedBy`, and soft ones (a helper, vocabulary or endpoint another in-flight issue introduces or relies on).
   - **Context groups:** an issue's group goes into the same chip, built back-to-back.
   - **Backend blockers:** skip anything waiting on the platform.
   Present the picks *and* the excluded ones with a one-line reason each.
2. **One chip per independent unit** (a single issue or a context group). Each chip prompt must stand alone:
   - Absolute paths to the skills it must Read, under its own worktree root (`<worktree>/.agents/skills/geins-linear/SKILL.md`, `implementation-plan`) — never just the skill name; spawned sessions otherwise fall back to a marketplace skill.
   - Environment: Node 24 on PATH; copy `.env` from the main checkout (`.env` is gitignored, so a fresh worktree has none); a **distinct dev port** per chip (3001, 3002, …; the main checkout keeps 3000).
   - Branch names, the issue ids, which open questions to ask about, and the usual rules (In Progress + assignee, no commit without approval, ask before browser checks).
   - Merge discipline: merge one session at a time, sync with the latest `next` before merging, expect small conflicts in the hot spots above and keep both sides.
3. **Clean up after merge** (when asked): confirm each PR is merged and the worktree has no uncommitted changes, archive the session, `git worktree remove` it if the folder is left behind, and `git branch -D` its local branches (squash/rebase merges leave them looking unmerged — check the PR, not `git branch --merged`).

## One-line shortcuts


- `build issue STU-52` / `prep issue STU-*` → pull issue → readiness checks → `implementation-plan` → update the issue with the ready plan.
- `merge issue` → run §3 preflight, then §4 (present → on approval → PR → optional `@claude review` + triage → `--squash --auto` → once merged, Ready for QA → suggest next issue).
- `merge group` → §4a (push the per-issue commits → one PR → `@claude review` + triage → `--rebase --auto` → once merged, every issue Ready for QA).
- `what can run in parallel?` → §7 (conflict check → one chip per unit → cleanup after merge).
