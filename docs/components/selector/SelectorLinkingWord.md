# `SelectorLinkingWord`

A small typographic label used between selector condition groups (e.g. "and also", "or"). Renders its default slot in uppercase at reduced font size.

## Features

- Pure presentational — no props, no emits
- Consistent uppercase styling at `0.65rem`–`0.75rem` depending on viewport

## Usage

### Basic Usage

```vue
<template>
  <SelectorLinkingWord>and also</SelectorLinkingWord>
</template>
```

## Slots

### default

The linking-word text to display (e.g. `'and also'`, `'or'`).

## Dependencies

None — pure CSS component.
