---
title: "Create channel API repository and register it"
project: "Self Service (Channels)"
milestone: "M1 — Foundation"
priority: 2
estimate: 2
labels:
  - feature
  - confidence-high
  - risk-low
  - geins-studio
depends_on:
  - "./001-channel-types.md"
model: sonnet
mode: claude-code agent
---

## Context

The channel entity needs a repository for API communication. Currently `globalRepo` has a read-only `channel.list()`. We need a full CRUD repository following the `entityRepo` factory chain, registered in the composable so pages can access it via `useGeinsRepository()`.

## Expected Outcome

A new channel repository with full CRUD operations, registered and accessible as `channelApi` from `useGeinsRepository()`. The existing `globalApi.channel.list()` remains for account-level channel listing (used by `accountStore`).

## Implementation Notes

**New file: `app/utils/repositories/channel.ts`**

Use the `entityRepo` factory chain (same pattern as `customer.ts` or `order.ts`):

```
entityGetRepo → entityListRepo → entityBaseRepo → entityRepo (full CRUD)
```

Assumed endpoints (confirm with API — may be `/account/channel/` or `/channel/`):
- `GET /channel` — list all channels
- `GET /channel/{id}` — single channel with full details
- `POST /channel` — create
- `PATCH /channel/{id}` — update
- `DELETE /channel/{id}` — delete

Generic types: `entityRepo<ChannelResponse, ChannelCreate, ChannelUpdate>`

**Registration:**
1. `app/utils/repos.ts` — add `channel: channelRepo` to the `repo` object
2. `app/composables/useGeinsRepository.ts` — add `channelApi: repo.channel($geinsApiFetchInstance)` to the return object and update `UseGeinsRepositoryReturnType`

**Reference files:**
- Repository factories: `app/utils/repositories/entity-base.ts`, `app/utils/repositories/entity.ts`
- Existing domain repo: `app/utils/repositories/order.ts` or `app/utils/repositories/customer.ts`
- Registration: `app/utils/repos.ts`, `app/composables/useGeinsRepository.ts`

## Acceptance Criteria

- `app/utils/repositories/channel.ts` exists with a `channelRepo` factory function
- Repository provides `list()`, `get(id, options?)`, `create(data)`, `update(id, data)`, `delete(id)` methods
- Repository is registered in `app/utils/repos.ts`
- `channelApi` is accessible from `useGeinsRepository()` return type
- `UseGeinsRepositoryReturnType` interface includes `channelApi`
- `pnpm typecheck` passes
- `pnpm lint:check` passes
- Unit test: verify the repository factory returns an object with all expected methods (list, get, create, update, delete)

## Agent Execution
- **Model**: sonnet
- **Mode**: claude-code agent
- **Why**: Standard repository setup following existing patterns, but involves multiple files and registration steps that benefit from sonnet's broader context handling.
