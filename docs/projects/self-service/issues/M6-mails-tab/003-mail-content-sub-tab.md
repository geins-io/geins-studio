---
title: 'Implement Mail content sub-tab with dynamic template list and row component'
project: 'Self Service (Channels)'
milestone: 'M6 — Mails Tab'
priority: 2
estimate: 3
labels:
  - feature
  - confidence-medium
  - risk-low
depends_on:
  - './002-mails-tab-scaffold.md'
model: sonnet
mode: claude-code agent
---

## Context

The Mail content sub-tab lists all mail template types assigned to the channel, rendered dynamically from `entity.mailTypes` in the channel GET response — not a hardcoded array. Each row shows the template name, description, and a pencil button to open the configuration sheet (issue 006). There is no per-type enable/disable toggle — the backend only has a global `Disabled` master flag.

Design reference: Figma node `99:21317`.

## Expected Outcome

1. `app/components/channel/ChannelMailContentRow.vue` — single mail template row:
   - Mail icon (Lucide `Mail`) on the left.
   - Template name (`text-sm font-medium`) + description (`text-xs text-muted-foreground`) in the center (`flex-1`).
   - Edit button (Lucide `Pencil`, `variant="ghost"`, `size="icon"`) on the right that emits `edit` with the `ChannelMailType` payload.

2. `app/components/channel/ChannelMailContentTab.vue` — the sub-tab body:
   - `defineProps<{ mailTypes: ChannelMailType[], loading?: boolean }>()`.
   - Renders one `ChannelMailContentRow` per entry, separated by `divide-y`.
   - Empty state when `mailTypes` is `[]`: `t('channel.no_mail_types')`.
   - Skeleton rows (3 rows at `h-14`) when `loading` is `true`.
   - Emits `edit(mailType: ChannelMailType)` upward — parent will open `ChannelMailConfigSheet` (wired in issue 006).

3. `ChannelMailsTab.vue` updated to slot `ChannelMailContentTab` into the "Mail content" sub-tab, passing `:mailTypes` and `:loading` from its own props.

## Implementation Notes

### `ChannelMailContentRow.vue`

```ts
const props = defineProps<{ mailType: ChannelMailType }>()
const emit = defineEmits<{ edit: [mailType: ChannelMailType] }>()
```

Row layout: `flex items-center gap-4 py-3 px-4`.

The pencil edit button should be accessible with `aria-label` set to `t('channel.edit_mail_type', { name: mailType.name })`.

No API calls in this component — purely presentational.

### `ChannelMailContentTab.vue`

No API calls. Pure presentation. The parent page owns the `edit` event and will open the config sheet.

When `loading` is `true`, render 3 skeleton rows using `<Skeleton class="h-14 w-full rounded-md" />` inside a `flex flex-col gap-2` wrapper instead of the list.

### i18n

Add to `channel` namespace in `en.json` and `sv.json`:
- `channel.no_mail_types` → `"No mail templates configured for this channel."`
- `channel.edit_mail_type` → `"Edit {name}"`

## Acceptance Criteria

- `ChannelMailContentTab` renders one `ChannelMailContentRow` per entry in `mailTypes`.
- Clicking the edit button emits `edit` with the correct `ChannelMailType` object.
- Empty state renders when `mailTypes` is `[]`.
- Skeleton rows render when `loading` is `true`.
- `ChannelMailsTab` slots `ChannelMailContentTab` into the "Mail content" sub-tab and threads `edit` events upward.
- `pnpm typecheck` and `pnpm lint:check` pass with no new errors.
- All visible strings in `en.json` and `sv.json`.
- Vitest: test that `ChannelMailContentTab` renders the correct number of rows for a given `mailTypes` array; test that clicking the edit button emits the correct `ChannelMailType`; test that empty state renders for `mailTypes: []`; test that 3 skeleton rows render when `loading: true`.

## Agent Execution

- **Model**: sonnet
- **Mode**: claude-code agent
- **Why**: Presentational component pattern with no new API calls — follows established row/tab patterns used throughout the codebase.
