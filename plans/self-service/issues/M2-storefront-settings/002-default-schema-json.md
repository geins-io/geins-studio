---
title: "Create default Geins storefront schema JSON"
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
  - "./001-storefront-schema-types.md"
model: haiku
mode: claude-code agent
---

## Context

The storefront settings UI needs a default schema that ships with the app. This schema encodes the Figma designs (Base settings + Layout options tabs) and serves as the fallback when no custom schema is set on a channel. A utility function is also needed to generate default settings values from any schema.

## Expected Outcome

A static JSON file with the default schema, plus a utility to extract default values from a schema. These are used by the renderer (issue 004) and the schema editor (issue 006) reset function.

## Implementation Notes

**File: `app/assets/schemas/storefront-settings-default.json`**

Copy the default schema JSON from `/plans/self-service/storefront-settings-schema-spec.md` (the "Default Schema" section). It defines two tabs:

- **Base settings**: Storefront mode (radio-cards: Commerce/Catalogue) + Default settings section with Access Requirements group (toggles: priceVisibility, orderPlacement, stockStatus)
- **Layout options**: Logotype (file), Corner style (radio-cards: Square/Round), Font settings (2-column selects: Headings/Body), Theme colors (3 color fields: primary, background, accent)

**File: `app/utils/storefront-settings.ts`**

Utility functions:

1. `getDefaultSchema(): StorefrontSchema` — imports and returns the default JSON file, typed
2. `extractDefaultSettings(schema: StorefrontSchema): StorefrontSettings` — walks all fields in all tabs/sections and builds a flat key-value object from each field's `default` value. Handles `group` fields recursively (group's own default + children defaults)
3. `getSettingsValue(settings: StorefrontSettings, key: string): unknown` — reads a value by key
4. `setSettingsValue(settings: StorefrontSettings, key: string, value: unknown): StorefrontSettings` — returns a new settings object with the value set (immutable)

**Reference**: `/plans/self-service/storefront-settings-schema-spec.md` (Default Schema and Default Settings sections)

## Acceptance Criteria

- `app/assets/schemas/storefront-settings-default.json` exists and is valid JSON matching the spec
- `app/utils/storefront-settings.ts` exports all 4 utility functions
- `extractDefaultSettings` produces the exact default values from the spec document when given the default schema
- `getSettingsValue` and `setSettingsValue` handle flat dot-notation keys correctly
- Unit test: `extractDefaultSettings(getDefaultSchema())` returns expected default values object
- Unit test: `getSettingsValue` / `setSettingsValue` round-trip correctly for nested keys
- `pnpm typecheck` passes
- `pnpm lint:check` passes
- `pnpm test --run` passes

## Agent Execution
- **Model**: haiku
- **Mode**: claude-code agent
- **Why**: Static JSON creation from existing spec plus simple utility functions — no complex logic.
