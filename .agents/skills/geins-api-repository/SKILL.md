---
name: geins-api-repository
description: "Add a new typed API repository or extend an existing one in Geins Studio without bypassing the project's API architecture. Use when creating new API integrations, adding endpoints, or wiring repositories. Trigger on: repository, API repository, add repo, new endpoint, create repository, extend repository, API integration, useGeinsRepository, entityRepo."
---

# Geins Studio — API Repository: Add or Extend

Add a new typed repository or extend an existing one without bypassing the project's API architecture. See `CLAUDE.md` → "API Repositories" for the canonical reference.

## Rules

- All API calls flow through typed repository factories accessed via `useGeinsRepository()`.
- The Nitro server proxy (`server/api/[...].ts`) is a transparent passthrough — adds auth headers, no response transformation.

## Repository factory chain

Simplest → fullest: `entityGetRepo` → `entityListRepo` → `entityBaseRepo` → `entityRepo` (full CRUD). Pick the right level for the entity's API capabilities.

## Checklist

1. **Identify API group** — Which group does the entity belong to? (`orderApi`, `customerApi`, `productApi`, `globalApi`, etc.)
2. **Use the base repo chain** — Prefer `entityRepo` and friends before writing custom fetches.
3. **Domain-specific methods** — Add them as thin wrappers around the typed base repo behavior.
4. **Wire the repo** — Register in `app/utils/repos.ts` and expose via `app/composables/useGeinsRepository.ts`.

## Verify

```bash
pnpm typecheck
```

- Repo types are correct.
- `list()` and `get(id)` work with expected `fields` behavior (if used).
