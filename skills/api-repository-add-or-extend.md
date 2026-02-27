# API repository: add or extend

Goal: Add a new typed repository (or extend an existing one) without bypassing the project’s API architecture.

See also:

- CLAUDE.md → “API Repositories”
- CLAUDE.md → “Project Structure” (app/utils/repositories, server/api proxy)

## Rules

- All API calls should flow through typed repository factories accessed via `useGeinsRepository`.
- The Nitro server proxy is a transparent passthrough (adds auth headers; no response transformation).

## Checklist

1. Identify which API group the entity belongs to (orderApi, customerApi, productApi, globalApi, etc.).
2. Prefer the existing base repo chain (entityGetRepo, entityListRepo, entityRepo) before writing custom fetches.
3. If you need domain-specific methods, add them as thin wrappers around the typed base repo behavior.
4. Wire the repo into the project’s repo registry so pages can access it via `useGeinsRepository`.

## Verify

- Typecheck passes (repo types are correct).
- List + get(id) work with expected `fields` behavior (if used).
