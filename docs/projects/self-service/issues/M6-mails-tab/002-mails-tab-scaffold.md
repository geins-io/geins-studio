---
title: 'Scaffold ChannelMailsTab with inner sub-tabs and wire into channel edit page'
project: 'Self Service (Channels)'
milestone: 'M6 — Mails Tab'
priority: 2
estimate: 2
labels:
  - feature
  - confidence-high
  - risk-low
depends_on:
  - './001-mail-types-and-repository.md'
  - '../M1-foundation/004-channel-edit-page-scaffold.md'
model: sonnet
mode: claude-code agent
---

## Context

Before any sub-tab content is implemented, the Mails tab needs its structural shell: a `ContentEditCard` with three inner sub-tabs (Mail content, General, Layout options) and a settings gear icon in the card header. This issue creates that shell with placeholder content in each sub-tab, then wires it into the channel edit page so subsequent issues can fill in the content independently.

## Expected Outcome

1. `app/components/channel/ChannelMailsTab.vue` with:
   - `ContentEditCard` titled `t('channel.mails')`.
   - Inner `Tabs` with triggers: "Mail content", "General", "Layout options".
   - Each sub-tab body is an empty placeholder for now (sub-tabs are filled in by issues 003–005).
   - Gear icon (`Settings` from Lucide) in `#header-action` slot — non-functional at this stage, `disabled`.
   - `defineProps<{ mailSettings: ChannelMailSettings | null, mailTypes: ChannelMailType[], loading?: boolean }>()`.

2. `app/pages/store/channel/[id].vue`:
   - "Mails" tab added to the tab bar (after Payments).
   - `ChannelMailsTab` rendered in that tab slot.
   - Two new refs: `channelMailSettings` and `channelMailTypes`.
   - In `parseEntityData`: `channelMailSettings.value = entity.mailSettings ?? null` and `channelMailTypes.value = entity.mailTypes ?? []`.

## Implementation Notes

### Component structure

Use shadcn-vue `Tabs` for the inner sub-tabs (same import path as used in other components). Default active tab: `"mail-content"`.

```html
<ContentEditCard :title="t('channel.mails')">
  <template #header-action>
    <Button variant="ghost" size="icon" disabled>
      <Settings class="size-4" />
    </Button>
  </template>
  <Tabs default-value="mail-content">
    <TabsList>
      <TabsTrigger value="mail-content">{{ t('channel.mail_content') }}</TabsTrigger>
      <TabsTrigger value="general">{{ t('channel.mail_general') }}</TabsTrigger>
      <TabsTrigger value="layout">{{ t('channel.mail_layout') }}</TabsTrigger>
    </TabsList>
    <TabsContent value="mail-content"><!-- filled by issue 003 --></TabsContent>
    <TabsContent value="general"><!-- filled by issue 004 --></TabsContent>
    <TabsContent value="layout"><!-- filled by issue 005 --></TabsContent>
  </Tabs>
</ContentEditCard>
```

Pass `mailSettings` and `mailTypes` as props so sub-tab issues can consume them via the same component without changing the prop contract.

### Page integration

`channelMailSettings` and `channelMailTypes` are standalone refs (not form fields). They are populated exclusively in `parseEntityData` and will be synced to `entityDataUpdate` via dedicated watchers in issues 004 and 005.

### i18n

Add to `channel` namespace in `en.json` and `sv.json`:
- `channel.mails` → `"Mails"`
- `channel.mail_content` → `"Mail content"`
- `channel.mail_general` → `"General"`
- `channel.mail_layout` → `"Layout options"`

## Acceptance Criteria

- `ChannelMailsTab` renders `ContentEditCard` with three sub-tab triggers.
- Gear icon is visible in the card header (disabled).
- "Mails" tab appears in the channel edit page tab bar.
- `channelMailSettings` and `channelMailTypes` refs are populated in `parseEntityData`.
- Component renders without errors when `mailSettings` is `null` and `mailTypes` is `[]`.
- `pnpm typecheck` and `pnpm lint:check` pass with no new errors.
- All visible strings in `en.json` and `sv.json`.
- Vitest: test that `ChannelMailsTab` renders the three sub-tab triggers; test that it renders without crashing when `mailSettings` is `null` and `mailTypes` is `[]`.

## Agent Execution

- **Model**: sonnet
- **Mode**: claude-code agent
- **Why**: Structural scaffolding following established tab and card patterns — low complexity, low risk.
