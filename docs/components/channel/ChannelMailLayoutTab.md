# `ChannelMailLayoutTab`

`ChannelMailLayoutTab` is the **Layout** sub-tab of the Mails tab — visual styling for transactional emails: logo + header image upload, color palette (backgrounds / text / buttons), typography (font family + URL + size scale + line height), shape (border radius + product image dims), and product display toggles.

## Features

- Two-way `v-model` for the entire `Partial<ChannelMailSettings>` object
- Separate `v-model:staged-files` for the freshly-picked logo / header `File` instances (the parent uploads them on save)
- Curated-font autodetect: when the user picks a font from [`FormInputFont`](/components/form/input/FormInputFont) that has a known Google Fonts CSS URL, `fontUrl` is auto-populated and shown as locked
- Three color-key groups rendered as `1+1+1` grids: backgrounds, text, buttons
- Pixel inputs ([`FormInputPixel`](/components/form/input/FormInputPixel)) for every size value (small/medium/large font, line height, border radius)
- Product display section: show-brand + hide-article-number toggles + free-text product parameters

## Usage

```vue
<script setup lang="ts">
import type { MailLayoutStagedFiles } from '@/components/channel/ChannelMailLayoutTab.vue';

const layoutFields = ref<Partial<ChannelMailSettings>>({});
const layoutFiles = ref<MailLayoutStagedFiles>({});
</script>

<template>
  <ChannelMailLayoutTab
    v-model="layoutFields"
    v-model:staged-files="layoutFiles"
  />
</template>
```

## v-model

### default

```ts
v-model: Partial<ChannelMailSettings>
```

The full layout settings object. **Required.**

### `stagedFiles`

```ts
v-model:staged-files: MailLayoutStagedFiles
```

Freshly picked logo and header-image `File` instances — parent uploads on save.

- **Default:** `{}`

## Type Definitions

```ts
type MailLayoutStagedFiles = {
  logoUrl?: File;
  headerImgUrl?: File;
};
```

Exported from `ChannelMailLayoutTab.vue`.

## Dependencies

- shadcn-vue `Item` family, `Switch`, `Input`, `Label`
- [`ContentSection`](/components/content/ContentSection)
- [`FormInputImage`](/components/form/input/FormInputImage), [`FormInputColor`](/components/form/input/FormInputColor), [`FormInputFont`](/components/form/input/FormInputFont), [`FormInputLocked`](/components/form/input/FormInputLocked), [`FormInputPixel`](/components/form/input/FormInputPixel), [`FormInputDescription`](/components/form/input/FormInputDescription)
- `fontToGoogleUrl` from `@/utils/storefrontFonts` — curated-font URL detection
