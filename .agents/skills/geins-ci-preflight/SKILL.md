---
name: geins-ci-preflight
description: "Run the same checks locally that CI will run, so PRs don't bounce. Use before committing or creating a pull request. Trigger on: before commit, pre-commit, CI checks, preflight, PR checks, lint fails, typecheck fails, test fails, before PR, ready to commit."
---

# Geins Studio — CI Preflight

Run the same checks locally that CI will run so PRs don't bounce. See `CLAUDE.md` → "Workflow Rules" → "Before committing" for the canonical reference.

## Before every commit (required)

```bash
pnpm lint:check   # read-only, CI-safe
pnpm typecheck
```

Do not commit with known failures.

## Tests

```bash
pnpm test:changed
```

Runs only the tests affected by the branch's changes — the same set the pre-push hook runs. The full suite and `pnpm build` run in CI (`.github/workflows/ci-quality-gate.yml`), which `next` requires before merging. Run `pnpm build` locally too when i18n messages or template syntax changed.

## If lint fails

Fix locally using `pnpm lint` (auto-fix), then re-run `pnpm lint:check`.

## If typecheck fails

Fix types without weakening established patterns — don't `any` around errors unless you also document the reason.

## If tests fail

First decide whether the failure is a regression or a stale expectation (`docs/guides/testing.md` → "When a test fails"). Fix accordingly, then re-run the tests.
