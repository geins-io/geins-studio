---
title: 'Implement Mail general settings sub-tab wired to channel PATCH'
project: 'Self Service (Channels)'
milestone: 'M6 — Mails Tab'
priority: 2
estimate: 2
labels:
  - feature
  - confidence-high
  - risk-low
depends_on:
  - './002-mails-tab-scaffold.md'
model: sonnet
mode: claude-code agent
---

## Context

The General sub-tab within the Mails card contains shared sender settings (display name, from address, URLs) and optional SMTP overrides. These live on `ChannelMailSettings.general` and are saved via the single `PATCH /account/channel/{id}` channel write surface — same as all other channel fields. There is also a global master toggle (`disabled`) that disables all transaction mails for the channel.

Design reference: Figma node `175:4240`.

## Expected Outcome

1. `app/components/channel/ChannelMailGeneralTab.vue`:
   - A `Switch` + label for the global "Disable all transaction mails" master toggle at the top, bound to `modelValue.disabled`.
   - `FormGrid design="1+1"`: Display name + From email address.
   - `FormGrid design="1+1"`: Login URL + Password reset URL.
   - `FormGrid design="1"`: BCC email (labeled as optional).
   - Collapsible "SMTP overrides" section (use `ContentSwitch` component): SMTP host, port, user, password — collapsed by default.
   - Props: `modelValue: MailGeneralSettings`, emits `update:modelValue`.

2. `ChannelMailsTab.vue` slots `ChannelMailGeneralTab` into the General sub-tab, two-way bound to a `mailGeneralSettings` ref passed from the page.

3. `app/pages/store/channel/[id].vue`:
   - `mailGeneralSettings` ref initialized to `channelMailSettings.value?.general ?? {}`.
   - Dedicated watcher syncs changes to `entityDataUpdate.mailSettings.general`.
   - `hasUnsavedChanges` becomes `true` after any field change.

## Implementation Notes

### Component

Use `defineModel<MailGeneralSettings>()` or explicit props + emit (prefer `defineModel` for Vue 3.4+ compatibility). Each change to any field should emit the full updated `MailGeneralSettings` object.

Field input types:
- Email fields: `<Input type="email" />`
- URL fields: `<Input type="url" />`
- SMTP port: `<Input type="number" />`
- SMTP password: `<Input type="password" />`

For the SMTP collapsible, use the existing `ContentSwitch` component which provides an animated collapsible slot. Title: `t('channel.mail_smtp_overrides')`. Default: collapsed.

### Watcher in `[id].vue`

```ts
watch(
  mailGeneralSettings,
  (general) => {
    entityDataUpdate.value.mailSettings = {
      ...entityDataUpdate.value.mailSettings,
      general,
    }
  },
  { deep: true },
)
```

This follows the same standalone-ref watcher pattern used for `discount` and `requireConfirmation` in quotation and for `channelPayments` in M5.

### i18n

Add to `channel` namespace in `en.json` and `sv.json`:
- `channel.mail_disabled_toggle` → `"Disable all transaction mails"`
- `channel.mail_display_name` → `"Display name"`
- `channel.mail_from_email` → `"From email address"`
- `channel.mail_login_url` → `"Login URL"`
- `channel.mail_password_reset_url` → `"Password reset URL"`
- `channel.mail_bcc_email` → `"BCC email (order confirmation)"`
- `channel.mail_smtp_overrides` → `"SMTP overrides"`
- `channel.mail_smtp_host` → `"SMTP host"`
- `channel.mail_smtp_port` → `"SMTP port"`
- `channel.mail_smtp_user` → `"SMTP username"`
- `channel.mail_smtp_password` → `"SMTP password"`

## Acceptance Criteria

- All required fields and the master disable toggle render correctly.
- SMTP section is collapsed by default and expands on toggle.
- Changing any field emits the updated `MailGeneralSettings` object.
- `entityDataUpdate.mailSettings.general` is updated when `mailGeneralSettings` changes.
- `hasUnsavedChanges` is `true` after any field edit; `false` on initial load.
- Field values load from the channel GET response via `parseEntityData`.
- `pnpm typecheck` and `pnpm lint:check` pass with no new errors.
- All visible strings in `en.json` and `sv.json`.
- Vitest: test that changing a field emits the updated `MailGeneralSettings`; test that the SMTP section renders its fields when expanded; test that the watcher correctly syncs `mailGeneralSettings` to `entityDataUpdate.mailSettings.general`; test that `hasUnsavedChanges` is triggered after a field edit.

## Agent Execution

- **Model**: sonnet
- **Mode**: claude-code agent
- **Why**: Standard form component with well-defined fields following the established standalone-ref watcher pattern — low complexity, low risk.
