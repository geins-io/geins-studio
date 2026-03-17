---
title: "Define storefront schema and settings types"
project: "Self Service (Channels)"
milestone: "M2 — Storefront Settings"
priority: 2
estimate: 1
labels:
  - feature
  - confidence-high
  - risk-low
  - geins-studio
depends_on:
  - "../M1-foundation/001-channel-types.md"
model: haiku
mode: claude-code agent
---

## Context

The storefront settings tab is entirely driven by a JSON schema. Before building the renderer or any UI, we need TypeScript types that define the schema shape (`StorefrontSchema`) and the settings data shape (`StorefrontSettings`). These types are fully specified in `/plans/self-service/storefront-settings-schema-spec.md` and must be translated into the project's type system.

## Expected Outcome

A new `shared/types/StorefrontSettings.ts` file exporting all schema-related types. The `ChannelResponse` type (from M1) should reference `StorefrontSchema` and `StorefrontSettings` for the channel's storefront data.

## Implementation Notes

**File: `shared/types/StorefrontSettings.ts`**

Translate the types from the spec document verbatim:

1. `StorefrontSchema` — `Record<string, SchemaTab>` (top-level keys = tabs)
2. `SchemaTab` — `{ label, icon?, sections[] }`
3. `SchemaSection` — `{ key, title, description?, icon?, fields[] }`
4. `SchemaField` — The main field definition with `key`, `type`, `label`, plus type-specific props (`options`, `accept`, `min`, `max`, `pattern`, `placeholder`), grouping (`children`), layout (`columns`), and conditional visibility (`visibleWhen`)
5. `SchemaFieldType` — Union: `'string' | 'number' | 'boolean' | 'select' | 'color' | 'file' | 'radio-cards' | 'group'`
6. `SchemaFieldOption` — `{ value, label, description?, icon? }`
7. `StorefrontSettings` — `Record<string, unknown>` (flat key-value store, shape determined by schema)

Also add a utility type `SchemaFieldVisibleWhen` — `{ field: string, equals: unknown }`.

**Reference**: `/plans/self-service/storefront-settings-schema-spec.md` (TypeScript types section)

Export all types from the shared types barrel.

## Acceptance Criteria

- `shared/types/StorefrontSettings.ts` exists with all 7+ types listed above
- Types match the specification document exactly
- Types are exported from the shared types index
- `ChannelResponse` in `shared/types/Channel.ts` includes optional `storefrontSchema?: StorefrontSchema` and `storefrontSettings?: StorefrontSettings` fields
- `pnpm typecheck` passes
- `pnpm lint:check` passes

## Agent Execution
- **Model**: haiku
- **Mode**: claude-code agent
- **Why**: Straightforward type definitions from an existing specification — no complex logic needed.
