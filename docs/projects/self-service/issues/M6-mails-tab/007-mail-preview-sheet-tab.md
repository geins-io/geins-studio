---
title: 'Implement mail preview tab in mail configuration sheet'
project: 'Self Service (Channels)'
milestone: 'M6 — Mails Tab'
priority: 3
estimate: 2
labels:
  - feature
  - confidence-medium
  - risk-low
depends_on:
  - './006-mail-configuration-sheet.md'
model: sonnet
mode: claude-code agent
---

## Context

The mail configuration sheet (issue 006) includes a stubbed "Preview" tab. This issue implements it: calling `POST /account/channel/{channelId}/mail/{mailType}/preview` with the selected language and rendering the returned HTML in a sandboxed `<iframe>`. The preview uses dummy data injected by the backend and shows what the styled mail template looks like for the current channel configuration.

Design reference: Figma node `188:4756`.

## Expected Outcome

`ChannelMailConfigSheet.vue` Preview tab:
- Lazy-loaded — preview is only fetched when the Preview tab is first activated, not on sheet open.
- "Refresh preview" button in the tab panel header re-fetches on demand.
- Calls `channelApi.previewMail(channelId, mailType.typeId, { language: selectedLanguage })` on activation and on refresh.
- Renders returned HTML in `<iframe :srcdoc="previewHtml" sandbox="allow-same-origin" class="w-full rounded-md border-0" style="height: 600px" />`.
- `<Skeleton class="w-full rounded-md" style="height: 600px" />` shown while fetching.
- Inline error state (destructive icon + `t('channel.mail_preview_error')` message) if the API call fails.
- When `selectedLanguage` changes while the Preview tab is active, the preview re-fetches automatically.

## Implementation Notes

### Lazy loading

Track `previewLoaded` and `previewHtml` as component-level refs. In the `Tabs` `onValueChange` handler (or a watch on `activeTab`):

```ts
watch(activeTab, async (tab) => {
  if (tab === 'preview' && !previewLoaded.value) {
    await fetchPreview()
    previewLoaded.value = true
  }
})
```

"Refresh" button resets `previewLoaded.value = false` and calls `fetchPreview()`.

### Re-fetch on language change

```ts
watch(selectedLanguage, () => {
  if (activeTab.value === 'preview') fetchPreview()
})
```

This reuses the `selectedLanguage` ref already defined in the Edit tab (issue 006) — both tabs share the same language selection.

### Iframe rendering

Use `srcdoc` (not `src`) to inject HTML directly, avoiding CORS and URL issues:

```html
<iframe
  :srcdoc="previewHtml"
  sandbox="allow-same-origin"
  class="w-full rounded-md border-0"
  style="height: 600px"
  title="Mail preview"
/>
```

### Error state

If `fetchPreview` throws, set `previewError = true` and show:

```html
<div class="flex flex-col items-center gap-2 py-8 text-destructive">
  <AlertCircle class="size-6" />
  <p class="text-sm">{{ t('channel.mail_preview_error') }}</p>
  <Button variant="outline" size="sm" @click="fetchPreview">{{ t('channel.mail_preview_refresh') }}</Button>
</div>
```

### i18n

Add to `channel` namespace in `en.json` and `sv.json`:
- `channel.mail_preview_refresh` → `"Refresh preview"`
- `channel.mail_preview_error` → `"Failed to load mail preview"`

## Acceptance Criteria

- Preview tab renders an `<iframe>` with the HTML returned by `PreviewMail`.
- Preview is lazy — `fetchPreview` is not called when the sheet opens on the Edit tab.
- Switching to the Preview tab triggers `fetchPreview` on first activation.
- "Refresh" button re-fetches and updates the iframe content.
- Language changes while on the Preview tab trigger a re-fetch.
- Loading skeleton is shown during fetch.
- Error state is shown (with retry button) if the preview API call fails.
- `pnpm typecheck` and `pnpm lint:check` pass with no new errors.
- All visible strings in `en.json` and `sv.json`.
- Vitest: test that `fetchPreview` is called on Preview tab activation and not on Edit tab activation; test that language change triggers re-fetch when on Preview tab but not when on Edit tab; test that loading skeleton is shown during fetch; test that error state renders on API failure.

## Agent Execution

- **Model**: sonnet
- **Mode**: claude-code agent
- **Why**: Extends an existing sheet component with a well-scoped lazy-load + iframe rendering pattern — low complexity, follows standard async data patterns.
