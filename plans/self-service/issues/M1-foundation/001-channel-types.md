---
title: "Define Channel entity types"
project: "Self Service (Channels)"
milestone: "M1 — Foundation"
priority: 2
estimate: 1
labels:
  - feature
  - confidence-high
  - risk-low
  - geins-studio
model: haiku
mode: claude-code agent
---

## Context

The Channel entity needs CRUD types before any repository or page work can begin. The existing `Channel` interface in `shared/types/Account.ts` is a basic read-only shape used by `accountStore`. We need a full set of types following the established entity type pattern (Base/Create/Update/Response) in a new dedicated file.

## Expected Outcome

A new `shared/types/Channel.ts` file with all Channel entity types, exported and available via `#shared/types`. The existing `Channel` in `Account.ts` remains untouched for backwards compatibility.

## Implementation Notes

Follow the pattern in `shared/types/Quotation.ts` using `CreateEntity<T>`, `UpdateEntity<T>`, and `ResponseEntity<T>` from `shared/types/Global.ts`.

**Types to define:**

1. `ChannelBase` — shared fields: `name`, `displayName`, `url`, `type` (enum: `webshop` | `physical` | `other`), `active`, `defaultLanguage`
2. `ChannelCreate` — extends `CreateEntity<ChannelBase>` (name, displayName, type, url, active)
3. `ChannelUpdate` — extends `UpdateEntity<ChannelBase>` (partial of create + ID)
4. `ChannelResponse` — extends `ResponseEntity<ChannelBase>` with response-only fields: `languages`, `markets`, `paymentMethods`, `storefrontSettings`, etc.
5. `ChannelListItem` — lightweight type for list page: `_id`, `name`, `displayName`, `url`, `markets` (count or array), `active`
6. `ChannelFieldsFilter` — field filter type for API options (e.g. `'default' | 'all' | 'markets' | 'languages' | 'payments'`)
7. `ChannelApiOptions` — extends `ApiOptions<ChannelFieldsFilter>`

**Reference files:**
- Pattern: `shared/types/Quotation.ts`
- Type utilities: `shared/types/Global.ts` (`CreateEntity`, `UpdateEntity`, `ResponseEntity`, `EntityBase`)
- Existing channel type: `shared/types/Account.ts`

Export all new types from the shared types index.

## Acceptance Criteria

- `shared/types/Channel.ts` exists with all types listed above
- Types are exported from the shared types barrel (`shared/types/index.ts` or equivalent)
- `ChannelCreate` uses `CreateEntity<ChannelBase>` (omits `_id`, `_type`)
- `ChannelUpdate` uses `UpdateEntity<ChannelBase>` (all fields optional)
- `ChannelResponse` uses `ResponseEntity<ChannelBase>` (adds `_id`, `_type`)
- Existing `Channel` in `Account.ts` is not modified
- `pnpm typecheck` passes with no new errors
- `pnpm lint:check` passes

## Agent Execution
- **Model**: haiku
- **Mode**: claude-code agent
- **Why**: Straightforward type definitions following an established pattern — no complex logic or cross-file reasoning needed.
