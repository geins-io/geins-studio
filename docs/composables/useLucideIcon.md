# `useLucideIcon`

The `useLucideIcon` composable resolves a Lucide icon **name** (a string) to its Vue component at runtime. Use it whenever the icon is not known at build time — icon names from the orchestrator manifest, navigation config, asset types, or a component prop.

## Why not `resolveComponent('Lucide…')`?

`nuxt-lucide-icons` registers each icon as a non-global component, and Nuxt's component loader only imports the names it sees statically in templates. A dynamically built name (``resolveComponent(`Lucide${name}`)``) never gets imported, so nothing renders. `useLucideIcon` looks icons up in the `icons` barrel export from `@lucide/vue` instead, which always contains every icon.

## Features

- **Exact Lucide names** (`'Plus'`, `'Funnel'`) resolve directly
- **Casing fallback** — camelCase, kebab-case and snake_case are normalized to PascalCase (`'arrow-right'` → `ArrowRight`)
- **Semantic aliases** for names the orchestrator manifest ships that aren't Lucide names (`http` → `Globe`, `loop` → `Repeat`, `databaseImport` → `Import`, …)
- **Renamed icons** — old Lucide names map to the current one (`filter` → `Funnel`)
- **Safe** — returns `null` for an empty or unknown name, so callers can `v-if` the icon away

## Usage

### Basic usage

```vue
<script setup lang="ts">
const props = defineProps<{ icon: string }>();

const { resolveIcon } = useLucideIcon();
const iconComponent = computed(() => resolveIcon(props.icon));
</script>

<template>
  <component :is="iconComponent" v-if="iconComponent" class="size-4" />
</template>
```

### Mapping your own aliases first

Components that expose their own short aliases map them to a Lucide name before resolving, and pass anything else through. See [`ButtonIcon`](/components/button/ButtonIcon):

```ts
const { resolveIcon } = useLucideIcon();

const aliasMap: Record<ButtonIconAlias, string> = { new: 'Plus' /* … */ };

const iconComponent = computed(() =>
  resolveIcon(aliasMap[props.icon as ButtonIconAlias] ?? props.icon),
);
```

## Properties and methods

### `resolveIcon`

```ts
resolveIcon(iconName?: string): Component | null
```

Resolves an icon name to a Lucide Vue component. Tries, in order:

1. The name as-is (an exact Lucide PascalCase name)
2. The alias table, keyed by the name lowercased with non-alphanumerics stripped (so `database-import`, `databaseImport` and `database_import` all match)
3. The name converted to PascalCase

- **Parameters**:
  - `iconName` (optional): the icon name in any supported form

- **Returns**: the icon component, or `null` when `iconName` is empty or matches nothing

## Adding an alias

Add an entry to `ICON_ALIASES` in `app/composables/useLucideIcon.ts`. The key is the normalized form (lowercase, alphanumerics only); the value must be a valid Lucide icon name, which the `LucideIconName` type checks.

## Type definitions

```ts
function useLucideIcon(): {
  resolveIcon: (iconName?: string) => Component | null;
};
```
