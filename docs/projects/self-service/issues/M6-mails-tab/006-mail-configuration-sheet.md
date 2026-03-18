---
title: 'Implement mail configuration sheet with text key editing and language switching'
project: 'Self Service (Channels)'
milestone: 'M6 — Mails Tab'
priority: 2
estimate: 5
labels:
  - feature
  - confidence-medium
  - risk-medium
depends_on:
  - './001-mail-types-and-repository.md'
  - './003-mail-content-sub-tab.md'
model: opus
mode: claude-code interactive
---

## Context

When the user clicks the pencil icon on a mail template row, a `Sheet` opens for editing that template's text content. The sheet fetches text keys per language via `GET /account/channel/{channelId}/mail/{mailType}?language={lang}`, renders each key as an editable field (with the system default as placeholder and an "Overridden" badge when a custom value exists), and saves via `PATCH /account/channel/{channelId}/mail/{mailType}` using a flat key-value body.

This is a direct API call pattern from a component — outside the channel `useEntityEdit` PATCH surface. The non-standard flat request body, language-switching with re-fetch, and override state make this the most complex component in M6.

Design reference: Figma node `184:6761`.

## Expected Outcome

1. `app/components/channel/ChannelMailConfigSheet.vue`:
   - `Sheet` (`side="right"`, wide enough for text editing — `class="sm:max-w-2xl"`).
   - Header: mail type name + close button.
   - Inner `Tabs` with two triggers: "Edit" and "Preview" (Preview tab is a stub — implemented in issue 007).
   - **Edit tab**:
     - Language selector (`Select`) at top — shows channel languages with country flag icons. Changing language re-fetches `GetMailTexts`.
     - List of `Textarea` fields — one per `MailTextEntry`. Each field: prettified label (see below) + `font-mono text-xs text-muted-foreground` raw key, placeholder = `entry.defaultValue`, value = `entry.value`, "Overridden" badge (`variant="secondary"`) when `entry.hasOverride`.
     - "Restore to system default" button (`variant="destructive"`, `size="sm"`) — sends empty string for all overridden keys.
     - Footer: `Cancel` + `Update` (primary) buttons.
   - `defineProps<{ open: boolean, channelId: string, mailType: ChannelMailType | null, languages: string[] }>()`.
   - Emits: `update:open`.

2. `ChannelMailContentTab.vue` wires the `edit` event: sets `activeMailType` ref + `sheetOpen = true`.

3. `app/pages/store/channel/[id].vue` passes `channelLanguages` (array of language IDs from `channelMailTypes` or the channel's `languages` array) to `ChannelMailsTab` → `ChannelMailContentTab` → `ChannelMailConfigSheet`.

## Implementation Notes

### Direct API calls from the component

```ts
const { channelApi } = useGeinsRepository()
const { showErrorToast } = usePageError()
const { toast } = useToast()

async function fetchTexts() {
  if (!props.mailType || !props.channelId) return
  loading.value = true
  try {
    const result = await channelApi.getMailTexts(
      props.channelId,
      props.mailType.typeId,
      selectedLanguage.value,
    )
    textEntries.value = result.texts
    // Populate localOverrides from current entry values
    localOverrides.value = Object.fromEntries(
      result.texts.filter(e => e.hasOverride).map(e => [e.key, e.value]),
    )
  } catch {
    showErrorToast(t('channel.mail_load_texts_error'))
  } finally {
    loading.value = false
  }
}

// Re-fetch on sheet open or mail type change
watch(
  [() => props.open, () => props.mailType],
  ([open]) => { if (open) fetchTexts() },
)

// Re-fetch on language change
watch(selectedLanguage, fetchTexts)
```

### Flat request body construction

`UpdateMailTexts` body: `{ language: 'sv', KEY_ONE: 'override text' }`. Only include keys that have been edited (non-empty string). Empty string reverts to system default.

```ts
async function handleSave() {
  saving.value = true
  try {
    const payload: MailTextsUpdateRequest = { language: selectedLanguage.value }
    for (const [key, value] of Object.entries(localOverrides.value)) {
      payload[key] = value  // empty string intentionally included (reverts that key)
    }
    await channelApi.updateMailTexts(props.channelId, props.mailType!.typeId, payload)
    toast({ title: t('channel.mail_save_success'), variant: 'positive' })
    await fetchTexts()   // refresh override badges
  } catch {
    showErrorToast(t('channel.mail_save_error'))
  } finally {
    saving.value = false
  }
}
```

### Restore to system default

Send empty strings for all currently overridden keys:

```ts
async function handleRestoreDefaults() {
  const payload: MailTextsUpdateRequest = { language: selectedLanguage.value }
  for (const entry of textEntries.value.filter(e => e.hasOverride)) {
    payload[entry.key] = ''
  }
  await channelApi.updateMailTexts(props.channelId, props.mailType!.typeId, payload)
  await fetchTexts()
}
```

### Prettified key labels

`ORDER_DELIVERY_TITLE` → "Order delivery title":

```ts
function prettifyKey(key: string): string {
  return key
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}
```

Display: prettified label in `text-sm font-medium`, raw key in `text-xs text-muted-foreground font-mono` below it.

### Template variable hint

Below each `Textarea`, render a small helper line: `t('channel.mail_template_variables_hint')`. Informational only — no variable validation.

### Language selector with flags

Reuse the flag display pattern from M3 (`FormInputCountrySelect` with `showFlags` prop). If a standalone flag utility exists, use it. Otherwise render flag emoji via a simple country-code-to-flag helper.

### i18n

Add to `channel` namespace in `en.json` and `sv.json`:
- `channel.mail_edit_tab` → `"Edit"`
- `channel.mail_preview_tab` → `"Preview"`
- `channel.mail_select_language` → `"Language"`
- `channel.mail_restore_defaults` → `"Restore to system default"`
- `channel.mail_text_overridden` → `"Overridden"`
- `channel.mail_template_variables_hint` → `"Use {variable_name} syntax for dynamic values."`
- `channel.mail_save_success` → `"Mail texts updated"`
- `channel.mail_load_texts_error` → `"Failed to load mail texts"`
- `channel.mail_save_error` → `"Failed to save mail texts"`

## Acceptance Criteria

- Sheet opens when clicking a mail template row's edit button.
- Language selector shows channel languages; changing selection re-fetches text keys.
- One `Textarea` field renders per `MailTextEntry`, with `defaultValue` as placeholder.
- Overridden fields show an "Overridden" badge.
- Editing a field stores the value in `localOverrides`.
- Save calls `UpdateMailTexts` with correct flat body (only local overrides + language) and shows success toast.
- Save failure shows error toast; sheet remains open.
- Restore to default sends empty strings for all overridden keys and refreshes the field list.
- Cancel closes the sheet without saving.
- Loading state shown while fetching text keys.
- Preview tab renders as a stub (empty, no crash).
- `pnpm typecheck` and `pnpm lint:check` pass with no new errors.
- All visible strings in `en.json` and `sv.json`.
- Vitest: test that `fetchTexts` is called when `open` becomes `true`; test that language change triggers re-fetch; test that the save payload is built correctly from `localOverrides` (only changed keys + language); test that restore to default sends empty strings for all overridden keys; test that success toast is shown after save; test that error toast is shown on API failure.

## Agent Execution

- **Model**: opus
- **Mode**: claude-code interactive
- **Why**: Direct API calls from a sheet component outside `useEntityEdit`, non-standard flat request body, language-switching with re-fetch, and override state management all require deep cross-file reasoning and human review before applying.
