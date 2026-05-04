# `FormItemSwitch`

`FormItemSwitch` is the standard "labelled boolean toggle" form row — used for `active`, `enabled`, feature flags, and any other on/off entity field.

## Features

- Bordered card layout with label, optional description, and right-aligned [`Switch`](/components/shadcn-vue)
- Two-way `v-model` binding to a boolean
- `disabled` state dims the row and locks the switch
- Slot for trailing content next to the label (e.g. info tooltip)

## Usage

### Basic Usage

```vue
<script setup lang="ts">
const active = ref(true);
</script>

<template>
  <FormItemSwitch
    v-model="active"
    label="Active"
    description="Inactive entities are hidden from list pages."
  />
</template>
```

### Inside a VeeValidate field

```vue
<template>
  <FormField v-slot="{ value, handleChange }" name="active">
    <FormItemSwitch
      :model-value="value"
      :label="$t('active')"
      :description="$t('entity_active_description')"
      @update:model-value="handleChange"
    />
  </FormField>
</template>
```

## Props

### `label`

```ts
label?: string
```

Bold label rendered above the description.

- **Default:** `''`

### `description`

```ts
description?: string
```

Muted helper text rendered below the label.

- **Default:** `''`

### `disabled`

```ts
disabled?: boolean
```

Dims the row and disables the switch. Sets `aria-readonly` for accessibility.

- **Default:** `false`

## v-model

### default

```ts
v-model: boolean
```

The toggle state. Bound via `defineModel<boolean>()`.

## Slots

### `after-label`

Trailing content rendered next to the label — typically an info tooltip or status indicator.

## Dependencies

- shadcn-vue [`Switch`](/components/shadcn-vue), `FormItem`, `FormLabel`, `FormDescription`, `FormControl`
