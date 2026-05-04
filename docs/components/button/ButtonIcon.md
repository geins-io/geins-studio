# `ButtonIcon`

`ButtonIcon` is the canonical icon-prefixed action button in Geins Studio. It wraps shadcn-vue's [`Button`](/components/shadcn-vue) with a Lucide icon resolved either from a short alias (`save`, `new`, `export`, …) or by raw Lucide name.

## Features

- Short aliases for the most common admin actions (`save`, `new`, `copy`, `export`, `settings`, `send`, `retry`)
- Pass any PascalCase Lucide icon name to escape the alias map
- Optional `href` turns the button into a `NuxtLink` while keeping `Button` styling
- Slot for the button label

## Usage

### Basic Usage

```vue
<template>
  <ButtonIcon icon="save" @click="onSave">
    {{ $t('save_entity') }}
  </ButtonIcon>
</template>
```

### As a link

```vue
<template>
  <ButtonIcon icon="new" :href="getEntityUrl('new')">
    {{ $t('new_entity') }}
  </ButtonIcon>
</template>
```

### Custom Lucide icon

```vue
<template>
  <ButtonIcon icon="Sparkles">Generate</ButtonIcon>
</template>
```

## Props

### `icon`

```ts
icon: 'new' | 'save' | 'copy' | 'export' | 'settings' | 'send' | 'retry' | (string & {})
```

Either an alias from the table below or any PascalCase Lucide icon name.

| Alias | Lucide icon |
| --- | --- |
| `new` | `Plus` |
| `save` | `Save` |
| `copy` | `Copy` |
| `export` | `File` |
| `settings` | `Settings2` |
| `send` | `Send` |
| `retry` | `RotateCw` |

### `href`

```ts
href?: string
```

When set, renders as a `NuxtLink` instead of a plain `<div>` inside the `Button`. The `Button` itself uses `as-child` so styling is preserved.

- **Default:** `''`

## Slots

### default

The button label. Required for accessibility — never use `ButtonIcon` without text.

## Dependencies

- shadcn-vue [`Button`](/components/shadcn-vue) — visual primitive
- `useLucideIcon` — resolves the icon name to a component (tree-shake-safe). See `app/composables/useLucideIcon.ts`.
