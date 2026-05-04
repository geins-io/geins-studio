# `ContentSwitch`

A bordered toggle row with a label, optional description, optional icon, and an optional disabled tooltip. When the switch is on, an animated panel expands to reveal a default slot.

## Features

- Two-way v-model binding for the boolean toggle state
- Animated expand/collapse of the slot content when toggled (CSS height transition)
- Optional `disabledTooltip` shown via `TooltipProvider` when `disabled` is `true`
- Icon rendered via `useLucideIcon` (any PascalCase Lucide icon name)

## Usage

### Basic Usage

```vue
<script setup lang="ts">
const enabled = ref(false)
</script>

<template>
  <ContentSwitch
    v-model:checked="enabled"
    label="Enable notifications"
    description="Send email alerts for new orders"
  />
</template>
```

### With expandable content

```vue
<script setup lang="ts">
const active = ref(false)
</script>

<template>
  <ContentSwitch
    v-model:checked="active"
    label="Custom shipping"
    icon="Truck"
  >
    <!-- Shown only when active is true -->
    <FormGrid design="1+1">
      <FormField name="shippingMethod">...</FormField>
    </FormGrid>
  </ContentSwitch>
</template>
```

### Disabled with tooltip

```vue
<template>
  <ContentSwitch
    :checked="false"
    label="Beta feature"
    :disabled="true"
    disabled-tooltip="This feature is not yet available"
  />
</template>
```

## Props

### `label`

```ts
label: string
```

- **Type:** `string`
- **Required:** yes
- **Description:** Primary label text shown next to the switch.

### `description`

```ts
description?: string
```

- **Type:** `string`
- **Description:** Secondary description text rendered below the label.

### `disabled`

```ts
disabled?: boolean
```

- **Type:** `boolean`
- **Description:** Disables the switch interaction.

### `disabledTooltip`

```ts
disabledTooltip?: string
```

- **Type:** `string`
- **Description:** Tooltip text shown on hover when the switch is disabled.

### `icon`

```ts
icon?: string
```

- **Type:** `string`
- **Description:** PascalCase Lucide icon name displayed to the left of the label.

## Model

### `checked`

```ts
v-model:checked="value"  // boolean
```

Two-way binding for the toggle state.

## Slots

### default

Content revealed when the switch is turned on. Transitions in with an animated height expansion.

## Dependencies

- `useLucideIcon` — icon resolution
- shadcn-vue [`Switch`](/components/shadcn-vue), [`Tooltip`](/components/shadcn-vue)
