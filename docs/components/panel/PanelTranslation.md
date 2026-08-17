# `PanelTranslation`

`PanelTranslation` is the global translation panel — it edits a locale-keyed value ([`LocalizedText`](/domains/assets)) across the account's configured languages. It is built on [`PanelEdit`](/components/panel/PanelEdit), so when opened while another panel is open it automatically stacks over it (panel-on-panel) and reuses the shared unsaved-changes guard.

## Features

- **Account-driven locales** — languages come from the account language setup ([`useAccountStore`](/stores/account) `languages`), not a fixed list. Only `active` languages are shown; the current/default language sorts first and is marked.
- **Per-language rows** — each row shows a [`FlagIcon`](/components/FlagIcon) (country resolved via `languageToCountryCode`) + language name, and an input placeholder of the form `{field} in {language}…`.
- **Fill-count subtitle** — the panel subtitle shows `{subject} · {filled} of {total} languages filled`.
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
  <PanelEdit v-model:open="open" :title="asset.name">
    <FormField v-slot="{ componentField }" name="altText" keep-value>
      <FormItem>
        <FormLabel>{{ $t('alt_text') }}</FormLabel>
        <div class="relative">
          <Input v-model="altText[currentLanguage]" class="pr-11" />
          <button
            type="button"
            class="absolute top-1/2 right-3 -translate-y-1/2"
            @click="translationsOpen = true"
          >
            <FlagIcon :country-code="languageToCountryCode(currentLanguage)" />
          </button>
        </div>
      </FormItem>
    </FormField>
  </PanelEdit>

  <!-- Auto-stacks over the base panel (panel-on-panel) — no wiring needed. -->
  <PanelTranslation
    v-model="altText"
    v-model:open="translationsOpen"
    :field-label="$t('alt_text')"
    :subject="asset.name"
  />
</template>
```

## Props

### `fieldLabel`

```ts
fieldLabel?: string;
```

The field being translated — used in each locale input's placeholder (`{field} in {language}…`).

### `subject`

```ts
subject?: string;
```

Context shown before the fill count in the subtitle (e.g. the asset name).

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

- [`PanelEdit`](/components/panel/PanelEdit) — shell, auto-stacking, unsaved guard
- [`FlagIcon`](/components/FlagIcon) + `languageToCountryCode` — per-language flags
- [`useAccountStore`](/stores/account) — configured languages + current language
- shadcn-vue `Input`, `Label`, [`Empty`](/components/shadcn-vue)
