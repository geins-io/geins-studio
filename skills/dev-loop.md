# Dev loop

Goal: Start development quickly, make a change, and verify it locally.

See also:

- CLAUDE.md → “Geins Studio - Commands”
- CLAUDE.md → “Workflow Rules”

## Start

- Run: `pnpm dev`
- App should be available at: http://localhost:3000

## Fast checks (pick what matches your change)

- Lint with fixes: `pnpm lint`
- CI-safe lint (no fixes): `pnpm lintcheck`
- Typecheck: `pnpm typecheck`
- Unit tests (single run): `pnpm test --run`

## While working (non-negotiables)

- Follow established patterns and conventions from CLAUDE.md.
- Don’t use `console.log`; use the project logging approach described in CLAUDE.md.
- Be mindful of performance implications (data fetching, state, rendering).

## After finishing a task

- Update CLAUDE.md with new learnings (and remove stale info).
- Keep docs up to date if you changed patterns/architecture.
