# CI preflight

Goal: Run the same checks locally that CI will run (so PRs don’t bounce).

See also:

- CLAUDE.md → “Geins Studio - Commands”
- CLAUDE.md → “Workflow Rules”

## Run (recommended order)

1. `pnpm lint:check` (read-only, CI-safe)
2. `pnpm typecheck`
3. `pnpm test --run`

## If lint fails

- Fix locally using `pnpm lint` (auto-fix), then re-run `pnpm lint:check`.

## If typecheck fails

- Fix types without weakening established patterns (don’t “any” around errors unless you also document the reason).

## If tests fail

- Fix the failing spec(s), then re-run `pnpm test --run`.
