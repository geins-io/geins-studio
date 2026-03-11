# Skills (Agent Runbooks)

This folder contains short, task-focused runbooks (“skills”) for working in Geins Studio.
They are designed to be executed quickly and consistently by an agent (or a human) without scanning all of `CLAUDE.md`.

## Relationship to CLAUDE.md

- `CLAUDE.md` is the canonical reference (principles, architecture, invariants, domain knowledge).
- Skills are procedural checklists and command recipes.
- Skills should link back to the relevant `CLAUDE.md` section instead of duplicating long explanations.

## How to use

1. Pick the skill that matches the task (e.g. “add-new-entity”, “ci-preflight”).
2. Follow the checklist in order.
3. If you discover a new convention or a better workflow, update `CLAUDE.md` first (source of truth), then update or add a skill.

## Index

- dev-loop.md
- ci-preflight.md
- add-new-entity.md
- entity-edit-page-edit-mode-loading.md
- i18n-update.md
- api-repository-add-or-extend.md
- ui-component-conventions.md
- table-patterns.md
