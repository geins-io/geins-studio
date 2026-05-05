# `ContentEditTabs`

`ContentEditTabs` is the horizontal tab bar at the top of entity edit pages — supports plain string labels or `TabDescriptor` objects with a per-tab error indicator, and syncs the active tab to the `?tab=` query parameter.

## Features

- Two label shapes: `string` or `TabDescriptor` (`{ label, error? }`)
- Red dot in the top-right corner of any tab whose `error` is `true` (with screen-reader announcement)
- Two-way `v-model:current-tab` (numeric index)
- URL query sync: writes `?tab=N` on change, reads it on mount, removes the query when index `0` is selected
- Replaces the route (no new history entry) so back/forward isn't polluted

## Usage

### Plain labels

```vue
<script setup lang="ts">
const currentTab = ref(0);
const tabs = [t('general'), t('settings'), t('advanced')];
</script>

<template>
  <ContentEditTabs v-model:current-tab="currentTab" :tabs="tabs" />
</template>
```

### With per-tab error indicators

```vue
<script setup lang="ts">
import type { TabDescriptor } from '@/components/content/edit/ContentEditTabs.vue';

const tabs = computed<TabDescriptor[]>(() => [
  { label: t('general'), error: form.errors?.general?.length > 0 },
  { label: t('settings') },
]);
</script>

<template>
  <ContentEditTabs v-model:current-tab="currentTab" :tabs="tabs" />
</template>
```

## Props

### `tabs`

```ts
tabs: Array<string | TabDescriptor>
```

The tab labels. Strings are normalized to `{ label }`.

## v-model

### `currentTab`

```ts
v-model:current-tab: number
```

Active tab index (0-based).

## Type Definitions

```ts
interface TabDescriptor {
  label: string;
  error?: boolean;
}
```
