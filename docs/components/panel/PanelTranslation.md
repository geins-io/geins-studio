# `PanelTranslation`

`PanelTranslation` is the global translation panel — it edits a locale-keyed value ([`LocalizedText`](/domains/assets)) across the account's configured languages. It is built on [`PanelEdit`](/components/panel/PanelEdit), so it stacks over a base panel (panel-on-panel) and reuses the shared unsaved-changes guard.

## Features

- **Account-driven locales** — languages come from the account language setup ([`useAccountStore`](/stores/account) `languages`), not a fixed list. Only `active` languages are shown; the current/default language sorts first and is marked.
- **Working copy + guard** — edits a copy; `dirty` reflects real changes and the `PanelEdit` guard prompts before discarding. Blank locales are dropped on save.
- **Degenerate state** — when only one language is configured there is nothing to translate, so an empty state is shown and the footer is hidden.
- Opened programmatically from a translatable field via `v-model:open`; the value rides on `v-model`.

## Usage

```vue
<script setup lang="ts">
import type { LocalizedText } from '#shared/types';

const altText = ref<LocalizedText>({ en: 'Product hero' });
const translationsOpen = ref(false);
</script>

<template>
  <div class="flex items-end gap-2">
    <FormItem>
      <FormLabel>{{ $t('alt_text') }}</FormLabel>
      <Input v-model="altText[currentLanguage]" />
    </FormItem>
    <Button variant="outline" @click="translationsOpen = true">
      {{ $t('translations') }}
    </Button>
  </div>

  <PanelTranslation
    v-model="altText"
    v-model:open="translationsOpen"
    :field-label="$t('alt_text')"
  />
</template>
```

## Props

### `fieldLabel`

```ts
fieldLabel?: string;
```

Shown as the panel subtitle — what is being translated (e.g. the field label).

## v-model

### default (`modelValue`)

```ts
v-model: LocalizedText
```

The locale-keyed value being edited (`{ en: '…', sv: '…' }`). Committed on save with blank locales removed.

### `open`

```ts
v-model:open: boolean
```

Panel visibility.

## Dependencies

- [`PanelEdit`](/components/panel/PanelEdit) — shell, stacking, unsaved guard
- [`useAccountStore`](/stores/account) — configured languages + current language
- shadcn-vue `Input`, `Label`, [`Empty`](/components/shadcn-vue)
