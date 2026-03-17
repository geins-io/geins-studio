---
title: "Add storefront preview button"
project: "Self Service (Channels)"
milestone: "M2 — Storefront Settings"
priority: 3
estimate: 1
labels:
  - feature
  - confidence-high
  - risk-low
  - geins-studio
depends_on:
  - "./005-storefront-tab-container.md"
model: haiku
mode: claude-code agent
---

## Context

The Figma design shows a "Preview" button in the Storefront settings card header. Clicking it opens the channel's storefront URL in a new browser tab so the user can see their settings in action. The preview token mechanism is TBD on the backend, so this issue implements the button and basic URL opening, with a placeholder for token generation.

## Expected Outcome

A "Preview" button in the Storefront settings card header that opens the channel's URL in a new tab. The implementation is ready to add token-based preview authentication when the backend endpoint is available.

## Implementation Notes

**Location: `app/components/channel/storefront/ChannelStorefrontSettings.vue`** (modify the existing component from issue 005)

**Button placement:**
- In the `ContentEditCard` `#header-action` slot, before the `...` dropdown menu
- Button variant: `outline`, size: `sm`
- Icon: `ExternalLink` (Lucide)
- Label: `t('channels.preview')`

**Behavior:**
- On click: `window.open(previewUrl, '_blank')`
- `previewUrl` is computed from the channel's `url` field: `https://${channelUrl}` (or the raw URL if it already includes protocol)
- When `url` is empty/undefined, the button is disabled with a tooltip: "Set a channel URL first"
- Future: append `?preview={token}` when the preview token API is available. Add a `// TODO: Add preview token when API is available` comment.

**Props needed:**
- Add `channelUrl?: string` prop to `ChannelStorefrontSettings`
- Parent passes `entityDataUpdate.url` or `form.values.details.url`

**i18n keys** (if not already added in issue 005):
- `channels.preview` — "Preview"
- `channels.set_url_first` — "Set a channel URL to enable preview"

## Acceptance Criteria

- "Preview" button appears in the Storefront settings card header
- Clicking opens the channel URL in a new browser tab
- Button is disabled when no channel URL is set
- Disabled state shows a tooltip explaining why
- TODO comment marks where preview token should be added
- i18n keys in both locale files
- `pnpm typecheck` passes
- `pnpm lint:check` passes

## Agent Execution
- **Model**: haiku
- **Mode**: claude-code agent
- **Why**: Trivial UI addition — one button with a `window.open` call and a disabled state.
