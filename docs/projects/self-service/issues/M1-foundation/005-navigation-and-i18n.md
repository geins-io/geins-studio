---
title: 'Add Channels navigation entry and i18n keys'
project: 'Self Service (Channels)'
milestone: 'M1 — Foundation'
priority: 3
estimate: 1
labels:
  - feature
  - confidence-high
  - risk-low
depends_on:
  - './003-channel-list-page.md'
model: haiku
mode: claude-code agent
---

## Context

The Channels section needs to appear in the main navigation and all UI text must be localised. Currently `app/lib/navigation.ts` has no Settings section and no channel entry. The i18n files have no channel-related keys.

## Expected Outcome

- A "Store" section (or "Settings" — match the visual grouping in the Figma designs) appears in the sidebar navigation with a "Channels" child item.
- All channel-related i18n keys are present in both `en.json` and `sv.json`.

## Implementation Notes

### Navigation (`app/lib/navigation.ts`)

Add a new top-level entry for "Store" with icon `Store` (Lucide) and group `store`. Add a "Channels" child:

```ts
{
  label: t('navigation.store'),
  href: '/store/channel/list',
  icon: 'Store',
  group: 'store',
  children: [
    {
      label: t('navigation.channels'),
      href: '/store/channel/list',
      childPattern: '/store/channel/:id',
    },
  ],
},
```

### i18n keys

Add to both `i18n/locales/en.json` and `i18n/locales/sv.json` under a `channel` namespace:

**Navigation (top-level `navigation` namespace):**
- `navigation.store` — "Store" / "Butik"
- `navigation.channels` — "Channels" / "Kanaler"

**Entity actions (global keys — use `@.lower:{entityName}` interpolation pattern):**
- `channel.entity_name` — "channel" / "kanal" (used as `{entityName}` in global action keys)

**Channel-specific labels:**
- `channel.name` — "Internal name" / "Internt namn"
- `channel.display_name` — "Display name" / "Visningsnamn"
- `channel.url` — "Storefront URL" / "Butiksadress"
- `channel.type` — "Channel type" / "Kanaltyp"
- `channel.type_webshop` — "Webshop" / "Webshop"
- `channel.type_physical` — "Physical store" / "Fysisk butik"
- `channel.type_other` — "Other" / "Annat"
- `channel.markets_count` — "Markets" / "Marknader"
- `channel.languages_count` — "Languages" / "Språk"
- `channel.transaction_mails` — "Transaction mails" / "Transaktionsmejl"
- `channel.activate_info` — "Activating a channel triggers background processing. This may take a moment." / "Att aktivera en kanal startar bakgrundsbearbetning. Det kan ta en stund."
- `channel.activate_error` — "Failed to activate channel" / "Kunde inte aktivera kanalen"
- `channel.deactivate_error` — "Failed to deactivate channel" / "Kunde inte inaktivera kanalen"

**Tab labels:**
- `channel.tab_storefront_settings` — "Storefront settings" / "Butikinställningar"
- `channel.tab_general` — "General" / "Allmänt"
- `channel.tab_markets` — "Markets" / "Marknader"
- `channel.tab_payments` — "Payments" / "Betalningar"
- `channel.tab_mails` — "Mails" / "Mejl"

**Helper text:**
- `channel.name_helper` — "Generated automatically from the display name on creation." / "Genereras automatiskt från visningsnamnet vid skapande."
- `channel.url_helper` — "Changing the URL will break existing links." / "Att ändra URL:en bryter befintliga länkar."

## Acceptance Criteria

- `app/lib/navigation.ts` includes the "Store" group with "Channels" child pointing to `/store/channel/list`.
- `childPattern: '/store/channel/:id'` ensures the nav item stays active on edit pages.
- All i18n keys listed above exist in both `en.json` and `sv.json`.
- No keys are missing in one locale file but present in the other.
- `pnpm typecheck` and `pnpm lint:check` pass with no new errors.

## Agent Execution

- **Model**: haiku
- **Mode**: claude-code agent
- **Why**: Pure config/text changes — navigation entry and JSON key additions require no logic.
