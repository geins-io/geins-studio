---
title: 'Implement Mail layout options sub-tab with image uploads and color/typography fields'
project: 'Self Service (Channels)'
milestone: 'M6 — Mails Tab'
priority: 2
estimate: 3
labels:
  - feature
  - confidence-medium
  - risk-medium
depends_on:
  - './002-mails-tab-scaffold.md'
  - '../M2-storefront-settings/005-wire-storefront-settings-into-channel-edit.md'
model: opus
mode: claude-code interactive
---

## Context

The Layout options sub-tab controls the shared visual appearance of all transaction mails for a channel. It has four sections: Images (logo + header image via file uploads), Colors (13 color hex fields), Typography (fonts + sizes), and Shape (border radius + product image size). Images are uploaded as multipart file parts on channel PATCH — the same mechanism established for storefront logo uploads in M2. Colors use the hex input + swatch component also built in M2.

Design reference: Figma node `179:6151`.

## Expected Outcome

1. `app/components/channel/ChannelMailLayoutTab.vue`:
   - **Images section**: Logo (`logoUri`) + Header image (`headerImgUri`) — file input with current image preview when a URI is set.
   - **Colors section**: 13 color fields using `FormInputColor` (hex input + swatch preview).
   - **Typography section**: FontLink (URL input), FontFamily (text), FontSizeSmall/Medium/Large (text), LineHeight (text).
   - **Shape section**: BorderRadius (text), ProdImgSize (text).
   - `defineProps<{ modelValue: MailLayoutSettings, loading?: boolean }>()`, emits `update:modelValue`.
   - Emits `update:stagedFiles` with `{ logoUri?: File, headerImgUri?: File }` when files are selected.

2. `ChannelMailsTab.vue` slots `ChannelMailLayoutTab` into the Layout sub-tab, two-way bound to refs from the page.

3. `app/pages/store/channel/[id].vue`:
   - `mailLayoutSettings` ref initialized from `channelMailSettings.value?.layout ?? {}`.
   - `mailLayoutFiles` ref for staged file uploads: `ref<{ logoUri?: File, headerImgUri?: File }>({})`.
   - Watcher syncs `mailLayoutSettings` → `entityDataUpdate.mailSettings.layout`.
   - On save: channel PATCH multipart body includes JSON part `"channel"` + file parts named `"mailSettings.logoUri"` and `"mailSettings.headerImgUri"` when files are staged. Clear `mailLayoutFiles` after successful save.

## Implementation Notes

### `FormInputColor` component

Check if M2's schema renderer extracted a standalone `app/components/form/input/FormInputColor.vue`. If it did, reuse it directly. If color input was inlined in `StorefrontSchemaRenderer`, extract it to `FormInputColor.vue` first, then use it here. The component should accept `modelValue: string` (hex), emit `update:modelValue`, and render an `<Input>` alongside a small `<div>` swatch with `background-color: modelValue`.

### File upload inputs

For logo and header image:

```html
<div class="flex flex-col gap-2">
  <img v-if="modelValue.logoUri" :src="modelValue.logoUri" class="h-16 w-auto object-contain rounded" />
  <Input type="file" accept="image/*" @change="onLogoFileChange" />
</div>
```

On file selection, emit `update:stagedFiles` with the new `File` object. Do not update `modelValue.logoUri` locally — the URI is only updated after the server responds with the blob URL.

### Multipart PATCH pattern

Follow the pattern established in M2-005 (`wire-storefront-settings-into-channel-edit`). The channel PATCH sends:
- JSON part named `"channel"` containing all `ChannelUpdate` fields.
- Optional file parts named `"mailSettings.logoUri"` and `"mailSettings.headerImgUri"`.

**Before writing this issue, review the M2-005 implementation** to confirm the exact multipart construction approach used in `[id].vue`.

### Colors (13 fields)

Render as `FormGrid design="1+1"` of `FormInputColor` components. The 13 properties (camelCase, confirm exact names against API when available): `backgroundColor`, `bodyColor`, `headerColor`, `footerColor`, `headerTextColor`, `footerTextColor`, `buttonBackgroundColor`, `buttonTextColor`, `textColor`, `linkColor`, `priceColor`, `borderColor`, `highlightColor`.

### Watcher

```ts
watch(
  mailLayoutSettings,
  (layout) => {
    entityDataUpdate.value.mailSettings = {
      ...entityDataUpdate.value.mailSettings,
      layout,
    }
  },
  { deep: true },
)
```

### i18n

Add to `channel` namespace in `en.json` and `sv.json`:
- `channel.mail_logo` → `"Logo"`
- `channel.mail_header_image` → `"Header image"`
- `channel.mail_colors` → `"Colors"`
- `channel.mail_typography` → `"Typography"`
- `channel.mail_shape` → `"Shape"`
- `channel.mail_font_link` → `"Font link (URL)"`
- `channel.mail_font_family` → `"Font family"`
- `channel.mail_line_height` → `"Line height"`
- `channel.mail_border_radius` → `"Border radius"`
- `channel.mail_prod_img_size` → `"Product image size"`
- (plus labels for font size small/medium/large and each color field)

## Acceptance Criteria

- All four sections (Images, Colors, Typography, Shape) render with correct inputs.
- Color fields show a swatch preview alongside the hex input.
- Logo and header image inputs show a preview of the current URI when set.
- File selection stages the `File` object and does not modify the `modelValue` URI directly.
- Staged files are sent as multipart file parts on channel PATCH.
- `mailLayoutSettings` watcher syncs to `entityDataUpdate.mailSettings.layout`.
- `hasUnsavedChanges` is `true` after any field edit or file selection.
- Field values load from channel GET response via `parseEntityData`.
- `pnpm typecheck` and `pnpm lint:check` pass with no new errors.
- All visible strings in `en.json` and `sv.json`.
- Vitest: test that color input emits updated hex value; test that file selection emits staged file object without modifying `modelValue.logoUri`; test that watcher syncs `mailLayoutSettings` to `entityDataUpdate.mailSettings.layout`; test that multipart payload includes file parts when files are staged.

## Agent Execution

- **Model**: opus
- **Mode**: claude-code interactive
- **Why**: File upload staging for multipart PATCH across component + page boundary carries medium risk; the `FormInputColor` extraction decision and 13-field layout require cross-file reasoning and human review before applying.
