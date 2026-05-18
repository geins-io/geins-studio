# `JsonCodeEditor`

`JsonCodeEditor` is the CodeMirror-backed JSON editor — used for example inside [`ChannelSchemaEditorSheet`](/components/channel/ChannelSchemaEditorSheet) for editing the storefront-settings schema. Themed with the app's CSS custom properties so it adapts to light/dark mode automatically.

## Features

- CodeMirror 6 with `basicSetup` + `@codemirror/lang-json`
- App-aware theme: gutters / cursor / selection / active line all use `var(--background)`, `var(--foreground)`, `var(--primary)` etc. — no separate dark theme needed
- `update:modelValue` fires on every doc change
- External `modelValue` updates sync into the editor (used to reset content when the sheet reopens)
- Mono font stack (SF Mono / Menlo / Monaco / Consolas)

## Usage

This is typically lazy-loaded as `LazyJsonCodeEditor` inside [`ChannelSchemaEditorSheet`](/components/channel/ChannelSchemaEditorSheet). The component lives at `app/components/JsonCodeEditor.vue` so its auto-import name is `JsonCodeEditor`.

```vue
<script setup lang="ts">
const json = ref('{}');
</script>

<template>
  <LazyJsonCodeEditor v-model="json" class="min-h-0 flex-1" />
</template>
```

## Props

### `modelValue`

```ts
modelValue: string;
```

The JSON document as a string. Two-way via `update:modelValue`.

## Events

### `update:modelValue`

```ts
(value: string): void
```

Fired on every editor change.

## Dependencies

- [`codemirror`](https://codemirror.net/) — `EditorView`, `basicSetup`
- [`@codemirror/lang-json`](https://github.com/codemirror/lang-json) — JSON syntax highlighting
