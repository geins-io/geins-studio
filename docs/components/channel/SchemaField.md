# `SchemaField`

`SchemaField` is the recursive renderer for a single field inside a storefront-settings schema — switches across ten field types and recurses into `sub-section` children. Component lives at `app/components/channel/SchemaField.vue` and registers with `name: 'ChannelSchemaField'` so it can self-recurse cleanly inside the template.

## Features

- Reads + writes values via `getSettingValue` / `setSettingValue` — supports dotted paths inside the settings object
- `visibleWhen` rule per field: another field's value must equal a literal — otherwise the field is hidden
- Ten field types render to different inputs:
  - `string` → `Input`
  - `textarea` → `Textarea`
  - `number` → numeric `Input` with `min` / `max`
  - `boolean` → `Switch` row with optional Lucide icon
  - `select` → `Select` with options
  - `font` → [`FormInputFont`](/components/form/input/FormInputFont)
  - `color` → [`FormInputColor`](/components/form/input/FormInputColor)
  - `image` → [`FormInputImage`](/components/form/input/FormInputImage) with accept/maxSize forwarded
  - `radio-cards` → [`FormInputRadioCards`](/components/form/input/FormInputRadioCards)
  - `radio` → `RadioGroup` + `RadioGroupItem`
- Two structural types:
  - `sub-section` — recurses into `children`, optional column grid via `columns` prop, otherwise auto-rows via `groupFieldsIntoRows`
  - `boolean-choice` — [`ContentSwitch`](/components/content/ContentSwitch) with a nested choice (radio or radio-cards) revealed when enabled

## Usage

This is recursive and called from [`StorefrontSchemaRenderer`](/components/channel/StorefrontSchemaRenderer). Direct usage is rare:

```vue
<template>
  <ChannelSchemaField
    :field="field"
    :model-value="settings"
    @update:model-value="settings = $event"
  />
</template>
```

## Props

### `field`

```ts
field: SchemaField
```

The field descriptor. The `type` property switches the renderer.

### `modelValue`

```ts
modelValue: StorefrontSettings
```

The full settings object — every field reads/writes by key into this.

### `nested`

```ts
nested?: boolean
```

`true` when rendered inside a `sub-section` — suppresses the top border that separates root sections.

- **Default:** `false`

### `isFirstSubSection`

```ts
isFirstSubSection?: boolean
```

When the field is the first sub-section in a section, suppresses its top border for cleaner spacing.

- **Default:** `false`

## Events

### `update:modelValue`

```ts
(value: StorefrontSettings): void
```

Fires whenever any descendant field changes.

## Dependencies

- shadcn-vue `Input`, `Textarea`, `Select`, `Switch`, `Item` family, `RadioGroup`, `Label`
- [`ContentCardHeader`](/components/content/ContentCardHeader), [`ContentSwitch`](/components/content/ContentSwitch)
- [`FormInputDescription`](/components/form/input/FormInputDescription), [`FormInputFont`](/components/form/input/FormInputFont), [`FormInputColor`](/components/form/input/FormInputColor), [`FormInputImage`](/components/form/input/FormInputImage), [`FormInputRadioCards`](/components/form/input/FormInputRadioCards)
- `getSettingValue`, `setSettingValue`, `groupFieldsIntoRows`, `gridClass` utilities from `@/utils/storefront`
