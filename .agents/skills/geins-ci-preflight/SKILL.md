---
name: geins-ci-preflight
description: "Run the same checks locally that CI will run, so PRs don't bounce. Use before committing or creating a pull request. Trigger on: before commit, pre-commit, CI checks, preflight, PR checks, lint fails, typecheck fails, test fails, before PR, ready to commit."
---

# Geins Studio — CI Preflight

Run the same checks locally that CI will run so PRs don't bounce. See `CLAUDE.md` → "Workflow Rules" → "Before committing" for the canonical reference.

## Before every commit (required by workflow rule 5)

```bash
pnpm lint:check   # read-only, CI-safe
pnpm typecheck
```

## Before PR (full suite)

```bash
pnpm test --run
```

## If lint fails

Fix locally using `pnpm lint` (auto-fix), then re-run `pnpm lint:check`.

## If typecheck fails

Fix types without weakening established patterns — don't `any` around errors unless you also document the reason.

## If tests fail

Fix the failing spec(s), then re-run `pnpm test --run`.
