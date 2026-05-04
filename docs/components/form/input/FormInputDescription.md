# `FormInputDescription`

`FormInputDescription` is the small helper text rendered below a form input — muted, slightly indented, used for hints or constraints.

## Features

- Single muted paragraph, `text-xs`, left-padded to align with the field below
- Optional class override
- Slot-based content

## Usage

### Basic Usage

```vue
<template>
  <FormInputPixel v-model="size" />
  <FormInputDescription>
    Used for the storefront hero. Recommended: 64px or larger.
  </FormInputDescription>
</template>
```

## Props

### `class`

```ts
class?: HTMLAttributes['class']
```

Additional Tailwind classes merged via `cn`.

## Slots

### default

The helper text.
