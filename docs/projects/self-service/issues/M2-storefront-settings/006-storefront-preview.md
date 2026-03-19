---
title: 'Implement storefront preview button (open storefront with preview token)'
project: 'Self Service (Channels)'
milestone: 'M2 — Storefront Settings'
priority: 3
estimate: 2
labels:
  - feature
  - confidence-low
  - risk-high
depends_on:
  - './003-storefront-tab-container.md'
  - '../M1-foundation/002-channel-api-repository.md'
model: sonnet
mode: claude-code interactive
---

## Context

The "Preview" button in the Storefront settings card header should open the channel's storefront URL in a new tab with a short-lived preview token, letting the user see the effect of their settings before publishing. This is the lowest-priority item in M2 and is blocked by a backend endpoint that issues preview tokens (TBD as of 2026-03-16).

> **Note**: Do not start this issue until the preview token endpoint is confirmed and documented. The "Preview" button in issue 003 is already rendered as a disabled placeholder — this issue upgrades it to functional.

## Expected Outcome

Clicking "Preview" in the Storefront settings card:
1. Calls a backend endpoint to obtain a short-lived preview token for the channel
2. Opens `{channel.url}?preview={token}` in a new browser tab
3. Shows a loading state on the button while the token is being fetched
4. Shows an error toast if token generation fails

## Implementation Notes

### API endpoint

Add to the channel repository (`app/utils/repositories/channel.ts`) once the endpoint is confirmed:
```ts
previewToken: (channelId: string) => $geinsApi(`/account/channel/${channelId}/preview-token`, { method: 'POST' })
```

Exact endpoint path, request body, and response shape TBD — confirm with backend before implementing.

### Component changes

In `ChannelStorefrontSettings.vue`, replace the disabled "Preview" button:
- Button calls `handlePreview()` on click
- `handlePreview`: calls `channelApi.channel.previewToken(channelId)`, then `window.open(url, '_blank')`
- `isLoadingPreview` ref drives the button loading state (use `LoaderCircle` animated icon, matching patterns elsewhere in the codebase)
- On error: `showErrorToast(t('channel.preview_error'))`

### Channel URL

The channel `url` field comes from `entityData.value.url` (already available in the edit page scope). Pass the channel ID and URL to `ChannelStorefrontSettings` as additional props when enabling preview, or emit an event up to the page which handles the token call.

### i18n

Add to `en.json` and `sv.json` under `channel` namespace:
- `channel.preview_error` — "Failed to generate preview. Please try again."

## Acceptance Criteria

- Clicking "Preview" shows a loading state on the button.
- On success, `{channel.url}?preview={token}` opens in a new browser tab.
- On failure, an error toast is shown and the button returns to its normal state.
- The button is only enabled in edit mode (not create mode, where there is no channel ID).
- `pnpm typecheck` and `pnpm lint:check` pass with no new errors.
- Vitest: tests for `handlePreview` covering success (window.open called with correct URL) and error (toast shown, no window.open).

## Agent Execution

- **Model**: sonnet
- **Mode**: claude-code interactive
- **Why**: Risk-high due to unknown backend endpoint — human review needed to validate the integration before applying, once the endpoint is confirmed.
