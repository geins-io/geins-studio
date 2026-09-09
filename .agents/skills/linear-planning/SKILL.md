---
name: linear-planning
description: "Plan a feature/initiative in Linear for Geins Studio: turn a UX prototype (in the studio-prototypes repo) into a project, milestones, and implementation-ready issues. Use when scoping a new feature, creating or restructuring a Linear project/milestones, breaking a prototype into issues, or deciding how to slice work into phases. For executing a single issue, use the `linear` skill instead. Trigger on: plan a project, plan a feature, create project, create milestone, break down prototype, scope work, slice into phases, roadmap, project structure, milestone plan."
metadata:
  short-description: Geins Studio Linear project & milestone planning
---

# Geins Studio — Linear Project Planning

Turn a feature idea — usually a **UX prototype** — into a well-structured Linear **project → milestones → issues** that the `linear` skill can then execute one by one. This is the strategic, up-front mode; per-issue build/merge lives in `.agents/skills/linear/SKILL.md`.

## Source of truth: the prototype repo

Feature UX is prototyped in the **`studio-prototypes`** repo (`github.com/geins-io/studio-prototypes`, e.g. `src/prototypes/workspace/{area}/{feature}/*.jsx`); clone it alongside this repo if you haven't. Planning starts there:

1. Locate the feature's prototype and read it end to end — components, states, flows, copy.
2. Extract the discrete capabilities (each becomes one issue, roughly one PR's worth).
3. Note anything the prototype fakes (mock catalogues, hardcoded data) — those become explicit "real-API" follow-ups, not silent gaps.

## Project & milestone structure

- **One project per feature/initiative** (team "Studio"), not many small projects — milestones do the slicing.
- **Milestones are ordered phases, named `Phase N — <theme>`** (e.g. "Phase 1 — Browse & upload", "Phase 8 — Real API alignment"). Use this naming for every milestone.
- **Deferred / nice-to-have work is just a later phase** — add another `Phase N` rather than a special bucket name. (Some older projects have ad-hoc names like "Post-v0 (deferred)"; going forward, prefer phases.)
- Prefer **milestones over new projects** when it's the same feature at a different stage.
- When work depends on the platform/backend team, keep it in its own phase and mark those issues blocked with a note.

## What to create, and when

- **Create the project only when explicitly told to** (`save_project`: name, description, team "Studio"). Otherwise assume the project already exists and just add milestones/issues to it.
- **Create all the phase milestones up front** — the full phase plan is the useful artifact.
- **Only create the issues for Phase 1 initially.** Do NOT create every phase's issues at once: the project scope and what lives in each later milestone routinely shifts while coding. Flesh out a later phase's issues as it approaches.

## Turning the prototype into issues

For each Phase-1 capability, draft an issue (via `save_issue`) that is **implementation-ready** per the `linear` skill's readiness checks — enough that another agent executes it without inventing patterns:

- **Title**: imperative, scoped to one PR.
- **Prototype reference (when one exists)**: a concrete pointer to **where in the prototype to look** — the file path plus the specific component/section/state (e.g. `upload-wizard.jsx` → `AssetWizardReview`, the "matched" view). This is what the builder re-opens at implementation time, so be precise; it's how they avoid missing details or inventing behaviour.
- **Body**: what to build; the codebase conventions it must follow (repo/type registration, page patterns, i18n, docs); reuse-first note (check for a shadcn-vue primitive or existing app component before hand-rolling); and explicit open questions to confirm before coding.
- **Links**: the parent/related issues, and the prototype path.
- **Milestone**: place it in its phase. (Estimates/priority conventions: skip for now.)
- **Temporary scaffolding**: if the slice needs mock/phase-gated code, say so and point at the cutover ledger (`docs/domains/assets-cutover.md`) discipline.

## Slicing principles

- One issue ≈ one reviewable PR. Split when an issue would touch too many surfaces or carry two unrelated decisions.
- Sequence so each issue merges green on its own; note hard dependencies with blocked-by.
- Call out cross-team blockers up front (own milestone).
- Don't silently drop prototype scope — everything either becomes an issue or an explicit "deferred" note.

## Context grouping (for token-efficient execution)

Issues that share heavy exploration — the same prototype section, the same component/file inventory, the same domain dig — are cheapest to **build in one agent context**. Re-reading that exploration in a fresh context per issue is pure tax; carrying unrelated issues in one long context is also tax. Decide the grouping **at creation time**, while the shared context is fresh, so the builder never has to open and compare all the issues to work it out later.

- When two+ issues in a phase share the same exploration **and** can be built back-to-back (respect blocked-by order), add a **`**Context group:**`** line near the top of each one's body naming the siblings + a one-line why, e.g. `**Context group:** build in the same context as STU-339 — shares the AssetPickerSheet prototype + AssetCard/TableView inventory.`
- A **dependency chain** where B reuses A's exploration is the classic group. A **fan-out** of independent issues off one base usually is **not** — build each fresh; grouping unrelated surfaces just to batch them adds noise (= tokens).
- **Solo issues need no marker** — absence means "a fresh context is fine". Don't annotate everything.

## Handoff to execution

Once the phase milestones exist and Phase 1's issues are drafted, per-issue work uses `.agents/skills/linear/SKILL.md` (prep → build → present → merge → Ready for QA). Draft later phases' issues as those phases approach, since scope shifts while building.

## Project updates

Post a Linear **project status update** (`save_status_update`) to keep the project's health + progress visible.

**Cadence:** every **Friday**, at **each milestone completion**, and **on demand** ("post a project update for <project>").

**Format** — keep it short and scannable:

- **Health:** 🟢 On track · 🟡 At risk · 🔴 Off track
- **TL;DR** — one line.
- **Shipped since last update** — merged issues / completed milestones (with `STU-` refs).
- **In progress / up next** — what's active + what's queued.
- **Risks & blockers** — cross-team deps, open decisions (or "none").
- **Milestone** — current `Phase N` and what's left in it.

Draft from the last update (`get_status_updates`) + issues merged since; **present it for review before posting** — a project update is outward-facing, so don't auto-post.
