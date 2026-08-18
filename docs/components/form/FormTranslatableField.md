# `FormTranslatableField`

`FormTranslatableField` is a translatable text input: an inline field for the **current language** plus a flag affordance that opens the global [`PanelTranslation`](/components/panel/PanelTranslation) to edit **every** configured language.

The translation panel **auto-stacks** — it opens as a normal sheet on a plain edit page, or as panel-on-panel when the field lives inside another panel — via [`usePanelStack`](/composables/usePanelStack), with no wiring.

Drop it inside a vee-validate `FormField`/`FormItem` and bind `v-model` to the field's [`LocalizedText`](/domains/assets) value; the caller owns the `FormLabel`.

## Usage

```vue
<FormField v-slot="{ value, handleChange }" name="altText" keep-value>
  <FormItem>
    <FormLabel :optional="true">{{ $t('alt_text') }}</FormLabel>
    <FormTranslatableField
      :model-value="value"
      :label="$t('alt_text')"
      :placeholder="$t('alt_text_placeholder')"
      :subject="asset.name"
      @update:model-value="handleChange"
    />
  </FormItem>
</FormField>
```

(Or bind `v-model` to a computed over the form value, as [`AssetDetailPanel`](/components/asset/AssetDetailPanel) does.)

## Props

### `label`

```ts
label?: string;
```

The field label — used as the translation panel's subtitle and in each per-language placeholder (`{label} in {language}…`).

### `placeholder`

```ts
placeholder?: string;
```

Placeholder for the inline (current-language) input.

### `subject`

```ts
subject?: string;
```

Context shown before the fill count in the panel subtitle (e.g. the entity name).

### `disabled`

```ts
disabled?: boolean;
```

## v-model

```ts
v-model: LocalizedText;
```

The locale-keyed value (`{ en: '…', sv: '…' }`). The inline input edits the current language; the panel edits all languages. Blank locales are dropped.

## Dependencies

- [`PanelTranslation`](/components/panel/PanelTranslation) — the all-languages editor (auto-stacks)
- [`FlagIcon`](/components/FlagIcon) + `languageToCountryCode` — current-language flag
- [`useAccountStore`](/stores/account) — current language; shadcn-vue `Input`
