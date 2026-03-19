---
title: 'Define Channel TypeScript types'
project: 'Self Service (Channels)'
milestone: 'M1 — Foundation'
priority: 2
estimate: 2
labels:
  - feature
  - confidence-high
  - risk-low
model: haiku
mode: claude-code agent
---

## Context

The existing `Channel` interface in `shared/types/Account.ts` is a minimal stub used by `accountStore`. The full channel entity — as needed for list, create, edit, and API response shapes — does not exist yet. All subsequent M1 issues depend on these types being defined first.

## Expected Outcome

A new file `shared/types/Channel.ts` contains all Channel-related TypeScript interfaces. The existing `Channel` interface in `Account.ts` is left untouched for backwards compatibility.

## Implementation Notes

- Follow the pattern from `shared/types/Quotation.ts` (separate Base/Response/Create/Update interfaces, all extending `EntityBase` from `Global.ts`).
- All new types must be exported from `shared/types/index.ts` (check current barrel).
- Do **not** modify `shared/types/Account.ts` — `accountStore` depends on the existing `Channel` type.
- Type definitions should be inferred from the project plan's "Type Gaps" table and the confirmed API details in M1.

### Types to define

**`ChannelResponse`** — full API response shape (used by the edit page):
- All fields from existing `Channel` (name, displayName, location/url, type, active)
- `url: string` — the channel's storefront URL (`tblSite.strUrl`)
- `languages: ChannelLanguage[]` — ordered array; first item is the default language
- `markets: ChannelMarket[]` — ordered array; first item is the default market
- `paymentMethods: ChannelPaymentMethod[]` — full payment method objects with `active`
- `mailSettings: ChannelMailSettings` — general + layout settings
- `mailTypes: ChannelMailType[]` — list of all mail templates
- `storefrontSettings: Record<string, unknown>` — opaque nested JSON
- `storefrontSchema: Record<string, unknown>` — opaque JSON schema

**`ChannelCreate`** — POST body:
- `name: string`, `displayName: string`, `url: string`, `type: ChannelType`, `active: boolean`

**`ChannelUpdate`** — PATCH body (multipart/form-data JSON part named `"channel"`):
- Partial of ChannelCreate fields
- `languages?: ChannelLanguageAssignment[]` — ordered; first = default
- `markets?: ChannelMarketAssignment[]` — ordered; first = default
- `paymentMethods?: ChannelPaymentMethodAssignment[]`
- `mailSettings?: Partial<ChannelMailSettings>`
- `storefrontSettings?: Record<string, unknown>`
- `storefrontSchema?: Record<string, unknown>`

**`ChannelListItem`** — table row shape (subset of response):
- `_id`, `name`, `displayName`, `url`, `type`, `active`
- `marketCount: number`

**Sub-entity types:**
- `ChannelLanguage` — `{ _id, name, active }` (same shape as existing `Language` but scoped to this file)
- `ChannelLanguageAssignment` — `{ _id: string, active: boolean }` (write shape)
- `ChannelMarket` — read shape with `country`, `currency`, `vat?`, `group?`, `active`
- `ChannelMarketAssignment` — `{ _id: string, active: boolean }` (write shape)
- `ChannelPaymentMethod` — `{ _id, name, icon?, markets, customerTypes, customerGroups, active }`
- `ChannelPaymentMethodAssignment` — `{ _id: string, active: boolean }`
- `ChannelMailSettings` — general settings (`displayName`, `fromEmailAddress`, `loginUrl`, `passwordResetUrl`, `orderConfirmationBCCEmail?`) + layout settings (colors, fonts, logo URLs)
- `ChannelMailType` — `{ _id, type: string, name: string, active: boolean }`

## Acceptance Criteria

- `shared/types/Channel.ts` exists and exports all interfaces listed above.
- All types are re-exported from the shared types barrel (`shared/types/index.ts`).
- `shared/types/Account.ts` is unchanged — `Channel`, `Market`, `Language` there remain as-is.
- TypeScript compiler (`pnpm typecheck`) passes with no new errors.
- Each interface includes only fields confirmed by the project plan — no speculative fields.

## Agent Execution

- **Model**: haiku
- **Mode**: claude-code agent
- **Why**: Pure type definitions with no runtime logic — straightforward, low-risk, well-scoped.
