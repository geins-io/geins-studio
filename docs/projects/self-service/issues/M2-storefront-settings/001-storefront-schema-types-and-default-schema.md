---
title: 'Define storefront schema TypeScript types and default JSON schema'
project: 'Self Service (Channels)'
milestone: 'M2 — Storefront Settings'
priority: 2
estimate: 2
labels:
  - feature
  - confidence-high
  - risk-low
depends_on:
  - '../M1-foundation/001-channel-types.md'
model: sonnet
mode: claude-code agent
---

## Context

The entire Storefront settings tab is driven by a JSON schema. Before any UI can be built, the TypeScript types that describe the schema structure and the default Geins schema JSON must exist. This is the foundational layer that all M2 components depend on.

Full specification is in `docs/projects/self-service/storefront-settings-schema-spec.md`.

## Expected Outcome

- TypeScript types for the schema system are defined in `shared/types/Storefront.ts`
- A default Geins storefront schema is available as a static JSON asset at `app/assets/schemas/storefront-settings-default.json`
- `ChannelResponse` in `shared/types/Channel.ts` references `storefrontSchema` and `storefrontSettings`
- `ChannelUpdate` includes `storefrontSchema?: StorefrontSchema` and `storefrontSettings?: StorefrontSettings`

## Implementation Notes

### TypeScript types (`shared/types/Storefront.ts`)

Transcribe the types directly from the spec doc:

```ts
export type StorefrontSchema = Record<string, SchemaTab>
export type StorefrontSettings = Record<string, unknown>

export interface SchemaTab { label: string; icon?: string; sections: SchemaSection[] }
export interface SchemaSection { key: string; title: string; description?: string; icon?: string; fields: SchemaField[] }
export interface SchemaField {
  key: string; type: SchemaFieldType; label: string; description?: string; icon?: string
  default?: unknown; required?: boolean; disabled?: boolean
  options?: SchemaFieldOption[]; accept?: string; min?: number; max?: number
  pattern?: string; placeholder?: string; children?: SchemaField[]
  columns?: 1 | 2 | 3
  visibleWhen?: { field: string; equals: unknown }
}
export type SchemaFieldType = 'string' | 'number' | 'boolean' | 'select' | 'color' | 'file' | 'radio-cards' | 'group'
export interface SchemaFieldOption { value: string; label: string; description?: string; icon?: string }
```

Export from `shared/types/index.ts` (or whatever the barrel file is — check first).

### Default schema JSON (`app/assets/schemas/storefront-settings-default.json`)

Transcribe the full default schema from the spec doc exactly. It has two top-level tabs:
- `"baseSettings"` — Storefront mode (radio-cards) + Access Requirements group (3 boolean children)
- `"layoutOptions"` — Logotype (file), Corner style (radio-cards), Font settings (2× select with `columns: 2`), Theme colors (3× color)

### Helper utility

Add a utility function `getDefaultSettings(schema: StorefrontSchema): StorefrontSettings` in `app/utils/storefront.ts` that walks every field in every section of every tab and collects `default` values into a flat object. This is used when creating a new channel or resetting to defaults.

## Acceptance Criteria

- `shared/types/Storefront.ts` exports all types listed above with correct TypeScript shapes.
- `StorefrontSchema` and `StorefrontSettings` are added to `ChannelResponse` and `ChannelUpdate` in `shared/types/Channel.ts`.
- `app/assets/schemas/storefront-settings-default.json` is valid JSON and matches the schema structure defined by `StorefrontSchema`.
- `getDefaultSettings(defaultSchema)` returns the expected flat settings object from the spec doc (all 12 key-value pairs).
- `pnpm typecheck` and `pnpm lint:check` pass with no new errors.
- Vitest: unit tests for `getDefaultSettings` covering: all default values are extracted, missing `default` fields are omitted, group children are included.

## Agent Execution

- **Model**: sonnet
- **Mode**: claude-code agent
- **Why**: Straightforward transcription of a fully-specified schema into TypeScript types and a JSON file — no ambiguity, no complex logic.
