# `ButtonExport`

`ButtonExport` is a list-page header button that opens a dropdown with "Export all" and "Export selection" entries, with a default slot for additional export options.

## Features

- Pre-styled trigger using [`ButtonIcon`](/components/button/ButtonIcon) with the `export` alias
- Built-in "Export all" and "Export selection" items
- Slot for adding custom export formats (CSV, Excel, etc.)

## Usage

### Basic Usage

```vue
<template>
  <ButtonExport>
    <DropdownMenuItem @click="exportCsv">
      <span>Export as CSV</span>
    </DropdownMenuItem>
  </ButtonExport>
</template>
```

## Slots

### default

Additional `DropdownMenuItem` entries appended after the built-in "Export all" and "Export selection" options.

## Dependencies

- shadcn-vue [`DropdownMenu`](/components/shadcn-vue) — visual primitive
- [`ButtonIcon`](/components/button/ButtonIcon) — trigger button
