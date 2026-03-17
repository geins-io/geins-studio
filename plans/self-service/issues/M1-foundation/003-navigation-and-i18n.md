---
title: "Add channel navigation entry and i18n keys"
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

Before building the list and edit pages, the navigation entry and i18n translations need to be in place. Channels belong under the "Store" section in the navigation sidebar.

## Expected Outcome

A "Channels" navigation item visible in the sidebar under the Store group, with all necessary i18n keys in both English and Swedish locale files.

## Implementation Notes

**Navigation (`app/lib/navigation.ts`):**

Add a new entry under the Store group (or create the group if it doesn't exist):

```typescript
{
  label: t('navigation.channels'),
  href: '/store/channel/list',
  icon: 'Store',  // or appropriate Lucide icon
  group: 'store',
  children: [
    {
      label: t('navigation.channels'),
      href: '/store/channel/list',
      childPattern: '/store/channel/:id',
    },
  ],
}
```

**i18n (`i18n/locales/en.json` + `sv.json`):**

Add these keys:
- `"channel": "Channel | Channels"` (top-level — pluralized entity name)
- `"navigation.channels": "Channels"` (nav label)
- Domain-specific keys under a `"store"` namespace (or `"channels"` namespace — check existing pattern):
  - `"display_name"`, `"channel_url"`, `"channel_type"`, `"default_language"`, `"additional_languages"` — or reuse existing keys if they already exist
- Check if `"store"` namespace already exists; if not, create it

**Reference files:**
- Navigation pattern: `app/lib/navigation.ts`
- i18n pattern: `i18n/locales/en.json` (check existing entity sections like `orders`, `pricing`)

## Acceptance Criteria

- "Channels" appears in the sidebar navigation under the Store group
- Clicking "Channels" navigates to `/store/channel/list`
- `navigation.channels` key exists in both `en.json` and `sv.json`
- `channel` entity name key exists in both locale files (with pluralization)
- `pnpm lint:check` passes
- Manual verification: navigation renders without console errors

## Agent Execution
- **Model**: haiku
- **Mode**: claude-code agent
- **Why**: Simple additions to existing config files — no complex logic, just following the established pattern.
