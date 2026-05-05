# `ContentEditSummary`

`ContentEditSummary` is the standard right-column summary card on entity edit pages — entity status badge, active toggle with descriptive copy, and one or two `ContentDataList` blocks (main summary + settings summary).

## Features

- Status badge driven by either an explicit `status` prop or by `entityLiveStatus` (boolean). Hidden in create mode and behind `showActiveStatus`
- [`ContentSwitch`](/components/content/ContentSwitch) for the active state with auto-generated description copy that explains the next state transition (will activate / will deactivate)
- Two slottable lists: main `summary` and `settingsSummary`, each rendered through [`ContentDataList`](/components/content/ContentDataList)
- Adapts max-height when injected `sidebar-floating` is `true` (set by [`ContentEditMain`](/components/content/edit/ContentEditMain))
- `disabled` + `disabledTooltip` route through to the active toggle
- Multiple slots for inserting custom content between sections

## Usage

```vue
<script setup lang="ts">
const { entityDataUpdate, summary, entityName } = useEntityEdit({ /* ... */ });
const active = computed({
  get: () => entityDataUpdate.value?.active ?? false,
  set: (v) => (entityDataUpdate.value!.active = v),
});
</script>

<template>
  <ContentEditSummary
    v-model:active="active"
    :entity-live-status="originalEntity?.active"
    :summary="summary"
    :entity-name="entityName"
  />
</template>
```

## Props

### `createMode`

```ts
createMode?: boolean
```

Hides the status badge and active toggle, swaps the description for a generic "create summary" copy.

- **Default:** `false`

### `description`

```ts
description?: string
```

Subheading shown below "Summary".

- **Default:** `''`

### `summary`

```ts
summary?: DataItem[]
```

Main summary rows — `{ label, value }` pairs.

- **Default:** `[]`

### `settingsSummary`

```ts
settingsSummary?: DataItem[]
```

Optional second list rendered under a "Settings" label.

- **Default:** `[]`

### `entityName`

```ts
entityName?: string
```

Used in the active-toggle description copy (`entity_is_active`, `entity_will_activate`, etc.).

### `entityLiveStatus`

```ts
entityLiveStatus?: boolean
```

The currently *persisted* active state — drives the status badge (when no explicit `status` is set) and the toggle's transition copy.

- **Default:** `false`

### `showActiveStatus`

```ts
showActiveStatus?: boolean
```

Whether to render the badge + active toggle at all.

- **Default:** `true`

### `disabled`

```ts
disabled?: boolean
```

Disables the active toggle.

- **Default:** `false`

### `disabledTooltip`

```ts
disabledTooltip?: string
```

Tooltip shown over the disabled toggle.

### `status`

```ts
status?: StatusBadgeStatus
```

Explicit badge status (overrides `entityLiveStatus`). Use for entities with non-boolean lifecycle (e.g. quotations).

## v-model

### `active`

```ts
v-model:active: boolean
```

Two-way binding on the active toggle.

## Slots

### `before-active-switch` / `before-summary` / `after-summary` / `after-settings`

Insertion points for custom content around the standard sections.

## Dependencies

- shadcn-vue `Card`
- [`ContentCardHeader`](/components/content/ContentCardHeader), [`ContentSwitch`](/components/content/ContentSwitch), [`ContentDataList`](/components/content/ContentDataList)
- [`StatusBadge`](/components/StatusBadge)
- Injects `sidebar-floating` from [`ContentEditMain`](/components/content/edit/ContentEditMain)
